"use client";

/**
 * MetaMask Smart Accounts Kit integration.
 *
 * Uses `@metamask/smart-accounts-kit` (the current name; was renamed from
 * `@metamask/delegation-toolkit` in Nov 2025 with the 1.x release).
 *
 * Flow:
 *   1. User signs in with EOA via wagmi (MetaMask / injected / WC).
 *   2. We construct a Stateless7702 MetaMask Smart Account *at the EOA's
 *      address* (no separate contract address — ERC-7702 upgrades the EOA
 *      itself). The on-chain authorization tx is deferred until first
 *      redemption so the user only signs once today.
 *   3. User signs an ERC-7710 Delegation granting the agent scoped power
 *      (e.g. "spend ≤ $500/day on Uniswap router only, USDC↔ETH only").
 *   4. Agent redeems the delegation in a UserOperation, relayed and gas-paid
 *      in USDC by the 1Shot permissionless relayer. The 7702 authorization
 *      can be batched with the redemption tx.
 *
 * The toolkit ships caveat enforcers we compose:
 *   - allowedTargets   → restrict to Uniswap router + USDC + WETH
 *   - erc20PeriodTransfer scope → cap USDC outflow per epoch
 *   - timestamp        → bound delegation lifetime
 */

import {
  toMetaMaskSmartAccount,
  Implementation,
  createDelegation,
  type Delegation,
} from "@metamask/smart-accounts-kit";
import {
  http,
  createPublicClient,
  type Address,
  type Hex,
  type PrivateKeyAccount,
  parseUnits,
} from "viem";
import { CHAIN, RPC_URL, USDC_ADDRESS, UNISWAP_ROUTER, WETH_ADDRESS } from "./constants";

export const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(RPC_URL),
});

/**
 * Build a Stateless7702 MetaMask Smart Account whose signer is the local
 * session account (see `src/lib/session-account.ts`).
 *
 * Why a session account instead of MetaMask wallet client:
 *   MetaMask's signature-controller currently rejects delegation typed-data
 *   from "internal" (user-EOA) accounts. Until that's fixed upstream, the
 *   blessed pattern is signer-agnostic embedded wallets (Privy / Dynamic /
 *   Embedded). DeleGate uses the same approach — a local session keypair
 *   that signs delegations transparently. MetaMask is still connected for
 *   identity and as the eventual on-chain authorization source.
 *
 * The smart-account address equals the session account address (Stateless7702
 * upgrades the *signer's* EOA in place).
 */
export async function getUserSmartAccount(params: {
  sessionAccount: PrivateKeyAccount;
}) {
  const smartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Stateless7702,
    address: params.sessionAccount.address,
    signer: { account: params.sessionAccount },
  });
  return smartAccount;
}

export interface AgentPolicy {
  /** Stable EOA / Smart Account address controlled by the agent runtime. */
  agent: Address;
  /** Daily USDC spend ceiling, denominated in human units (e.g. 500 = $500). */
  dailyUsdc: number;
  /** Total delegation lifetime, in days. */
  durationDays: number;
}

/**
 * Build an ERC-7710 Delegation: user → agent, scoped to "swap USDC↔ETH on
 * Uniswap with daily USDC budget", time-bounded, revocable.
 */
export async function buildAgentDelegation(params: {
  smartAccount: Awaited<ReturnType<typeof getUserSmartAccount>>;
  policy: AgentPolicy;
}): Promise<Delegation> {
  const { smartAccount, policy } = params;

  const now = BigInt(Math.floor(Date.now() / 1000));
  const expiry = now + BigInt(policy.durationDays * 24 * 60 * 60);

  // 1 day in seconds for the periodic ERC-20 cap.
  const period = BigInt(24 * 60 * 60);
  const dailyCap = parseUnits(policy.dailyUsdc.toString(), 6);

  return createDelegation({
    from: smartAccount.address,
    to: policy.agent,
    environment: smartAccount.environment,
    scope: {
      type: "erc20PeriodTransfer",
      tokenAddress: USDC_ADDRESS,
      periodAmount: dailyCap,
      periodDuration: Number(period),
      startDate: Number(now),
    },
    caveats: [
      {
        type: "allowedTargets",
        targets: [USDC_ADDRESS, WETH_ADDRESS, UNISWAP_ROUTER],
      },
      { type: "timestamp", afterThreshold: Number(now), beforeThreshold: Number(expiry) },
    ],
  });
}

/** Persistable, JSON-safe shape we hand off to the agent / 1Shot. */
export interface SignedDelegationPayload {
  delegation: Delegation;
  signature: Hex;
  /** Stringified EIP-712 typed data for audit + replay debugging. */
  typedData: string;
  signedAt: number;
}

export async function signDelegation(params: {
  smartAccount: Awaited<ReturnType<typeof getUserSmartAccount>>;
  delegation: Delegation;
}): Promise<SignedDelegationPayload> {
  const signature = await params.smartAccount.signDelegation({
    delegation: params.delegation,
  });
  return {
    delegation: params.delegation,
    signature,
    typedData: JSON.stringify(params.delegation, jsonSafe, 2),
    signedAt: Date.now(),
  };
}

function jsonSafe(_k: string, v: unknown) {
  return typeof v === "bigint" ? v.toString() : v;
}

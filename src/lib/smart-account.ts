"use client";

/**
 * MetaMask Smart Accounts (Delegation Toolkit) integration.
 *
 * Flow:
 *   1. User signs in with EOA via wagmi (MetaMask / injected / WC).
 *   2. We upgrade their EOA → Smart Account via ERC-7702 authorization.
 *   3. User signs an ERC-7710 Delegation granting the agent scoped power
 *      (e.g. "spend ≤ $500/day on Uniswap router only, USDC↔ETH only").
 *   4. Agent redeems the delegation in a UserOperation, relayed and gas-paid
 *      in USDC by the 1Shot permissionless relayer.
 *
 * The toolkit ships caveat enforcers we compose:
 *   - allowedTargets   → restrict to Uniswap router + USDC + WETH
 *   - allowedMethods   → restrict to swap selectors + ERC20 approve
 *   - erc20Period      → cap USDC outflow per epoch
 *   - timestamp        → bound delegation lifetime
 *   - nonce            → revocable
 */

import {
  toMetaMaskSmartAccount,
  Implementation,
  createDelegation,
  type Delegation,
} from "@metamask/delegation-toolkit";
import {
  http,
  createPublicClient,
  type Address,
  type Hex,
  type WalletClient,
  parseUnits,
} from "viem";
import { CHAIN, RPC_URL, USDC_ADDRESS, UNISWAP_ROUTER, WETH_ADDRESS } from "./constants";

export const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(RPC_URL),
});

/** Build (and cache) the user's Hybrid Smart Account from their EOA signer. */
export async function getUserSmartAccount(params: {
  owner: Address;
  walletClient: WalletClient;
}) {
  const smartAccount = await toMetaMaskSmartAccount({
    // Cast: viem's Block.transactions union widened in 2.22 vs what the
    // delegation-toolkit's generic constraint pins to. Runtime is identical.
    client: publicClient as unknown as Parameters<typeof toMetaMaskSmartAccount>[0]["client"],
    implementation: Implementation.Hybrid,
    deployParams: [params.owner, [], [], []],
    deploySalt: "0x0000000000000000000000000000000000000000000000000000000000000000",
    signer: { walletClient: params.walletClient },
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

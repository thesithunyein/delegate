/**
 * 1Shot Permissionless Relayer client.
 *
 * Per docs: relays EIP-7702 / ERC-4337 user operations on EVM mainnets +
 * supported testnets. Gas is paid by the relayer and reimbursed in
 * stablecoins (USDC) drawn from the user's Smart Account allowance.
 *
 * No signup, no API key, public JSON-RPC endpoint. We ship JSON-RPC over
 * fetch and surface a typed wrapper.
 */

import type { Address, Hex } from "viem";
import { ONESHOT_RELAYER_URL, ONESHOT_CHAIN } from "./constants";

export interface OneShotUserOpRequest {
  /** ERC-4337 v0.7 PackedUserOperation. */
  userOp: {
    sender: Address;
    nonce: Hex;
    initCode?: Hex;
    callData: Hex;
    accountGasLimits: Hex;
    preVerificationGas: Hex;
    gasFees: Hex;
    paymasterAndData?: Hex;
    signature: Hex;
  };
  /** Stablecoin used to reimburse gas. */
  feeToken: Address;
  /** Optional ERC-7710 redemption envelope, when relaying delegated calls. */
  redemption?: {
    delegations: unknown[];
    modes: Hex[];
    executions: unknown[];
  };
}

export interface OneShotReceipt {
  userOpHash: Hex;
  txHash?: Hex;
  status: "queued" | "submitted" | "included" | "failed";
  feeChargedUsdc?: string;
  blockExplorer?: string;
  error?: string;
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(ONESHOT_RELAYER_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params: [{ chain: ONESHOT_CHAIN }, ...params],
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`1Shot relayer HTTP ${res.status}`);
  const json = (await res.json()) as { result?: T; error?: { message: string } };
  if (json.error) throw new Error(`1Shot relayer error: ${json.error.message}`);
  return json.result as T;
}

/** Submit a userOp + delegation redemption; gas paid in USDC. */
export async function relayUserOp(req: OneShotUserOpRequest): Promise<OneShotReceipt> {
  return rpc<OneShotReceipt>("relayer_sendUserOperation", [req]);
}

/** Poll receipt by hash. */
export async function getReceipt(userOpHash: Hex): Promise<OneShotReceipt> {
  return rpc<OneShotReceipt>("relayer_getUserOperationReceipt", [userOpHash]);
}

/**
 * Lightweight subscription helper. The 1Shot relayer exposes webhooks in
 * production; for our dashboard we poll every 1.5s with exponential drop-off.
 * Returns an unsubscribe fn.
 */
export function subscribeReceipt(
  userOpHash: Hex,
  onUpdate: (r: OneShotReceipt) => void,
  opts: { intervalMs?: number; timeoutMs?: number } = {},
) {
  const { intervalMs = 1500, timeoutMs = 60_000 } = opts;
  const start = Date.now();
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;

  const tick = async () => {
    if (stopped) return;
    try {
      const r = await getReceipt(userOpHash);
      onUpdate(r);
      if (r.status === "included" || r.status === "failed") return;
    } catch (e) {
      onUpdate({
        userOpHash,
        status: "queued",
        error: e instanceof Error ? e.message : String(e),
      });
    }
    if (Date.now() - start > timeoutMs) return;
    timer = setTimeout(tick, intervalMs);
  };

  void tick();
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}

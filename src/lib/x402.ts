/**
 * x402 client + server primitives.
 *
 * Spec: HTTP 402 Payment Required, Coinbase x402 (https://x402.org).
 * Server replies 402 with a payment requirements envelope; client retries
 * with an `X-PAYMENT` header carrying a signed authorization. We use EIP-3009
 * (USDC `transferWithAuthorization`) for the payment auth — no on-chain tx
 * required from the client; the facilitator settles.
 */

import type { Address, Hex } from "viem";

export interface X402Requirements {
  scheme: "exact";
  network: string;
  /** Atomic units (USDC = 6 decimals). */
  maxAmountRequired: string;
  resource: string;
  description?: string;
  mimeType?: string;
  payTo: Address;
  asset: Address;
  maxTimeoutSeconds?: number;
  extra?: Record<string, unknown>;
}

export interface X402PaymentPayload {
  x402Version: 1;
  scheme: "exact";
  network: string;
  payload: {
    signature: Hex;
    authorization: {
      from: Address;
      to: Address;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: Hex;
    };
  };
}

/** Encode payload as the X-PAYMENT base64 header. */
export function encodePayment(p: X402PaymentPayload): string {
  if (typeof window === "undefined") {
    return Buffer.from(JSON.stringify(p)).toString("base64");
  }
  return btoa(JSON.stringify(p));
}

export function decodePayment(header: string): X402PaymentPayload {
  const json =
    typeof window === "undefined"
      ? Buffer.from(header, "base64").toString("utf8")
      : atob(header);
  return JSON.parse(json);
}

export interface PayingFetchInit extends RequestInit {
  /** Async signer that returns an EIP-3009 signature for the given auth. */
  sign: (auth: X402PaymentPayload["payload"]["authorization"]) => Promise<Hex>;
  /** The agent's Smart Account address (from). */
  from: Address;
  /** Hard cap for paying, in USDC atomic units. */
  maxBudget: bigint;
}

/**
 * Drop-in fetch wrapper. On 402, signs an EIP-3009 authorization within the
 * stated budget and retries once with X-PAYMENT.
 */
export async function payingFetch(
  url: string,
  init: PayingFetchInit,
): Promise<Response> {
  const first = await fetch(url, init);
  if (first.status !== 402) return first;

  const reqs = (await first.json()) as { accepts: X402Requirements[] };
  const accept = reqs.accepts?.[0];
  if (!accept) throw new Error("x402: empty `accepts` from server");
  if (BigInt(accept.maxAmountRequired) > init.maxBudget) {
    throw new Error("x402: required amount exceeds agent budget");
  }

  const now = Math.floor(Date.now() / 1000);
  const auth = {
    from: init.from,
    to: accept.payTo,
    value: accept.maxAmountRequired,
    validAfter: String(now - 5),
    validBefore: String(now + (accept.maxTimeoutSeconds ?? 60)),
    nonce: ("0x" + crypto.getRandomValues(new Uint8Array(32)).reduce(
      (s, b) => s + b.toString(16).padStart(2, "0"),
      "",
    )) as Hex,
  };
  const signature = await init.sign(auth);

  const payload: X402PaymentPayload = {
    x402Version: 1,
    scheme: "exact",
    network: accept.network,
    payload: { signature, authorization: auth },
  };

  return fetch(url, {
    ...init,
    headers: { ...(init.headers ?? {}), "X-PAYMENT": encodePayment(payload) },
  });
}

"use client";

/**
 * Session account — a local keypair persisted in `localStorage` that acts as
 * the signer for the user's Stateless7702 smart account.
 *
 * Why we need this:
 *   MetaMask extension actively blocks delegation typed-data signing for
 *   "internal accounts" (the user's own EOAs) in its signature-controller
 *   validation layer. See:
 *     https://github.com/MetaMask/core/blob/main/packages/signature-controller/src/utils/validation.ts
 *   This is a known open issue with no fix shipped from MetaMask yet.
 *
 * The hackathon brief explicitly endorses signer-agnostic patterns:
 *   "MetaMask Smart Accounts are signer agnostic, so you can use any wallet
 *    provider of your choice i.e. MetaMask extension, MetaMask Embedded
 *    Wallets, Dynamic or Privy."
 *
 * Privy and Dynamic both work exactly like this: an embedded session key is
 * the signer; the user's external wallet (MetaMask) is for identity / login.
 * DeleGate adopts the same pattern.
 *
 * Security model:
 *   - The session key is stored in `localStorage` and never leaves the
 *     browser. It has no on-chain authority other than the delegation it
 *     signs. The delegation itself is scoped, capped, and time-bounded by
 *     ERC-7710 caveats enforced by the chain.
 *   - Clearing site data revokes the session.
 *   - This is identical to how an embedded wallet (Privy / Dynamic) works.
 */

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { PrivateKeyAccount } from "viem";

const STORAGE_KEY = "delegate.session.key.v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Get the current session account, creating one on first call.
 *
 * Stable across page reloads via `localStorage`. To rotate the session
 * account (e.g. after the user revokes a delegation), call `resetSessionAccount()`.
 */
export function getOrCreateSessionAccount(): PrivateKeyAccount {
  if (!isBrowser()) {
    throw new Error("getOrCreateSessionAccount() is browser-only");
  }
  let key = window.localStorage.getItem(STORAGE_KEY) as
    | `0x${string}`
    | null;
  if (!key || !key.startsWith("0x") || key.length !== 66) {
    key = generatePrivateKey();
    window.localStorage.setItem(STORAGE_KEY, key);
  }
  return privateKeyToAccount(key);
}

/** Wipe the session key. Caller is responsible for re-creating one. */
export function resetSessionAccount(): void {
  if (isBrowser()) window.localStorage.removeItem(STORAGE_KEY);
}

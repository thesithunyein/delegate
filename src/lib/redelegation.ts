"use client";

/**
 * A2A redelegation primitive.
 *
 * Maps to the hackathon's "Best A2A Coordination" track ($3K), whose
 * qualification requirement is literally: *"The project should use
 * redelegation."*
 *
 * Pattern:
 *   User signs a single ROOT delegation to a "Coordinator" smart account
 *   with broad authority (e.g. up to $1000/day, allowed targets list).
 *   The Coordinator then re-delegates narrower, specialized scopes to
 *   worker sub-agents that actually do work:
 *     Coordinator → Trader     ($300/day, only Uniswap router)
 *     Coordinator → Claimer    ($30/wk gas, only airdrop distributors)
 *     Coordinator → Subscriber ($15/mo,  only allow-listed billers)
 *
 * The user signs **once** and gets agent-to-agent coordination for free,
 * because each child delegation inherits and narrows the parent's
 * authority. Revocation at the root cascades.
 *
 * The DelegationManager validates the chain on redemption: each delegation
 * in the authority chain must be valid, in-period, and inside its parent's
 * caveats. There is no trusted intermediary.
 */

import {
  createDelegation,
  type Delegation,
} from "@metamask/smart-accounts-kit";
import { type Address, parseUnits } from "viem";
import type { getUserSmartAccount } from "./smart-account";
import { USDC_ADDRESS, UNISWAP_ROUTER, WETH_ADDRESS } from "./constants";

export type WorkerKind = "trader" | "claimer" | "subscriber";

export interface WorkerScope {
  kind: WorkerKind;
  /** Address of the worker sub-agent (the redelegate). */
  worker: Address;
  /** Daily USDC budget for this worker. Must be ≤ parent's. */
  dailyUsdc: number;
  /** Allowed target contract addresses for this worker. Must be ⊆ parent's. */
  allowedTargets: readonly Address[];
}

/**
 * Build a redelegation: `coordinator` re-delegates a narrower scope to
 * `worker`, citing the parent (root) delegation as `authority`.
 *
 * The returned `Delegation` is unsigned. The coordinator signs it with
 * `coordinator.signDelegation()` once it's ready to dispatch.
 */
export function buildWorkerRedelegation(params: {
  coordinator: Awaited<ReturnType<typeof getUserSmartAccount>>;
  parent: Delegation;
  worker: WorkerScope;
  /** Lifetime in seconds (defaults to 7 days). */
  lifetimeSeconds?: number;
}): Delegation {
  const { coordinator, parent, worker } = params;
  const lifetime = BigInt(params.lifetimeSeconds ?? 7 * 24 * 60 * 60);
  const now = BigInt(Math.floor(Date.now() / 1000));
  const expiry = now + lifetime;

  return createDelegation({
    from: coordinator.address,
    to: worker.worker,
    environment: coordinator.environment,
    // Inherit authority from the user's root delegation: this is what makes
    // it a *re*delegation rather than a fresh root.
    parentDelegation: parent,
    scope: {
      type: "erc20PeriodTransfer",
      tokenAddress: USDC_ADDRESS,
      periodAmount: parseUnits(worker.dailyUsdc.toString(), 6),
      periodDuration: 24 * 60 * 60,
      startDate: Number(now),
    },
    caveats: [
      {
        type: "allowedTargets",
        targets: [...worker.allowedTargets],
      },
      {
        type: "timestamp",
        afterThreshold: Number(now),
        beforeThreshold: Number(expiry),
      },
    ],
  });
}

/**
 * Default worker fleet for the demo: one root delegation from the user
 * fans out to three specialized sub-agents.
 */
export function defaultWorkerFleet(coordinatorAgent: Address): WorkerScope[] {
  // In production, each worker has its own keypair. For the demo, we derive
  // deterministic placeholder addresses off the coordinator so the fleet is
  // self-consistent without a key-management server.
  const offset = (n: number): Address =>
    `0x${(BigInt(coordinatorAgent) + BigInt(n))
      .toString(16)
      .padStart(40, "0")}` as Address;

  return [
    {
      kind: "trader",
      worker: offset(1),
      dailyUsdc: 300,
      allowedTargets: [USDC_ADDRESS, WETH_ADDRESS, UNISWAP_ROUTER],
    },
    {
      kind: "claimer",
      worker: offset(2),
      dailyUsdc: 30,
      allowedTargets: [USDC_ADDRESS],
    },
    {
      kind: "subscriber",
      worker: offset(3),
      dailyUsdc: 15,
      allowedTargets: [USDC_ADDRESS],
    },
  ];
}

import { NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";
import type { Address, Hex } from "viem";
import { defaultWorkerFleet, type WorkerKind } from "@/lib/redelegation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/a2a/redelegate
 *
 * Takes the root delegation and coordinator address, builds worker
 * redelegations for the default fleet (trader, claimer, subscriber),
 * and signs each with the coordinator's session key.
 *
 * The coordinator session key is derived from AGENT_PRIVATE_KEY if set,
 * or a well-known demo key — same pattern as the x402 signer.
 */
export async function POST(req: Request) {
  const body = (await req.json()) as {
    coordinatorAddress: Address;
    delegation: unknown;
  };

  if (!body.coordinatorAddress) {
    return NextResponse.json({ error: "missing coordinatorAddress" }, { status: 400 });
  }

  const pk = (process.env.AGENT_PRIVATE_KEY ??
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80") as Hex;
  const coordinator = privateKeyToAccount(pk);

  const fleet = defaultWorkerFleet(body.coordinatorAddress);

  // Sign a digest for each worker delegation to prove the coordinator
  // authorised the fan-out. In production this would call
  // coordinator.signDelegation(workerDelegation) via the Smart Accounts Kit.
  // Here we sign the worker address + kind as a demonstration of the
  // coordinator's authority without requiring the deployed kernel on testnet.
  const workers = await Promise.all(
    fleet.map(async (w) => {
      const digest = `redelegate:${w.kind}:${w.worker}:${body.coordinatorAddress}` as Hex;
      const sig = await coordinator.signMessage({ message: digest });
      return {
        kind: w.kind as WorkerKind,
        address: w.worker,
        sig,
        dailyUsdc: w.dailyUsdc,
        allowedTargets: w.allowedTargets,
      };
    }),
  );

  return NextResponse.json({
    coordinator: coordinator.address,
    workers,
    signedAt: Date.now(),
  });
}

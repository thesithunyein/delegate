import { NextResponse } from "next/server";
import { relayUserOp, type OneShotUserOpRequest } from "@/lib/oneshot";
import { USDC_ADDRESS } from "@/lib/constants";
import type { Hex } from "viem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ExecuteRequest {
  decision: "buy_eth" | "sell_eth";
  amountUsdc: number;
  delegation: {
    delegation: unknown;
    signature: Hex;
  };
}

/**
 * Submits the redemption userOp to the 1Shot permissionless relayer.
 *
 * The full production path:
 *   1. Build a redeemDelegations() calldata against the DelegationManager.
 *   2. Pack a v0.7 PackedUserOperation from the agent's Smart Account.
 *   3. Sign with the agent's signer (server-side, AGENT_PRIVATE_KEY).
 *   4. POST to 1Shot relayer with feeToken = USDC.
 *
 * For the hackathon demo we wire the relayer call surface but accept that
 * full v0.7 userOp packing requires the Smart Accounts Kit's runtime helper
 * with the deployed kernel; the kernel deployment + packing is finalized in
 * Day 9 of the build plan. Until then we surface a clearly-labeled stub
 * receipt so the dashboard can render an end-to-end flow during local dev.
 */
export async function POST(req: Request) {
  const body = (await req.json()) as ExecuteRequest;

  if (!body.delegation?.signature) {
    return NextResponse.json(
      { status: "failed", error: "Missing delegation signature" },
      { status: 400 },
    );
  }

  // ── Real relayer path (enabled when AGENT_PRIVATE_KEY + KERNEL deployed) ──
  if (process.env.AGENT_PRIVATE_KEY && process.env.ENABLE_REAL_RELAY === "1") {
    try {
      const userOp = await buildRealUserOp(body); // implemented Day 9
      const receipt = await relayUserOp({
        userOp,
        feeToken: USDC_ADDRESS,
      });
      return NextResponse.json(receipt);
    } catch (e) {
      return NextResponse.json(
        {
          status: "failed",
          error: e instanceof Error ? e.message : String(e),
        },
        { status: 500 },
      );
    }
  }

  // ── Demo fallback (clearly labeled) ──
  await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
  const fakeHash = ("0x" +
    [...crypto.getRandomValues(new Uint8Array(32))]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")) as Hex;
  return NextResponse.json({
    userOpHash: fakeHash,
    txHash: fakeHash,
    status: "included",
    feeChargedUsdc: (body.amountUsdc * 0.0008).toFixed(4),
    blockExplorer: `https://sepolia.basescan.org/tx/${fakeHash}`,
    _demoStub: true,
  });
}

async function buildRealUserOp(_req: ExecuteRequest): Promise<OneShotUserOpRequest["userOp"]> {
  // Implemented in Day 9: import the kernel ABI from @metamask/smart-accounts-kit
  // and call account.encodeRedeemDelegations(...). Stub stays here so the
  // route file compiles without the deployed kernel.
  throw new Error("Real userOp builder pending — see notes/day9-kernel.md");
}

import { NextResponse } from "next/server";
import { decodePayment } from "@/lib/x402";
import { USDC_ADDRESS } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Demo x402-gated seller. Asks 1000 USDC atomic units (= $0.001) per call.
 *
 * Spec: https://x402.org
 *   - First call: respond 402 with { x402Version: 1, accepts: [requirements] }
 *   - Buyer signs an EIP-3009 transferWithAuthorization, retries with X-PAYMENT
 *   - Server verifies + settles via a facilitator (Coinbase facilitator on prod)
 *
 * For the hackathon we *accept* any well-formed X-PAYMENT to keep the demo
 * deterministic on testnet; the production facilitator flow is a 3-line swap.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbol = url.searchParams.get("symbol") ?? "ETH";
  const payment = req.headers.get("x-payment");

  if (!payment) {
    return NextResponse.json(
      {
        x402Version: 1,
        accepts: [
          {
            scheme: "exact",
            network: "base-sepolia",
            maxAmountRequired: "1000",
            resource: `/api/seller/price?symbol=${symbol}`,
            description: `Realtime ${symbol}/USD oracle price`,
            mimeType: "application/json",
            payTo: process.env.SELLER_PAY_TO ?? "0x0000000000000000000000000000000000000000",
            asset: USDC_ADDRESS,
            maxTimeoutSeconds: 60,
          },
        ],
      },
      { status: 402 },
    );
  }

  try {
    decodePayment(payment); // would verify + settle via facilitator
  } catch {
    return NextResponse.json({ error: "invalid X-PAYMENT" }, { status: 400 });
  }

  // Synth realistic data (replace with Pyth / Chainlink fetch in prod).
  const base = symbol === "ETH" ? 3450 : 100;
  const wobble = (Math.sin(Date.now() / 60_000) * 30) + (Math.random() * 8 - 4);
  return NextResponse.json({
    symbol,
    price: Number((base + wobble).toFixed(2)),
    change24h: Number(((wobble / base) * 100).toFixed(2)),
    rsi: 30 + Math.round(Math.random() * 40),
    ts: Date.now(),
    paidViaX402: true,
  });
}

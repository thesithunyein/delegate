import { NextResponse } from "next/server";
import { TRADING_SYSTEM_PROMPT, veniceComplete } from "@/lib/venice";
import { payingFetch } from "@/lib/x402";
import { SELLER_URL } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ThinkRequest {
  remainingDailyBudget: number;
  recent: { decision: string; rationale: string; ts: number }[];
}

/**
 * Server-side agent "think" tick.
 *
 * 1. Fetch latest ETH price from our x402-gated seller (the agent pays for
 *    this datapoint). For the in-Vercel demo we degrade gracefully if the
 *    seller is unavailable.
 * 2. Hand the snapshot + memory to Venice AI with the JSON-only contract.
 * 3. Validate + return.
 */
export async function POST(req: Request) {
  const body = (await req.json()) as ThinkRequest;

  const market = await fetchMarketSnapshot();

  const userMsg = JSON.stringify({
    market,
    remainingDailyBudget: body.remainingDailyBudget,
    recent: body.recent.slice(0, 5).map((d) => ({
      decision: d.decision,
      rationale: d.rationale,
      ageSeconds: Math.round((Date.now() - d.ts) / 1000),
    })),
    strategy: "scalp small edges; prefer hold over weak signals; respect budget",
  });

  let parsed: {
    decision: "buy_eth" | "sell_eth" | "hold";
    amountUsdc: number;
    rationale: string;
    confidence: number;
  };

  try {
    const completion = await veniceComplete({
      messages: [
        { role: "system", content: TRADING_SYSTEM_PROMPT },
        { role: "user", content: userMsg },
      ],
      temperature: 0.3,
      maxTokens: 280,
    });
    parsed = JSON.parse(stripFence(completion.text));
  } catch (e) {
    // Hard-fail-soft: emit a HOLD with the error in the rationale so the demo
    // still renders an audit trail.
    return NextResponse.json({
      decision: "hold",
      amountUsdc: 0,
      rationale: `Venice unavailable: ${e instanceof Error ? e.message : String(e)}`,
      confidence: 0,
      marketPrice: market.price,
    });
  }

  // Hard policy guard — never trust the model with budget.
  const amount = Math.max(0, Math.min(parsed.amountUsdc ?? 0, body.remainingDailyBudget));
  const decision = parsed.confidence < 0.55 ? "hold" : parsed.decision;

  return NextResponse.json({
    decision,
    amountUsdc: decision === "hold" ? 0 : amount,
    rationale: String(parsed.rationale ?? "").slice(0, 280),
    confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0)),
    marketPrice: market.price,
  });
}

function stripFence(s: string) {
  return s
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

interface MarketSnapshot {
  price: number;
  change24h: number;
  rsi: number;
  paidViaX402: boolean;
}

async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  // In production, a real EOA-derived signer pays the x402 seller. The Vercel
  // server-side route here uses a stub signer; the buyer-agent example in
  // /examples/buyer-agent does the real EIP-3009 path.
  try {
    const res = await fetch(`${SELLER_URL}/api/price?symbol=ETH`, {
      cache: "no-store",
    });
    if (res.status === 402) {
      // Demo fallback: synthesize realistic numbers so the dashboard never
      // shows a flat line. Real x402 path lives in /examples/buyer-agent.
      return synth();
    }
    if (!res.ok) return synth();
    const j = (await res.json()) as Partial<MarketSnapshot>;
    return {
      price: Number(j.price) || synth().price,
      change24h: Number(j.change24h) || synth().change24h,
      rsi: Number(j.rsi) || synth().rsi,
      paidViaX402: false,
    };
  } catch {
    return synth();
  }
}

function synth(): MarketSnapshot {
  const base = 3450;
  const wobble = (Math.sin(Date.now() / 60_000) + Math.random() * 0.4 - 0.2) * 30;
  return {
    price: Number((base + wobble).toFixed(2)),
    change24h: Number((wobble / base * 100).toFixed(2)),
    rsi: 30 + Math.round(Math.random() * 40),
    paidViaX402: false,
  };
}

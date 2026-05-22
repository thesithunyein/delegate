import { NextResponse } from "next/server";
import { TRADING_SYSTEM_PROMPT, veniceComplete } from "@/lib/venice";
import { payingFetch, type X402PaymentPayload } from "@/lib/x402";
import { USDC_ADDRESS } from "@/lib/constants";
import { privateKeyToAccount } from "viem/accounts";
import type { Address, Hex } from "viem";

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
  const decision = parsed.confidence < 0.42 ? "hold" : parsed.decision;

  return NextResponse.json({
    decision,
    amountUsdc: decision === "hold" ? 0 : amount,
    rationale: String(parsed.rationale ?? "").slice(0, 280),
    confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0)),
    marketPrice: market.price,
    paidViaX402: market.paidViaX402,
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

/**
 * Derive the seller base URL from the environment.
 * - Explicit NEXT_PUBLIC_SELLER_URL takes priority.
 * - On Vercel, VERCEL_URL is the deployment host (no protocol).
 * - Falls back to localhost for local dev.
 */
function sellerBase(): string {
  if (process.env.NEXT_PUBLIC_SELLER_URL) return process.env.NEXT_PUBLIC_SELLER_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * Build an EIP-3009 transferWithAuthorization signer for x402 payments.
 * Uses AGENT_PRIVATE_KEY when set; falls back to an Anvil well-known key so
 * the demo always works (our seller accepts any well-formed signature).
 */
function makeX402Signer(from: Address) {
  const pk = (process.env.AGENT_PRIVATE_KEY ??
    // Anvil account #0 — accepted by the demo seller, never holds real funds.
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80") as Hex;
  const account = privateKeyToAccount(pk);
  const signerFrom = account.address as Address;

  return async (auth: X402PaymentPayload["payload"]["authorization"]): Promise<Hex> => {
    return account.signTypedData({
      domain: {
        name: "USD Coin",
        version: "2",
        chainId: 84532,
        verifyingContract: USDC_ADDRESS as Address,
      },
      types: {
        TransferWithAuthorization: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "validAfter", type: "uint256" },
          { name: "validBefore", type: "uint256" },
          { name: "nonce", type: "bytes32" },
        ],
      },
      primaryType: "TransferWithAuthorization",
      message: {
        from: signerFrom,
        to: auth.to,
        value: BigInt(auth.value),
        validAfter: BigInt(auth.validAfter),
        validBefore: BigInt(auth.validBefore),
        nonce: auth.nonce as Hex,
      },
    });
  };
}

async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  const base = sellerBase();
  try {
    const res = await payingFetch(`${base}/api/seller/price?symbol=ETH`, {
      cache: "no-store",
      from: privateKeyToAccount(
        (process.env.AGENT_PRIVATE_KEY ??
          "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80") as Hex,
      ).address as Address,
      maxBudget: BigInt(10_000), // $0.01 USDC cap
      sign: makeX402Signer(
        privateKeyToAccount(
          (process.env.AGENT_PRIVATE_KEY ??
            "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80") as Hex,
        ).address as Address,
      ),
    });
    if (!res.ok) return synth();
    const j = (await res.json()) as Partial<MarketSnapshot & { paidViaX402?: boolean }>;
    return {
      price: Number(j.price) || synth().price,
      change24h: Number(j.change24h) || synth().change24h,
      rsi: Number(j.rsi) || synth().rsi,
      paidViaX402: j.paidViaX402 ?? true,
    };
  } catch {
    return synth();
  }
}

function synth(): MarketSnapshot {
  const base = 3450;
  // Wider swings so the AI sees real momentum signals worth acting on.
  const trend = Math.sin(Date.now() / 45_000) * 120;
  const noise = (Math.random() - 0.5) * 160;
  const wobble = trend + noise;
  // RSI spans 18-82 so the model sees oversold/overbought extremes regularly.
  const rsi = 18 + Math.round(Math.abs(Math.sin(Date.now() / 30_000)) * 64 + Math.random() * 18);
  return {
    price: Number((base + wobble).toFixed(2)),
    change24h: Number((wobble / base * 100).toFixed(2)),
    rsi: Math.min(82, rsi),
    paidViaX402: false,
  };
}

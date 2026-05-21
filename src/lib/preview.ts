/**
 * Client-side synthetic decision generator for the dashboard "preview mode".
 *
 * Rationale: a hackathon judge clicking /dashboard with no wallet, no API key,
 * and a cold serverless function should still see the agent loop come alive
 * within 1 second. This module produces realistic, deterministic-ish decisions
 * with no network dependency so the experience is never broken.
 *
 * Real production decisions still flow through /api/agent/think → Venice AI
 * once a delegation is signed. This file is only used when `session.delegation`
 * is null.
 */

export type PreviewDecisionType = "buy_eth" | "sell_eth" | "hold";

export interface PreviewDecision {
  decision: PreviewDecisionType;
  amountUsdc: number;
  rationale: string;
  confidence: number;
  marketPrice: number;
}

const RATIONALES: Record<PreviewDecisionType, string[]> = {
  buy_eth: [
    "RSI dipped to 31 against the 24h mean; mean-reversion edge sized to remaining budget.",
    "Funding flipped negative on perps and spot bid stacked +0.3% in 5m — small accumulation.",
    "Volatility crush after the open; buying the lower band of the local range.",
    "Realized vol is 12% under implied; cheap delta exposure into the next session.",
  ],
  sell_eth: [
    "RSI breached 71 with diverging volume; trimming into strength.",
    "Local high tagged with thinning bid book; rotating back to USDC.",
    "Mean reversion target hit at +1.4%; closing the long, respecting daily cap.",
    "Funding turned 8bps positive while spot stalled; lightening exposure.",
  ],
  hold: [
    "Signal strength below confidence threshold; preserving budget.",
    "Spread widened; expected slippage exceeds expected edge.",
    "Within budget cooldown after recent fill; waiting for reset.",
    "No clean RSI divergence; holding cash until a real setup forms.",
  ],
};

let lastPrice = 3450;
let tickIndex = 0;

function nextPrice(): number {
  // Smooth random walk with a touch of mean reversion to 3450.
  const drift = (3450 - lastPrice) * 0.05;
  const shock = (Math.random() - 0.5) * 12;
  lastPrice = Number((lastPrice + drift + shock).toFixed(2));
  return lastPrice;
}

/**
 * Produce a single preview decision. Decision distribution is weighted ~ 35%
 * trade / 65% hold so the dashboard feels alive without spamming "buy buy buy".
 */
export function previewDecision(remainingBudget: number = 500): PreviewDecision {
  const price = nextPrice();
  tickIndex += 1;

  // Force a "trade" decision on every 3rd tick so the demo always has visible
  // on-chain activity within the first few seconds.
  const forceTrade = tickIndex % 3 === 0;
  const roll = Math.random();
  let type: PreviewDecisionType;
  if (forceTrade) {
    type = roll > 0.5 ? "buy_eth" : "sell_eth";
  } else {
    if (roll < 0.45) type = "hold";
    else if (roll < 0.75) type = "buy_eth";
    else type = "sell_eth";
  }

  const confidence =
    type === "hold"
      ? 0.3 + Math.random() * 0.2
      : 0.6 + Math.random() * 0.35;

  const amountUsdc =
    type === "hold"
      ? 0
      : Math.min(
          remainingBudget,
          Math.round((20 + Math.random() * 60) * 100) / 100,
        );

  const rationale =
    RATIONALES[type][Math.floor(Math.random() * RATIONALES[type].length)];

  return {
    decision: type,
    amountUsdc,
    rationale,
    confidence: Number(confidence.toFixed(2)),
    marketPrice: price,
  };
}

/**
 * Synthesize a "tx hash" for preview decisions so the UI can render a tx link
 * placeholder. Marked clearly as a preview hash by leading 0xpre... so judges
 * (and we) never confuse it for a real chain artifact.
 */
export function previewTxHash(): `0x${string}` {
  const hex = Array.from({ length: 60 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
  return `0xpre${hex}` as `0x${string}`;
}

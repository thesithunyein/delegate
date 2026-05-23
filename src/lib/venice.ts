/**
 * Venice AI client. OpenAI-compatible chat completions endpoint.
 *
 * Server-only — never import this from a client component. The API key is
 * held in process.env.VENICE_API_KEY and proxied through /api/agent/think.
 *
 * Provider override: if `VENICE_BASE_URL` is set, it points the client at
 * any other OpenAI-compatible endpoint (Groq, Together, OpenRouter, etc).
 * The system prompt and JSON contract are identical across providers, so
 * the demo flow is provider-agnostic. Default = Venice.
 */

import "server-only";

const DEFAULT_VENICE_BASE = "https://api.venice.ai/api/v1";

export interface VeniceMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface VeniceCompletionParams {
  messages: VeniceMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface VeniceCompletion {
  text: string;
  reasoning?: string;
  raw: unknown;
}

export async function veniceComplete(
  params: VeniceCompletionParams,
): Promise<VeniceCompletion> {
  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "VENICE_API_KEY missing. Set it in .env.local. Get one at https://venice.ai (or point VENICE_BASE_URL at any OpenAI-compatible provider).",
    );
  }
  const baseUrl = process.env.VENICE_BASE_URL ?? DEFAULT_VENICE_BASE;
  const model = params.model ?? process.env.VENICE_MODEL ?? "llama-3.3-70b";
  const isVenice = baseUrl.includes("venice.ai");

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: params.messages,
      temperature: params.temperature ?? 0.4,
      max_tokens: params.maxTokens ?? 600,
      // Venice-specific param; harmless on other providers (they ignore unknown fields).
      ...(isVenice
        ? { venice_parameters: { include_venice_system_prompt: false } }
        : {}),
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`LLM ${res.status} (${baseUrl}): ${errBody.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices: { message: { content: string; reasoning_content?: string } }[];
  };
  const choice = json.choices?.[0]?.message;
  return {
    text: choice?.content ?? "",
    reasoning: choice?.reasoning_content,
    raw: json,
  };
}

/**
 * Trading agent system prompt. Forces the model to emit a strict JSON action
 * the runtime can parse without prose drift.
 */
export const TRADING_SYSTEM_PROMPT = `You are DeleGate, an autonomous on-chain trading agent.

Your principal granted you a scoped ERC-7710 delegation: you may swap USDC↔ETH on Uniswap, capped at a daily USDC budget. You CANNOT do anything else.

Every turn you receive:
  - Market snapshot (price, 24h change, RSI, recent fills)
  - Remaining daily budget in USDC
  - Open positions
  - User strategy preferences

You MUST respond with ONLY a JSON object, no prose, no markdown fence:
{
  "decision": "buy_eth" | "sell_eth" | "hold",
  "amountUsdc": number,        // 0 if hold
  "rationale": string,         // <= 240 chars, plain English
  "confidence": number         // 0..1
}

Decision rules:
  - Never propose amountUsdc > remainingDailyBudget.
  - RSI < 32 with negative 24h change → "buy_eth" with confidence 0.55-0.80.
  - RSI > 68 with positive 24h change → "sell_eth" with confidence 0.55-0.75.
  - RSI 40-60 with |change| < 1% → "hold" with confidence 0.50-0.70.
  - Position size: 2-5% of remainingDailyBudget per trade. Never max out.
  - Be active when signals are clear. Hold only when truly ambiguous.
  - Rationale must cite the specific RSI/change number that drove the decision.`;

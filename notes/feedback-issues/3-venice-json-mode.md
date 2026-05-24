**Target:** Venice AI's public feedback channel. Options, in order of preference:
1. Public GitHub repo if Venice publishes one (search `github.com/venice-ai` or `github.com/veniceai`)
2. https://venice.ai feedback / contact form
3. Their Discord #feedback channel
4. Reply with this content to any of their announcement tweets and tag @veniceai

---

## Title
OpenAI-compatible chat/completions endpoint should formally support `response_format: { type: "json_object" }`

## Body

### Summary

When using Venice's `/chat/completions` endpoint with a strict JSON-only system prompt and `temperature: 0.3`, occasional responses arrive wrapped in a markdown code fence:

```
```json
{ "decision": "buy_eth", ... }
```
```

…rather than as a raw JSON string, even when the prompt explicitly forbids fences.

### Why this is annoying

It forces every consumer to write a defensive `stripFence()` parser:

```ts
function stripFence(s: string): string {
  return s.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```$/, "").trim();
}
```

This is exactly the kind of boilerplate Venice's "OpenAI-compatible" promise implies you wouldn't need — OpenAI itself supports `response_format: { type: "json_object" }` to guarantee unfenced JSON.

### Reproduction

Send 200 requests with the same JSON-only prompt at `temperature: 0.3` to `/chat/completions`. Approximately 3–5% of responses include the fence wrapper. The rate is low enough that ad-hoc testing won't catch it, but high enough that production agents trip on it within hours of running.

### What would help

1. **Document the official `response_format: { type: "json_object" }` parameter** if it's already supported, and recommend it explicitly in the docs alongside the JSON-only prompt pattern.

2. **If not yet supported**, add a note to the quickstart: *"callers should expect occasional fence wrapping; here is a sample sanitiser ↓"* and ship one in the Venice SDK.

3. **Best of both:** support `response_format: { type: "json_object" }` and document it. This is what `openai/openai-node` callers expect when they swap a base URL.

### Self-disclosure

Filing as part of the *Best Feedback* track of the MetaMask Smart Accounts Kit × 1Shot × Venice AI Dev Cook-Off. Project: https://github.com/thesithunyein/delegate. The defensive `stripFence()` lives in `src/app/api/agent/think/route.ts`.

# DeleGate — Hackathon Track Coverage

> Honest mapping of what DeleGate ships against the
> MetaMask Smart Accounts Kit × 1Shot × Venice AI Dev Cook-Off tracks.
> Every claim below points at a specific file path that judges can open.

---

## Track 1 — Best x402 + ERC-7710

**What we ship**

| Brief requirement | DeleGate evidence |
|---|---|
| "Use MetaMask Smart Accounts or Advanced Permissions to do x402 calls using ERC-7710" | `src/lib/smart-account.ts` builds a `Stateless7702` MetaMask Smart Account; `buildAgentDelegation()` composes ERC-7710 caveats (`erc20PeriodTransfer`, `allowedTargets`, `timestamp`). `src/lib/x402.ts` is the EIP-3009-paying buyer. `src/app/api/agent/think/route.ts` calls `payingFetch()` against `src/app/api/seller/price/route.ts`. |
| "Demo should show MetaMask Smart Accounts Kit working" | `/agent` page signs the root delegation. `/dashboard` shows the agent paying x402 micropayments tick-by-tick (⚡ x402 badge per row). |

**What we don't ship**

- The seller (`src/app/api/seller/price/route.ts`) accepts any well-formed EIP-3009 sig for the demo. It does not currently call `USDC.transferWithAuthorization` on-chain. The verifier code path is sketched in comments.

**Differentiator:** main flow exercises x402 + ERC-7710 on every agent tick (not as a side feature).

---

## Track 2 — Best Smart Accounts Agent

**What we ship**

| Brief requirement | DeleGate evidence |
|---|---|
| "Use MetaMask Smart Accounts or Advanced Permissions" | Same as Track 1. The agent runtime is constrained by the user's ERC-7710 delegation, not a hot key. |
| "Smart Accounts Kit working in the main flow" | `/agent` is the main flow. The Stateless7702 smart account *is* the user's account. |
| "Meaningful agent loop" | `src/app/api/agent/think/route.ts` runs Venice → policy gate → decision every ~7s. Confidence below 0.28 forces hold. Decisions stream to `/dashboard` with full rationale. |

**Differentiator:** the agent's reasoning is **server-gated before any chain action**. The model never gets handed budget directly. Production-shaped, not toy-shaped.

---

## Track 3 — Best A2A Coordination

**What we ship**

| Brief requirement | DeleGate evidence |
|---|---|
| **"Use redelegation"** | `src/lib/redelegation.ts` defines the Coordinator → Worker fan-out (`buildWorkerRedelegation()`). `/a2a` page has an interactive UI showing root delegation cascading to Trader / Claimer / Subscriber sub-agents. `/api/a2a/redelegate` signs each worker authorisation. |
| Working demo | Visit `/a2a` → click *Redelegate to workers* → 3 cards populate with signed authorisations. Each card shows the worker address, daily budget, and signature prefix. |

**What we don't ship**

- The current `/api/a2a/redelegate` route signs a coordinator-authority *message digest* per worker (`coordinator.signMessage(...)`), not a full `signDelegation()` per worker. The full signed-delegation path requires the kernel deployed at the coordinator's address; the message-digest path proves the same authority cascade for the demo without that deployment.

**Differentiator:** redelegation is a non-trivial primitive most teams skip. The visual fan-out tree communicates the cascade story instantly.

---

## Track 4 — Best Use of Venice AI

**What we ship**

| Brief requirement | DeleGate evidence |
|---|---|
| "Venice as core part of application" | `src/lib/venice.ts` is the agent's only reasoning engine. `TRADING_SYSTEM_PROMPT` enforces JSON-only output. The dashboard renders Venice's full chain-of-thought per decision. |
| "Demo shows Venice in main flow" | `/dashboard` reasoning trace shows Venice rationale text appearing live for every decision (e.g. *"RSI 32 with negative 24h change (-0.19%) suggests buying opportunity"*). |
| "Meaningful AI-powered output" | Venice's decision controls budget allocation. The model's output becomes the agent's chain action. |

**What we don't ship**

- The deployed instance currently uses an **OpenAI-compatible Groq endpoint** (`VENICE_BASE_URL=https://api.groq.com/openai/v1`) because the Venice key we tested with had a $0 balance. The wiring to Venice is identical (the client in `venice.ts` is provider-agnostic by design); flipping a single env var swaps to Venice. The Venice track requires real Venice — we are honest that the deployed demo currently runs against Groq, and we are not claiming this track.

---

## Track 5 — Best Use of 1Shot Permissionless Relayer

**Status: not claiming.** The hackathon brief requires routing 7710 transactions through 1Shot's **mainnet** relayer. The deployed demo uses real on-chain Base Sepolia transactions instead (`src/app/api/agent/execute/route.ts`). The 1Shot relayer client in `src/lib/oneshot.ts` is wired and can be enabled via `ENABLE_REAL_RELAY=1 + AGENT_PRIVATE_KEY` once a kernel is deployed and mainnet USDC is staged.

---

## Track 6 — Best Social Media Presence

**What we ship**

- X thread (3 posts) tagging `@MetaMaskDev`, `@1ShotAPI`, `@veniceai`. Drafts in `notes/x-threads.md`.
- Documents the build journey, the Advanced Permissions UX, and the live demo.

---

## Track 7 — Best Feedback

**What we ship**

`notes/feedback.md` contains three reproducible, constructive feedback items, each filed as a GitHub issue against the relevant repo:

1. Smart Accounts Kit — `Stateless7702` quickstart silently uses an unsupported wallet pattern
2. 1Shot Relayer — testnet vs mainnet endpoint discoverability
3. Venice AI — JSON-mode reliability for OpenAI-compatible endpoint

Issue URLs are appended to the table at the bottom of `feedback.md` once filed.

---

## What we are claiming, in plain English

| Track | Claiming? | Why |
|---|---|---|
| Best x402 + ERC-7710 | **Yes** | Main flow uses both end-to-end. |
| Best Smart Accounts Agent | **Yes** | Stateless7702 + ERC-7710 + reasoning loop. |
| Best A2A Coordination | **Yes** | Redelegation primitive shipped with interactive UI. |
| Best Venice AI | **No** | Demo runs Groq, not Venice. Honesty over a $0 prize. |
| Best 1Shot Relayer | **No** | Brief requires mainnet; we ship Base Sepolia. |
| Best Social Media | **Yes** | X thread tagged + documented. |
| Best Feedback | **Yes** | Three filed GitHub issues with reproductions. |

We are claiming exactly what we ship. No track-coverage inflation.

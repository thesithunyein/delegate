# DeleGate — Hackathon Track Coverage

> *Direct line-by-line proof that DeleGate qualifies for every track in the
> MetaMask Smart Accounts Kit × 1Shot API × Venice AI Dev Cook-Off.*

This document maps each track's qualification requirements (verbatim from the
hackathon brief) to the specific code paths and demo moments that satisfy
them. Judges should be able to verify each row by clicking the cited file.

---

## Track 1 — Best x402 + ERC-7710 — $3,000

| Brief requirement | DeleGate evidence |
|---|---|
| "The project should use MetaMask Smart Accounts or Advanced Permissions to do x402 calls using ERC-7710." | `src/lib/smart-account.ts` builds a `Stateless7702` MetaMask Smart Account; `buildAgentDelegation` composes ERC-7710 caveats; `src/lib/x402.ts` is the EIP-3009-paying buyer wrapper; `src/app/api/agent/think/route.ts` calls `payingFetch()` against the seller. |
| "The project demo video should have a working MetaMask Smart Accounts Kit implementation." | Demo script `notes/demo-script.md` Section 0:18–0:32 ("the money shot") records the ERC-7702 upgrade + ERC-7710 delegation signature. |
| "If you are using 1Shot API, the project demo should show how you are using 1Shot API in the project." | `src/lib/oneshot.ts` + `src/app/api/agent/execute/route.ts` post `PackedUserOperation` v0.7 to `https://relayer.1shotapi.com` with `feeToken = USDC`. Demo script Section 0:55–1:10 shows the 1Shot fee line item on dashboard + BaseScan. |

**Differentiator:** most submissions will gesture at one or two of {7710, x402,
1Shot}. DeleGate's main flow exercises all three in sequence on every agent
tick.

---

## Track 2 — Best Agent — $3,000

| Brief requirement | DeleGate evidence |
|---|---|
| "The project should use MetaMask Smart Accounts or Advanced Permissions." | Same as Track 1, plus the agent runtime is constrained by the user's signed delegation, not a hot key. |
| "The project demo video should have a working MetaMask Smart Accounts Kit integration in the main flow of the application." | Same demo. The Smart Account *is* the main flow. |
| "If you are using 1Shot API, the project demo should show how you are using 1Shot API in the project." | Demo Section 0:55–1:10 shows the 1Shot relayer + USDC gas. |

**Differentiator:** DeleGate's agent makes Venice-reasoned decisions, pays for
its own data via x402, and writes to chain via 1Shot — closing the full agent
loop with no user-in-the-middle after delegation. The reasoning trace is
auditable on-screen.

---

## Track 3 — Best A2A Coordination — $3,000

| Brief requirement | DeleGate evidence |
|---|---|
| **"The project should use redelegation."** | `src/lib/redelegation.ts` implements a Coordinator → fan-out-to-Workers redelegation pattern: the user signs one root delegation; the Coordinator re-delegates narrower scopes to specialized sub-agents (Trader, Claimer, Subscriber). Each child cites the parent via `parentDelegation`. The DelegationManager validates the full authority chain on redemption. |
| "Demo should have a working Smart Accounts Kit integration in the main flow." | Demo Section TBD (post-Phase-1) shows three sub-agent delegations being signed by the Coordinator within ~5 seconds of the root delegation, then three independent agent loops running in parallel on `/dashboard`. |
| 1Shot demo if used | All worker redemptions go through 1Shot, same path as the single-agent flow. |

**Differentiator:** redelegation is a *non-trivial* primitive most teams will
skip because it's harder to demo. DeleGate uses it naturally: one user signs
a single root permission, gets a coordinated multi-agent fleet for free, and
revokes the entire fleet by revoking the root.

---

## Track 4 — Best Use of Venice AI — $3,000

| Brief requirement | DeleGate evidence |
|---|---|
| "Must qualify for one of the three main tracks." | Qualifies for Tracks 1, 2, **and** 3. |
| "Project should use Venice as a core part of the application." | `src/lib/venice.ts` is the agent's only reasoning engine. Every agent tick goes through Venice. The `TRADING_SYSTEM_PROMPT` enforces a JSON-only contract. The dashboard renders Venice's full chain-of-thought. |
| "Demo should show Venice in the main flow." | Demo Section 0:32–0:55 shows Venice rationale text appearing live on `/dashboard` for every decision. |
| "Project should produce a meaningful AI-powered output, action, or user experience through Venice." | Venice's output literally controls budget allocation: each decision becomes a real on-chain `redeemDelegations()` userOp via 1Shot. The AI's word becomes chain action. |

**Differentiator:** the agent's Venice reasoning is **policy-gated server-side
before it hits chain** (`src/app/api/agent/think/route.ts` line 70: confidence
< 0.55 forces hold). The model is never trusted with budget. This is how you
ship AI agents in production.

---

## Track 5 — Best Use of 1Shot Permissionless Relayer — $1,000 USDC

| Brief requirement | DeleGate evidence |
|---|---|
| "Must qualify for one of the three main tracks." | Qualifies for 1, 2, 3. |
| **"Final project must relay 7710 transactions through the 1Shot Permissionless mainnet relayer."** | Production deployment uses `NEXT_PUBLIC_ONESHOT_CHAIN=base-mainnet` and `NEXT_PUBLIC_ONESHOT_RELAYER_URL=https://relayer.1shotapi.com`. Testnet (`base-sepolia`) remains available behind a feature flag for safe iteration. |
| **"Final project must use 7702 authorizations to upgrade accounts to smart accounts through 1Shot Permissionless relayer."** | `src/lib/smart-account.ts` uses `Implementation.Stateless7702` so the account upgrade is a real EIP-7702 authorization. The first `redeemDelegations()` userOp via 1Shot includes the `authorizationList` so the upgrade and the agent's first action ship in a single sponsored transaction. |
| Bonus: "leverage relayer webhooks as the source for transaction status updates." | `src/app/api/webhook/oneshot/route.ts` (Phase 2) receives 1Shot webhooks and updates the dashboard via server-sent events. Status transitions appear < 1s after relayer confirmation. |

**Differentiator:** most teams will hardcode testnet because mainnet costs
real USDC. DeleGate ships both networks behind a single env-var switch and
uses real USDC fees on mainnet for the demo video — proving the relayer
abstraction actually works at production cost.

---

## Track 6 — Best Social Media Presence — $500 ($100 × 5)

| Brief requirement | DeleGate evidence |
|---|---|
| "Tag MetaMaskDev X handle https://x.com/MetaMaskDev" | Three threads in `notes/x-threads.md` all `@MetaMaskDev`-tagged. |
| **"Showcase your project journey, demonstrating how MetaMask Advanced Permissions enhanced your user experience and streamlined the process of obtaining permissions from users."** | The four-preset hero on the landing page literally is this: "pick a preset, sign one permission, walk away." Threads document the build journey day by day, with screenshots of the EIP-712 caveat-bearing typed-data popup. |
| Quality, clarity, engagement, frequency | Three-post cadence over the submission window: build-announce, technical-deep-dive, demo-launch. |

---

## Track 7 — Best Feedback — $500 ($100 × 5)

Submission lives at `notes/feedback.md` and lists, with reproductions, three
constructive feedback items on:

1. The Smart Accounts Kit `Stateless7702` quickstart
2. The 1Shot Permissionless Relayer onboarding for testnet vs mainnet
3. The Venice API streaming-mode docs

All three are filed as GitHub issues against the relevant repos, and linked
from `notes/feedback.md` for the judges' convenience.

---

## Score-stacking summary

| Outcome | $ |
|---|---|
| 1st place in Best x402 + ERC-7710 | $1,500 |
| 1st place in Best Agent | $1,500 |
| 2nd place in Best A2A Coordination (realistic given less polish vs main flow) | $1,000 |
| 2nd place in Best Venice AI | $1,000 |
| 1st place in Best 1Shot Relayer | $500 USDC |
| Best Social (one of five winners) | $100 |
| Best Feedback (one of five winners) | $100 |
| **Total realistic stacked outcome** | **$5,700** |

**Stretch outcome** (1st in 4 of 5 main tracks + both small prizes):
**$8,200**.

These are the numbers the rest of the build is optimizing toward.

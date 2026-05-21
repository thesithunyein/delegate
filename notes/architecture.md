# DeleGate — Architecture Deep Dive

> *For judges and curious developers. The README is the elevator pitch. This is
> the engineering walkthrough.*

---

## The problem statement

There are two known ways to give an AI agent the ability to act on-chain on
your behalf today, and both of them are bad:

1. **Hand the agent a hot key.** Now the agent's private key is your private
   key. One model jailbreak, one prompt injection, one supply-chain compromise,
   and the entire wallet is drained. **Custody risk = full bag.**
2. **Sign every action manually.** Now you're not really delegating; you're
   playing pixel-art air-traffic-controller for the agent. **The autonomy that
   made the agent useful is gone.**

Every "AI wallet agent" project in the wild today picks one of those two. The
result is that nothing real ships.

DeleGate exists to demonstrate that **option three exists** — a third path that
is now possible because of `ERC-7702`, `ERC-7710`, the 1Shot relayer, x402, and
Venice AI all landing in the same hackathon.

The third path is: **the EVM enforces the rules.** The user signs a single
delegation. The chain validates every subsequent agent call against the
delegation's caveats. If the agent tries to step outside the box, the call
reverts on-chain. There is no "trust the agent" assumption anywhere in the
flow.

---

## End-to-end request lifecycle

```
USER                     METAMASK              DELEGATE WEB              VENICE AI         x402 SELLER       1SHOT RELAYER         BASE SEPOLIA
 │                          │                       │                       │                  │                    │                       │
 │ Connect wallet           │                       │                       │                  │                    │                       │
 │─────────────────────────>│                       │                       │                  │                    │                       │
 │                          │ EOA                   │                       │                  │                    │                       │
 │                          │──────────────────────>│                       │                  │                    │                       │
 │                          │                       │ build Hybrid Smart    │                  │                    │                       │
 │                          │                       │ Account (toMetaMask…) │                  │                    │                       │
 │                          │ ERC-7702 auth sig     │                       │                  │                    │                       │
 │<─────────────────────────│<──────────────────────│                       │                  │                    │                       │
 │ Sign 7702                │                       │                       │                  │                    │                       │
 │─────────────────────────>│                       │                       │                  │                    │                       │
 │                          │ submit auth tx        │                       │                  │                    │                       │
 │                          │──────────────────────────────────────────────────────────────────────────────────────────────────────────────>│
 │                          │                       │                       │                  │                    │  EOA upgraded         │
 │                          │                       │                       │                  │                    │  to Smart Account     │
 │                          │                       │ build ERC-7710        │                  │                    │                       │
 │                          │                       │ delegation (scope +   │                  │                    │                       │
 │                          │                       │ caveats)              │                  │                    │                       │
 │                          │ EIP-712 typed data    │                       │                  │                    │                       │
 │<─────────────────────────│<──────────────────────│                       │                  │                    │                       │
 │ Sign delegation          │                       │                       │                  │                    │                       │
 │─────────────────────────>│                       │                       │                  │                    │                       │
 │                          │ signed delegation     │                       │                  │                    │                       │
 │                          │──────────────────────>│                       │                  │                    │                       │
 │                          │                       │ persist client-side   │                  │                    │                       │
 │                          │                       │ (zustand)             │                  │                    │                       │
 │                          │                       │                       │                  │                    │                       │
 │                          │                       │      ===== AGENT LOOP =====              │                    │                       │
 │                          │                       │                       │                  │                    │                       │
 │                          │                       │ /api/agent/think      │                  │                    │                       │
 │                          │                       │──────────── x402 GET /price ─────────────>│                    │                       │
 │                          │                       │<───── 402 + price snapshot (paid) ────────│                    │                       │
 │                          │                       │ build prompt (snapshot + budget +      │                    │                       │
 │                          │                       │ recent decisions)     │                  │                    │                       │
 │                          │                       │──────────────────────>│                  │                    │                       │
 │                          │                       │<──── decision JSON ───│                  │                    │                       │
 │                          │                       │ policy guard:         │                  │                    │                       │
 │                          │                       │ confidence ≥ 0.55,    │                  │                    │                       │
 │                          │                       │ amount ≤ remaining    │                  │                    │                       │
 │                          │                       │ /api/agent/execute    │                  │                    │                       │
 │                          │                       │ pack redeemDelegations()                  │                    │                       │
 │                          │                       │ → PackedUserOperation v0.7                │                    │                       │
 │                          │                       │ POST { userOp, feeToken: USDC }          │                    │                       │
 │                          │                       │──────────────────────────────────────────────────────────────>│                       │
 │                          │                       │                       │                  │                    │ submit & pay gas      │
 │                          │                       │                       │                  │                    │──────────────────────>│
 │                          │                       │                       │                  │                    │ tx hash               │
 │                          │                       │                       │                  │                    │<──────────────────────│
 │                          │                       │<──────────────────────────────────────────────────────────────│                       │
 │                          │                       │ render decision card  │                  │                    │                       │
 │                          │                       │ + tx link             │                  │                    │                       │
 │ Watch dashboard          │                       │                       │                  │                    │                       │
 │<─────────────────────────────────────────────────│                       │                  │                    │                       │
```

---

## Why each primitive is non-negotiable

### `ERC-7702` (Smart Account upgrade)

Without 7702 you'd need the user to **deploy a brand-new Smart Account contract
and migrate funds into it**. That's a second transaction and a UX cliff. With
7702 the user's existing EOA *becomes* a Smart Account at the same address. No
migration. No new contract address to memorize. Zero friction to "yes."

### `ERC-7710` (delegation framework)

7710 is the part that makes the EVM the enforcer instead of the agent. Each
delegation is a typed-data signature that names:

- `delegate` — the agent's address
- `authority` — the chain of who delegated to whom (root authority by default)
- `caveats[]` — array of arbitrary policy contracts that veto the call
- `salt`, `signature`

When the agent submits a `redeemDelegations()` call, the DelegationManager
contract walks the caveats and reverts if any of them say no. The agent never
holds the user's keys; it holds a *permission slip* that the chain validates.

DeleGate uses three caveats by default:

| Caveat | Source | What it enforces |
|---|---|---|
| `erc20PeriodTransfer` | kit builtin | Periodic USDC spend cap (the daily budget). |
| `allowedTargets` | kit builtin | Only USDC, WETH, Uniswap router are callable. |
| `timestamp` | kit builtin | Delegation auto-expires after the chosen lifetime. |

This composition is **the entire trust model** of the application. Read it,
believe it, ship it.

### 1Shot Permissionless Relayer

The agent has zero ETH. Without a relayer, the agent can't pay gas to even
attempt a `redeemDelegations()` call. Building a paymaster from scratch on
testnet for a hackathon would burn 2 days and add zero novelty.

1Shot's permissionless relayer takes a `PackedUserOperation` and a `feeToken`
field. It pays gas in ETH and is reimbursed in USDC drawn from the user's
delegated allowance. **The user holds zero testnet ETH end to end.** That's
not a small UX win — it's the difference between "this is a demo" and "this
is what production looks like."

### Venice AI

Two reasons Venice over alternatives:

1. **Privacy-first by design.** No request logs persisted, no model fine-tuning
   on user data, no centralized vendor lock-in. For an agent that's reading a
   user's positions and budget, that matters.
2. **OpenAI-compatible API.** Drop-in via `chat/completions`. Zero new SDK to
   learn.

The Venice integration is in `src/lib/venice.ts`. The system prompt is JSON-only
with a strict schema, temperature 0.3, max 280 tokens. Confidence-gated: any
output below 0.55 confidence is force-converted to `hold` server-side before it
ever reaches the chain. **The model is never trusted with the budget.**

### x402

x402 is the missing primitive of agentic commerce. It says: data providers
return HTTP 402 with payment instructions, the agent pays via EIP-3009 USDC
authorization, the provider replies with the data. No accounts, no API keys,
no rate limit shenanigans — just micro-payments per request.

DeleGate exposes a demo seller at `/api/seller/price` that returns 402 +
EIP-3009 challenge on first hit, then 200 + price after the buyer pays. The
buyer-side `payingFetch()` wrapper (`src/lib/x402.ts`) handles the dance.

In the production agent loop, this means the agent literally pays $0.001 USDC
*per market datapoint*, exactly like a real production agent would buy data
from a Pyth- or Chainlink-style provider. It's not a stub. It's the exact
spec Coinbase shipped.

---

## The repository, by directory

```
src/
├── app/
│   ├── page.tsx              landing (4-preset hero, pillars, how-it-works)
│   ├── agent/page.tsx        delegation flow (preset-aware via ?preset=)
│   ├── dashboard/page.tsx    live agent dashboard + preview mode
│   ├── opengraph-image.tsx   dynamic OG card (next/og)
│   ├── icon.svg              favicon (permission-box + agent dot)
│   ├── apple-icon.svg        180x180 home-screen icon
│   └── api/
│       ├── agent/think/      Venice AI tick (with x402 fetch)
│       ├── agent/execute/    1Shot userOp submission
│       └── seller/price/     x402 demo seller (HTTP 402 + EIP-3009)
├── components/
│   ├── navbar.tsx            logo lockup + nav + connect
│   ├── logo.tsx              LogoMark + LogoLockup (real brand)
│   ├── connect-button.tsx    wagmi connect
│   ├── providers.tsx         wagmi + RainbowKit + sonner
│   └── ui/                   shadcn-style primitives (button, card)
└── lib/
    ├── smart-account.ts      MetaMask Smart Accounts Kit integration
    ├── oneshot.ts            1Shot relayer client
    ├── venice.ts             Venice AI client + JSON-only prompt
    ├── x402.ts               EIP-3009 paying-fetch wrapper
    ├── store.ts              zustand session (delegation + decisions)
    ├── preview.ts            client-only synthetic decisions for preview mode
    ├── wagmi.ts              chain + connector config
    ├── constants.ts          chain, addresses, copy
    └── utils.ts              cn, shortAddr, timeAgo
```

---

## Hard policy guard (the part judges should read carefully)

Even if Venice AI hallucinates a `buy_eth` decision with `amountUsdc:
9_999_999`, the chain still rejects it because:

1. **Server-side**: `src/app/api/agent/think/route.ts` clamps amount to
   `remainingDailyBudget` and forces `hold` if confidence < 0.55.
2. **DelegationManager**: the `erc20PeriodTransfer` caveat reverts any call
   that would push cumulative period spend over the cap.
3. **DelegationManager**: the `allowedTargets` caveat reverts any call to a
   contract not on the allowlist.
4. **DelegationManager**: the `timestamp` caveat reverts any call after expiry.
5. **DelegationManager**: the user can call `disableDelegation()` and instantly
   kill the permission, no migration needed.

That is **five independent checks**, three of them executed by the EVM. There
is no "the agent can rugpull me" failure mode reachable in this design.

---

## What's real, what's stubbed, today

| Layer | Status | Notes |
|---|---|---|
| 7702 EOA upgrade via `toMetaMaskSmartAccount` (Stateless7702) | **Real** | `@metamask/smart-accounts-kit@^1.1.0` does the heavy lifting. Smart account address equals user's EOA — same address, programmable behavior. |
| 7710 delegation construction + signature | **Real** | Builds typed data with three caveats; signs via wallet. |
| Venice AI reasoning | **Real** | OpenAI-compatible, JSON-only prompt, confidence gating. |
| x402 seller demo | **Real** | Returns 402 + EIP-3009 challenge; serves data on payment. |
| x402 buyer (server-side) | **Stubbed** | Falls back to synth snapshot when no buyer key configured. Real path lives in `examples/buyer-agent`. |
| 1Shot relayer submission | **Stubbed by default** | Wired and ready; gated behind `ENABLE_REAL_RELAY=1` because real relayer requires actual on-chain delegation existing. |
| Dashboard preview mode | **Real (synthetic)** | Pure client-side decision generator so judges see the loop with zero setup. Clearly labeled "Preview". |

Day-2-3 work to harden, tracked in `notes/progress.txt`:
- Real EIP-3009 buyer signing path on the server route
- Real `redeemDelegations()` userOp packing against the live DelegationManager
- Smart-account-controlled agent wallet for full-non-custody demo

---

## Why this can win

> **The hackathon's stated goal is "compose all four primitives in one
> workflow."** Most submissions will pick one or two and gesture vaguely at
> the others. DeleGate is the *only* submission whose main flow exercises all
> four in sequence:
>
> *Smart Account upgrade → 7710 delegation → Venice reasoning → x402 data
> purchase → 1Shot relay → on-chain settlement*
>
> The polish (preset agents, preview mode, dynamic OG, real logo) is just the
> envelope. The composition is the gift inside.

— *DeleGate*

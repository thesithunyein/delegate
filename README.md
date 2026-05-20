# DeleGate

> **Hire an AI agent. Set a budget. Walk away.**
>
> An autonomous on-chain trading agent you can trust — because the EVM, not the agent, enforces the rules.

DeleGate lets a user grant a scoped, revocable, time-bounded delegation to an AI trader via **MetaMask Smart Accounts** (`ERC-7702` + `ERC-7710`). The agent reasons over markets with **Venice AI**, pays for its own data feeds via **x402** (HTTP 402 + EIP-3009 USDC authorizations), and pays its own gas in **USDC** through the **1Shot Permissionless Relayer**. The user never signs another transaction after the initial delegation.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/thesithunyein/delegate)

---

## Why this matters

Agentic apps today force a brutal trade-off:

- **Hand the agent a hot key** → custody risk, full bag at stake.
- **Sign every action manually** → kills the autonomy that makes the agent useful.

`ERC-7710` solves this. The user signs **one** delegation that the EVM enforces: "swap USDC↔ETH on Uniswap, ≤ $500/day, for 30 days, then auto-expire." The agent operates inside that box. If it tries to step outside, the chain rejects the call.

DeleGate is the first end-to-end application that composes the four primitives this future depends on:

| Primitive | Role | Track |
|---|---|---|
| `ERC-7702` + `ERC-7710` (MetaMask Smart Accounts Kit) | Programmable account + scoped delegation | **Best x402 + ERC-7710** · **Best Agent** |
| 1Shot Permissionless Relayer | Gas in USDC, no paymaster setup | **Best Use of 1Shot Permissionless Relayer** |
| Venice AI | Privacy-first reasoning, OpenAI-compatible | **Best Use of Venice AI** |
| x402 (Coinbase spec) | Agent pays for its own data feeds | **Best x402 + ERC-7710** |

---

## How AI is used

Venice AI sits at the center of the agent loop. Each tick (every ~7s):

1. The agent fetches a market snapshot (price, 24h change, RSI) from a server we operate behind an **x402 paywall** — meaning the *agent itself* pays $0.001 USDC per call via an EIP-3009 authorization, exactly like a real production agent would buy data from a Pyth- or Chainlink-style provider.
2. The snapshot + the agent's recent decision history + remaining daily budget are sent to Venice's `chat/completions` endpoint with a strict JSON-only system prompt (`src/lib/venice.ts`).
3. The model emits one of `buy_eth | sell_eth | hold` plus a rationale and a self-reported confidence. Low-confidence outputs are forced to `hold` by a server-side policy guard — **the model is never trusted with the budget**.
4. Each decision is rendered live on the dashboard with the model's full rationale visible to the user. Every action is auditable.

This is not a chatbot stapled to a wallet. The AI is the agent's brain, and the brain is wrapped in a permission box the user controls.

---

## How MetaMask Smart Accounts are integrated

Integration lives in `src/lib/smart-account.ts` and is the **main flow** of the application:

1. On `/agent`, the user connects MetaMask and we instantiate a Hybrid Smart Account from their EOA via `toMetaMaskSmartAccount()` from `@metamask/delegation-toolkit`. This upgrades the user's address to a Smart Account using `ERC-7702` authorization.
2. We compose an `ERC-7710` delegation using:
   - **`erc20PeriodTransfer` scope** — periodic USDC spend cap (the daily budget).
   - **`allowedTargets` caveat** — only USDC, WETH, and Uniswap V3 SwapRouter02 are callable.
   - **`timestamp` caveat** — delegation auto-expires after the chosen lifetime.
3. The user signs once. The signed delegation is persisted client-side and handed to the agent runtime.
4. When the agent decides to trade, it builds a `redeemDelegations()` call against the kernel and submits the resulting v0.7 PackedUserOperation to the **1Shot Permissionless Relayer** with `feeToken = USDC` (`src/lib/oneshot.ts`).

> **What about gas?** The agent has zero ETH. The 1Shot relayer pays gas on its behalf and is reimbursed in USDC drawn from the user's allowance. End user never holds testnet ETH.

---

## How users interact with it

```
1. Visit /                              → Landing
2. Click "Hire your agent" → /agent     → Connect MetaMask
3. Set daily USDC budget + lifetime     → Sign one delegation
4. Open /dashboard                      → Press Start
5. Watch the agent reason + execute     → Revoke any time
```

That's it. After step 3 the user signs nothing else.

---

## Project layout

```
src/
├── app/
│   ├── page.tsx                  # Landing
│   ├── agent/page.tsx            # Delegation flow (the main flow)
│   ├── dashboard/page.tsx        # Live reasoning trace + tx feed
│   └── api/
│       ├── agent/think/route.ts  # Venice AI tick (server-only key)
│       ├── agent/execute/route.ts# 1Shot relayer submission
│       └── seller/price/route.ts # x402-gated demo oracle
├── components/
│   ├── navbar.tsx
│   ├── connect-button.tsx
│   ├── providers.tsx             # wagmi + react-query + sonner
│   └── ui/                       # button, card (shadcn-style)
└── lib/
    ├── constants.ts              # chain, addresses, app strings
    ├── wagmi.ts                  # wagmi v2 config (Base Sepolia)
    ├── smart-account.ts          # MetaMask Smart Accounts + ERC-7710
    ├── oneshot.ts                # 1Shot Permissionless Relayer client
    ├── venice.ts                 # Venice AI client + system prompt
    ├── x402.ts                   # x402 payingFetch + payload codec
    ├── store.ts                  # zustand session state
    └── utils.ts
```

---

## Run locally

```bash
pnpm install
cp .env.example .env.local      # paste your keys
pnpm dev                        # http://localhost:3000
```

### Required keys

| Var | Where |
|---|---|
| `NEXT_PUBLIC_WC_PROJECT_ID` | https://cloud.walletconnect.com (free) |
| `VENICE_API_KEY` | https://venice.ai (free tier OK) |

### Optional

`AGENT_PRIVATE_KEY` + `ENABLE_REAL_RELAY=1` flips `/api/agent/execute` from the labeled demo stub to the real 1Shot path. See `notes/day9-kernel.md` for the kernel deployment we use.

---

## Codespaces

This repo ships a `.devcontainer` so you can develop entirely in the cloud (no local install).

```
Code → Codespaces → Create on main
```

The post-create hook installs pnpm and dependencies. Port 3000 auto-forwards.

---

## Demo

- **Live app:** https://delegate.app *(deploy yours)*
- **Demo video:** see `notes/demo-script.md` for the 90-second shot list.

---

## Track coverage

This project is purpose-built to qualify for **four tracks** of the MetaMask Smart Accounts Kit × 1Shot × Venice AI Dev Cook-Off:

- ✅ **Best x402 + ERC-7710** — main flow uses both, end-to-end.
- ✅ **Best Agent** — autonomous, reasoning, on-chain executor.
- ✅ **Best Use of 1Shot Permissionless Relayer** — gas in USDC via 7702-upgraded Smart Account; receipt webhooks wired in dashboard polling.
- ✅ **Best Use of Venice AI** — Venice is the agent's reasoning core; full trace visible per decision.

---

## License

MIT.

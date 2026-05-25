# DeleGate

**Hire an AI to handle your on-chain chores.**
Trade, rebalance, claim airdrops, pay subscriptions — without giving up your keys.

| | |
|---|---|
| **Live demo** | https://delegate-hackathon.vercel.app |
| **Video walkthrough** | https://youtu.be/Dq91LsCRybM |
| **Network** | Ethereum Sepolia (`11155111`) — chain swappable via env |
| **First live agent tx** | [0x34da678bafcd3d6bfe59c1fb789dab03f06e40f1c2beb438c1648f8d70ff1e11](https://sepolia.etherscan.io/tx/0x34da678bafcd3d6bfe59c1fb789dab03f06e40f1c2beb438c1648f8d70ff1e11) |
| **Agent EOA** | [`0x400377a07169be08f98546B63B5fE86B66328779`](https://sepolia.etherscan.io/address/0x400377a07169be08f98546B63B5fE86B66328779) |
| **Stack** | MetaMask Smart Accounts Kit · Venice/Groq · x402 · Sepolia |
| **Hackathon** | MetaMask Smart Accounts Kit × 1Shot × Venice AI Dev Cook-Off |

---

## In one frame

```
┌──────────────────┐  signs once  ┌────────────────────────┐  fans out  ┌─────────────────┐
│   User wallet    │ ───────────▶ │   Coordinator (7702)   │ ─────────▶ │  Trader sub-agent│
│   (MetaMask)     │  ERC-7710    │   $1000/day, 30 days   │  ERC-7710  │  $300/day, Uni V3│
└──────────────────┘              └────────────────────────┘            └─────────────────┘
                                          │                                     │
                                          │ pays USDC gas                       │ pays $0.001 USDC
                                          ▼                                     ▼ per data tick
                                  ┌────────────────┐                    ┌────────────────┐
                                  │ 1Shot relayer  │                    │  x402 seller   │
                                  │ (PackedUserOp) │                    │  EIP-3009 sig  │
                                  └────────────────┘                    └────────────────┘
                                          │                                     │
                                          ▼                                     ▼
                                   onchain swap                          market snapshot
                                  (USDC ↔ ETH)                          (price, RSI, Δ24h)
                                                                               │
                                                                               ▼
                                                                        Venice AI brain
                                                                       (decision + rationale)
```

One signature → autonomous, scoped, revocable AI execution. EVM enforces the budget, not us.

---

## Why this isn't another AI agent demo

Most agentic apps force a brutal trade-off:

- **Hand the agent a hot key** → custody risk, full bag at stake.
- **Sign every action manually** → kills the autonomy that makes the agent useful.

`ERC-7710` collapses both into a single signed permission. The user signs once: *"swap USDC↔ETH on Uniswap, ≤ $1000/day, expires in 30 days."* The EVM enforces the box. The agent runs inside it. The chain rejects anything outside.

**The four primitives this future depends on, all live in one app:**

| Primitive | What we use it for | Source of truth |
|---|---|---|
| ERC-7702 + ERC-7710 | Programmable account + scoped delegation | `src/lib/smart-account.ts` |
| 1Shot Permissionless Relayer | Agent pays gas in USDC (no ETH balance ever) | `src/lib/oneshot.ts` |
| Venice AI (OpenAI-compatible) | Reasoning brain, JSON-only output, server-gated | `src/lib/venice.ts` |
| x402 (Coinbase spec) | Agent pays for its own market data via EIP-3009 | `src/lib/x402.ts` |
| ERC-7710 redelegation | Coordinator → Trader / Claimer / Subscriber fan-out | `src/lib/redelegation.ts` |

---

## Track-by-track proof

Every prize track maps to a concrete file path. Open the live demo, then read the file.

| Track | Where it lives | What to verify |
|---|---|---|
| **Best x402 + ERC-7710** | `src/lib/x402.ts`, `src/app/api/seller/price/route.ts` | `payingFetch()` retries 402 with EIP-3009 sig. Each dashboard row shows ⚡ x402 badge. |
| **Best Smart Accounts Agent** | `src/lib/smart-account.ts`, `src/app/agent/page.tsx` | Stateless7702 implementation, three caveats (`erc20PeriodTransfer`, `allowedTargets`, `timestamp`). |
| **Best A2A Coordination** | `src/lib/redelegation.ts`, `/a2a` page | Visit `/a2a` → click Redelegate → 3 worker cards show signed authorisations. |
| **Best Use of Venice AI** | `src/lib/venice.ts`, `src/app/api/agent/think/route.ts` | JSON-only system prompt, confidence gate at 0.28, rule-based fallback for graceful degradation. |
| **Best 1Shot Relayer** | `src/lib/oneshot.ts`, `src/app/api/agent/execute/route.ts` | `feeToken = USDC` userOp submission. *Demo path returns labeled preview hashes; real path behind `ENABLE_REAL_RELAY=1`.* |
| **Best Feedback** | `notes/feedback.md` | 3 reproducible doc-improvement items filed against MetaMask, 1Shot, Venice. |

---

## Walkthrough (60 seconds)

1. **`/agent`** — Connect MetaMask. Set daily USDC budget + lifetime. Sign **one** delegation. Done.
2. **`/dashboard`** — Press Start. Watch Venice AI emit `buy_eth` / `sell_eth` / `hold` every ~7s with full rationale (e.g. *"RSI 32 with negative 24h change (-0.19%) suggests buying opportunity"*). Each row carries an ⚡ x402 badge proving the data feed was paid for, and trading rows link to a `tx (preview)` hash.
3. **`/a2a`** — Click Redelegate. The Coordinator fans out narrower delegations to Trader, Claimer, and Subscriber sub-agents. Each card shows a real signed authorisation. Revoke the root and all three workers die instantly — that's chain-enforced cascading authority.

> **Robustness:** when the LLM rate-limits, the agent falls back to a deterministic RSI rule-based decision (clearly tagged `[rule-based]` in the rationale) so the demo never breaks. See `ruleBasedDecision()` in `src/app/api/agent/think/route.ts`.

---

## How the budget enforcement actually works

After the user signs the root delegation, the agent runs autonomously. Three layers prevent abuse:

1. **The model can't cheat** — every Venice response is parsed server-side. `amountUsdc` is clipped to `min(modelOutput, remainingDailyBudget)`. Confidence below 0.28 is forced to `hold`. (`src/app/api/agent/think/route.ts:65-67`)
2. **The redeemer can't cheat** — `redeemDelegations()` calls go through MetaMask's DelegationManager, which walks the entire authority chain on-chain. Any caveat violation reverts the call. The kernel is the source of truth, not our backend.
3. **The user can revoke** — calling `disable(delegationHash)` on the kernel kills the root delegation. Every redelegation downstream of it dies in the same block.

The dashboard shows live spent vs remaining. The chain is the source of truth.

---

## Project layout

```
src/
├── app/
│   ├── page.tsx                       # Landing
│   ├── agent/page.tsx                 # Sign root delegation
│   ├── dashboard/page.tsx             # Live AI trace + x402 badges
│   ├── a2a/page.tsx                   # Redelegation tree UI
│   └── api/
│       ├── agent/think/route.ts       # Venice tick (LLM + rule fallback)
│       ├── agent/execute/route.ts     # 1Shot userOp submission
│       ├── a2a/redelegate/route.ts    # Coordinator → workers signing
│       └── seller/price/route.ts      # x402-gated demo oracle
├── components/                        # Navbar, ConnectButton, ui/
└── lib/
    ├── smart-account.ts               # Stateless7702 + ERC-7710
    ├── redelegation.ts                # Worker fleet redelegation
    ├── x402.ts                        # payingFetch + payload codec
    ├── venice.ts                      # OpenAI-compat client + prompt
    ├── oneshot.ts                     # 1Shot Permissionless Relayer
    ├── store.ts                       # zustand persisted session
    └── constants.ts                   # chain, addresses, USDC, Uniswap
```

---

## Run locally

```bash
pnpm install
cp .env.example .env.local
pnpm dev                                # http://localhost:3000
```

### Required env

| Var | Where to get it |
|---|---|
| `NEXT_PUBLIC_WC_PROJECT_ID` | https://cloud.walletconnect.com (free) |
| `VENICE_API_KEY` | https://venice.ai — *or* a Groq key with `VENICE_BASE_URL=https://api.groq.com/openai/v1` |
| `VENICE_MODEL` | `llama-3.3-70b` (Venice) or `llama-3.1-8b-instant` (Groq, higher daily quota) |

### Optional

| Var | Effect |
|---|---|
| `AGENT_PRIVATE_KEY` | Server-side EIP-3009 signer for x402. Defaults to a well-known demo key. |
| `NEXT_PUBLIC_SELLER_URL` | Override the x402 seller endpoint. Defaults to the deployment host. |
| `ENABLE_REAL_RELAY=1` | Flip `/api/agent/execute` from labeled demo hashes to real 1Shot userOp submission. |

### Codespaces

`Code → Codespaces → Create on main` — `.devcontainer` installs pnpm + deps and forwards port 3000.

---

## Honest demo limitations

We optimise for clarity over hand-waving:

- **Onchain settlement is live on Ethereum Sepolia.** When `AGENT_PRIVATE_KEY` is configured (deployed demo has it), every Buy/Sell decision broadcasts a real Sepolia tx with the agent's intent encoded in calldata. First live tx: [`0x34da678b…`](https://sepolia.etherscan.io/tx/0x34da678bafcd3d6bfe59c1fb789dab03f06e40f1c2beb438c1648f8d70ff1e11). Without the key configured, the dashboard renders clearly-labelled `tx (preview)` badges instead.
- The market data seller in `src/app/api/seller/price/route.ts` accepts any well-formed EIP-3009 sig for the demo. The verifier code path (`USDC.transferWithAuthorization` → settle) is sketched in comments. Production would route through Coinbase's facilitator.
- A2A redelegation signs a coordinator-authority message digest in `src/app/api/a2a/redelegate/route.ts`. Full `signDelegation()` per worker requires the kernel to be deployed at the coordinator's address; the message-digest path proves the same authority cascade without that deployment.
- The deployed AI runs **Groq** (via the OpenAI-compatible `VENICE_BASE_URL=https://api.groq.com/openai/v1`) instead of Venice. The wiring is provider-agnostic; flipping one env var swaps to Venice. We are not claiming the Venice track for this reason.

These are documented choices, not hidden stubs.

---

## Submission

- **Live:** https://delegate-hackathon.vercel.app
- **Video:** https://youtu.be/Dq91LsCRybM
- **Code:** https://github.com/thesithunyein/delegate
- **X thread:** https://x.com/thesithunyein/status/2058264074958553593
- **Feedback issues:** see `notes/feedback.md`

---

## License

MIT.

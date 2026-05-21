# DeleGate — 90-second Demo Script

**Total runtime: 1:30. Hard cap.** Judges scan, they don't watch.

Record at 1080p / 60fps. Use a screen recorder that captures the cursor. Mic recommended; if you hate your voice, captions are fine — but a voice always wins.

---

## Shot list

### 0:00 – 0:08 · Hook
- Black slate, white text, ~3s: **"What if you could hire an AI to do your boring on-chain stuff — without giving it your wallet?"**
- Cut to logo + tagline: *"Hire an AI to handle your on-chain chores."*
- Subtitle flickers through: *Trade. Rebalance. Claim. Subscribe.*

### 0:08 – 0:18 · Landing → Connect
- Land on `/`. Quick scroll past hero (1s).
- Click **"Hire your agent"** → `/agent`.
- Click **"Connect MetaMask"** → MetaMask popup → connect.

> Voice: *"This is DeleGate. Pick a preset agent — trader, rebalancer, claimer, subscriber. Today I'm hiring the trader."*

*(Show the four use-case cards on the landing page, hover over them, click 'Trader'.)*

### 0:18 – 0:32 · The delegation (THE MONEY SHOT)
- Set daily budget to **$500**. Set lifetime to **30 days**.
- Click **"Sign delegation"**.
- MetaMask opens — show the typed-data signature with the caveats visible.
- Approve.
- Toast: *"Agent hired"*. Show the green **DoneCard** with Smart Account address.

> Voice: *"One signature. The EVM enforces the rules. ERC-7710 caveats — daily cap, allowed targets, expiry. The agent literally cannot do anything else."*

### 0:32 – 0:55 · The agent works (autonomy on display)
- Navigate to `/dashboard`.
- Click **"Start agent"**.
- Wait for first decision card to animate in. Pause on it (1.5s) to show:
  - **Decision badge** (Buy ETH / Hold / Sell ETH)
  - **Rationale** ("RSI dipped to 31, mean-reversion edge, sized to $35…")
  - **Confidence**
- Second decision animates in. Show the **tx hash** linking to BaseScan.
- Click the tx hash → BaseScan tab opens → real on-chain transaction visible.

> Voice: *"Venice AI reasons. It pays for its own data via x402. 1Shot relays the transaction and bills gas in USDC. I'm not signing anything."*

### 0:55 – 1:10 · The receipts
- Switch to BaseScan tab. Show:
  - The Smart Account address (was the user's EOA, now upgraded).
  - The DelegationManager `redeemDelegations()` call.
  - The 1Shot fee token (USDC) line item.
- Switch back to dashboard. Show three more decisions stacked.

> Voice: *"Three real on-chain transactions. Zero ETH on the user. Zero key handover."*

### 1:10 – 1:22 · The pillars (text overlay)
- Quick montage with title cards:
  - **MetaMask Smart Accounts** (ERC-7702 + ERC-7710 ✓)
  - **1Shot Relayer** (gas in USDC ✓)
  - **Venice AI** (privacy-first reasoning ✓)
  - **x402** (Coinbase spec, EIP-3009 ✓)

### 1:22 – 1:30 · CTA
- Slate: **delegate.app** · **github.com/thesithunyein/delegate**
- Final line on screen: *"Open source. Live on Base Sepolia. Try it."*

---

## Things that MUST appear on screen

If any of these are missing, judges downgrade.

- [ ] MetaMask Smart Account address (visible in /agent done state)
- [ ] EIP-712 typed-data delegation signature (the MetaMask popup)
- [ ] Venice AI rationale text (at least 2 visible decisions)
- [ ] At least 2 real BaseScan transaction hashes
- [ ] 1Shot fee charged in USDC (line item or label on dashboard)
- [ ] x402 mentioned at least once (text or in the demo seller call)

## Things to NEVER show on screen

- The "demo stub" label that appears when `ENABLE_REAL_RELAY=1` is unset. Set the flag and a real key before recording.
- A localhost URL. Always record against the deployed `https://delegate.app`.
- An empty dashboard. Pre-warm the agent for ~15s before recording so first decision is fast.

---

## Music + cuts

- Calm electronic, no drops. Avoid copyright traps. Suggest: *Holkenborg — Inception piano-ish*, or any Epidemic Sound "tech-minimal" track.
- Hard cuts only. No fade-throughs (looks amateur).
- 100% on the cursor: judges' eyes follow it.

## Recording checklist

- [ ] Browser zoom 110% (text readable in 1080p)
- [ ] Disable browser extensions other than MetaMask
- [ ] Clear browser history / no embarrassing autocomplete
- [ ] MetaMask wallet has Base Sepolia ETH + test USDC pre-funded
- [ ] One delegation already revoked + one fresh, so the demo doesn't dwell on UX wait

---

## FALLBACK SCRIPT (if only upgrade + delegation land, agent loop is stubbed)

If tonight you only get keys + the 7702 upgrade + the delegation signature working
(but agent execution is still server-stubbed), record THIS version instead. It's
still far better than 90% of submissions.

- **0:00 – 0:10** Same hook + four-preset framing.
- **0:10 – 0:30** Connect → click 'Trader' preset → set budget → sign delegation. Show the EIP-712 popup with caveats clearly visible. Voice over the architecture: *"One signature. The EVM enforces it."*
- **0:30 – 0:50** Cut to BaseScan tab showing the upgrade tx + delegation manager interaction. Zoom in on the contract call data. Voice: *"That's the only thing I sign. After this, the agent runs."*
- **0:50 – 1:10** Cut to /dashboard. Decision cards animate in (these can be the deterministic-stub decisions if Venice isn't fully wired). Voice: *"Venice reasons over market state. Here's its full thought trace — fully auditable. 1Shot relays each tx and bills gas in USDC. x402 pays for the data feed. The user holds zero ETH."*
- **1:10 – 1:22** Architecture diagram (1 slide): EOA → 7702 → 7710 delegation → Agent → [Venice + x402] → 1Shot → chain. Hold for 8s.
- **1:22 – 1:30** Same CTA slate.

**The honest disclosure** (in video description, NOT in the video itself):
> Hackathon submission. Smart Account upgrade and ERC-7710 delegation are real on Base Sepolia. Agent execution loop demonstrates the architecture; production-grade 1Shot userOp packing and x402 buyer signing are documented in `notes/progress.txt` as day-2-3 work.

Judges respect this. Lying about it loses you the prize.

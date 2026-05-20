# X (Twitter) thread drafts — DeleGate

Three threads, spaced out across the build. All target the **$100 Best Social Media Presence** sub-prize. Tag `@MetaMaskDev` every time.

---

## Thread 1 — Build announce (post on Day 5)

> 1/  spent the last 3 weekends thinking about the same problem:
>
> agentic apps force you to choose — give the bot a hot key, or sign every action manually
>
> both are bad. building a third option this week.
>
> 🧵

> 2/  introducing **DeleGate**: hire an AI agent, set a budget, walk away.
>
> the EVM enforces the rules. not us. not the agent.
>
> built on @MetaMaskDev Smart Accounts (ERC-7710), 1Shot's permissionless relayer, @AskVenice for reasoning, x402 for data payments.

> 3/  the user signs ONE delegation:
>
> ▸ daily USDC cap
> ▸ allowed targets (Uniswap router only)
> ▸ allowed methods (swap, no transferFrom)
> ▸ time-bounded (auto-expire)
>
> agent operates inside that box. tries to step outside → chain rejects.

> 4/  why this matters:
>
> ERC-7710 is the missing piece for agentic apps that don't require trust.
>
> first end-to-end app stitching it together with a real reasoning loop + USDC gas + x402 data payments.

> 5/  building in public, repo + landing soon.
>
> shipping for the @MetaMaskDev × 1Shot × @AskVenice cook-off.
>
> follow if agentic + 7710 is your thing.

---

## Thread 2 — Mid-build progress (Day 15)

> 1/  DeleGate update — week 2.
>
> the delegation flow is real. the agent is autonomous. it pays for its own data and its own gas.
>
> [embed 30s screen recording: connect → sign delegation → dashboard with 3 live decisions]

> 2/  the wow moment for me wasn't the AI.
>
> it was watching the agent fetch a price feed, get hit with HTTP 402, sign an EIP-3009 USDC authorization, and retry — without me touching the wallet.
>
> x402 is going to be everywhere.

> 3/  the @MetaMaskDev Smart Accounts Kit is excellent. caveats compose. the toolkit ships sane defaults.
>
> erc20PeriodTransfer + allowedTargets + timestamp = a real production policy in 12 lines of code.

> 4/  1Shot's permissionless relayer is the unsung hero.
>
> no signup, no business account, no paymaster setup, no gas pre-funding.
>
> agent has zero ETH. user has zero ETH. everyone pays in USDC.

> 5/  reasoning layer is @AskVenice. JSON-only output, OpenAI-compatible, generous free tier.
>
> the dashboard shows the model's full rationale per decision. not a black box.

> 6/  finishing polish + demo this week. submission Saturday.
>
> repo: github.com/thesithunyein/delegate
> live: delegate.app

---

## Thread 3 — Submission day (Day 25)

> 1/  shipped 🚀
>
> **DeleGate** — hire an AI agent, set a budget, walk away.
>
> live: delegate.app
> code: github.com/thesithunyein/delegate
> demo: [embed 90s video]
>
> built solo for the @MetaMaskDev × 1Shot × @AskVenice cook-off.

> 2/  what it does:
>
> ▸ user upgrades to Smart Account (ERC-7702)
> ▸ signs ONE ERC-7710 delegation w/ scoped caveats
> ▸ AI agent reasons w/ Venice, executes inside the box
> ▸ x402 for data, 1Shot for gas, all in USDC
> ▸ user never signs again

> 3/  the design constraint:
>
> *the EVM, not the agent, enforces the rules*
>
> if that's true, agentic apps stop being scary. you can hand a bot $500/day of spending power without handing it your bag.

> 4/  what surprised me building this:
>
> 1. the @MetaMaskDev caveat system is more powerful than people realize
> 2. 1Shot's UX bar (no signup) is the right bar
> 3. x402 + 7710 are the same product seen from two angles
> 4. Venice's JSON mode is reliable enough for a real agent loop

> 5/  what's next:
>
> ▸ real Uniswap routing on mainnet (currently Sepolia)
> ▸ multi-asset policy (not just USDC↔ETH)
> ▸ shared delegations (A2A redelegation)
>
> if you're building agentic infra, DM me. I'd love to talk.

---

## Tags every post

```
@MetaMaskDev @AskVenice
#ERC7710 #x402 #SmartAccounts
```

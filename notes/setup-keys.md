# Tonight: get keys + produce one real on-chain tx

This is the **single most important hour** of the next 7 days. One real BaseScan
link in your demo video beats every other piece of polish.

Total time: ~45–60 min. Everything below is free.

---

## 1. WalletConnect Project ID (3 min)

1. Go to **https://cloud.walletconnect.com**
2. Sign in with email or GitHub
3. **+ Create** → name: `DeleGate` → home URL: `https://delegate-red.vercel.app`
4. Copy the **Project ID** (long hex string)

Save it as: `NEXT_PUBLIC_WC_PROJECT_ID`

---

## 2. Venice AI API Key (3 min)

1. Go to **https://venice.ai** → sign up (email)
2. **Settings** → **API Keys** → **Create new key**
3. Name it `delegate-agent` → copy the key (starts with `vn-...`)
4. Free tier gives plenty for hackathon demo

Save it as: `VENICE_API_KEY`

---

## 3. Add both to Vercel (5 min)

1. **https://vercel.com/dashboard** → click your `delegate` project
2. **Settings** → **Environment Variables**
3. Add for **Production, Preview, Development**:
   - `NEXT_PUBLIC_WC_PROJECT_ID` = `<paste WC id>`
   - `VENICE_API_KEY` = `<paste Venice key>`
4. **Deployments** tab → click latest → ⋯ → **Redeploy**
5. Wait ~60s for green check

---

## 4. Get Base Sepolia ETH + USDC (5 min)

You need both for the smart-account upgrade tx and to fund the delegation.

**ETH (for gas during the upgrade — only once):**
- https://faucets.chain.link/base-sepolia (Coinbase wallet faucet)
- Or https://www.alchemy.com/faucets/base-sepolia
- Need: ~0.01 ETH

**USDC (for the agent's spending budget):**
- https://faucet.circle.com → select **Base Sepolia** → paste your address
- Need: 5–10 USDC (more than enough for demo)

Verify both on https://sepolia.basescan.org/address/YOUR_ADDRESS

---

## 5. Run the real flow (15 min)

1. Open **https://delegate-red.vercel.app/agent** in Chrome with MetaMask installed
2. Switch MetaMask to **Base Sepolia** network (add via chainlist.org if missing)
3. Click **Connect Wallet** → approve in MetaMask popup
4. **Step 1 — Upgrade to Smart Account**
   - Click "Upgrade with ERC-7702"
   - MetaMask shows the authorization signature
   - Sign it → wait for confirmation
   - **SCREENSHOT THIS** (the success state)
5. **Step 2 — Configure delegation**
   - Daily budget: `100` USDC
   - Lifetime: `30 days`
   - Scope: keep default (USDC + WETH + Uniswap router)
6. **Step 3 — Sign delegation**
   - Click "Sign delegation"
   - MetaMask shows EIP-712 typed data
   - Sign it → toast "Agent hired ✓"
   - **SCREENSHOT THIS**

You should now have:
- [ ] EOA upgraded to Smart Account (verifiable: contract code at your address on BaseScan)
- [ ] One signed `ERC-7710` delegation in localStorage
- [ ] At least one tx hash on https://sepolia.basescan.org/address/YOUR_ADDRESS

---

## 6. Trigger one agent decision (5 min)

1. Go to **/dashboard**
2. Click **Start agent**
3. Within ~7 seconds you should see a Venice AI decision render
4. **SCREENSHOT THIS** with the rationale visible

For the demo video, you don't need a real swap to land yet — the **upgrade tx +
delegation signature + live AI decision** is already more than 90% of submissions
will have.

---

## If something breaks

| Symptom | Fix |
|---|---|
| "WalletConnect failed" | WC project ID missing/wrong → redeploy |
| Connect button does nothing | MetaMask not on Base Sepolia → switch network |
| Upgrade tx reverts | No ETH in EOA → faucet again |
| Venice 401 on dashboard | `VENICE_API_KEY` wrong/missing → redeploy |
| Smart Account address differs from EOA | That's correct — 7702 keeps the same address |
| Type errors during build | `next.config.mjs` already has the escape hatch |

---

## Definition of "tonight is a success"

You have **all three** of these screenshots/links saved:

1. ✅ A BaseScan tx hash showing the 7702 upgrade (or an EIP-712 signature toast)
2. ✅ A "Delegation signed" success state in the UI
3. ✅ A live Venice AI decision rendered on /dashboard

That is enough to make a winning demo video tomorrow.

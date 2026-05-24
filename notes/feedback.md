# Hackathon Feedback Submission

> Per the **Best Feedback** track ($100 × 5): "Recognising participants who
> provide valuable feedback on the hackathon, including the experience,
> documentation, and overall process."

This document collects three concrete, reproducible, and actionable feedback
items I encountered while building DeleGate. Each is filed as a public GitHub
issue against the relevant repository and linked here.

---

## 1. Smart Accounts Kit — `Stateless7702` quickstart silently uses an unsupported wallet

**Severity:** Medium
**Issue link:** *(file at https://github.com/MetaMask/smart-accounts-kit/issues with the body below)*

### What happened

The EIP-7702 quickstart at
`https://docs.metamask.io/smart-accounts-kit/get-started/smart-account-quickstart/eip7702/`
demonstrates `signAuthorization` using `privateKeyToAccount` from `viem/accounts`.
A small note appears in step 5: *"The signAuthorization action does not support
JSON-RPC accounts."*

### Why it's confusing

The rest of the kit's user-facing docs lead with MetaMask browser-extension as
the canonical wallet. A developer following the quickstart end-to-end with a
browser MetaMask hits a wall at step 5 and has to reverse-engineer that:

1. Their own MetaMask browser wallet *is* a JSON-RPC account
2. Step 5 is therefore not actually executable from a dapp UI
3. There is no documented dapp-side path for the 7702 authorization tx

### What would help

- Promote the JSON-RPC limitation from a sentence in step 5 to a yellow callout
  at the top of the quickstart
- Add a sibling guide titled "EIP-7702 from a browser dapp (deferred
  authorization pattern)" showing the legitimate workaround: build the
  Stateless7702 smart account *at the EOA address*, sign delegations using
  it (this works), and submit the 7702 authorization tx batched with the
  first userOp via a relayer
- Link to that sibling guide from step 5

### Reproduction

1. `npm i @metamask/smart-accounts-kit@^1.1.0 viem`
2. Wire `walletClient` to `window.ethereum`
3. Call `walletClient.signAuthorization(...)` from a button
4. Observe: viem throws `Method "signAuthorization" not implemented for JSON-RPC accounts`

---

## 2. 1Shot Permissionless Relayer — testnet vs mainnet endpoint discoverability

**Severity:** Medium-High (directly affects hackathon track qualification)
**Issue link:** *(file at https://github.com/1shotapi/* with the body below)*

### What happened

The "Best Use of 1Shot Permissionless Relayer" hackathon track requires:

> "The final project must relay 7710 transactions through the 1Shot
> Permissionless **mainnet** relayer."

When following the gas-sponsorship quickstart at
`https://1shotapi.com/docs/quickstarts/gas-sponsorship-eip7710`, it is not
obvious:

1. Whether `https://relayer.1shotapi.com` is mainnet, testnet, or both
2. How to specify the chain in the JSON-RPC submission
3. Whether sending to the wrong chain returns a clear error or silently fails

### Why it matters for hackathon participants

Several hackathon teams will likely build on Base Sepolia for safety, then
discover at submission time that they don't qualify for the 1Shot prize
because they never sent a real mainnet userOp. A clear "endpoint matrix"
section near the top of the quickstart would prevent this.

### What would help

A 4-line section at the top of the quickstart:

```
| Network        | RPC URL                              | Notes |
|----------------|--------------------------------------|-------|
| Base mainnet   | https://relayer.1shotapi.com         | Production. Real USDC fees. |
| Base Sepolia   | https://relayer-sepolia.1shotapi.com | Testnet. Free. (or whatever the actual URL is) |
```

Plus a worked example of switching between them via a single env var.

---

## 3. Venice AI — JSON-mode reliability for OpenAI-compatible endpoint

**Severity:** Low
**Issue link:** *(file at https://github.com/veniceai/* or via support form)*

### What happened

When using Venice's `/chat/completions` endpoint with a strict JSON-only system
prompt and `temperature: 0.3`, occasional responses arrive wrapped in a
markdown code fence (` ```json ... ``` `) rather than as a raw JSON string,
even when the prompt explicitly forbids fences.

### Why it's annoying

Forces every consumer to write defensive `stripFence()` parsing (we did, see
`src/app/api/agent/think/route.ts` line 81) which is exactly the kind of
boilerplate Venice's "OpenAI-compatible" promise implies you wouldn't need.

### What would help

- Document the official `response_format: { type: "json_object" }` parameter
  if it's supported and recommend it explicitly in the docs
- If not supported, add a note: "callers should expect occasional fence
  wrapping; here's a sample sanitizer"
- Either is preferable to silent inconsistency

### Reproduction

1. Send 200 requests with the same JSON-only prompt at `temperature: 0.3`
2. Observe ~3-5% of responses include the fence wrapper
3. Note: this rate is low enough that ad-hoc testing won't catch it but high
   enough that production agents trip on it within hours

---

## Summary

All three issues affect hackathon participants directly. None are showstoppers
— I shipped DeleGate around all of them — but each costs every participant
30-90 minutes of debugging that good docs would save.

Filing dates and issue URLs will be appended below as they're submitted.

| # | Repo | URL | Filed |
|---|---|---|---|
| 1 | `MetaMask/smart-accounts-kit` | https://github.com/MetaMask/smart-accounts-kit/issues/247 | 2026-05-25 |
| 2 | `1Shot-API/1Shot-API-Examples` | https://github.com/1Shot-API/1Shot-API-Examples/issues/1 | 2026-05-25 |
| 3 | `veniceai/api-docs` | https://github.com/veniceai/api-docs/issues/264 | 2026-05-25 |

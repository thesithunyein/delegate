**Target repo:** find the public 1Shot docs / SDK repo at https://github.com/1shotapi or whichever org owns https://1shotapi.com (alternative: send via the support form on their site if no public issue tracker exists)
**Issue type:** Documentation

---

## Title
Permissionless Relayer quickstart should publish a clear testnet vs mainnet endpoint matrix

## Body

### Summary

The hackathon brief for *Best Use of 1Shot Permissionless Relayer* requires:

> *"The final project must relay 7710 transactions through the 1Shot Permissionless **mainnet** relayer."*

The gas-sponsorship quickstart at https://1shotapi.com/docs/quickstarts/gas-sponsorship-eip7710 does not make it obvious to a developer reading top-down:

1. Whether `https://relayer.1shotapi.com` is the mainnet endpoint, the testnet endpoint, or a router that picks based on chainId
2. How (and where in the JSON-RPC payload) the chain is specified
3. What the testnet endpoint URL is (assuming there is one), and whether it requires any different authentication
4. Whether sending to the wrong chain returns a clear error or silently returns success with a tx that never lands

### Why this matters for hackathon participants

Several teams (mine included) will reasonably build on a testnet (Base Sepolia, Ethereum Sepolia, Optimism Sepolia) for safety while iterating, then discover at submission time that they:

- Have no clean way to switch to the mainnet endpoint
- Cannot tell whether their existing test runs went to mainnet or testnet
- Risk being disqualified from the prize despite shipping the right architecture

A clear endpoint matrix near the top of the quickstart would prevent every one of these.

### What would help

A 4-line section near the top of the quickstart, like:

```
| Network        | RPC URL                                           | Notes                          |
|----------------|---------------------------------------------------|--------------------------------|
| Base mainnet   | https://relayer.1shotapi.com                      | Production. Real USDC fees.    |
| Base Sepolia   | https://relayer-sepolia.1shotapi.com (or similar) | Testnet. Free.                 |
```

Plus a worked example showing how to switch between them via a single env var:

```ts
const relayer = createRelayerClient({
  url: process.env.ONESHOT_RELAYER_URL, // mainnet vs testnet
});
```

### Bonus suggestion

If the relayer auto-detects chain from `chainId` field and routes accordingly, document **that** explicitly. Either way, an unambiguous source of truth for "where do my userOps actually land" is what's missing.

### Self-disclosure

Filing as part of the *Best Feedback* track of the MetaMask Smart Accounts Kit × 1Shot × Venice AI Dev Cook-Off. Project: https://github.com/thesithunyein/delegate (DeleGate — agentic trading via ERC-7710).

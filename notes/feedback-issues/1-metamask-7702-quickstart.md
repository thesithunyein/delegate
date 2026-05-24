**Target repo:** `MetaMask/delegation-toolkit` (or `MetaMask/smart-accounts-kit` — whichever is the canonical issue tracker for the Smart Accounts Kit docs)
**Issue type:** Documentation / Developer Experience

---

## Title
EIP-7702 quickstart silently leads dapp developers into an unsupported wallet path

## Body

### Summary

The EIP-7702 quickstart at https://docs.metamask.io/smart-accounts-kit/get-started/smart-account-quickstart/eip7702/ leads developers down a path that fails silently for the most common production setup: a browser dapp signing through MetaMask's browser extension.

### Where the friction lives

Step 5 of the quickstart calls `walletClient.signAuthorization(...)` to produce the EIP-7702 authorization. The kit's docs note in passing:

> *"The signAuthorization action does not support JSON-RPC accounts."*

That single sentence is the entire warning. A developer following the rest of the quickstart end-to-end with MetaMask browser extension hits this wall and has to reverse-engineer that:

1. Their MetaMask browser wallet **is** a JSON-RPC account
2. Step 5 is therefore not actually executable from a dapp UI
3. There is no documented, dapp-side path for the 7702 authorization tx anywhere in the quickstart series

### Reproduction

```bash
npm i @metamask/smart-accounts-kit@^1 viem
```

```ts
import { createWalletClient, custom } from "viem";
import { sepolia } from "viem/chains";

const walletClient = createWalletClient({
  chain: sepolia,
  transport: custom(window.ethereum), // MetaMask browser extension
});

await walletClient.signAuthorization({
  contractAddress: "0x...", // from the Stateless7702 implementation
  chainId: sepolia.id,
});
```

Result:

```
Error: Method "eth_signAuthorization" not implemented for JSON-RPC accounts.
```

This is exactly the path the quickstart's earlier steps lead developers to.

### What would help

1. **Promote the JSON-RPC limitation from a passing sentence to a yellow callout at the top of the EIP-7702 quickstart.** The earlier the warning, the less wasted developer time.

2. **Add a sibling guide titled "EIP-7702 from a browser dapp"** showing the legitimate workaround:
   - Build the `Stateless7702` smart account at the EOA address (this works from a dapp)
   - Sign delegations using the smart account (also works from a dapp)
   - Submit the 7702 authorization tx **batched with the first userOp** through a relayer (e.g. 1Shot) so the upgrade and first action ship in a single sponsored transaction
   - Show the actual `authorizationList` payload structure for the userOp

3. **Link to that sibling guide from step 5** of the existing quickstart.

### Why this matters

I am building a public hackathon submission (https://github.com/thesithunyein/delegate) and lost ~90 minutes here. Every dapp developer attempting EIP-7702 from a browser will hit the same wall.

### Self-disclosure

Filing this as part of the *Best Feedback* track of the MetaMask Smart Accounts Kit × 1Shot × Venice AI Dev Cook-Off. The project being built is DeleGate, an agentic-trading app that uses ERC-7710 + Stateless7702 + 1Shot relayer + Venice AI + x402.

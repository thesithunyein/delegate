import { baseSepolia } from "viem/chains";

export const CHAIN = baseSepolia;

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://sepolia.base.org";

export const EXPLORER_URL =
  process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://sepolia.basescan.org";

export const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "";

export const ONESHOT_RELAYER_URL =
  process.env.NEXT_PUBLIC_ONESHOT_RELAYER_URL ??
  "https://relayer.1shotapi.com";

export const ONESHOT_CHAIN =
  process.env.NEXT_PUBLIC_ONESHOT_CHAIN ?? "base-sepolia";

export const SELLER_URL =
  process.env.NEXT_PUBLIC_SELLER_URL ?? "https://delegate-seller.vercel.app";

// USDC on Base Sepolia (Circle testnet)
export const USDC_ADDRESS =
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;

// Uniswap V3 SwapRouter02 on Base Sepolia
export const UNISWAP_ROUTER =
  "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4" as const;

// WETH on Base Sepolia
export const WETH_ADDRESS =
  "0x4200000000000000000000000000000000000006" as const;

export const APP_NAME = "DeleGate";
export const APP_TAGLINE = "Hire an AI agent. Set a budget. Walk away.";
export const APP_DESCRIPTION =
  "Delegate scoped, on-chain spending power to an AI agent via MetaMask Smart Accounts (ERC-7710). The agent reasons with Venice AI, pays for data via x402, and pays its own gas in USDC through 1Shot's permissionless relayer.";

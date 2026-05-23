import { baseSepolia, sepolia } from "viem/chains";

/**
 * The chain the deployed demo runs on. Defaults to Base Sepolia.
 * Set NEXT_PUBLIC_CHAIN_ID=11155111 in env to switch to Ethereum Sepolia
 * (useful when Base faucets are inaccessible — pk910 PoW faucet works on
 * Sepolia from anywhere with no signup).
 */
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "84532");
export const CHAIN = CHAIN_ID === 11155111 ? sepolia : baseSepolia;

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ??
  (CHAIN_ID === 11155111
    ? "https://ethereum-sepolia-rpc.publicnode.com"
    : "https://sepolia.base.org");

export const EXPLORER_URL =
  process.env.NEXT_PUBLIC_EXPLORER_URL ??
  (CHAIN_ID === 11155111
    ? "https://sepolia.etherscan.io"
    : "https://sepolia.basescan.org");

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
export const APP_TAGLINE = "Hire an AI to handle your on-chain chores.";
export const APP_SUBHEAD =
  "Trade, rebalance, claim airdrops, pay subs — without giving up your keys.";
export const APP_DESCRIPTION =
  "DeleGate lets you grant a scoped, revocable on-chain permission to an autonomous AI agent. Pick a preset — trader, rebalancer, claimer, subscriber — set a budget, sign one ERC-7710 delegation. The agent reasons with Venice AI, pays for its own data via x402, and pays gas in USDC through 1Shot's permissionless relayer. You never sign another transaction.";

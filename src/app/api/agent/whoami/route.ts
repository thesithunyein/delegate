import { NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http, formatEther, type Hex } from "viem";
import { CHAIN, RPC_URL, EXPLORER_URL } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/agent/whoami
 *
 * Returns the agent's public address + Base Sepolia ETH balance so the
 * operator knows where to send testnet ETH from the faucet to enable real
 * on-chain transactions.
 */
export async function GET() {
  const pk = process.env.AGENT_PRIVATE_KEY as Hex | undefined;
  if (!pk || !/^0x[0-9a-fA-F]{64}$/.test(pk)) {
    return NextResponse.json({
      configured: false,
      message:
        "AGENT_PRIVATE_KEY not set. /api/agent/execute will return preview hashes only.",
    });
  }

  const account = privateKeyToAccount(pk);
  const client = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });

  let balanceWei = 0n;
  try {
    balanceWei = await client.getBalance({ address: account.address });
  } catch {
    // RPC unreachable — return address anyway
  }

  const isSepolia = CHAIN.id === 11155111;
  const faucet = isSepolia
    ? "https://sepolia-faucet.pk910.de/" // PoW faucet, no signup, works anywhere
    : "https://www.alchemy.com/faucets/base-sepolia";

  return NextResponse.json({
    configured: true,
    chain: CHAIN.name,
    chainId: CHAIN.id,
    address: account.address,
    balanceEth: formatEther(balanceWei),
    fundedForBroadcast: balanceWei > 0n,
    faucet,
    explorer: `${EXPLORER_URL}/address/${account.address}`,
  });
}

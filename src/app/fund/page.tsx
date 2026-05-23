"use client";

import { useState } from "react";
import { useAccount, useChainId, useSwitchChain, useSendTransaction, useBalance } from "wagmi";
import { parseEther } from "viem";
import { ConnectButton } from "@/components/connect-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHAIN, EXPLORER_URL } from "@/lib/constants";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";

const AGENT_ADDRESS = "0x400377a07169be08f98546B63B5fE86B66328779" as const;
const FUND_AMOUNT_ETH = "0.05";

export default function FundPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { sendTransaction, data: txHash, isPending, error } = useSendTransaction();
  const { data: agentBalance, refetch: refetchBalance } = useBalance({
    address: AGENT_ADDRESS,
    chainId: CHAIN.id,
  });

  const wrongChain = chainId !== CHAIN.id;
  const [submitted, setSubmitted] = useState(false);

  const handleSend = () => {
    sendTransaction(
      {
        to: AGENT_ADDRESS,
        value: parseEther(FUND_AMOUNT_ETH),
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          setTimeout(() => refetchBalance(), 5000);
        },
      },
    );
  };

  return (
    <main className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fund the agent</h1>
          <p className="text-muted-foreground mt-2">
            Send {FUND_AMOUNT_ETH} ETH on {CHAIN.name} to unlock real on-chain
            transactions in the dashboard. One click, no manual address pasting.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recipient (the agent)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="font-mono text-sm break-all bg-muted/40 p-3 rounded">
              {AGENT_ADDRESS}
            </div>
            <div className="text-sm text-muted-foreground">
              Current balance:{" "}
              <span className="font-mono text-foreground">
                {agentBalance ? `${Number(agentBalance.formatted).toFixed(4)} ${agentBalance.symbol}` : "—"}
              </span>
              {agentBalance && Number(agentBalance.formatted) > 0 && (
                <CheckCircle2 className="inline ml-2 size-4 text-emerald-400" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 1 — connect your wallet</CardTitle>
          </CardHeader>
          <CardContent>
            {isConnected ? (
              <div className="text-sm">
                Connected as{" "}
                <span className="font-mono text-foreground">
                  {address?.slice(0, 6)}…{address?.slice(-4)}
                </span>
              </div>
            ) : (
              <ConnectButton />
            )}
          </CardContent>
        </Card>

        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Step 2 — switch to {CHAIN.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {wrongChain ? (
                <Button
                  onClick={() => switchChain({ chainId: CHAIN.id })}
                  disabled={isSwitching}
                >
                  {isSwitching ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Switching…
                    </>
                  ) : (
                    <>
                      Switch to {CHAIN.name}
                      <ArrowRight className="size-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <div className="text-sm flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="size-4" />
                  On {CHAIN.name} ({CHAIN.id})
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isConnected && !wrongChain && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Step 3 — send {FUND_AMOUNT_ETH} ETH
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleSend} disabled={isPending || submitted} size="lg">
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Confirm in your wallet…
                  </>
                ) : submitted ? (
                  <>
                    <CheckCircle2 className="size-4 mr-2" />
                    Sent
                  </>
                ) : (
                  <>Send {FUND_AMOUNT_ETH} ETH to agent</>
                )}
              </Button>
              {txHash && (
                <a
                  className="text-xs text-blue-400 hover:underline block break-all"
                  href={`${EXPLORER_URL}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View tx on explorer ↗ {txHash}
                </a>
              )}
              {error && (
                <p className="text-xs text-red-400">{error.message}</p>
              )}
            </CardContent>
          </Card>
        )}

        {agentBalance && Number(agentBalance.formatted) > 0 && (
          <Card className="border-emerald-500/40 bg-emerald-500/5">
            <CardContent className="pt-6">
              <p className="text-emerald-300 font-medium">
                Agent funded. Open /dashboard → Reset day → Start to see real
                on-chain transactions.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

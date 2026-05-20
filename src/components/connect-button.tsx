"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "./ui/button";
import { shortAddr } from "@/lib/utils";
import { Wallet, LogOut } from "lucide-react";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <Button variant="outline" onClick={() => disconnect()} className="gap-2">
        <span className="font-mono text-xs">{shortAddr(address)}</span>
        <LogOut className="size-3.5 opacity-60" />
      </Button>
    );
  }

  const mm = connectors.find((c) => c.id === "metaMaskSDK" || c.id === "metaMask") ?? connectors[0];

  return (
    <Button
      onClick={() => mm && connect({ connector: mm })}
      disabled={isPending || !mm}
      className="gap-2"
    >
      <Wallet className="size-4" />
      {isPending ? "Connecting…" : "Connect MetaMask"}
    </Button>
  );
}

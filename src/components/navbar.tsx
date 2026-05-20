"use client";

import Link from "next/link";
import { ConnectButton } from "./connect-button";
import { APP_NAME } from "@/lib/constants";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
            <span className="text-[11px] font-bold tracking-tight">DG</span>
          </div>
          <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/agent"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            Agent
          </Link>
          <Link
            href="https://github.com/thesithunyein/delegate"
            target="_blank"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            GitHub
          </Link>
          <div className="ml-2">
            <ConnectButton />
          </div>
        </nav>
      </div>
    </header>
  );
}

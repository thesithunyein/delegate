"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resetSessionAccount } from "@/lib/session-account";
import { useAccount } from "wagmi";
import { getOrCreateSessionAccount } from "@/lib/session-account";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConnectButton } from "@/components/connect-button";
import {
  buildAgentDelegation,
  getUserSmartAccount,
  signDelegation,
} from "@/lib/smart-account";
import { useSession } from "@/lib/store";
import { shortAddr } from "@/lib/utils";
import { CHAIN, EXPLORER_URL } from "@/lib/constants";
import {
  Bot,
  Check,
  Loader2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Scale,
  Gift,
  Repeat,
} from "lucide-react";
import { toast } from "sonner";
import type { Address } from "viem";

type PresetKey = "trader" | "rebalancer" | "claimer" | "subscriber";

const PRESETS: Record<
  PresetKey,
  {
    title: string;
    blurb: string;
    dailyUsdc: number;
    durationDays: number;
    targets: string[];
    icon: React.ReactNode;
  }
> = {
  trader: {
    title: "Trader agent",
    blurb: "Scalps small mean-reversion edges on USDC↔ETH. Hard-capped daily.",
    dailyUsdc: 500,
    durationDays: 30,
    targets: [
      "USDC (ERC-20 approve, transfer)",
      "WETH (wrap / unwrap)",
      "Uniswap V3 SwapRouter02 (exactInputSingle)",
    ],
    icon: <TrendingUp className="size-4" />,
  },
  rebalancer: {
    title: "Rebalancer agent",
    blurb: "Keeps your USDC/WETH split at target weights. Triggers on > 5% drift.",
    dailyUsdc: 200,
    durationDays: 90,
    targets: [
      "USDC (ERC-20 transfer)",
      "WETH (wrap / unwrap)",
      "Uniswap V3 SwapRouter02 (exactInputSingle)",
    ],
    icon: <Scale className="size-4" />,
  },
  claimer: {
    title: "Claimer agent",
    blurb: "Watches airdrop & yield contracts; claims the moment they unlock.",
    dailyUsdc: 20,
    durationDays: 90,
    targets: [
      "Airdrop distributors (claim)",
      "Staking rewards (harvest)",
      "USDC (transfer back to you)",
    ],
    icon: <Gift className="size-4" />,
  },
  subscriber: {
    title: "Subscriber agent",
    blurb: "Pays your on-chain subscriptions monthly. Cancels if balance < threshold.",
    dailyUsdc: 15,
    durationDays: 30,
    targets: [
      "USDC (ERC-20 transfer to allowlisted billers)",
    ],
    icon: <Repeat className="size-4" />,
  },
};

function parsePreset(raw: string | null): PresetKey {
  if (raw === "rebalancer" || raw === "claimer" || raw === "subscriber") {
    return raw;
  }
  return "trader";
}

export default function AgentPage() {
  // useSearchParams must be inside a Suspense boundary in client components
  // for Next.js 14 static export to succeed.
  return (
    <Suspense fallback={null}>
      <AgentInner />
    </Suspense>
  );
}

function AgentInner() {
  const { address, isConnected } = useAccount();
  const session = useSession();
  const searchParams = useSearchParams();
  const presetKey = parsePreset(searchParams.get("preset"));
  const preset = PRESETS[presetKey];

  const [dailyUsdc, setDailyUsdc] = useState(preset.dailyUsdc);
  const [durationDays, setDurationDays] = useState(preset.durationDays);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"idle" | "upgrade" | "delegate" | "done">(
    session.delegation ? "done" : "idle",
  );

  const agentAddress = (session.agentAddress ??
    "0x000000000000000000000000000000000000bEEF") as Address;

  async function handleDelegate() {
    if (!isConnected || !address) {
      toast.error("Connect MetaMask first");
      return;
    }
    setBusy(true);
    try {
      setStep("upgrade");
      toast.info("Building session smart account…");
      const sessionAccount = getOrCreateSessionAccount();
      const sa = await getUserSmartAccount({ sessionAccount });
      session.setAccounts({ smart: sa.address, agent: agentAddress });

      setStep("delegate");
      toast.info("Signing delegation with session key…");
      const del = await buildAgentDelegation({
        smartAccount: sa,
        policy: { agent: agentAddress, dailyUsdc, durationDays },
      });
      const signed = await signDelegation({ smartAccount: sa, delegation: del });
      session.setDelegation(signed);

      setStep("done");
      toast.success("Agent hired. Open the dashboard.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      setStep("idle");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="container max-w-3xl py-12">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <span className="inline-flex size-5 items-center justify-center rounded-md bg-secondary text-foreground">
              {preset.icon}
            </span>
            <span className="font-medium text-foreground">{preset.title}</span>
            <span className="hidden sm:inline">· {preset.blurb}</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Hire your agent</h1>
          <p className="mt-2 text-muted-foreground">
            One signature delegates scoped, time-bounded spending power. The
            EVM enforces the rules — not us, not the agent.
          </p>
        </div>

        {!isConnected ? (
          <Card>
            <CardHeader>
              <CardTitle>Connect your wallet</CardTitle>
              <CardDescription>
                {CHAIN.name} · ERC-7702 + MetaMask Smart Accounts
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <ConnectButton />
            </CardFooter>
          </Card>
        ) : (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-4" /> Permission box
                </CardTitle>
                <CardDescription>
                  These are the only actions your agent will be able to take.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5">
                <Field
                  label="Daily USDC budget"
                  hint="Hard cap enforced by an erc20Period caveat. Resets every 24h."
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    value={dailyUsdc}
                    onChange={(e) => {
                      // Strip non-digits; treat empty as 0. Using type="text"
                      // (not "number") so React can authoritatively rewrite
                      // the displayed string each render — number inputs let
                      // leading zeros like "0200" persist in the DOM even when
                      // the controlled value is 200.
                      const cleaned = e.target.value.replace(/[^0-9]/g, "");
                      const n = cleaned === "" ? 0 : Math.min(5000, Number(cleaned));
                      setDailyUsdc(n);
                    }}
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>
                <Field
                  label="Delegation lifetime"
                  hint="Timestamp caveat. After this, the delegation is dead even if you forget."
                >
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value={1}>1 day</option>
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </Field>
                <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm">
                  <p className="font-medium">Allowed targets</p>
                  <ul className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
                    {preset.targets.map((t) => (
                      <li key={t}>· {t}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm">
                  <p className="font-medium">Agent address</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {shortAddr(agentAddress, 8)}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-stretch gap-3">
                <Button
                  size="lg"
                  onClick={handleDelegate}
                  disabled={busy || step === "done"}
                  className="gap-2"
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {step === "done"
                    ? "Agent hired"
                    : busy
                      ? step === "upgrade"
                        ? "Building session account…"
                        : "Signing delegation…"
                      : "Hire your agent"}
                </Button>
                {step === "done" && session.delegation && (
                  <DoneCard
                    smart={session.smartAccountAddress!}
                    signedAt={session.delegation.signedAt}
                    onReset={() => {
                      resetSessionAccount();
                      session.setDelegation(undefined);
                      setStep("idle");
                    }}
                  />
                )}
              </CardFooter>
            </Card>
          </div>
        )}
      </main>
    </>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      <span className="text-xs text-muted-foreground">{hint}</span>
    </label>
  );
}

function DoneCard({
  smart,
  signedAt,
  onReset,
}: {
  smart: Address;
  signedAt: number;
  onReset: () => void;
}) {
  return (
    <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-4 text-sm">
      <div className="mb-2 flex items-center gap-2 font-medium text-emerald-400">
        <Check className="size-4" /> Delegation signed
      </div>
      <div className="mb-3 grid gap-1 font-mono text-xs text-muted-foreground">
        <span>Session key: {shortAddr(smart, 8)}</span>
        <span>Signed at: {new Date(signedAt).toLocaleString()}</span>
      </div>
      <a
        href="/dashboard"
        className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
      >
        <Bot className="size-4" /> Open the dashboard →
      </a>
      <button
        onClick={onReset}
        className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground"
      >
        Reset delegation (hire a different agent)
      </button>
    </div>
  );
}

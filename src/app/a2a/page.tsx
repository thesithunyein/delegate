"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/store";
import { defaultWorkerFleet, type WorkerKind } from "@/lib/redelegation";
import { shortAddr } from "@/lib/utils";
import {
  Bot,
  ChevronDown,
  GitBranch,
  Shield,
  Repeat2,
  CreditCard,
  CheckCircle2,
  Circle,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const WORKER_META: Record<WorkerKind, { label: string; icon: React.ReactNode; color: string; budget: string; targets: string }> = {
  trader: {
    label: "Trader",
    icon: <Repeat2 className="size-4" />,
    color: "emerald",
    budget: "$300 / day",
    targets: "Uniswap V3, WETH, USDC",
  },
  claimer: {
    label: "Claimer",
    icon: <CheckCircle2 className="size-4" />,
    color: "sky",
    budget: "$30 / week",
    targets: "Airdrop distributors, USDC",
  },
  subscriber: {
    label: "Subscriber",
    icon: <CreditCard className="size-4" />,
    color: "violet",
    budget: "$15 / month",
    targets: "Allow-listed billers, USDC",
  },
};

export default function A2APage() {
  const session = useSession();
  const [redelegated, setRedelegated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workerSigs, setWorkerSigs] = useState<{ kind: WorkerKind; address: string; sig: string }[]>([]);

  const coordinatorAddress = session.smartAccountAddress;
  const fleet = coordinatorAddress ? defaultWorkerFleet(coordinatorAddress) : [];

  async function handleRedelegate() {
    if (!coordinatorAddress || !session.delegation) {
      toast.error("Sign a root delegation on /agent first");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/a2a/redelegate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          coordinatorAddress,
          delegation: session.delegation,
        }),
      });
      if (!res.ok) throw new Error(`redelegate ${res.status}`);
      const data = (await res.json()) as { workers: { kind: WorkerKind; address: string; sig: string }[] };
      setWorkerSigs(data.workers);
      setRedelegated(true);
      toast.success("Root delegation fan-out complete — 3 workers authorised");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="container py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/5 px-3 py-1 text-xs font-medium text-violet-400">
              <GitBranch className="size-3" /> Best A2A Coordination · ERC-7710 Redelegation
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Agent-to-Agent Coordination</h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl">
              You sign <strong className="text-foreground">one root delegation</strong> to a Coordinator smart account.
              The Coordinator fans out <strong className="text-foreground">narrower, specialised delegations</strong> to worker sub-agents —
              each with a tighter scope and smaller budget.
              Revoke the root and the entire fleet loses authority instantly.
            </p>
          </div>

          {/* Architecture Tree */}
          <div className="relative flex flex-col items-center gap-0">
            {/* User node */}
            <NodeCard
              icon={<Shield className="size-5 text-amber-400" />}
              title="Your Wallet"
              subtitle={coordinatorAddress ? shortAddr(coordinatorAddress, 8) : "0x… (connect wallet)"}
              badge="Root principal"
              badgeColor="amber"
              active
            />

            {/* Arrow down */}
            <Connector label="ERC-7710 root delegation · $500/day · all targets" />

            {/* Coordinator node */}
            <NodeCard
              icon={<Bot className="size-5 text-emerald-400" />}
              title="Coordinator Smart Account"
              subtitle={coordinatorAddress ? shortAddr(coordinatorAddress, 8) : "session key"}
              badge="Redelegates"
              badgeColor="emerald"
              active={!!coordinatorAddress}
            />

            {/* Fan-out arrows */}
            <div className="mt-2 flex w-full items-start justify-center gap-3">
              {(["trader", "claimer", "subscriber"] as WorkerKind[]).map((kind, i) => {
                const meta = WORKER_META[kind];
                const worker = fleet[i];
                const sig = workerSigs.find((w) => w.kind === kind);
                return (
                  <div key={kind} className="flex flex-1 flex-col items-center gap-0">
                    <div className="h-8 w-px bg-border" />
                    <ChevronDown className="size-3 -mt-1 text-muted-foreground" />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={`w-full rounded-xl border p-4 ${
                        sig
                          ? `border-${meta.color}-400/40 bg-${meta.color}-400/5`
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`text-${meta.color}-400`}>{meta.icon}</span>
                        <span className="text-sm font-medium">{meta.label}</span>
                        {sig && (
                          <span className={`ml-auto inline-flex items-center gap-1 rounded-full bg-${meta.color}-400/10 px-2 py-0.5 text-xs font-medium text-${meta.color}-400`}>
                            <Zap className="size-2.5" /> signed
                          </span>
                        )}
                      </div>
                      <div className="grid gap-1 font-mono text-xs text-muted-foreground">
                        <span>Budget: {meta.budget}</span>
                        <span>Targets: {meta.targets}</span>
                        {worker && <span className="truncate">Addr: {shortAddr(worker.worker, 6)}</span>}
                        {sig && (
                          <span className="truncate text-emerald-400">
                            Sig: {sig.sig.slice(0, 14)}…
                          </span>
                        )}
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action */}
          <div className="mt-10 rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h2 className="font-medium">Fan out to worker fleet</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {session.delegation
                    ? "Your root delegation is signed. Click below to redelegate to the 3 specialised workers."
                    : "You need a root delegation first. Go to /agent and hire your agent."}
                </p>
              </div>
              <div className="flex gap-2">
                {!session.delegation && (
                  <Button variant="outline" asChild>
                    <a href="/agent">Hire agent first</a>
                  </Button>
                )}
                <Button
                  onClick={handleRedelegate}
                  disabled={!session.delegation || loading || redelegated}
                  className="gap-2"
                >
                  <GitBranch className="size-4" />
                  {redelegated ? "Fleet deployed ✓" : loading ? "Signing…" : "Redelegate to workers"}
                </Button>
              </div>
            </div>

            {redelegated && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-3 text-xs text-emerald-300"
                >
                  ✓ Root delegation → Coordinator → Trader ($300/day) + Claimer ($30/wk) + Subscriber ($15/mo).
                  Revoke the root on /agent to instantly kill all three workers.
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* How it works */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3 text-sm">
            {[
              { n: "1", title: "One signature", body: "User signs a single root delegation scoped to the Coordinator smart account." },
              { n: "2", title: "Coordinator fans out", body: "Coordinator calls buildWorkerRedelegation() for each worker with a strictly narrower scope." },
              { n: "3", title: "Chain validates", body: "On redemption, DelegationManager walks the chain — each child must fit inside its parent's caveats." },
            ].map((s) => (
              <div key={s.n} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-2 text-2xl font-bold text-muted-foreground/30">{s.n}</div>
                <div className="font-medium">{s.title}</div>
                <p className="mt-1 text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

function NodeCard({
  icon,
  title,
  subtitle,
  badge,
  badgeColor,
  active,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  active?: boolean;
}) {
  return (
    <div
      className={`w-64 rounded-xl border p-4 text-center ${
        active ? `border-${badgeColor}-400/30 bg-${badgeColor}-400/5` : "border-border bg-card"
      }`}
    >
      <div className="mb-2 flex justify-center">{icon}</div>
      <div className="text-sm font-medium">{title}</div>
      <div className="font-mono text-xs text-muted-foreground">{subtitle}</div>
      <div className={`mt-2 inline-block rounded-full bg-${badgeColor}-400/10 px-2 py-0.5 text-xs font-medium text-${badgeColor}-400`}>
        {badge}
      </div>
    </div>
  );
}

function Connector({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="h-6 w-px bg-border" />
      <ChevronDown className="size-3 -mt-1 text-muted-foreground" />
      <span className="mt-0.5 max-w-xs text-center font-mono text-xs text-muted-foreground">
        {label}
      </span>
      <div className="h-3 w-px bg-border" />
    </div>
  );
}

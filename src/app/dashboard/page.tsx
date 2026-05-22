"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession, type AgentDecision } from "@/lib/store";
import { shortAddr, timeAgo } from "@/lib/utils";
import { EXPLORER_URL } from "@/lib/constants";
import { previewDecision, previewTxHash } from "@/lib/preview";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  ExternalLink,
  Pause,
  Play,
  Brain,
  Eye,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const session = useSession();
  const isPreview = !session.delegation;
  const [running, setRunning] = useState(isPreview); // auto-run in preview mode
  const [thinking, setThinking] = useState(false);

  const remaining = useMemo(() => {
    const cap = 500; // mirrors the policy default; UI source of truth in real build
    return Math.max(0, cap - session.spentTodayUsdc);
  }, [session.spentTodayUsdc]);

  useEffect(() => {
    if (!running) return;
    const intervalMs = isPreview ? 4_000 : 7_000;
    const id = setInterval(() => void tick(), intervalMs);
    void tick();
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, isPreview]);

  async function tick() {
    // Preview mode: client-only synthetic decisions, no network, instant.
    if (isPreview) {
      setThinking(true);
      // Simulate "thinking" latency so the indicator visibly pulses.
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 600));
      const p = previewDecision(remaining);
      const decision: AgentDecision = {
        id: crypto.randomUUID(),
        ts: Date.now(),
        decision: p.decision,
        amountUsdc: p.amountUsdc,
        rationale: p.rationale,
        confidence: p.confidence,
        marketPrice: p.marketPrice,
        txStatus: p.decision === "hold" ? "skipped" : "included",
        txHash: p.decision === "hold" ? undefined : previewTxHash(),
        feeChargedUsdc: p.decision === "hold" ? undefined : (0.012 + Math.random() * 0.01).toFixed(4),
      };
      session.appendDecision(decision);
      setThinking(false);
      return;
    }
    setThinking(true);
    try {
      const res = await fetch("/api/agent/think", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          remainingDailyBudget: remaining,
          recent: session.decisions.slice(0, 5),
        }),
      });
      if (!res.ok) throw new Error(`think ${res.status}`);
      const data = (await res.json()) as Omit<AgentDecision, "id" | "ts" | "txStatus">;
      const decision: AgentDecision = {
        ...data,
        id: crypto.randomUUID(),
        ts: Date.now(),
        txStatus: data.decision === "hold" ? "skipped" : "pending",
      };
      session.appendDecision(decision);

      if (decision.decision !== "hold") {
        // Fire-and-forget execute against /api/agent/execute (1Shot relayer).
        void executeAndUpdate(decision);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setThinking(false);
    }
  }

  async function executeAndUpdate(d: AgentDecision) {
    try {
      const res = await fetch("/api/agent/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          decision: d.decision,
          amountUsdc: d.amountUsdc,
          delegation: session.delegation,
        }),
      });
      const out = (await res.json()) as {
        userOpHash?: `0x${string}`;
        txHash?: `0x${string}`;
        feeChargedUsdc?: string;
        status: "included" | "failed";
        error?: string;
      };
      session.updateDecision(d.id, {
        txStatus: out.status,
        userOpHash: out.userOpHash,
        txHash: out.txHash,
        feeChargedUsdc: out.feeChargedUsdc,
      });
      if (out.status === "included") {
        toast.success(`${d.decision === "buy_eth" ? "Bought" : "Sold"} via 1Shot`);
      } else {
        toast.error(out.error ?? "Execution failed");
      }
    } catch (e) {
      session.updateDecision(d.id, { txStatus: "failed" });
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Agent dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Live reasoning trace · 1Shot-relayed transactions · USDC gas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={running ? "outline" : "default"}
              onClick={() => setRunning((r) => !r)}
              className="gap-2"
            >
              {running ? <Pause className="size-4" /> : <Play className="size-4" />}
              {running ? "Pause agent" : "Start agent"}
            </Button>
          </div>
        </div>

        {isPreview && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm">
            <Eye className="mt-0.5 size-4 flex-none text-amber-400" />
            <div className="flex-1">
              <p className="font-medium text-amber-300">Preview mode</p>
              <p className="mt-0.5 text-amber-100/70">
                Showing a synthetic agent loop so you can see how DeleGate
                works without setup. Decisions, prices, and transaction hashes
                below are simulated for the demo.{" "}
                <a href="/agent" className="underline underline-offset-4 hover:text-amber-300">
                  Hire a real agent
                </a>{" "}
                to run against Base Sepolia with Venice AI + 1Shot.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Stat
            label="Today's budget remaining"
            value={`$${remaining.toFixed(2)}`}
            sub="USDC · resets in 24h"
          />
          <Stat
            label="Decisions this session"
            value={String(session.decisions.length)}
            sub={
              session.smartAccountAddress
                ? `Smart Account ${shortAddr(session.smartAccountAddress)}`
                : "—"
            }
          />
          <Stat
            label="Spent today"
            value={`$${session.spentTodayUsdc.toFixed(2)}`}
            sub="Counted only on executed swaps"
          />
        </div>

        <div className="mt-10">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="size-4" /> Reasoning trace
                {thinking && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                    thinking…
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Every Venice AI decision the agent makes, plus its on-chain settlement. ⚡ = data paid via x402.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {session.decisions.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                  <Bot className="size-8 animate-pulse text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {isPreview ? "Warming up the preview agent…" : session.delegation ? "Press Start." : "Sign a delegation first."}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  <AnimatePresence initial={false}>
                    {session.decisions.map((d) => (
                      <motion.li
                        key={d.id}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="grid gap-2 px-6 py-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <DecisionBadge decision={d.decision} />
                            <span className="font-mono text-xs text-muted-foreground">
                              {timeAgo(d.ts)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            {d.paidViaX402 && (
                              <span
                                title="Market data fetched via x402 micropayment (EIP-3009)"
                                className="inline-flex cursor-help items-center gap-0.5 rounded bg-violet-500/10 px-1.5 py-0.5 font-mono font-medium text-violet-400"
                              >
                                <Zap className="size-2.5" /> x402
                              </span>
                            )}
                            <span className="text-muted-foreground">
                              conf {(d.confidence * 100).toFixed(0)}%
                            </span>
                            {d.amountUsdc > 0 && (
                              <span className="font-mono">${d.amountUsdc.toFixed(2)}</span>
                            )}
                            <TxLink d={d} />
                          </div>
                        </div>
                        <p className="text-sm text-foreground/90">{d.rationale}</p>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function DecisionBadge({ decision }: { decision: AgentDecision["decision"] }) {
  if (decision === "buy_eth")
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
        <ArrowUpRight className="size-3" /> Buy ETH
      </span>
    );
  if (decision === "sell_eth")
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-rose-400/10 px-2 py-0.5 text-xs font-medium text-rose-400">
        <ArrowDownRight className="size-3" /> Sell ETH
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
      Hold
    </span>
  );
}

function TxLink({ d }: { d: AgentDecision }) {
  if (d.txStatus === "skipped") return null;
  if (d.txStatus === "pending")
    return <span className="text-amber-400">relaying…</span>;
  if (d.txStatus === "failed")
    return <span className="text-rose-400">failed</span>;
  if (!d.txHash) return null;
  // Preview hashes start with 0xpre and are non-clickable (no real chain entry).
  if (d.txHash.startsWith("0xpre")) {
    return (
      <span
        title="Preview transaction — hire a real agent to see live BaseScan links"
        className="inline-flex cursor-help items-center gap-1 text-muted-foreground"
      >
        tx (preview)
      </span>
    );
  }
  return (
    <a
      href={`${EXPLORER_URL}/tx/${d.txHash}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-foreground hover:underline"
    >
      tx <ExternalLink className="size-3" />
    </a>
  );
}

import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Shield,
  Zap,
  Brain,
  Coins,
  ExternalLink,
  TrendingUp,
  Scale,
  Gift,
  Repeat,
} from "lucide-react";
import { APP_NAME, APP_TAGLINE, APP_SUBHEAD } from "@/lib/constants";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="relative">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="absolute inset-0 grid-bg opacity-60" aria-hidden />
          <div className="container relative py-24 md:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                Live on Base Sepolia · MetaMask Smart Accounts · ERC-7710
              </div>
              <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-7xl">
                {APP_TAGLINE}
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-pretty text-xl text-foreground/80 md:text-2xl">
                {APP_SUBHEAD}
              </p>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground">
                {APP_NAME} grants a scoped, revocable on-chain permission to an
                autonomous agent. It reasons with Venice AI, pays for its own
                data via x402, and pays gas in USDC through 1Shot&apos;s
                permissionless relayer. The EVM enforces your budget &mdash;
                not us, not the agent.
              </p>
              <div className="mt-9 flex items-center justify-center gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/agent">
                    Hire your agent <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/dashboard">See it live</Link>
                </Button>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                Free testnet · No real funds · Open source
              </p>
            </div>

            {/* Use cases */}
            <div className="mx-auto mt-20 max-w-5xl">
              <p className="mb-6 text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Pick a preset agent
              </p>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <UseCase
                  href="/agent?preset=trader"
                  icon={<TrendingUp className="size-4" />}
                  title="Trader"
                  budget="≤ $500/day"
                  desc="Watches RSI, swaps USDC↔ETH on Uniswap when signals fire."
                />
                <UseCase
                  href="/agent?preset=rebalancer"
                  icon={<Scale className="size-4" />}
                  title="Rebalancer"
                  budget="60/40 target"
                  desc="Keeps your portfolio at target weights. Triggers on drift > 5%."
                />
                <UseCase
                  href="/agent?preset=claimer"
                  icon={<Gift className="size-4" />}
                  title="Claimer"
                  budget="≤ $20/wk gas"
                  desc="Claims airdrops & yields the moment they unlock. You keep sleeping."
                />
                <UseCase
                  href="/agent?preset=subscriber"
                  icon={<Repeat className="size-4" />}
                  title="Subscriber"
                  budget="$15/mo cap"
                  desc="Pays your on-chain subscriptions. Cancels if balance < threshold."
                />
              </div>
            </div>
          </div>
        </section>

        {/* PILLARS */}
        <section className="container py-24">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Four primitives. One workflow. Zero custody risk.
            </h2>
            <p className="mt-3 text-muted-foreground">
              {APP_NAME} composes the latest agentic standards on Ethereum so
              you can ship autonomy without giving up your keys.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Pillar
              icon={<Shield className="size-5" />}
              title="MetaMask Smart Accounts"
              text="ERC-7702 upgrade in one click. ERC-7710 delegations carry caveats the EVM enforces. Revoke any time."
            />
            <Pillar
              icon={<Coins className="size-5" />}
              title="1Shot Permissionless Relayer"
              text="Agent pays its own gas in USDC. No paymaster setup, no signups, public relayer endpoint."
            />
            <Pillar
              icon={<Brain className="size-5" />}
              title="Venice AI"
              text="Privacy-first reasoning over market state. The agent's full thought trace is auditable on-screen."
            />
            <Pillar
              icon={<Zap className="size-5" />}
              title="x402 native"
              text="Agent pays for its own data feeds with HTTP 402 + EIP-3009 USDC authorizations. Fully spec-compliant."
            />
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="border-t border-border/60 bg-secondary/30">
          <div className="container py-24">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Three steps. No custody risk.
            </h2>
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  n: "01",
                  t: "Upgrade",
                  d: "Your EOA becomes a Smart Account via ERC-7702. Same address, programmable behavior.",
                },
                {
                  n: "02",
                  t: "Delegate",
                  d: "Sign one ERC-7710 delegation: scope, budget, expiry. The EVM enforces the caveats — not us, not the agent.",
                },
                {
                  n: "03",
                  t: "Walk away",
                  d: "The agent watches state, pays for data via x402, and executes inside the box. You revoke any time.",
                },
              ].map((s) => (
                <li
                  key={s.n}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <div className="mb-4 inline-block rounded-md bg-foreground px-2 py-0.5 font-mono text-[11px] tracking-tight text-background">
                    {s.n}
                  </div>
                  <h3 className="text-lg font-semibold">{s.t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="container py-24 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Ready to hire your first agent?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Pick a preset. Set a budget. Sign one delegation. Walk away.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/agent">
                Get started <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link href="https://github.com/thesithunyein/delegate" target="_blank">
                View source <ExternalLink className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <footer className="border-t border-border/60">
          <div className="container flex h-16 items-center justify-between text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} {APP_NAME}. Open source.</span>
            <span>
              Built with MetaMask Smart Accounts · 1Shot · Venice AI · x402
            </span>
          </div>
        </footer>
      </main>
    </>
  );
}

function Pillar({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-foreground/30">
      <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-secondary text-foreground">
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function UseCase({
  href,
  icon,
  title,
  budget,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  budget: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border bg-card/60 p-5 text-left transition-colors hover:border-foreground/40 hover:bg-card"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-7 items-center justify-center rounded-md bg-secondary text-foreground">
            {icon}
          </span>
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          {budget}
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {desc}
      </p>
      <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-foreground/80 opacity-0 transition-opacity group-hover:opacity-100">
        Hire <ArrowRight className="size-3" />
      </div>
    </Link>
  );
}

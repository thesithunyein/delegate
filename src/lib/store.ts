"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Address, Hex } from "viem";
import type { SignedDelegationPayload } from "./smart-account";

export interface AgentDecision {
  id: string;
  ts: number;
  decision: "buy_eth" | "sell_eth" | "hold";
  amountUsdc: number;
  rationale: string;
  confidence: number;
  marketPrice: number;
  txStatus?: "pending" | "included" | "failed" | "skipped";
  txHash?: Hex;
  userOpHash?: Hex;
  feeChargedUsdc?: string;
}

export interface SessionState {
  smartAccountAddress?: Address;
  agentAddress?: Address;
  delegation?: SignedDelegationPayload;
  decisions: AgentDecision[];
  spentTodayUsdc: number;
  dayEpoch: number;

  setAccounts: (a: { smart: Address; agent: Address }) => void;
  setDelegation: (d: SignedDelegationPayload | undefined) => void;
  appendDecision: (d: AgentDecision) => void;
  updateDecision: (id: string, patch: Partial<AgentDecision>) => void;
  resetDay: () => void;
  reset: () => void;
}

const todayEpoch = () => Math.floor(Date.now() / 86_400_000);

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      decisions: [],
      spentTodayUsdc: 0,
      dayEpoch: todayEpoch(),

      setAccounts: ({ smart, agent }) =>
        set({ smartAccountAddress: smart, agentAddress: agent }),

      setDelegation: (d) => set({ delegation: d }),

      appendDecision: (d) => {
        const epoch = todayEpoch();
        const carrySpent = get().dayEpoch === epoch ? get().spentTodayUsdc : 0;
        set({
          decisions: [d, ...get().decisions].slice(0, 200),
          dayEpoch: epoch,
          spentTodayUsdc:
            d.decision !== "hold" ? carrySpent + d.amountUsdc : carrySpent,
        });
      },

      updateDecision: (id, patch) =>
        set({
          decisions: get().decisions.map((d) =>
            d.id === id ? { ...d, ...patch } : d,
          ),
        }),

      resetDay: () => set({ spentTodayUsdc: 0, dayEpoch: todayEpoch() }),

      reset: () =>
        set({
          smartAccountAddress: undefined,
          agentAddress: undefined,
          delegation: undefined,
          decisions: [],
          spentTodayUsdc: 0,
          dayEpoch: todayEpoch(),
        }),
    }),
    {
      name: "delegate.session.v1",
      partialize: (s) => ({
        smartAccountAddress: s.smartAccountAddress,
        agentAddress: s.agentAddress,
        delegation: s.delegation,
        decisions: s.decisions,
        spentTodayUsdc: s.spentTodayUsdc,
        dayEpoch: s.dayEpoch,
      }),
    },
  ),
);

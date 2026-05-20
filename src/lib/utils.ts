import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatUnits, type Address } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortAddr(addr?: Address | string | null, chars = 4) {
  if (!addr) return "";
  return `${addr.slice(0, chars + 2)}…${addr.slice(-chars)}`;
}

export function formatUsdc(amount: bigint | undefined | null, decimals = 2) {
  if (amount === undefined || amount === null) return "0.00";
  const n = Number(formatUnits(amount, 6));
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatEth(amount: bigint | undefined | null, decimals = 4) {
  if (amount === undefined || amount === null) return "0";
  const n = Number(formatUnits(amount, 18));
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

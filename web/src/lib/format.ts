import type { Confidence, RootCause } from "../types";

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPlan(stripeEvent: Record<string, unknown>): string {
  const nickname =
    typeof stripeEvent.plan_nickname === "string" ? stripeEvent.plan_nickname : "";
  const amount = Number(stripeEvent.plan_amount ?? NaN);
  const currency =
    typeof stripeEvent.plan_currency === "string"
      ? stripeEvent.plan_currency.toUpperCase()
      : "";
  const interval =
    typeof stripeEvent.plan_interval === "string" ? stripeEvent.plan_interval : "";

  if (Number.isFinite(amount) && currency && interval) {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount / 100);
    return nickname ? `${nickname} · ${formatted}/${interval}` : `${formatted}/${interval}`;
  }
  return nickname || "Unknown plan";
}

export function formatDate(value: unknown): string {
  if (typeof value !== "string") return "Unknown";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Mirrors the terminal report's color semantics (src/report.ts).
export const rootCauseStyle: Record<RootCause, string> = {
  bug: "bg-red-500/15 text-red-300 ring-red-500/30",
  pricing: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  ux: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  support: "bg-orange-500/15 text-orange-300 ring-orange-500/30",
  competition: "bg-slate-500/15 text-slate-300 ring-slate-500/30",
  unknown: "bg-slate-500/15 text-slate-300 ring-slate-500/30",
};

export const confidenceStyle: Record<Confidence, string> = {
  High: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  Medium: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  Low: "bg-red-500/15 text-red-300 ring-red-500/30",
};

// Source pill colors, keyed by the upstream system named in a signal/trace.
export function sourceStyle(source: string): string {
  const key = source.toLowerCase();
  if (key.includes("posthog")) return "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-500/30";
  if (key.includes("github")) return "bg-slate-300/10 text-slate-200 ring-slate-300/25";
  if (key.includes("stripe")) return "bg-indigo-500/15 text-indigo-300 ring-indigo-500/30";
  if (key.includes("slack")) return "bg-rose-500/15 text-rose-300 ring-rose-500/30";
  return "bg-slate-500/15 text-slate-300 ring-slate-500/30";
}

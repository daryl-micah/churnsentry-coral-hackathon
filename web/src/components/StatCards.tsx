import type { ChurnAnalysis } from "../types";
import { confidenceStyle, formatUsd, rootCauseStyle } from "../lib/format";

export function StatCards({ analysis }: { analysis: ChurnAnalysis }) {
  const revenue = analysis.revenue_at_risk_usd ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Stat label="Root cause">
        <span
          className={`inline-flex rounded-lg px-3 py-1 text-lg font-bold uppercase tracking-wide ring-1 ${rootCauseStyle[analysis.root_cause]}`}
        >
          {analysis.root_cause}
        </span>
      </Stat>

      <Stat label="Confidence">
        <span
          className={`inline-flex rounded-lg px-3 py-1 text-lg font-bold uppercase tracking-wide ring-1 ${confidenceStyle[analysis.confidence]}`}
        >
          {analysis.confidence}
        </span>
      </Stat>

      <Stat label="Revenue at risk">
        <span className="text-2xl font-bold text-emerald-300">
          {revenue > 0 ? `${formatUsd(revenue)}` : "—"}
          {revenue > 0 && <span className="text-sm font-medium text-emerald-500">/yr</span>}
        </span>
      </Stat>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

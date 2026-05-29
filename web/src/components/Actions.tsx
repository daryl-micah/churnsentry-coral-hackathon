import type { ChurnAnalysis } from "../types";

export function Actions({ analysis }: { analysis: ChurnAnalysis }) {
  return (
    <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
      <p className="text-xs uppercase tracking-wider text-slate-500">Recommended actions</p>
      <div className="mt-3 space-y-3 text-sm">
        <div className="flex gap-3">
          <span className="text-emerald-400">▸ Now</span>
          <span className="text-slate-200">{analysis.immediate_action}</span>
        </div>
        <div className="flex gap-3">
          <span className="text-sky-400">▸ Long-term</span>
          <span className="text-slate-200">{analysis.long_term_fix}</span>
        </div>
      </div>
    </div>
  );
}

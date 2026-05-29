import type { Signal } from "../types";
import { sourceStyle } from "../lib/format";

export function SignalList({ signals }: { signals: Signal[] }) {
  return (
    <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
      <p className="text-xs uppercase tracking-wider text-slate-500">Signals</p>
      <ul className="mt-3 space-y-3">
        {signals.map((signal, i) => (
          <li key={i} className="flex gap-3">
            <span
              className={`mt-0.5 inline-flex h-fit shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${sourceStyle(signal.source)}`}
            >
              {signal.source}
            </span>
            <span className="text-sm leading-relaxed text-slate-200">{signal.finding}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

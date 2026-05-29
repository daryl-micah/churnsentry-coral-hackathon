const SOURCES = [
  { name: "Stripe", note: "billing", color: "text-indigo-300 ring-indigo-500/30" },
  { name: "PostHog", note: "errors", color: "text-fuchsia-300 ring-fuchsia-500/30" },
  { name: "GitHub", note: "issues + deploys", color: "text-slate-200 ring-slate-300/25" },
  { name: "Slack", note: "mentions", color: "text-rose-300 ring-rose-500/30" },
];

export function CrossSourceBadges() {
  return (
    <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
      <p className="text-xs uppercase tracking-wider text-slate-500">One runtime, four sources</p>
      <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SOURCES.map((s) => (
            <div
              key={s.name}
              className={`rounded-xl bg-black/30 px-3 py-2 text-center ring-1 ${s.color}`}
            >
              <div className="text-sm font-semibold">{s.name}</div>
              <div className="text-[10px] text-slate-500">{s.note}</div>
            </div>
          ))}
        </div>
        <div className="text-2xl text-slate-600 sm:rotate-0">→</div>
        <div className="rounded-xl bg-sky-500/15 px-4 py-2 text-center ring-1 ring-sky-500/40">
          <div className="text-sm font-bold text-sky-300">Coral</div>
          <div className="text-[10px] text-slate-400">one SQL runtime</div>
        </div>
      </div>
    </div>
  );
}

export function Summary({ summary }: { summary: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
      <p className="text-xs uppercase tracking-wider text-slate-500">Summary</p>
      <p className="mt-2 leading-relaxed text-slate-200">{summary}</p>
    </div>
  );
}

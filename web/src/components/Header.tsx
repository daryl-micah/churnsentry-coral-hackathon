export function Header({ provider }: { provider: { name: string; model: string } }) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          <span className="text-sky-400">Churn</span>Sentry
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Churn root-cause analysis across four sources, in one Coral SQL query.
        </p>
      </div>
      <div className="flex items-center gap-2 self-start rounded-full bg-white/5 px-3 py-1.5 text-xs ring-1 ring-white/10">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="text-slate-300">
          AI provider: <span className="font-semibold text-white">{provider.name}</span>
          <span className="text-slate-500"> · {provider.model}</span>
        </span>
      </div>
    </header>
  );
}

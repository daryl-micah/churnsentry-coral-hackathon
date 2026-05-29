export function SystemicBanner({ note }: { note?: string }) {
  return (
    <div className="rounded-2xl bg-red-500/10 p-4 ring-1 ring-red-500/30">
      <div className="flex items-start gap-3">
        <span className="text-lg leading-none">⚠</span>
        <div>
          <p className="font-semibold text-red-300">Systemic risk detected</p>
          {note && <p className="mt-1 text-sm text-red-200/80">{note}</p>}
        </div>
      </div>
    </div>
  );
}

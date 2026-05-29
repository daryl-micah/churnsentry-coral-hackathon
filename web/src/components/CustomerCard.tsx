import type { ChurnContext } from "../types";
import { formatDate, formatPlan } from "../lib/format";

export function CustomerCard({ context }: { context: ChurnContext }) {
  const { customer, stripeEvent } = context;
  const canceledAt =
    stripeEvent.canceled_at ?? stripeEvent.cancel_at ?? stripeEvent.current_period_end;

  return (
    <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-white">{customer.name}</h2>
        <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-300 ring-1 ring-red-500/30">
          churned
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate-500">Email</dt>
          <dd className="text-slate-200">{customer.email}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Plan</dt>
          <dd className="text-slate-200">{formatPlan(stripeEvent)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Canceled</dt>
          <dd className="text-slate-200">{formatDate(canceledAt)}</dd>
        </div>
      </dl>
    </div>
  );
}

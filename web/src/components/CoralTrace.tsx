import { Fragment, type ReactNode } from "react";
import type { QueryTrace } from "../types";

const SCHEMA_RE = /^(?:stripe|posthog|github|slack)\.[a-z_]+$/i;
// One pass: match a `schema.table` reference OR a SQL keyword.
const TOKEN_RE =
  /\b(?:stripe|posthog|github|slack)\.[a-z_]+|\b(?:SELECT|FROM|LEFT JOIN|INNER JOIN|JOIN|ON|WHERE|AND|OR|GROUP BY|ORDER BY|LIMIT|AS|IN|ILIKE|LIKE|INTERVAL|NOW|DESC|ASC)\b/gi;

function countSchemas(trace: QueryTrace[]): number {
  const set = new Set<string>();
  for (const { sql } of trace) {
    for (const m of sql.matchAll(/\b(stripe|posthog|github|slack)\./gi)) {
      set.add(m[1].toLowerCase());
    }
  }
  return set.size;
}

// Highlights SQL keywords (sky) and `schema.table` references (fuchsia) with
// no syntax-highlight dependency.
function highlight(sql: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of sql.matchAll(TOKEN_RE)) {
    const start = m.index ?? 0;
    if (start > last) {
      nodes.push(<Fragment key={`t-${i}`}>{sql.slice(last, start)}</Fragment>);
    }
    const token = m[0];
    const isSchema = SCHEMA_RE.test(token);
    nodes.push(
      <span
        key={`m-${i}`}
        className={isSchema ? "text-fuchsia-300" : "font-semibold text-sky-300"}
      >
        {token}
      </span>,
    );
    last = start + token.length;
    i += 1;
  }
  if (last < sql.length) {
    nodes.push(<Fragment key="t-tail">{sql.slice(last)}</Fragment>);
  }
  return nodes;
}

export function CoralTrace({ trace }: { trace: QueryTrace[] }) {
  const schemaCount = countSchemas(trace);

  return (
    <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wider text-slate-500">Coral queries</p>
        <p className="text-xs text-slate-400">
          <span className="font-semibold text-sky-300">{trace.length}</span> statements across{" "}
          <span className="font-semibold text-sky-300">{schemaCount}</span> sources · one Coral MCP
          connection
        </p>
      </div>
      <div className="mt-4 space-y-4">
        {trace.map((entry, idx) => (
          <div key={idx}>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-sky-400">→</span>
              <span className="font-medium text-slate-200">{entry.label}</span>
            </div>
            <pre className="mt-1.5 overflow-x-auto rounded-lg bg-black/40 p-3 font-mono text-xs leading-relaxed text-slate-300 ring-1 ring-white/5">
              <code>{highlight(entry.sql)}</code>
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

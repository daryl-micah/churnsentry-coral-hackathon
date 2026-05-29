// Mirrors the CLI snapshot contract emitted by `tsx src/agent.ts --demo --json`.
// Source of truth: ChurnContext (src/prompts.ts), ChurnAnalysis (src/report.ts),
// QueryTrace (src/coral.ts). Kept in sync via `npm run snapshot`.

export type RootCause =
  | "bug"
  | "pricing"
  | "ux"
  | "support"
  | "competition"
  | "unknown";

export type Confidence = "High" | "Medium" | "Low";

export interface Signal {
  source: string;
  finding: string;
}

export interface ChurnAnalysis {
  summary: string;
  root_cause: RootCause;
  confidence: Confidence;
  signals: Signal[];
  immediate_action: string;
  long_term_fix: string;
  systemic_risk: boolean;
  systemic_note?: string;
  revenue_at_risk_usd?: number;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
}

export interface ChurnContext {
  customer: Customer;
  stripeEvent: Record<string, unknown>;
  posthogErrors: Record<string, unknown>[];
  githubIssues: Record<string, unknown>[];
  recentDeploys: Record<string, unknown>[];
  slackMentions: Record<string, unknown>[];
}

export interface QueryTrace {
  label: string;
  sql: string;
}

export interface Snapshot {
  provider: { name: string; model: string };
  context: ChurnContext;
  analysis: ChurnAnalysis;
  trace: QueryTrace[];
}

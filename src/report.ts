export type ChurnAnalysis = {
  summary: string;
  root_cause: "bug" | "pricing" | "ux" | "support" | "competition" | "unknown";
  confidence: "High" | "Medium" | "Low";
  signals: Array<{ source: string; finding: string }>;
  immediate_action: string;
  long_term_fix: string;
  systemic_risk: boolean;
  systemic_note?: string;
};

export type ChurnReport = {
  markdown: string;
  slackBlocks: unknown[];
};

export function buildReport(_analysis: ChurnAnalysis): ChurnReport {
  // TODO: format markdown and Slack blocks
  return { markdown: "", slackBlocks: [] };
}

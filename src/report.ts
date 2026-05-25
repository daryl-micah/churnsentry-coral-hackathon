export type ChurnAnalysis = {
  customerId: string;
  rootCause: string;
  evidence: string[];
  narrative: string;
};

export type ChurnReport = {
  markdown: string;
  slackBlocks: unknown[];
};

export function buildReport(_analysis: ChurnAnalysis): ChurnReport {
  // TODO: format markdown and Slack blocks
  return { markdown: "", slackBlocks: [] };
}

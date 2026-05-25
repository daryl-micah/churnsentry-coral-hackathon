import type { ChurnReport } from "./report.js";

export async function postSlackReport(_report: ChurnReport): Promise<void> {
  // TODO: post report to Slack webhook if configured
}

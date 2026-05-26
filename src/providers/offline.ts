import type { AnalysisProvider } from "./types.js";

/**
 * Offline demo provider — returns a fixed, judge-friendly ChurnAnalysis.
 * Used automatically when `--demo` is passed and no AI provider credentials
 * are set, so reviewers can run the full pipeline with zero signups.
 */
export class OfflineProvider implements AnalysisProvider {
  name = "Offline (canned demo)";
  model = "no-network";

  async analyze(_prompt: string): Promise<string> {
    void _prompt;
    return JSON.stringify({
      summary:
        "DemoCo churned after repeated Excel export timeouts triggered by the v3.4.2 deploy. Engineering shipped a partial fix but the customer's pain cycle had already crossed three weeks and one paid renewal.",
      root_cause: "bug",
      confidence: "High",
      signals: [
        {
          source: "PostHog",
          finding:
            "ExportTimeoutError on ExportService.runExport — 64 occurrences across 14 days; correlated rage-clicks on #export-button.",
        },
        {
          source: "GitHub",
          finding:
            "Issue #4821 ('Excel export times out at 30s') labelled P0/customer-reported is still open with 8 comments, plus feature request #4834 for CSV export co-signed by 3 other accounts.",
        },
        {
          source: "GitHub",
          finding:
            "Deploy v3.4.2 (\"Export service timeouts patch\") landed 1 day before cancellation — fix was incomplete.",
        },
      ],
      immediate_action:
        "Ship a streaming CSV export path for affected customers and offer DemoCo a free month + personal follow-up from CS.",
      long_term_fix:
        "Add an SLO on export latency in PostHog + page on regression; require export-touching PRs to include a load test.",
      systemic_risk: true,
      systemic_note:
        "Same ExportTimeoutError affecting 11 other paying accounts on Growth plan — proactive outreach recommended.",
      revenue_at_risk_usd: 1188,
    });
  }
}

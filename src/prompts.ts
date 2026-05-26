export interface ChurnContext {
  customer: { id: string; email: string; name: string };
  stripeEvent: Record<string, unknown>;
  posthogErrors: Record<string, unknown>[];
  plainThreads: Record<string, unknown>[];
  recentDeploys: Record<string, unknown>[];
  slackMentions: Record<string, unknown>[];
}

export function buildAnalysisPrompt(data: ChurnContext): string {
  const schema = `
{
  "summary": "string (2 sentences)",
  "root_cause": "bug | pricing | ux | support | competition | unknown",
  "confidence": "High | Medium | Low",
  "signals": [
    { "source": "string", "finding": "string" },
    { "source": "string", "finding": "string" },
    { "source": "string", "finding": "string" }
  ],
  "immediate_action": "string",
  "long_term_fix": "string",
  "systemic_risk": true,
  "systemic_note": "string (optional)",
  "revenue_at_risk_usd": 0
}
  `.trim();

  const sections = [
    `# Stripe churn event\n${JSON.stringify(data.stripeEvent, null, 2)}`,
    `# PostHog errors (errors + analytics, last 30d)\n${JSON.stringify(data.posthogErrors, null, 2)}`,
    `# Plain support threads (open + recent)\n${JSON.stringify(data.plainThreads, null, 2)}`,
    `# GitHub recent deploys\n${JSON.stringify(data.recentDeploys, null, 2)}`,
    `# Slack customer mentions\n${JSON.stringify(data.slackMentions, null, 2)}`,
  ].join("\n\n");

  return `
You are a senior Customer Success + Engineering analyst. Analyze the churn context for ${data.customer.name} (${data.customer.email}) and produce a concise, evidence-backed diagnosis.

Requirements:
- Identify the most likely root cause (bug, UX, pricing, missing feature, support failure, competition, or unknown).
- Assign a confidence score: High, Medium, or Low.
- Provide exactly 3 specific signals that support the diagnosis. Each signal's "source" must name the actual upstream system: "PostHog", "Plain", "Stripe", "GitHub", or "Slack".
- Recommend 1 immediate action and 1 long-term fix.
- Flag if this looks systemic (same error/complaint pattern observed in PostHog or Plain for other customers).
- Compute revenue_at_risk_usd as the annualized USD value of the cancelled subscription (plan_amount in cents × 12 if interval=month, ÷ 100). If unknown, use 0.
- Output ONLY valid JSON (no markdown, no code fences) matching this schema:

${schema}

Context:
${sections}
  `.trim();
}

export interface ChurnContext {
  customer: { id: string; email: string; name: string };
  stripeEvent: Record<string, unknown>;
  sentryErrors: Record<string, unknown>[];
  intercomTickets: Record<string, unknown>[];
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
  "systemic_note": "string (optional)"
}
  `.trim();

  return `
You are a senior Customer Success + Engineering analyst. Analyze the churn context and produce a concise, evidence-backed diagnosis.

Requirements:
- Identify the most likely root cause (bug, UX, pricing, missing feature, support failure, competition, or unknown).
- Assign a confidence score: High, Medium, or Low.
- Provide exactly 3 specific signals that support the diagnosis, each explicitly citing the source.
- Recommend 1 immediate action and 1 long-term fix.
- Flag if this looks systemic (e.g., same error pattern in Sentry for other customers).
- Output ONLY valid JSON (no markdown, no code fences) matching this schema:

${schema}

Context:
${JSON.stringify(data, null, 2)}
  `.trim();
}

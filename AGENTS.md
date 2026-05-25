# Coral skills & workflow

This project uses Coral queries to gather evidence for churn root-cause analysis.

## Skills to implement

- **coral.queryUsage** — product usage, feature adoption, and engagement signals
- **coral.queryBilling** — plan changes, downgrades, unpaid invoices
- **coral.querySupport** — support ticket volume, sentiment, and SLA breaches
- **coral.queryCRM** — account notes, renewal risks, and CSM updates

## Recommended workflow

1. Validate env vars and source connectivity (Stripe + Coral).
2. Load Stripe customer context from CLI args or demo webhook event.
3. Run Coral queries to collect signals across usage, billing, support, and CRM.
4. Synthesize a root-cause narrative with evidence and confidence.
5. Format the report as Markdown and Slack blocks.
6. Optionally post to Slack via webhook.

## Output expectations

- Be explicit about evidence and uncertainty.
- Prefer concrete signals over speculation.
- Keep the report executive-friendly and action-oriented.

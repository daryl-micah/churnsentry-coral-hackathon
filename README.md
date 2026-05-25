# churnsentry

Claude Code hackathon scaffold for generating churn root-cause reports from Stripe and Coral data.

## Quickstart

1. `cp .env.example .env`
2. `npm install`
3. `npm run dev -- <stripe_customer_id>`

Demo mode uses a simulated Stripe webhook event:

`npm run dev -- --demo`

## Project layout

- `src/agent.ts` — main agent entry point
- `src/coral.ts` — Coral query helpers
- `src/sources.ts` — source config and connection checks
- `src/prompts.ts` — system prompt for the analysis agent
- `src/report.ts` — report formatter (markdown + Slack blocks)
- `src/webhook.ts` — optional Slack webhook poster
- `src/demo.ts` — demo mode with a mock Stripe event

# ChurnSentry

> **A Coral-powered enterprise agent that investigates churned Stripe customers and produces a root-cause report — across five tools, in one SQL query, on a $0/month stack.**

Built for the [WeMakeDevs Coral hackathon](https://www.wemakedevs.org/hackathons/coral), Track 1 — *Enterprise Agent*.

Churn post-mortems routinely take **45 minutes across five tabs**. ChurnSentry compresses that into **one cross-source SQL query, one AI analysis, one report** — and costs nothing to run.

---

## What makes this entry different

| | |
|---|---|
| 🆓 **$0 stack** | PostHog (free tier) + Plain (free tier) + Groq (free tier) + Stripe/GitHub/Slack APIs — no paid SaaS required. See [Cost](#cost) below. |
| 🧬 **Two custom Coral sources** | We authored [`coral-sources/posthog.yaml`](./coral-sources/posthog.yaml) and [`coral-sources/plain.yaml`](./coral-sources/plain.yaml) — net-new tables for Coral's SQL surface area. |
| 🔍 **Transparent SQL** | Every report prints the actual cross-source queries that were executed against Coral. No "trust me" black box. |
| 💰 **Revenue framing** | Each report quantifies annualised USD at risk — judges and execs both care. |
| 🔌 **Pluggable AI** | Default is free Groq. Swap to Copilot / Claude / OpenAI by changing one env var. |

---

## Architecture

```mermaid
flowchart TD
  A[Stripe Webhook / CLI] --> B[ChurnSentry Agent]

  B --> C[Coral MCP Server\ncoral mcp-stdio]

  C --> D[(stripe.*)]
  C --> E[(posthog.*)\ncustom YAML source]
  C --> F[(plain.*)\ncustom YAML source]
  C --> G[(github.*)]
  C --> H[(slack.*)]

  B --> I{AI Provider\nCHURNSENTRY_PROVIDER}

  I -->|groq| J[Groq API — FREE\nllama-3.3-70b-versatile]
  I -->|copilot| L[GitHub Copilot API\nreuses GITHUB_TOKEN]
  I -->|claude| K[Anthropic API\n(optional, paid)]
  I -->|openai| M[OpenAI API\n(optional, paid)]

  J --> N[Churn Root Cause Report]
  L --> N
  K --> N
  M --> N

  N --> O[Terminal Report\n+ Coral SQL trace\n+ revenue at risk]
  N --> P[Slack Block Kit]
```

---

## Coral integration

We connect Coral to Claude Code via the MCP stdio bridge:

```
claude mcp add --scope user coral -- coral mcp-stdio
```

The agent executes `coral sql --format json` to fetch unified, typed rows. **The cross-source JOIN is the demo** — it combines a custom PostHog source with Coral's bundled Stripe and Slack:

```sql
SELECT s.customer, s.canceled_at, s.plan_amount,
       p.name AS error, p.occurrences, p.last_seen,
       t.title AS support_thread, t.status AS thread_status
FROM   stripe.subscriptions s
JOIN   posthog.persons      pp ON pp.email = s.customer_email
JOIN   posthog.errors        p ON p.last_seen >= s.canceled_at - interval '7 days'
LEFT JOIN plain.threads      t ON t.customer_email = s.customer_email
WHERE  s.status = 'canceled'
  AND  s.canceled_at >= now() - interval '30 days'
ORDER BY p.occurrences DESC;
```

**Benchmark:** using Coral is ~2x more cost-efficient than calling each provider MCP separately (no duplicated auth, no pagination round-trips, far fewer tool calls).

### Custom Coral sources

Coral bundles Sentry/Stripe/GitHub/Slack/Linear/Datadog — but not PostHog or Plain. So we authored both:

| File | Tables | Replaces |
|---|---|---|
| [`coral-sources/posthog.yaml`](./coral-sources/posthog.yaml) | `posthog.errors`, `posthog.events`, `posthog.persons`, `posthog.session_recordings` | Sentry |
| [`coral-sources/plain.yaml`](./coral-sources/plain.yaml) | `plain.threads`, `plain.customers`, `plain.events` | Intercom |

Walkthrough + verification queries: [`coral-sources/README.md`](./coral-sources/README.md).

---

## Quick start

```bash
# 1. Install Coral
brew install withcoral/tap/coral

# 2. One-command setup (registers sources, copies .env, installs npm)
./scripts/setup.sh

# 3. Wire Coral into Claude Code
claude mcp add --scope user coral -- coral mcp-stdio
npx skills add withcoral/skills

# 4. Fill .env with free API keys (Groq, PostHog, Plain), then:
npm run dev -- --customer-id cus_xxx --github-repo myorg/myapp
```

### Demo mode (zero signups required)

```
npm run demo
```

Runs the full pipeline against committed fixtures and falls back to an **offline canned analyzer** if no AI keys are set — judges can see the complete output in under 30 seconds without provisioning a single account. With a Groq key in `.env`, the same command does a real live analysis.

---

## Choosing a provider

| Provider | Flag | Credential | Cost | Best for |
|---|---|---|---|---|
| **Groq** (default) | `--provider groq` | `GROQ_API_KEY` | **Free** (no card) | Fast Llama-3.3 70B inference |
| **GitHub Copilot** | `--provider copilot` | reuses `GITHUB_TOKEN` | **Free** if you have Copilot | Zero extra cost |
| Claude | `--provider claude` | `ANTHROPIC_API_KEY` | Paid | Highest reasoning quality |
| OpenAI | `--provider openai` | `OPENAI_API_KEY` | Paid | GPT-4o JSON mode |

> The pluggable provider abstraction lives in [`src/providers/`](./src/providers/). All providers return the same `ChurnAnalysis` JSON schema — switching never requires a code change outside that directory.

---

## Cost

ChurnSentry is engineered to run on **$0/month** for typical hackathon and small-business usage. Same pipeline on the paid stack would run roughly $115/month:

| Component | Paid stack | ChurnSentry (free stack) |
|---|---|---|
| Error tracking | Sentry Team — **$26/mo** | PostHog Cloud free tier — **$0** |
| Customer support | Intercom Essential — **$74/mo** | Plain free tier — **$0** |
| AI analysis | Claude / GPT-4o — **~$15/mo** for one investigation/day | Groq llama-3.3-70b free tier — **$0** |
| Cross-source SQL | n/a (build it yourself) | Coral — **$0** (open-source) |
| **Total** | **~$115/mo** | **$0/mo** |

The trade-off is honest: free-tier quotas exist. The README's free-tier links are current as of 2026. If you outgrow them, every component has a paid upgrade path (or a self-hosted OSS alternative) — but the project is structured so most users never need one.

---

## Why Coral

Without Coral, this agent needs **five separate MCP servers**, each with its own auth, pagination, and rate limits. That explodes to 20+ tool calls per investigation. With Coral, it's **one SQL runtime, one MCP connection, and cross-source JOINs in a single query** — *plus* two custom YAML sources of our own that extend Coral's SQL surface to PostHog and Plain.

That's the "Best Use of Coral" angle: we didn't just consume Coral's bundled sources, we shipped two new ones.

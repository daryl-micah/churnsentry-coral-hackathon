# ChurnSentry

Churn post-mortems routinely take **45 minutes across five tabs**. ChurnSentry compresses that into **one SQL query, one AI analysis, one report**.

ChurnSentry is a project that investigates churned Stripe customers by joining Sentry, Intercom, GitHub, and Slack signals through Coral. It produces a crisp root-cause report and (optionally) posts it to Slack.

## Architecture

```mermaid
flowchart TD
  A[Stripe Webhook / CLI] --> B[ChurnSentry Agent]

  B --> C[Coral MCP Server\ncoral mcp-stdio]

  C --> D[(stripe.*)]
  C --> E[(sentry.*)]
  C --> F[(intercom.*)]
  C --> G[(github.*)]
  C --> H[(slack.*)]

  B --> I{AI Provider\nCHURNSENTRY_PROVIDER}

  I -->|claude| J[Anthropic API\nclaude-sonnet-4-20250514]
  I -->|openai| K[OpenAI API\ngpt-4o]
  I -->|copilot| L[GitHub Copilot API\napi.githubcopilot.com\nreuses GITHUB_TOKEN]

  J --> M[Churn Root Cause Report]
  K --> M
  L --> M

  M --> N[Terminal Report]
  M --> O[Slack Block Kit]
```

## Coral integration

We connect Coral to Claude Code via the MCP stdio bridge:

```
claude mcp add --scope user coral -- coral mcp-stdio
```

Then the agent executes `coral sql --format json` to fetch unified, typed rows. This is the cross-source JOIN that proves Coral's value, combining Sentry error patterns with Intercom conversation history:

```sql
SELECT i.id, i.title, i.culprit, i.status, i.level,
       i.first_seen, i.last_seen, i.times_seen, i.project_slug,
       conv.id AS conversation_id, conv.subject, conv.created_at
FROM sentry.issues i
JOIN sentry.events e ON e.issue_id = i.id
JOIN intercom.contacts ct ON ct.email = e.user_email
LEFT JOIN intercom.conversations conv ON conv.contact_id = ct.id
WHERE i.status = 'unresolved'
  AND i.last_seen >= now() - interval '30 days'
ORDER BY i.times_seen DESC
LIMIT 10;
```

**Benchmark:** using Coral is ~2x more cost-efficient than calling each provider MCP separately (no duplicated auth or pagination and far fewer tool calls).

## Quick start

```
brew install withcoral/tap/coral
coral source add --interactive stripe
coral source add --interactive sentry
coral source add --interactive intercom
coral source add --interactive github
coral source add --interactive slack
claude mcp add --scope user coral -- coral mcp-stdio
npx skills add withcoral/skills
cp .env.example .env  # fill in your tokens
npm install
npm run dev -- --customer-id cus_xxx --github-repo myorg/myapp
```

## Demo mode

```
npm run dev -- --demo
```

## Choosing a provider

| Provider | Flag | Extra credential needed | Best for |
|---|---|---|---|
| Claude | `--provider claude` | `ANTHROPIC_API_KEY` | Highest reasoning quality |
| OpenAI | `--provider openai` | `OPENAI_API_KEY` | GPT-4o JSON mode |
| GitHub Copilot | `--provider copilot` | none (reuses `GITHUB_TOKEN`) | Zero extra cost if you have Copilot |

**Copilot advantage:** if you already connected the GitHub source for Coral, you already have the token — Copilot analysis is literally free to add.

## Why Coral

Without Coral, this agent needs **five separate MCP servers**, each with its own auth, pagination, and rate limits. That explodes to 20+ tool calls per investigation. With Coral, it’s **one SQL runtime, one MCP connection, and cross-source JOINs in a single query**.

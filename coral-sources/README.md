# Custom Coral sources

ChurnSentry ships one custom [Coral](https://withcoral.com) source specification that isn't in Coral's bundled set: **PostHog**. It is the free-stack replacement for Sentry and doubles as the project's "Best Use of Coral" entry — extending Coral's SQL surface area to a new SaaS in roughly a hundred lines of YAML.

| File | Replaces | Free tier | Tables exposed |
|---|---|---|---|
| [`posthog.yaml`](./posthog.yaml) | Sentry | Yes — generous | `posthog.errors`, `posthog.events`, `posthog.persons`, `posthog.session_recordings` |

> Customer-support signal comes from `github.issues` (Coral's bundled `github` source) — no custom YAML needed. Most teams already file customer-reported bugs there, and the existing `GITHUB_TOKEN` covers it. See the [README](../README.md) for the cross-source JOIN.

## Register

```bash
coral source add ./coral-sources/posthog.yaml
```

Set the corresponding env vars (see [`.env.example`](../.env.example)):

- **PostHog:** `POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`, `POSTHOG_HOST`

## Verify

```bash
coral sql "SELECT name, status, occurrences FROM posthog.errors ORDER BY occurrences DESC LIMIT 5"
```

## Why this matters

The whole point of Coral is **cross-source SQL JOINs**. With this custom PostHog source registered alongside Coral's bundled `stripe`, `github`, and `slack` sources, ChurnSentry can answer "did the export bug in PostHog correlate with this Stripe cancellation and a GitHub issue someone filed?" in **one query**:

```sql
SELECT s.customer, p.name AS error, gi.title AS issue
FROM   stripe.subscriptions s
JOIN   posthog.persons     pp ON pp.email = s.customer_email
JOIN   posthog.errors      p  ON p.last_seen >= s.canceled_at - interval '7 days'
LEFT JOIN github.issues    gi ON gi.body ILIKE '%' || s.customer_name || '%'
                              AND gi.state = 'open'
WHERE  s.status = 'canceled'
  AND  s.canceled_at >= now() - interval '30 days'
```

No matching MCP per source, no separate auth flows — one custom source spec, one SQL runtime, four sources joined.

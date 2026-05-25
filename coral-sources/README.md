# Custom Coral sources

ChurnSentry ships with two custom [Coral](https://withcoral.com) source specifications that aren't in Coral's bundled set. They are the **free-stack replacements** for Sentry and Intercom and double as the project's "Best Use of Coral" entry — each file extends Coral's SQL surface area to a new SaaS in roughly a hundred lines of YAML.

| File | Replaces | Free tier | Tables exposed |
|---|---|---|---|
| [`posthog.yaml`](./posthog.yaml) | Sentry | Yes — generous | `posthog.errors`, `posthog.events`, `posthog.persons`, `posthog.session_recordings` |
| [`plain.yaml`](./plain.yaml) | Intercom | Yes | `plain.threads`, `plain.customers`, `plain.events` |

## Register

```bash
coral source add ./coral-sources/posthog.yaml
coral source add ./coral-sources/plain.yaml
```

Set the corresponding env vars (see [`.env.example`](../.env.example)):

- **PostHog:** `POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`, `POSTHOG_HOST`
- **Plain:** `PLAIN_API_KEY`

## Verify

```bash
coral sql "SELECT name, status, occurrences FROM posthog.errors ORDER BY occurrences DESC LIMIT 5"
coral sql "SELECT title, status, customer_email FROM plain.threads WHERE status = 'TODO' LIMIT 5"
```

## Why this matters

The whole point of Coral is **cross-source SQL JOINs**. With these two YAMLs registered alongside Coral's bundled `stripe`, `github`, and `slack` sources, ChurnSentry can answer "did the export bug in PostHog correlate with this Stripe cancellation and a Plain ticket?" in **one query**:

```sql
SELECT s.customer, p.name AS error, t.title AS ticket
FROM   stripe.subscriptions s
JOIN   posthog.persons     pp ON pp.email = s.customer_email
JOIN   posthog.errors      p  ON p.last_seen >= s.canceled_at - interval '7 days'
LEFT JOIN plain.threads    t  ON t.customer_email = s.customer_email
WHERE  s.status = 'canceled'
  AND  s.canceled_at >= now() - interval '30 days'
```

No matching MCP per source, no five separate auth flows — one source spec, one SQL runtime.

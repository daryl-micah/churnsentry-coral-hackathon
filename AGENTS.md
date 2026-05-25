# ChurnSentry — Coral skills guide

## AI Provider

This project supports three analysis backends. The active provider is set by `CHURNSENTRY_PROVIDER` or the `--provider` flag.

When using provider=copilot, note that `GITHUB_TOKEN` is shared with the Coral github source. One token, two jobs.

All providers receive identical prompts and return the same ChurnAnalysis JSON schema. Switching providers never requires changes to `coral.ts`, `report.ts`, or the SQL queries.

## Query rules

- Always use `coral sql --format json` for all queries.
- Prefer a single JOIN query over multiple sequential queries.
- `stripe.subscriptions` must be filtered by status for performance.
- `slack.messages` must include a channel filter to avoid scanning all channels.

## Discovery workflow

1. `list_catalog` to confirm available sources and schemas.
2. `describe_table` before writing a query against any table.

## Source schemas

- `stripe.*`
- `sentry.*`
- `intercom.*`
- `github.*`
- `slack.*`

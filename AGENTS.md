# ChurnSentry — Coral skills guide

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

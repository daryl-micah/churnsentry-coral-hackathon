import { exec } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";

const execAsync = promisify(exec);

const customerIdSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const emailSchema = z.string().email().max(254);
const ownerSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_.-]+$/);
const repoSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_.-]+$/);
const daysSchema = z.coerce.number().int().min(1).max(3650);
const customerNameSchema = z.string().min(1).max(200).regex(/^[a-zA-Z0-9 .,&_-]+$/);
const channelPatternSchema = z.string().min(1).max(200).regex(/^[a-zA-Z0-9_.%-]+$/);

export type CoralQueryResult = {
  raw: Record<string, unknown>[];
};

export type QueryTrace = { label: string; sql: string };
const queryTrace: QueryTrace[] = [];
export function getQueryTrace(): readonly QueryTrace[] {
  return queryTrace;
}
export function resetQueryTrace(): void {
  queryTrace.length = 0;
}
function recordTrace(label: string, sql: string): void {
  queryTrace.push({ label, sql: normalizeSql(sql) });
}
export function addQueryTrace(label: string, sql: string): void {
  recordTrace(label, sql);
}

function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

function normalizeSql(sql: string): string {
  return sql.trim().replace(/\s+/g, " ");
}

function escapeForDoubleQuotes(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\$/g, "\\$")
    .replace(/`/g, "\\`");
}

export async function coralQuery(sql: string): Promise<Record<string, unknown>[]> {
  const normalized = normalizeSql(z.string().min(1).parse(sql));
  const escaped = escapeForDoubleQuotes(normalized);
  const { stdout } = await execAsync(`coral sql --format json "${escaped}"`, {
    maxBuffer: 1024 * 1024 * 10,
  });
  const parsed = JSON.parse(stdout) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Expected coral JSON output to be an array");
  }
  return parsed as Record<string, unknown>[];
}

async function tracedQuery(
  label: string,
  sql: string,
): Promise<Record<string, unknown>[]> {
  recordTrace(label, sql);
  return coralQuery(sql);
}

export async function getStripeChurnEvent(
  customerId: string,
): Promise<Record<string, unknown>[]> {
  const safeCustomerId = escapeSqlString(customerIdSchema.parse(customerId));
  const sql = `
    SELECT c.id, c.email, c.name, c.description,
           s.id as sub_id, s.status, s.cancel_at, s.canceled_at,
           s.current_period_end, s.plan_amount, s.plan_currency,
           s.plan_interval, s.plan_nickname
    FROM stripe.customers c
    JOIN stripe.subscriptions s ON s.customer = c.id
    WHERE c.id = '${safeCustomerId}'
      AND s.status IN ('canceled','unpaid','past_due')
    LIMIT 5
  `;
  return tracedQuery("Stripe churn event", sql);
}

export async function getRecentPostHogErrors(
  customerEmail: string,
): Promise<Record<string, unknown>[]> {
  const safeEmail = escapeSqlString(emailSchema.parse(customerEmail));
  const sql = `
    SELECT e.id, e.name, e.description, e.status, e.library,
           e.first_seen, e.last_seen, e.occurrences
    FROM posthog.errors e
    LEFT JOIN posthog.events ev
      ON ev.event = '$exception' AND ev.email = '${safeEmail}'
    WHERE e.status = 'active'
      AND e.last_seen >= now() - interval '30 days'
    GROUP BY e.id, e.name, e.description, e.status, e.library,
             e.first_seen, e.last_seen, e.occurrences
    ORDER BY e.occurrences DESC
    LIMIT 10
  `;
  return tracedQuery("PostHog errors (custom Coral source)", sql);
}

export async function getPlainThreads(
  customerEmail: string,
): Promise<Record<string, unknown>[]> {
  const safeEmail = escapeSqlString(emailSchema.parse(customerEmail));
  const sql = `
    SELECT t.id, t.title, t.status, t.priority,
           t.created_at, t.updated_at, t.status_changed_at,
           t.assignee_name
    FROM plain.threads t
    JOIN plain.customers c ON c.id = t.customer_id
    WHERE c.email = '${safeEmail}'
    ORDER BY t.created_at DESC
    LIMIT 10
  `;
  return tracedQuery("Plain support threads (custom Coral source)", sql);
}

export async function getRecentDeploys(
  owner: string,
  repo: string,
  days: number,
): Promise<Record<string, unknown>[]> {
  const parsed = z
    .object({ owner: ownerSchema, repo: repoSchema, days: daysSchema })
    .parse({ owner, repo, days });
  const safeOwner = escapeSqlString(parsed.owner);
  const safeRepo = escapeSqlString(parsed.repo);
  const safeDays = String(parsed.days);
  const sql = `
    SELECT r.tag_name, r.name, r.created_at, r.published_at,
           r.body, r.author_login
    FROM github.releases r
    WHERE r.owner = '${safeOwner}' AND r.repo = '${safeRepo}'
      AND r.created_at >= now() - interval '${safeDays} days'
    ORDER BY r.created_at DESC
    LIMIT 10
  `;
  return tracedQuery("GitHub recent deploys", sql);
}

export async function getSlackMentions(
  customerName: string,
  channelPattern: string,
): Promise<Record<string, unknown>[]> {
  const parsed = z
    .object({
      customerName: customerNameSchema,
      channelPattern: channelPatternSchema,
    })
    .parse({ customerName, channelPattern });
  const safeName = escapeSqlString(parsed.customerName);
  const safePattern = escapeSqlString(parsed.channelPattern);
  const sql = `
    SELECT m.text, m.user_id, m.ts, m.channel_id
    FROM slack.messages m
    JOIN slack.channels c ON c.id = m.channel_id
    WHERE c.name LIKE '${safePattern}'
      AND m.text ILIKE '%${safeName}%'
    ORDER BY m.ts DESC
    LIMIT 20
  `;
  return tracedQuery("Slack customer mentions", sql);
}

export async function runCoralQuery(customerId: string): Promise<CoralQueryResult> {
  const raw = await getStripeChurnEvent(customerId);
  return { raw };
}

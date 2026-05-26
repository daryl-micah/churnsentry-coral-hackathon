import chalk from "chalk";
import type { ChurnContext } from "./prompts.js";

export type ChurnAnalysis = {
  summary: string;
  root_cause: "bug" | "pricing" | "ux" | "support" | "competition" | "unknown";
  confidence: "High" | "Medium" | "Low";
  signals: Array<{ source: string; finding: string }>;
  immediate_action: string;
  long_term_fix: string;
  systemic_risk: boolean;
  systemic_note?: string;
  revenue_at_risk_usd?: number;
};

export type ProviderInfo = {
  name: string;
  model: string;
};

export type QueryTraceEntry = { label: string; sql: string };

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPlan(stripeEvent: Record<string, unknown>): string {
  const nickname = typeof stripeEvent.plan_nickname === "string" ? stripeEvent.plan_nickname : "";
  const amount =
    typeof stripeEvent.plan_amount === "number"
      ? stripeEvent.plan_amount
      : Number(stripeEvent.plan_amount ?? NaN);
  const currency =
    typeof stripeEvent.plan_currency === "string"
      ? stripeEvent.plan_currency.toUpperCase()
      : "";
  const interval =
    typeof stripeEvent.plan_interval === "string" ? stripeEvent.plan_interval : "";

  if (Number.isFinite(amount) && currency && interval) {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount / 100);
    return nickname ? `${nickname} (${formatted}/${interval})` : `${formatted}/${interval}`;
  }

  return nickname || "Unknown plan";
}

function formatCanceledAt(stripeEvent: Record<string, unknown>): string {
  const value = stripeEvent.canceled_at ?? stripeEvent.cancel_at ?? stripeEvent.current_period_end;
  if (!value) return "Unknown";
  return String(value);
}

function rootCauseBadge(rootCause: ChurnAnalysis["root_cause"]): string {
  switch (rootCause) {
    case "bug":
      return chalk.bgRed.white.bold(" BUG ");
    case "pricing":
      return chalk.bgYellow.black.bold(" PRICING ");
    case "ux":
      return chalk.bgBlue.white.bold(" UX ");
    case "support":
      return chalk.bgHex("#FFA500").black.bold(" SUPPORT ");
    case "competition":
      return chalk.bgGray.white.bold(" COMPETITION ");
    default:
      return chalk.bgGray.white.bold(" UNKNOWN ");
  }
}

function confidenceBadge(confidence: ChurnAnalysis["confidence"]): string {
  switch (confidence) {
    case "High":
      return chalk.bgGreen.black.bold(" HIGH ");
    case "Medium":
      return chalk.bgYellow.black.bold(" MEDIUM ");
    default:
      return chalk.bgRed.white.bold(" LOW ");
  }
}

export function printReport(
  context: ChurnContext,
  analysis: ChurnAnalysis,
  provider: ProviderInfo,
  trace: readonly QueryTraceEntry[] = [],
): void {
  const header = chalk.bold.cyan("🏴‍☠️ ChurnSentry — Root Cause Report");
  const plan = formatPlan(context.stripeEvent);
  const canceledAt = formatCanceledAt(context.stripeEvent);

  console.log(header);
  console.log(chalk.dim(`Provider: ${provider.name} (${provider.model})`));
  console.log("");
  console.log(chalk.bold("Customer"));
  console.log(`  ${chalk.bold("Name:")} ${context.customer.name}`);
  console.log(`  ${chalk.bold("Email:")} ${context.customer.email}`);
  console.log(`  ${chalk.bold("Plan:")} ${plan}`);
  console.log(`  ${chalk.bold("Canceled at:")} ${canceledAt}`);
  if (typeof analysis.revenue_at_risk_usd === "number" && analysis.revenue_at_risk_usd > 0) {
    console.log(
      `  ${chalk.bold("Revenue at risk:")} ${chalk.bgGreen.black.bold(
        ` ${formatUsd(analysis.revenue_at_risk_usd)}/yr `,
      )}`,
    );
  }
  console.log("");
  console.log(
    `${chalk.bold("Root cause:")} ${rootCauseBadge(analysis.root_cause)}  ${chalk.bold(
      "Confidence:",
    )} ${confidenceBadge(analysis.confidence)}`,
  );
  console.log("");
  console.log(chalk.bold("Summary"));
  console.log(`  ${analysis.summary}`);
  console.log("");
  console.log(chalk.bold("Signals"));
  for (const signal of analysis.signals) {
    console.log(`  - ${chalk.dim(`[${signal.source}]`)} ${signal.finding}`);
  }
  console.log("");
  console.log(chalk.bold("Actions"));
  console.log(`  ✅ ${analysis.immediate_action}`);
  console.log(`  🔭 ${analysis.long_term_fix}`);

  if (analysis.systemic_risk) {
    const note = analysis.systemic_note ? ` ${analysis.systemic_note}` : "";
    console.log("");
    console.log(chalk.bold.red(`⚠ Systemic risk detected.${note}`));
  }

  if (trace.length > 0) {
    console.log("");
    console.log(chalk.bold("Coral queries"));
    console.log(chalk.dim(`  ${trace.length} SQL statement(s) executed across ${countSchemas(trace)} sources via one Coral MCP connection.`));
    for (const entry of trace) {
      console.log(`  ${chalk.cyan("→")} ${chalk.bold(entry.label)}`);
      console.log(chalk.dim(`    ${entry.sql}`));
    }
  }
}

function countSchemas(trace: readonly QueryTraceEntry[]): number {
  const schemas = new Set<string>();
  for (const entry of trace) {
    const matches = entry.sql.match(/\b(stripe|posthog|github|slack)\./gi) ?? [];
    for (const m of matches) {
      schemas.add(m.split(".")[0].toLowerCase());
    }
  }
  return schemas.size;
}

export function buildSlackBlocks(
  context: ChurnContext,
  analysis: ChurnAnalysis,
  provider: ProviderInfo,
): { blocks: object[] } {
  const plan = formatPlan(context.stripeEvent);
  const blocks: object[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🚨 Churn Alert: ${context.customer.name}`,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `*Provider:* ${provider.name} (${provider.model})`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: analysis.summary,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Root cause*\n${analysis.root_cause}` },
        { type: "mrkdwn", text: `*Confidence*\n${analysis.confidence}` },
        { type: "mrkdwn", text: `*Plan*\n${plan}` },
        ...(typeof analysis.revenue_at_risk_usd === "number" && analysis.revenue_at_risk_usd > 0
          ? [{ type: "mrkdwn", text: `*Revenue at risk*\n${formatUsd(analysis.revenue_at_risk_usd)}/yr` }]
          : []),
      ],
    },
    { type: "divider" },
  ];

  for (const signal of analysis.signals) {
    blocks.push(
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Signal:* ${signal.finding}`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `*Source:* ${signal.source}`,
          },
        ],
      },
    );
  }

  blocks.push(
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Immediate action:* ${analysis.immediate_action}\n*Long-term fix:* ${analysis.long_term_fix}`,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "Powered by ChurnSentry + Coral (PostHog · Stripe · GitHub · Slack)",
        },
      ],
    },
  );

  if (analysis.systemic_risk) {
    blocks.splice(4, 0, {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:warning: *Systemic risk detected.* ${analysis.systemic_note ?? ""}`.trim(),
      },
    });
  }

  return { blocks };
}

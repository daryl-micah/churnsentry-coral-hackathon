import "dotenv/config";
import { Anthropic } from "@anthropic-ai/sdk";
import ora from "ora";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import {
  getIntercomTickets,
  getRecentDeploys,
  getRecentSentryErrors,
  getSlackMentions,
  getStripeChurnEvent,
} from "./coral.js";
import { buildAnalysisPrompt, type ChurnContext } from "./prompts.js";
import { buildSlackBlocks, printReport, type ChurnAnalysis } from "./report.js";
import { checkSources } from "./sources.js";
import { postToSlack } from "./webhook.js";

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1),
});

const analysisSchema = z.object({
  summary: z.string().min(1),
  root_cause: z.enum(["bug", "pricing", "ux", "support", "competition", "unknown"]),
  confidence: z.enum(["High", "Medium", "Low"]),
  signals: z
    .array(z.object({ source: z.string().min(1), finding: z.string().min(1) }))
    .length(3),
  immediate_action: z.string().min(1),
  long_term_fix: z.string().min(1),
  systemic_risk: z.boolean(),
  systemic_note: z.string().min(1).optional(),
});

type CliOptions = {
  customerId?: string;
  githubRepo?: string;
  demo: boolean;
};

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = { demo: false };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--demo") {
      options.demo = true;
      continue;
    }
    if (arg === "--customer-id") {
      const value = args[i + 1];
      if (!value) {
        throw new Error("Missing value for --customer-id");
      }
      options.customerId = value;
      i += 1;
      continue;
    }
    if (arg.startsWith("--customer-id=")) {
      options.customerId = arg.split("=", 2)[1];
      continue;
    }
    if (arg === "--github-repo") {
      const value = args[i + 1];
      if (!value) {
        throw new Error("Missing value for --github-repo");
      }
      options.githubRepo = value;
      i += 1;
      continue;
    }
    if (arg.startsWith("--github-repo=")) {
      options.githubRepo = arg.split("=", 2)[1];
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function parseGithubRepo(input: string): { owner: string; repo: string } {
  const repoSchema = z.string().regex(/^[^/]+\/[^/]+$/);
  const parsed = repoSchema.parse(input);
  const [owner, repo] = parsed.split("/");
  return { owner, repo };
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  const withoutFence = trimmed.startsWith("```")
    ? trimmed.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim()
    : trimmed;
  const firstBrace = withoutFence.indexOf("{");
  const lastBrace = withoutFence.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No JSON object found in model output");
  }
  return withoutFence.slice(firstBrace, lastBrace + 1);
}

async function loadFixture<T>(fileName: string): Promise<T> {
  const fileUrl = new URL(`./fixtures/${fileName}`, import.meta.url);
  const raw = await readFile(fileUrl, "utf-8");
  return JSON.parse(raw) as T;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  await checkSources();

  const env = envSchema.parse(process.env);
  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  if (!options.demo && !options.customerId) {
    console.error("Missing required --customer-id");
    process.exit(1);
  }
  if (!options.demo && !options.githubRepo) {
    console.error("Missing required --github-repo");
    process.exit(1);
  }

  const stripeSpinner = ora("⚓ Querying Stripe for churn event...").start();
  let stripeRows: Record<string, unknown>[];
  try {
    stripeRows = options.demo
      ? await loadFixture<Record<string, unknown>[]>("stripe-event.json")
      : await getStripeChurnEvent(options.customerId as string);
    stripeSpinner.succeed("⚓ Querying Stripe for churn event...");
  } catch (error) {
    stripeSpinner.fail("⚓ Querying Stripe for churn event...");
    throw error;
  }

  if (stripeRows.length === 0) {
    console.error("No churn event found for this customer.");
    process.exit(1);
  }

  const stripeRow = stripeRows[0];
  const customerSchema = z.object({
    id: z.string().min(1),
    email: z.string().email(),
    name: z.string().min(1),
  });
  const customer = customerSchema.parse({
    id: String(stripeRow.id ?? ""),
    email: String(stripeRow.email ?? ""),
    name: String(stripeRow.name ?? ""),
  });

  const { owner, repo } = options.demo
    ? { owner: "demo", repo: "demo" }
    : parseGithubRepo(options.githubRepo as string);

  const sentrySpinner = ora("🔎 Scanning Sentry for error patterns...").start();
  const intercomSpinner = ora("💬 Pulling Intercom support history...").start();
  const deploysSpinner = ora("🚀 Checking recent GitHub deploys...").start();
  const slackSpinner = ora("💬 Searching Slack for customer mentions...").start();

  const [sentryErrors, intercomTickets, recentDeploys, slackMentions] =
    await Promise.all([
      (async () => {
        try {
          const data = options.demo
            ? await loadFixture<Record<string, unknown>[]>("sentry-errors.json")
            : await getRecentSentryErrors(customer.email);
          sentrySpinner.succeed("🔎 Scanning Sentry for error patterns...");
          return data;
        } catch (error) {
          sentrySpinner.fail("🔎 Scanning Sentry for error patterns...");
          throw error;
        }
      })(),
      (async () => {
        try {
          const data = options.demo
            ? await loadFixture<Record<string, unknown>[]>("intercom-tickets.json")
            : await getIntercomTickets(customer.email);
          intercomSpinner.succeed("💬 Pulling Intercom support history...");
          return data;
        } catch (error) {
          intercomSpinner.fail("💬 Pulling Intercom support history...");
          throw error;
        }
      })(),
      (async () => {
        try {
          const data = options.demo
            ? await loadFixture<Record<string, unknown>[]>("recent-deploys.json")
            : await getRecentDeploys(owner, repo, 30);
          deploysSpinner.succeed("🚀 Checking recent GitHub deploys...");
          return data;
        } catch (error) {
          deploysSpinner.fail("🚀 Checking recent GitHub deploys...");
          throw error;
        }
      })(),
      (async () => {
        try {
          const data = options.demo
            ? await loadFixture<Record<string, unknown>[]>("slack-mentions.json")
            : await getSlackMentions(customer.name, "%");
          slackSpinner.succeed("💬 Searching Slack for customer mentions...");
          return data;
        } catch (error) {
          slackSpinner.fail("💬 Searching Slack for customer mentions...");
          throw error;
        }
      })(),
    ]);

  const context: ChurnContext = {
    customer,
    stripeEvent: stripeRow,
    sentryErrors,
    intercomTickets,
    recentDeploys,
    slackMentions,
  };

  const analysisSpinner = ora("🤖 Running root cause analysis...").start();
  let analysis: ChurnAnalysis;
  try {
    const prompt = buildAnalysisPrompt(context);
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 900,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("\n")
      .trim();
    const jsonPayload = extractJson(text);
    analysis = analysisSchema.parse(JSON.parse(jsonPayload));
    analysisSpinner.succeed("🤖 Running root cause analysis...");
  } catch (error) {
    analysisSpinner.fail("🤖 Running root cause analysis...");
    throw error;
  }

  printReport(context, analysis);

  if (process.env.SLACK_WEBHOOK_URL) {
    await postToSlack(buildSlackBlocks(context, analysis), process.env.SLACK_WEBHOOK_URL);
  }
}

void main();

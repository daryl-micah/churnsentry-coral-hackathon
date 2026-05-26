import "dotenv/config";
import ora from "ora";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import {
  addQueryTrace,
  getPlainThreads,
  getQueryTrace,
  getRecentDeploys,
  getRecentPostHogErrors,
  getSlackMentions,
  getStripeChurnEvent,
  resetQueryTrace,
} from "./coral.js";
import { buildAnalysisPrompt, type ChurnContext } from "./prompts.js";
import { buildSlackBlocks, printReport, type ChurnAnalysis } from "./report.js";
import { createProvider, detectProvider, detectProviderForDemo } from "./providers/index.js";
import type { ProviderName } from "./providers/types.js";
import { checkSources } from "./sources.js";
import { postToSlack } from "./webhook.js";

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
  revenue_at_risk_usd: z.number().nonnegative().default(0),
});

type CliOptions = {
  customerId?: string;
  githubRepo?: string;
  demo: boolean;
  provider?: ProviderName;
};

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = { demo: false };
  const providerSchema = z.enum(["claude", "openai", "copilot", "groq"]);
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
    if (arg === "--provider") {
      const value = args[i + 1];
      if (!value) {
        throw new Error("Missing value for --provider");
      }
      options.provider = providerSchema.parse(value);
      i += 1;
      continue;
    }
    if (arg.startsWith("--provider=")) {
      options.provider = providerSchema.parse(arg.split("=", 2)[1]);
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

async function loadFixture<T>(fileName: string): Promise<T> {
  const fileUrl = new URL(`./fixtures/${fileName}`, import.meta.url);
  const raw = await readFile(fileUrl, "utf-8");
  return JSON.parse(raw) as T;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  resetQueryTrace();
  if (!options.demo) {
    await checkSources();
  }

  const providerName = options.demo
    ? detectProviderForDemo(options.provider)
    : (options.provider ?? detectProvider());
  const provider = createProvider(providerName);
  console.log(`🤖 Analysis provider: ${provider.name} (${provider.model})`);

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

  if (options.demo) {
    addQueryTrace("Stripe churn event", "SELECT c.id, c.email, c.name, s.* FROM stripe.customers c JOIN stripe.subscriptions s ON s.customer = c.id WHERE c.id = '<id>' AND s.status IN ('canceled','unpaid','past_due') LIMIT 5");
  }

  const posthogSpinner = ora("🔎 Scanning PostHog for error patterns...").start();
  const plainSpinner = ora("💬 Pulling Plain support history...").start();
  const deploysSpinner = ora("🚀 Checking recent GitHub deploys...").start();
  const slackSpinner = ora("💬 Searching Slack for customer mentions...").start();

  const [posthogErrors, plainThreads, recentDeploys, slackMentions] =
    await Promise.all([
      (async () => {
        try {
          if (options.demo) {
            addQueryTrace(
              "PostHog errors (custom Coral source)",
              "SELECT e.id, e.name, e.status, e.first_seen, e.last_seen, e.occurrences FROM posthog.errors e LEFT JOIN posthog.events ev ON ev.event = '$exception' AND ev.email = '<email>' WHERE e.status = 'active' AND e.last_seen >= now() - interval '30 days' GROUP BY e.id, e.name, e.status, e.first_seen, e.last_seen, e.occurrences ORDER BY e.occurrences DESC LIMIT 10",
            );
          }
          const data = options.demo
            ? await loadFixture<Record<string, unknown>[]>("posthog-errors.json")
            : await getRecentPostHogErrors(customer.email);
          posthogSpinner.succeed("🔎 Scanning PostHog for error patterns...");
          return data;
        } catch (error) {
          posthogSpinner.fail("🔎 Scanning PostHog for error patterns...");
          throw error;
        }
      })(),
      (async () => {
        try {
          if (options.demo) {
            addQueryTrace(
              "Plain support threads (custom Coral source)",
              "SELECT t.id, t.title, t.status, t.priority, t.created_at, t.updated_at, t.assignee_name FROM plain.threads t JOIN plain.customers c ON c.id = t.customer_id WHERE c.email = '<email>' ORDER BY t.created_at DESC LIMIT 10",
            );
          }
          const data = options.demo
            ? await loadFixture<Record<string, unknown>[]>("plain-threads.json")
            : await getPlainThreads(customer.email);
          plainSpinner.succeed("💬 Pulling Plain support history...");
          return data;
        } catch (error) {
          plainSpinner.fail("💬 Pulling Plain support history...");
          throw error;
        }
      })(),
      (async () => {
        try {
          if (options.demo) {
            addQueryTrace(
              "GitHub recent deploys",
              "SELECT r.tag_name, r.name, r.created_at, r.body, r.author_login FROM github.releases r WHERE r.owner = '<owner>' AND r.repo = '<repo>' AND r.created_at >= now() - interval '30 days' ORDER BY r.created_at DESC LIMIT 10",
            );
          }
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
          if (options.demo) {
            addQueryTrace(
              "Slack customer mentions",
              "SELECT m.text, m.user_id, m.ts, m.channel_id FROM slack.messages m JOIN slack.channels c ON c.id = m.channel_id WHERE c.name LIKE '%' AND m.text ILIKE '%<name>%' ORDER BY m.ts DESC LIMIT 20",
            );
          }
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
    posthogErrors,
    plainThreads,
    recentDeploys,
    slackMentions,
  };

  const analysisSpinner = ora("🤖 Running root cause analysis...").start();
  let analysis: ChurnAnalysis;
  try {
    const rawJson = await provider.analyze(buildAnalysisPrompt(context));
    analysis = analysisSchema.parse(JSON.parse(rawJson));
    analysisSpinner.succeed("🤖 Running root cause analysis...");
  } catch (error) {
    analysisSpinner.fail("🤖 Running root cause analysis...");
    throw error;
  }

  const trace = getQueryTrace();
  printReport(context, analysis, { name: provider.name, model: provider.model }, trace);

  if (process.env.SLACK_WEBHOOK_URL) {
    await postToSlack(
      buildSlackBlocks(context, analysis, { name: provider.name, model: provider.model }),
      process.env.SLACK_WEBHOOK_URL,
    );
  }
}

void main();

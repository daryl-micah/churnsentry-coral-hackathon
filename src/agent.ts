import "dotenv/config";
import { Anthropic } from "@anthropic-ai/sdk";
import { z } from "zod";
import { runCoralQuery } from "./coral.js";
import { runDemoEvent } from "./demo.js";
import { systemPrompt } from "./prompts.js";
import { buildReport } from "./report.js";
import { ensureSourcesReady } from "./sources.js";
import { postSlackReport } from "./webhook.js";

export async function main(): Promise<void> {
  // TODO: parse CLI args for stripe_customer_id and flags
  // TODO: in demo mode, call runDemoEvent() to get a mock Stripe event
  // TODO: validate env vars with zod
  // TODO: initialize Anthropic client with ANTHROPIC_API_KEY
  // TODO: verify sources with ensureSourcesReady()
  // TODO: run runCoralQuery() and analyze using systemPrompt
  // TODO: buildReport() and optionally postSlackReport()
  void systemPrompt;
  void runCoralQuery;
  void runDemoEvent;
  void ensureSourcesReady;
  void buildReport;
  void postSlackReport;
  void Anthropic;
  void z;
}

void main();

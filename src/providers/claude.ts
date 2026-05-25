import { Anthropic } from "@anthropic-ai/sdk";
import type { AnalysisProvider } from "./types.js";

export class ClaudeProvider implements AnalysisProvider {
  name = "Claude";
  model = "claude-sonnet-4-20250514";
  private client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "❌ Missing ANTHROPIC_API_KEY for Claude provider.\nSet it in .env or export it before running.",
      );
    }
    this.client = new Anthropic({ apiKey });
  }

  async analyze(prompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system:
        "You are a senior Customer Success and Engineering analyst. Respond only with valid JSON matching the requested schema. No markdown fences, no preamble.",
      messages: [{ role: "user", content: prompt }],
    });
    const first = response.content[0];
    if (!first || first.type !== "text") {
      throw new Error("Claude response did not include text content.");
    }
    return first.text;
  }
}

import OpenAI from "openai";
import type { AnalysisProvider } from "./types.js";

export class OpenAIProvider implements AnalysisProvider {
  name = "OpenAI";
  model = "gpt-4o";
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "❌ Missing OPENAI_API_KEY for OpenAI provider.\nSet it in .env or export it before running.",
      );
    }
    this.client = new OpenAI({ apiKey });
  }

  async analyze(prompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 1024,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a senior Customer Success and Engineering analyst. Respond only with valid JSON matching the requested schema. No markdown fences, no preamble.",
        },
        { role: "user", content: prompt },
      ],
    });
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI response did not include content.");
    }
    return content;
  }
}

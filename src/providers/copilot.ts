import OpenAI from "openai";
import type { AnalysisProvider } from "./types.js";

export class CopilotProvider implements AnalysisProvider {
  name = "GitHub Copilot";
  model = "gpt-4o";
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.GITHUB_TOKEN;
    if (!apiKey) {
      throw new Error(
        "❌ Missing GITHUB_TOKEN for GitHub Copilot provider.\nSet it in .env or export it before running.",
      );
    }
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://api.githubcopilot.com",
      defaultHeaders: {
        "Editor-Version": "churnsentry/1.0",
        "Editor-Plugin-Version": "churnsentry-agent/1.0",
        "Copilot-Integration-Id": "churnsentry",
      },
    });
  }

  async analyze(prompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 1024,
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
      throw new Error("GitHub Copilot response did not include content.");
    }
    return content.replace(/```json\n?/g, "").replace(/```/g, "").trim();
  }
}

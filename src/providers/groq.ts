import OpenAI from "openai";
import type { AnalysisProvider } from "./types.js";

export class GroqProvider implements AnalysisProvider {
  name = "Groq";
  model = "llama-3.3-70b-versatile";
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        "❌ Missing GROQ_API_KEY for Groq provider.\nGet a free key at https://console.groq.com/keys",
      );
    }
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
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
      throw new Error("Groq response did not include content.");
    }
    return content;
  }
}

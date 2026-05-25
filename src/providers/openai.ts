import type { AnalysisProvider } from "./types.js";

export class OpenAIProvider implements AnalysisProvider {
  name = "OpenAI";
  model = "gpt-4o";

  async analyze(_prompt: string): Promise<string> {
    // TODO: implement OpenAI provider
    throw new Error("OpenAI provider not implemented yet.");
  }
}

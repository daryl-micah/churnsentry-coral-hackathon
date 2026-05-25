import type { AnalysisProvider } from "./types.js";

export class ClaudeProvider implements AnalysisProvider {
  name = "Claude";
  model = "claude-sonnet-4-20250514";

  async analyze(_prompt: string): Promise<string> {
    // TODO: implement Claude provider
    throw new Error("Claude provider not implemented yet.");
  }
}

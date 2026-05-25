import type { AnalysisProvider } from "./types.js";

export class CopilotProvider implements AnalysisProvider {
  name = "GitHub Copilot";
  model = "gpt-4o";

  async analyze(_prompt: string): Promise<string> {
    // TODO: implement GitHub Copilot provider
    throw new Error("GitHub Copilot provider not implemented yet.");
  }
}

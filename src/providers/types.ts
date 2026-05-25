export interface AnalysisProvider {
  name: string; // "Claude" | "OpenAI" | "GitHub Copilot"
  model: string;
  analyze(prompt: string): Promise<string>;
}

export type ProviderName = "claude" | "openai" | "copilot";

export interface ProviderConfig {
  provider: ProviderName;
}

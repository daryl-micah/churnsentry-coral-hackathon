export interface AnalysisProvider {
  name: string; // "Groq" | "GitHub Copilot" | "Claude" | "OpenAI" | "Offline (canned demo)"
  model: string;
  analyze(prompt: string): Promise<string>;
}

export type ProviderName = "groq" | "copilot" | "claude" | "openai" | "offline";

export interface ProviderConfig {
  provider: ProviderName;
}

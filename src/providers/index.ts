import { ClaudeProvider } from "./claude.js";
import { CopilotProvider } from "./copilot.js";
import { OpenAIProvider } from "./openai.js";
import type { AnalysisProvider, ProviderName } from "./types.js";

export function createProvider(name: ProviderName): AnalysisProvider {
  switch (name) {
    case "claude":
      return new ClaudeProvider();
    case "openai":
      return new OpenAIProvider();
    case "copilot":
      return new CopilotProvider();
    default: {
      const _exhaustive: never = name;
      throw new Error(`Unknown provider: ${_exhaustive}`);
    }
  }
}

export function detectProvider(): ProviderName {
  const raw = process.env.CHURNSENTRY_PROVIDER ?? "claude";
  if (!["claude", "openai", "copilot"].includes(raw)) {
    throw new Error(
      `Invalid CHURNSENTRY_PROVIDER="${raw}". Valid values: claude, openai, copilot`,
    );
  }
  return raw as ProviderName;
}

import { ClaudeProvider } from "./claude.js";
import { CopilotProvider } from "./copilot.js";
import { OpenAIProvider } from "./openai.js";
import type { AnalysisProvider, ProviderName } from "./types.js";

function requireEnv(value: string | undefined, message: string): void {
  if (!value) {
    throw new Error(message);
  }
}

export function createProvider(name: ProviderName): AnalysisProvider {
  switch (name) {
    case "claude":
      requireEnv(
        process.env.ANTHROPIC_API_KEY,
        "❌ Missing ANTHROPIC_API_KEY for Claude provider.\nSet it in .env or export it before running.",
      );
      return new ClaudeProvider();
    case "openai":
      requireEnv(
        process.env.OPENAI_API_KEY,
        "❌ Missing OPENAI_API_KEY for OpenAI provider.\nSet it in .env or export it before running.",
      );
      return new OpenAIProvider();
    case "copilot":
      requireEnv(
        process.env.COPILOT_API_KEY,
        "❌ Missing COPILOT_API_KEY for GitHub Copilot provider.\nSet it in .env or export it before running.",
      );
      return new CopilotProvider();
    default: {
      const _exhaustive: never = name;
      return _exhaustive;
    }
  }
}

export function detectProvider(): ProviderName {
  const raw = (process.env.CHURNSENTRY_PROVIDER ?? "claude").toLowerCase();
  if (raw === "claude" || raw === "openai" || raw === "copilot") {
    return raw;
  }
  throw new Error(
    `Unknown provider "${raw}". Valid options: claude, openai, copilot`,
  );
}

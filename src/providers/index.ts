import { ClaudeProvider } from "./claude.js";
import { CopilotProvider } from "./copilot.js";
import { GroqProvider } from "./groq.js";
import { OfflineProvider } from "./offline.js";
import { OpenAIProvider } from "./openai.js";
import type { AnalysisProvider, ProviderName } from "./types.js";

export function createProvider(name: ProviderName): AnalysisProvider {
  switch (name) {
    case "groq":
      return new GroqProvider();
    case "copilot":
      return new CopilotProvider();
    case "claude":
      return new ClaudeProvider();
    case "openai":
      return new OpenAIProvider();
    case "offline":
      return new OfflineProvider();
    default: {
      const _exhaustive: never = name;
      throw new Error(`Unknown provider: ${_exhaustive}`);
    }
  }
}

const VALID_PROVIDERS = ["groq", "copilot", "claude", "openai", "offline"] as const;

export function detectProvider(): ProviderName {
  // Default to Groq — free, fast, and signup-only (no payment method).
  const raw = process.env.CHURNSENTRY_PROVIDER ?? "groq";
  if (!(VALID_PROVIDERS as readonly string[]).includes(raw)) {
    throw new Error(
      `Invalid CHURNSENTRY_PROVIDER="${raw}". Valid values: ${VALID_PROVIDERS.join(", ")}`,
    );
  }
  return raw as ProviderName;
}

/**
 * For `--demo` runs: if no AI credentials are available, fall back to the
 * offline provider so reviewers can run the pipeline without signing up.
 */
export function detectProviderForDemo(explicit?: ProviderName): ProviderName {
  if (explicit) return explicit;
  if (process.env.CHURNSENTRY_PROVIDER) return detectProvider();
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.GITHUB_TOKEN) return "copilot";
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "offline";
}

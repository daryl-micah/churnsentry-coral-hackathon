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
 * For `--demo` runs: only auto-select a provider when its credential is
 * unambiguously usable. GROQ_API_KEY is the one zero-ambiguity case. A
 * raw GITHUB_TOKEN may be a PAT that Copilot rejects, so we don't pick
 * Copilot implicitly. Claude/OpenAI require explicit opt-in too —
 * judges shouldn't accidentally burn paid API credits from a stray env
 * var. Everything else falls back to the offline canned analyzer.
 */
export function detectProviderForDemo(explicit?: ProviderName): ProviderName {
  if (explicit) return explicit;
  if (process.env.CHURNSENTRY_PROVIDER) return detectProvider();
  if (process.env.GROQ_API_KEY) return "groq";
  return "offline";
}

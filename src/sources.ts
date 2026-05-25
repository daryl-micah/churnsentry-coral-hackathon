import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const REQUIRED_SOURCES = ["stripe", "sentry", "intercom", "github", "slack"] as const;

export type SourceStatus = Record<(typeof REQUIRED_SOURCES)[number], boolean>;

function parseSourceList(output: string): string[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/\|/g, " ").trim())
    .filter((line) => /[a-z0-9_]/i.test(line))
    .filter((line) => line.toLowerCase() !== "schema_name")
    .map((line) => line.match(/[a-z0-9_]+/i)?.[0]?.toLowerCase())
    .filter((value): value is string => Boolean(value));
}

export async function checkSources(): Promise<SourceStatus> {
  const { stdout } = await execAsync(
    'coral sql "SELECT schema_name FROM coral.tables GROUP BY 1 ORDER BY 1"',
    { maxBuffer: 1024 * 1024 },
  );
  const discovered = new Set(parseSourceList(stdout));
  const missing = REQUIRED_SOURCES.filter((source) => !discovered.has(source));

  if (missing.length > 0) {
    for (const source of missing) {
      console.error(`❌ Missing source: ${source}`);
      console.error(`Run: coral source add --interactive ${source}`);
    }
    process.exit(1);
  }

  return {
    stripe: true,
    sentry: true,
    intercom: true,
    github: true,
    slack: true,
  };
}

export async function ensureSourcesReady(): Promise<SourceStatus> {
  return checkSources();
}

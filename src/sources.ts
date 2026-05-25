export type SourceStatus = {
  stripe: boolean;
  coral: boolean;
};

export async function ensureSourcesReady(): Promise<SourceStatus> {
  // TODO: validate source configs and connection health
  return { stripe: false, coral: false };
}

export async function postToSlack(blocks: object, webhookUrl: string): Promise<void> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blocks),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      const suffix = details ? ` - ${details}` : "";
      console.warn(`Slack webhook failed: ${response.status} ${response.statusText}${suffix}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Slack webhook failed: ${message}`);
  }
}

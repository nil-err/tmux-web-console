import type { ExternalLinkShortcut, ExternalLinksResponse } from "../../shared/externalLinkTypes.js";

const externalLinksPath = "/api/config/external-links";

export async function fetchExternalLinksConfig(): Promise<ExternalLinksResponse> {
  const response = await fetch(externalLinksPath);
  if (!response.ok) {
    const payload = (await response.json().catch(() => undefined)) as
      | { error?: { message?: string } }
      | undefined;
    throw new Error(payload?.error?.message ?? "Unable to load external links");
  }
  return (await response.json()) as ExternalLinksResponse;
}

export async function saveExternalLinksConfig(links: ExternalLinkShortcut[]): Promise<ExternalLinksResponse> {
  const response = await fetch(externalLinksPath, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ links })
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => undefined)) as
      | { error?: { message?: string } }
      | undefined;
    throw new Error(payload?.error?.message ?? "Unable to save external links");
  }
  return (await response.json()) as ExternalLinksResponse;
}

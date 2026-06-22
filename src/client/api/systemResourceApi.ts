import type { SystemResourceSnapshot } from "../../shared/systemResourceTypes.js";

export async function fetchSystemResources(): Promise<SystemResourceSnapshot> {
  const response = await fetch("/api/system/resources");
  if (!response.ok) {
    const payload = (await response.json().catch(() => undefined)) as
      | { error?: { message?: string } }
      | undefined;
    throw new Error(payload?.error?.message ?? "Unable to load resource usage");
  }
  return (await response.json()) as SystemResourceSnapshot;
}

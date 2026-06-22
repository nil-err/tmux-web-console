import type { CommandAvailabilityResponse } from "../../shared/commandAvailabilityTypes.js";

export async function fetchCommandAvailability(): Promise<CommandAvailabilityResponse> {
  const response = await fetch("/api/system/commands");
  if (!response.ok) {
    const payload = (await response.json().catch(() => undefined)) as
      | { error?: { message?: string } }
      | undefined;
    throw new Error(payload?.error?.message ?? "Unable to load local command availability");
  }
  return (await response.json()) as CommandAvailabilityResponse;
}

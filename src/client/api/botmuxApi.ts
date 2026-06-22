import type { BotmuxDashboardResponse } from "../../shared/botmuxTypes.js";

export async function fetchBotmuxDashboard(): Promise<BotmuxDashboardResponse> {
  const response = await fetch("/api/botmux/dashboard");
  if (!response.ok) {
    throw new Error(`Unable to load botmux dashboard (${response.status})`);
  }
  return response.json() as Promise<BotmuxDashboardResponse>;
}

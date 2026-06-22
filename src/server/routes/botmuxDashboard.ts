import type { Router } from "express";
import type { BotmuxDashboardService } from "../botmux/botmuxDashboardService.js";
import { toErrorResponse } from "../utils/errors.js";

export function registerBotmuxDashboardRoute(router: Router, botmuxDashboardService: BotmuxDashboardService): void {
  router.get("/api/botmux/dashboard", async (_request, response) => {
    try {
      response.json(await botmuxDashboardService.getDashboard());
    } catch (error) {
      const result = toErrorResponse(error);
      response.status(result.statusCode).json(result.body);
    }
  });
}

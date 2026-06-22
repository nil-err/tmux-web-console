import type { Router } from "express";
import type { CommandAvailabilityService } from "../system/commandAvailabilityService.js";
import { toErrorResponse } from "../utils/errors.js";

export function registerCommandAvailabilityRoute(router: Router, commandAvailabilityService: CommandAvailabilityService): void {
  router.get("/api/system/commands", async (_request, response) => {
    try {
      response.json(await commandAvailabilityService.getAvailability());
    } catch (error) {
      const result = toErrorResponse(error);
      response.status(result.statusCode).json(result.body);
    }
  });
}

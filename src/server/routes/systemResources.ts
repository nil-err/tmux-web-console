import type { Router } from "express";
import type { SystemResourceService } from "../system/systemResourceService.js";
import { toErrorResponse } from "../utils/errors.js";

export function registerSystemResourcesRoute(router: Router, systemResourceService: SystemResourceService): void {
  router.get("/api/system/resources", async (_request, response) => {
    try {
      response.json(await systemResourceService.getSnapshot());
    } catch (error) {
      const result = toErrorResponse(error);
      response.status(result.statusCode).json(result.body);
    }
  });
}

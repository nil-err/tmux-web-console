import type { Router } from "express";
import type { ExternalLinksConfigService } from "../config/externalLinksConfigService.js";
import { toErrorResponse } from "../utils/errors.js";

export function registerExternalLinksRoute(router: Router, externalLinksConfigService: ExternalLinksConfigService): void {
  router.get("/api/config/external-links", async (_request, response) => {
    try {
      response.json(await externalLinksConfigService.getExternalLinks());
    } catch (error) {
      const result = toErrorResponse(error);
      response.status(result.statusCode).json(result.body);
    }
  });

  router.put("/api/config/external-links", async (request, response) => {
    try {
      response.json(await externalLinksConfigService.saveExternalLinks((request.body as { links?: unknown }).links));
    } catch (error) {
      const result = toErrorResponse(error);
      response.status(result.statusCode).json(result.body);
    }
  });
}

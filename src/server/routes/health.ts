import type { Router } from "express";
import { toErrorResponse } from "../utils/errors.js";
import type { TmuxService } from "../tmux/tmuxService.js";

export function registerHealthRoute(router: Router, tmuxService: TmuxService): void {
  router.get("/api/health", async (_request, response) => {
    try {
      const version = await tmuxService.getVersion();
      response.json({
        ok: true,
        tmux: {
          available: true,
          version
        }
      });
    } catch (error) {
      const result = toErrorResponse(error);
      response.status(result.statusCode).json(result.body);
    }
  });
}

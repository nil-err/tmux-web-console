import type { Router } from "express";
import type { TmuxService } from "../tmux/tmuxService.js";
import { toErrorResponse } from "../utils/errors.js";

export function registerTmuxTreeRoute(router: Router, tmuxService: TmuxService): void {
  router.get("/api/tmux/tree", async (_request, response) => {
    try {
      response.json(await tmuxService.getTree());
    } catch (error) {
      const result = toErrorResponse(error);
      response.status(result.statusCode).json(result.body);
    }
  });
}

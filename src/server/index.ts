import express from "express";
import { createServer } from "node:http";
import path from "node:path";
import { BotmuxDashboardService } from "./botmux/botmuxDashboardService.js";
import { ExternalLinksConfigService } from "./config/externalLinksConfigService.js";
import { resolveClientDist } from "./clientAssets.js";
import { serverConfig } from "./config.js";
import { registerBotmuxDashboardRoute } from "./routes/botmuxDashboard.js";
import { registerCommandAvailabilityRoute } from "./routes/commandAvailability.js";
import { registerExternalLinksRoute } from "./routes/externalLinks.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerSystemResourcesRoute } from "./routes/systemResources.js";
import { registerTmuxTreeRoute } from "./routes/tmuxTree.js";
import { CommandAvailabilityService } from "./system/commandAvailabilityService.js";
import { SystemResourceService } from "./system/systemResourceService.js";
import { TmuxService } from "./tmux/tmuxService.js";
import { TerminalSessionManager } from "./terminal/terminalSessionManager.js";
import { logger } from "./utils/logger.js";
import { registerTerminalWebSocket } from "./ws/terminal.js";

async function createApp() {
  const app = express();
  const router = express.Router();
  const tmuxService = new TmuxService();
  const botmuxDashboardService = new BotmuxDashboardService();
  const commandAvailabilityService = new CommandAvailabilityService();
  const externalLinksConfigService = new ExternalLinksConfigService();
  const systemResourceService = new SystemResourceService();
  const terminalSessionManager = new TerminalSessionManager({ tmuxService });

  app.use(express.json());
  registerBotmuxDashboardRoute(router, botmuxDashboardService);
  registerCommandAvailabilityRoute(router, commandAvailabilityService);
  registerExternalLinksRoute(router, externalLinksConfigService);
  registerHealthRoute(router, tmuxService);
  registerSystemResourcesRoute(router, systemResourceService);
  registerTmuxTreeRoute(router, tmuxService);
  app.use(router);

  if (process.env.NODE_ENV === "production") {
    const clientDist = resolveClientDist();
    app.use(express.static(clientDist));
    app.use((_request, response) => {
      response.sendFile(path.join(clientDist, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }

  return { app, terminalSessionManager };
}

const { app, terminalSessionManager } = await createApp();
const server = createServer(app);
registerTerminalWebSocket(server, terminalSessionManager);

server.listen(serverConfig.port, serverConfig.host, () => {
  logger.info(`tmux-web-console listening on http://${serverConfig.host}:${serverConfig.port}`);
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`received ${signal}, shutting down`);
  await terminalSessionManager.closeAll(signal);
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

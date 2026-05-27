import express from "express";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { serverConfig } from "./config.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerTmuxTreeRoute } from "./routes/tmuxTree.js";
import { TmuxService } from "./tmux/tmuxService.js";
import { TerminalSessionManager } from "./terminal/terminalSessionManager.js";
import { logger } from "./utils/logger.js";
import { registerTerminalWebSocket } from "./ws/terminal.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createApp() {
  const app = express();
  const router = express.Router();
  const tmuxService = new TmuxService();
  const terminalSessionManager = new TerminalSessionManager({ tmuxService });

  app.use(express.json());
  registerHealthRoute(router, tmuxService);
  registerTmuxTreeRoute(router, tmuxService);
  app.use(router);

  if (process.env.NODE_ENV === "production") {
    const clientDist = path.resolve(__dirname, "../client");
    app.use(express.static(clientDist));
    app.use((_request, response) => {
      response.sendFile(path.join(clientDist, "index.html"));
    });
  } else {
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

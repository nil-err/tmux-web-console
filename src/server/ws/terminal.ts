import type { IncomingMessage, Server as HttpServer } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocket, WebSocketServer } from "ws";
import type { ClientTerminalMessage, ServerTerminalMessage } from "../../shared/protocol.js";
import type { TerminalMode } from "../../shared/tmuxTypes.js";
import { serverConfig } from "../config.js";
import type { TerminalSessionManager } from "../terminal/terminalSessionManager.js";

export type ParsedTerminalRequest =
  | {
      ok: true;
      value: {
        sessionName: string;
        windowId: string;
        mode: TerminalMode;
      };
    }
  | { ok: false; code: string; message: string };

export function parseTerminalRequest(url: string | undefined): ParsedTerminalRequest {
  if (!url) {
    return { ok: false, code: "WS_PROTOCOL_ERROR", message: "Missing WebSocket URL" };
  }

  const parsed = new URL(url, "http://localhost");
  const sessionName = parsed.searchParams.get("session");
  const windowId = parsed.searchParams.get("window");
  const mode = parsed.searchParams.get("mode");

  if (!sessionName || !windowId || (mode !== "readonly" && mode !== "write")) {
    return { ok: false, code: "WS_PROTOCOL_ERROR", message: "Invalid terminal connection parameters" };
  }
  if (mode === "write" && !serverConfig.enableWriteMode) {
    return { ok: false, code: "WRITE_MODE_DISABLED", message: "Writable terminal connections are disabled" };
  }

  return {
    ok: true,
    value: {
      sessionName,
      windowId,
      mode
    }
  };
}

function send(socket: WebSocket, message: ServerTerminalMessage): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function parseMessage(data: WebSocket.RawData): ClientTerminalMessage | undefined {
  try {
    const parsed = JSON.parse(data.toString()) as ClientTerminalMessage;
    if (parsed.type === "input" && typeof parsed.data === "string") {
      return parsed;
    }
    if (parsed.type === "resize" && Number.isFinite(parsed.cols) && Number.isFinite(parsed.rows)) {
      return parsed;
    }
    if (parsed.type === "ping" && Number.isFinite(parsed.now)) {
      return parsed;
    }
    if (parsed.type === "close") {
      return parsed;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function registerTerminalWebSocket(server: HttpServer, manager: TerminalSessionManager): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    if (pathname !== "/ws/terminal") {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (webSocket) => {
      wss.emit("connection", webSocket, request);
    });
  });

  wss.on("connection", async (socket, request) => {
    const parsed = parseTerminalRequest(request.url);
    if (!parsed.ok) {
      send(socket, { type: "error", code: parsed.code, message: parsed.message });
      socket.close();
      return;
    }

    let connectionId: string | undefined;
    try {
      send(socket, { type: "status", status: "connecting" });
      const terminalSession = await manager.create(parsed.value);
      connectionId = terminalSession.connectionId;
      send(socket, {
        type: "ready",
        connectionId: terminalSession.connectionId,
        readonly: parsed.value.mode === "readonly"
      });
      send(socket, { type: "status", status: "connected" });

      terminalSession.onOutput((data) => send(socket, { type: "output", data }));
      terminalSession.onExit((event) => {
        send(socket, { type: "exit", exitCode: event.exitCode, signal: event.signal });
        send(socket, { type: "status", status: "exited" });
      });

      socket.on("message", (data) => {
        const message = parseMessage(data);
        if (!message) {
          send(socket, { type: "error", code: "WS_PROTOCOL_ERROR", message: "Invalid WebSocket message" });
          return;
        }
        if (message.type === "input") {
          terminalSession.write(message.data);
        } else if (message.type === "resize") {
          terminalSession.resize(message.cols, message.rows);
        } else if (message.type === "ping") {
          send(socket, { type: "pong", now: message.now });
        } else if (message.type === "close") {
          socket.close();
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create terminal connection";
      send(socket, { type: "error", code: "TERMINAL_CONNECT_FAILED", message });
      send(socket, { type: "status", status: "error" });
      socket.close();
    }

    socket.on("close", () => {
      if (connectionId) {
        void manager.close(connectionId, "websocket closed");
      }
    });
  });

  return wss;
}

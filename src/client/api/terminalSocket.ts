import type { ClientTerminalMessage, ServerTerminalMessage } from "../../shared/protocol.js";
import type { TerminalTab } from "../../shared/tmuxTypes.js";

export function createTerminalWebSocket(tab: TerminalTab): WebSocket {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const params = new URLSearchParams({
    session: tab.sessionName,
    window: tab.windowId,
    mode: tab.mode
  });
  return new WebSocket(`${protocol}//${window.location.host}/ws/terminal?${params.toString()}`);
}

export function sendTerminalMessage(socket: WebSocket, message: ClientTerminalMessage): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

export function parseTerminalMessage(data: MessageEvent<string>): ServerTerminalMessage | undefined {
  try {
    return JSON.parse(data.data) as ServerTerminalMessage;
  } catch {
    return undefined;
  }
}

import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { useEffect, useRef } from "react";
import type { TerminalTab } from "../../shared/tmuxTypes.js";
import { createTerminalWebSocket, parseTerminalMessage, sendTerminalMessage } from "../api/terminalSocket.js";

interface TerminalPaneProps {
  tab: TerminalTab;
  active: boolean;
  onStatus: (tabId: string, status: TerminalTab["status"], errorMessage?: string) => void;
}

export function TerminalPane({ tab, active, onStatus }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const terminal = new Terminal({
      cursorBlink: tab.mode === "write",
      convertEol: true,
      fontFamily: "Menlo, Consolas, 'Liberation Mono', monospace",
      fontSize: 13,
      letterSpacing: 0,
      lineHeight: 1.25,
      scrollback: 5000,
      theme: {
        background: "#0f1115",
        foreground: "#e6e8ee",
        cursor: "#f6c177",
        selectionBackground: "#41536b"
      }
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    if (containerRef.current) {
      terminal.open(containerRef.current);
      fitAddon.fit();
    }

    const socket = createTerminalWebSocket(tab);
    socketRef.current = socket;

    socket.onopen = () => {
      const dimensions = fitAddon.proposeDimensions();
      if (dimensions) {
        sendTerminalMessage(socket, { type: "resize", cols: dimensions.cols, rows: dimensions.rows });
      }
    };
    socket.onmessage = (event) => {
      const message = parseTerminalMessage(event);
      if (!message) {
        return;
      }
      if (message.type === "output") {
        terminal.write(message.data);
      } else if (message.type === "status") {
        onStatus(tab.tabId, message.status);
      } else if (message.type === "error") {
        terminal.writeln(`\r\n[${message.code}] ${message.message}`);
        onStatus(tab.tabId, "error", message.message);
      } else if (message.type === "exit") {
        onStatus(tab.tabId, "exited");
      }
    };
    socket.onerror = () => {
      onStatus(tab.tabId, "error", "WebSocket connection failed");
    };
    socket.onclose = () => {
      if (tab.status !== "error" && tab.status !== "exited") {
        onStatus(tab.tabId, "exited");
      }
    };

    const dataDisposable =
      tab.mode === "write"
        ? terminal.onData((data) => sendTerminalMessage(socket, { type: "input", data }))
        : undefined;

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current && socket.readyState === WebSocket.OPEN) {
        fitAddon.fit();
        const dimensions = fitAddon.proposeDimensions();
        if (dimensions) {
          sendTerminalMessage(socket, { type: "resize", cols: dimensions.cols, rows: dimensions.rows });
        }
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      dataDisposable?.dispose();
      resizeObserver.disconnect();
      if (socket.readyState === WebSocket.OPEN) {
        sendTerminalMessage(socket, { type: "close" });
      }
      socket.close();
      terminal.dispose();
    };
  }, [onStatus, tab]);

  useEffect(() => {
    if (active) {
      window.requestAnimationFrame(() => {
        fitAddonRef.current?.fit();
        terminalRef.current?.focus();
      });
    }
  }, [active]);

  return (
    <div className={`terminal-pane ${active ? "terminal-pane--active" : ""}`} aria-hidden={!active}>
      <div ref={containerRef} className="terminal-pane__surface" />
      {tab.errorMessage ? <div className="terminal-overlay terminal-overlay--error">{tab.errorMessage}</div> : null}
    </div>
  );
}

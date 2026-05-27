export type ClientTerminalMessage =
  | { type: "input"; data: string }
  | { type: "resize"; cols: number; rows: number }
  | { type: "ping"; now: number }
  | { type: "close" };

export type ServerTerminalMessage =
  | { type: "ready"; connectionId: string; readonly: boolean }
  | { type: "output"; data: string }
  | { type: "status"; status: "connecting" | "connected" | "exited" | "error" }
  | { type: "pong"; now: number }
  | { type: "error"; code: string; message: string }
  | { type: "exit"; exitCode: number | null; signal: string | null };

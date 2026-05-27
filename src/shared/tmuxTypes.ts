export interface TmuxWindow {
  id: string;
  sessionName: string;
  index: number;
  name: string;
  active: boolean;
  paneCount: number;
  flags: string;
}

export interface TmuxSession {
  name: string;
  createdAtEpoch?: number;
  attachedCount: number;
  windowCount: number;
  windows: TmuxWindow[];
}

export interface TmuxTree {
  sessions: TmuxSession[];
}

export type TerminalMode = "readonly" | "write";

export interface TerminalTab {
  tabId: string;
  title: string;
  sessionName: string;
  windowId: string;
  windowIndex: number;
  windowName: string;
  mode: TerminalMode;
  status: "connecting" | "connected" | "exited" | "error";
  createdAt: number;
  errorMessage?: string;
}

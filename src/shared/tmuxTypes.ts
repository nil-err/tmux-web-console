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

export type WebviewTabKind = "dashboard" | "agentBrowser";
export type FixedTabKind = WebviewTabKind | "resourceMonitor";

interface WebviewTabBase<TKind extends WebviewTabKind> {
  kind: TKind;
  tabId: string;
  title: string;
  url: string;
  status: "connected" | "error";
  createdAt: number;
  reloadKey: number;
  errorMessage?: string;
}

export type DashboardTab = WebviewTabBase<"dashboard">;
export type AgentBrowserTab = WebviewTabBase<"agentBrowser">;
export type WebviewTab = DashboardTab | AgentBrowserTab;

export interface ResourceMonitorTab {
  kind: "resourceMonitor";
  tabId: string;
  title: string;
  status: "connected" | "error";
  createdAt: number;
  errorMessage?: string;
}

export type WorkspaceTab = TerminalTab | WebviewTab | ResourceMonitorTab;

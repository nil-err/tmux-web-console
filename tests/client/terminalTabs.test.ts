import { describe, expect, it } from "vitest";
import type { AgentBrowserTab, DashboardTab, ResourceMonitorTab, TerminalTab } from "../../src/shared/tmuxTypes.js";
import { terminalTabsReducer, type TerminalTabsState } from "../../src/client/state/terminalTabs.js";

function createTab(tabId: string, status: TerminalTab["status"] = "connecting"): TerminalTab {
  return {
    tabId,
    title: `main:${tabId}`,
    sessionName: "main",
    windowId: "@44",
    windowIndex: 1,
    windowName: "dev",
    mode: tabId.includes("readonly") ? "readonly" : "write",
    status,
    createdAt: 1000
  };
}

function createDashboardTab(tabId: string): DashboardTab {
  return {
    kind: "dashboard",
    tabId,
    title: "Botmux Dashboard",
    url: "http://127.0.0.1:7891/?ticket=demo",
    status: "connected",
    createdAt: 1000,
    reloadKey: 0
  };
}

function createAgentBrowserTab(tabId: string): AgentBrowserTab {
  return {
    kind: "agentBrowser",
    tabId,
    title: "Agent Browser",
    url: "http://localhost:4848",
    status: "connected",
    createdAt: 1000,
    reloadKey: 0
  };
}

function createResourceMonitorTab(tabId: string): ResourceMonitorTab {
  return {
    kind: "resourceMonitor",
    tabId,
    title: "Resource Monitor",
    status: "connected",
    createdAt: 1000
  };
}

describe("terminalTabsReducer", () => {
  it("opens a tab and makes it active", () => {
    const state = terminalTabsReducer({ tabs: [] }, { type: "open", tab: createTab("tab-1") });

    expect(state.tabs.map((tab) => tab.tabId)).toEqual(["tab-1"]);
    expect(state.activeTabId).toBe("tab-1");
  });

  it("opens a dashboard tab at the start and makes it active", () => {
    const initial: TerminalTabsState = { tabs: [createTab("terminal-1")], activeTabId: "terminal-1" };

    const state = terminalTabsReducer(initial, { type: "open", tab: createDashboardTab("dashboard-1"), position: "start" });

    expect(state.tabs.map((tab) => tab.tabId)).toEqual(["dashboard-1", "terminal-1"]);
    expect(state.activeTabId).toBe("dashboard-1");
  });

  it("keeps dashboard fixed at the leftmost position", () => {
    const initial: TerminalTabsState = { tabs: [createTab("terminal-1")], activeTabId: "terminal-1" };

    const withTerminal = terminalTabsReducer(initial, { type: "open", tab: createTab("terminal-2"), position: "start" });
    const withDashboard = terminalTabsReducer(withTerminal, { type: "open", tab: createDashboardTab("dashboard-1"), position: "start" });
    const withTerminal3 = terminalTabsReducer(withDashboard, { type: "open", tab: createTab("terminal-3"), position: "start" });

    expect(withTerminal3.tabs.map((tab) => tab.tabId)).toEqual(["dashboard-1", "terminal-3", "terminal-2", "terminal-1"]);
    expect(withTerminal3.activeTabId).toBe("terminal-3");
  });

  it("activates an already open dashboard tab instead of opening a duplicate", () => {
    const initial: TerminalTabsState = {
      tabs: [createDashboardTab("dashboard-1"), createTab("terminal-1")],
      activeTabId: "terminal-1"
    };

    const dashboardState = terminalTabsReducer(initial, { type: "open", tab: createDashboardTab("dashboard-2"), position: "start" });

    expect(dashboardState.tabs.map((tab) => tab.tabId)).toEqual(["dashboard-1", "terminal-1"]);
    expect(dashboardState.activeTabId).toBe("dashboard-1");
  });

  it("activates an already open agent browser tab instead of opening a duplicate", () => {
    const initial: TerminalTabsState = {
      tabs: [createDashboardTab("dashboard-1"), createAgentBrowserTab("agent-browser-1"), createTab("terminal-1")],
      activeTabId: "terminal-1"
    };

    const state = terminalTabsReducer(initial, { type: "open", tab: createAgentBrowserTab("agent-browser-2"), position: "start" });

    expect(state.tabs.map((tab) => tab.tabId)).toEqual(["dashboard-1", "agent-browser-1", "terminal-1"]);
    expect(state.activeTabId).toBe("agent-browser-1");
  });

  it("keeps resource monitor fixed between dashboard and agent browser and dedupes it", () => {
    const initial: TerminalTabsState = {
      tabs: [createDashboardTab("dashboard-1"), createAgentBrowserTab("agent-browser-1"), createTab("terminal-1")],
      activeTabId: "terminal-1"
    };

    const withResource = terminalTabsReducer(initial, {
      type: "open",
      tab: createResourceMonitorTab("resource-monitor-1"),
      position: "start"
    });
    const deduped = terminalTabsReducer(withResource, {
      type: "open",
      tab: createResourceMonitorTab("resource-monitor-2"),
      position: "start"
    });

    expect(withResource.tabs.map((tab) => tab.tabId)).toEqual([
      "dashboard-1",
      "resource-monitor-1",
      "agent-browser-1",
      "terminal-1"
    ]);
    expect(deduped.tabs.map((tab) => tab.tabId)).toEqual([
      "dashboard-1",
      "resource-monitor-1",
      "agent-browser-1",
      "terminal-1"
    ]);
    expect(deduped.activeTabId).toBe("resource-monitor-1");
  });

  it("reorders only terminal tabs without moving the fixed dashboard tab", () => {
    const initial: TerminalTabsState = {
      tabs: [createDashboardTab("dashboard-1"), createTab("terminal-1"), createTab("terminal-2"), createTab("terminal-3")],
      activeTabId: "terminal-2"
    };

    const reordered = terminalTabsReducer(initial, { type: "reorder", sourceTabId: "terminal-3", targetTabId: "terminal-1" });
    const blocked = terminalTabsReducer(reordered, { type: "reorder", sourceTabId: "dashboard-1", targetTabId: "terminal-2" });

    expect(reordered.tabs.map((tab) => tab.tabId)).toEqual(["dashboard-1", "terminal-3", "terminal-1", "terminal-2"]);
    expect(blocked.tabs.map((tab) => tab.tabId)).toEqual(["dashboard-1", "terminal-3", "terminal-1", "terminal-2"]);
  });

  it("keeps the agent browser tab fixed before terminal tabs", () => {
    const initial: TerminalTabsState = {
      tabs: [createDashboardTab("dashboard-1"), createAgentBrowserTab("agent-browser-1"), createTab("terminal-1")],
      activeTabId: "terminal-1"
    };

    const state = terminalTabsReducer(initial, { type: "reorder", sourceTabId: "agent-browser-1", targetTabId: "terminal-1" });

    expect(state.tabs.map((tab) => tab.tabId)).toEqual(["dashboard-1", "agent-browser-1", "terminal-1"]);
  });

  it("refreshes the dashboard tab without changing tab order", () => {
    const initial: TerminalTabsState = {
      tabs: [createDashboardTab("dashboard-1"), createTab("terminal-1")],
      activeTabId: "terminal-1"
    };

    const state = terminalTabsReducer(initial, { type: "refreshDashboard" });

    expect(state.tabs.map((tab) => tab.tabId)).toEqual(["dashboard-1", "terminal-1"]);
    expect(state.activeTabId).toBe("terminal-1");
    expect(state.tabs[0]).toMatchObject({ kind: "dashboard", reloadKey: 1 });
  });

  it("keeps state unchanged when dashboard refresh is requested without a dashboard tab", () => {
    const initial: TerminalTabsState = {
      tabs: [createTab("terminal-1")],
      activeTabId: "terminal-1"
    };

    expect(terminalTabsReducer(initial, { type: "refreshDashboard" })).toBe(initial);
  });

  it("updates tab status and error message", () => {
    const initial: TerminalTabsState = { tabs: [createTab("tab-1")], activeTabId: "tab-1" };

    const state = terminalTabsReducer(initial, {
      type: "status",
      tabId: "tab-1",
      status: "error",
      errorMessage: "failed"
    });

    expect(state.tabs[0]).toMatchObject({ status: "error", errorMessage: "failed" });
  });

  it("closes active tabs and falls back to the nearest remaining tab", () => {
    const initial: TerminalTabsState = {
      tabs: [createTab("tab-1"), createTab("tab-2"), createTab("tab-3")],
      activeTabId: "tab-2"
    };

    const state = terminalTabsReducer(initial, { type: "close", tabId: "tab-2" });

    expect(state.tabs.map((tab) => tab.tabId)).toEqual(["tab-1", "tab-3"]);
    expect(state.activeTabId).toBe("tab-3");
  });

  it("clears the active tab when the last tab is closed", () => {
    const state = terminalTabsReducer(
      { tabs: [createTab("tab-1")], activeTabId: "tab-1" },
      { type: "close", tabId: "tab-1" }
    );

    expect(state).toEqual({ tabs: [], activeTabId: undefined });
  });
});

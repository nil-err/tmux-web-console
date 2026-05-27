import { describe, expect, it } from "vitest";
import type { TerminalTab } from "../../src/shared/tmuxTypes.js";
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

describe("terminalTabsReducer", () => {
  it("opens a tab and makes it active", () => {
    const state = terminalTabsReducer({ tabs: [] }, { type: "open", tab: createTab("tab-1") });

    expect(state.tabs.map((tab) => tab.tabId)).toEqual(["tab-1"]);
    expect(state.activeTabId).toBe("tab-1");
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

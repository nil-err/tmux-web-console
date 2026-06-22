import type { DashboardTab, FixedTabKind, TerminalTab, WorkspaceTab } from "../../shared/tmuxTypes.js";

const FIXED_TAB_ORDER: FixedTabKind[] = ["dashboard", "resourceMonitor", "agentBrowser"];

export interface TerminalTabsState {
  tabs: WorkspaceTab[];
  activeTabId?: string;
}

export type TerminalTabsAction =
  | { type: "open"; tab: WorkspaceTab; position?: "start" | "end" }
  | { type: "activate"; tabId: string }
  | { type: "close"; tabId: string }
  | { type: "reorder"; sourceTabId: string; targetTabId: string }
  | { type: "refreshDashboard" }
  | {
      type: "status";
      tabId: string;
      status: TerminalTab["status"];
      errorMessage?: string;
    };

function isFixedTab(tab: WorkspaceTab): tab is Extract<WorkspaceTab, { kind: FixedTabKind }> {
  return "kind" in tab && FIXED_TAB_ORDER.includes(tab.kind);
}

function isDashboardTab(tab: WorkspaceTab): tab is DashboardTab {
  return "kind" in tab && tab.kind === "dashboard";
}

function normalizeFixedTabOrder(tabs: WorkspaceTab[]): WorkspaceTab[] {
  const fixedTabs = tabs
    .filter(isFixedTab)
    .sort((left, right) => FIXED_TAB_ORDER.indexOf(left.kind) - FIXED_TAB_ORDER.indexOf(right.kind));
  const terminalTabs = tabs.filter((tab) => !isFixedTab(tab));

  return [...fixedTabs, ...terminalTabs];
}

export function terminalTabsReducer(state: TerminalTabsState, action: TerminalTabsAction): TerminalTabsState {
  if (action.type === "open") {
    if (isFixedTab(action.tab)) {
      const fixedKind = action.tab.kind;
      const existingTab = state.tabs.find((tab) => isFixedTab(tab) && tab.kind === fixedKind);
      if (existingTab) {
        return { ...state, activeTabId: existingTab.tabId };
      }
    }

    return {
      tabs: normalizeFixedTabOrder(action.position === "start" ? [action.tab, ...state.tabs] : [...state.tabs, action.tab]),
      activeTabId: action.tab.tabId
    };
  }

  if (action.type === "activate") {
    return state.tabs.some((tab) => tab.tabId === action.tabId) ? { ...state, activeTabId: action.tabId } : state;
  }

  if (action.type === "status") {
    return {
      ...state,
      tabs: state.tabs.map((tab) =>
        tab.tabId === action.tabId && !("kind" in tab)
          ? {
              ...tab,
              status: action.status,
              errorMessage: action.errorMessage
            }
          : tab
      )
    };
  }

  if (action.type === "reorder") {
    const sourceIndex = state.tabs.findIndex((tab) => tab.tabId === action.sourceTabId);
    const targetIndex = state.tabs.findIndex((tab) => tab.tabId === action.targetTabId);
    const sourceTab = state.tabs[sourceIndex];
    const targetTab = state.tabs[targetIndex];

    if (
      sourceIndex < 0 ||
      targetIndex < 0 ||
      sourceIndex === targetIndex ||
      !sourceTab ||
      !targetTab ||
      isFixedTab(sourceTab) ||
      isFixedTab(targetTab)
    ) {
      return state;
    }

    const tabs = [...state.tabs];
    tabs.splice(sourceIndex, 1);
    const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
    tabs.splice(adjustedTargetIndex, 0, sourceTab);

    return { ...state, tabs: normalizeFixedTabOrder(tabs) };
  }

  if (action.type === "refreshDashboard") {
    const dashboardTab = state.tabs.find(isDashboardTab);
    if (!dashboardTab) {
      return state;
    }

    return {
      ...state,
      tabs: state.tabs.map((tab) =>
        isDashboardTab(tab) && tab.tabId === dashboardTab.tabId
          ? {
              ...tab,
              reloadKey: tab.reloadKey + 1
            }
          : tab
      )
    };
  }

  const closingIndex = state.tabs.findIndex((tab) => tab.tabId === action.tabId);
  if (closingIndex < 0) {
    return state;
  }

  const tabs = state.tabs.filter((tab) => tab.tabId !== action.tabId);
  if (state.activeTabId !== action.tabId) {
    return { ...state, tabs };
  }

  return {
    tabs,
    activeTabId: tabs[closingIndex]?.tabId ?? tabs[closingIndex - 1]?.tabId
  };
}

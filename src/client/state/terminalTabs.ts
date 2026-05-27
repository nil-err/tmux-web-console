import type { TerminalTab } from "../../shared/tmuxTypes.js";

export interface TerminalTabsState {
  tabs: TerminalTab[];
  activeTabId?: string;
}

export type TerminalTabsAction =
  | { type: "open"; tab: TerminalTab }
  | { type: "activate"; tabId: string }
  | { type: "close"; tabId: string }
  | {
      type: "status";
      tabId: string;
      status: TerminalTab["status"];
      errorMessage?: string;
    };

export function terminalTabsReducer(state: TerminalTabsState, action: TerminalTabsAction): TerminalTabsState {
  if (action.type === "open") {
    return {
      tabs: [...state.tabs, action.tab],
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
        tab.tabId === action.tabId
          ? {
              ...tab,
              status: action.status,
              errorMessage: action.errorMessage
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

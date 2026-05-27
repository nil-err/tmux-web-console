import { useCallback, useEffect, useReducer, useState } from "react";
import type { TerminalMode, TerminalTab, TmuxSession, TmuxWindow } from "../shared/tmuxTypes.js";
import { fetchTmuxTree } from "./api/tmuxApi.js";
import { EmptyState } from "./components/EmptyState.js";
import { Layout } from "./components/Layout.js";
import { SessionSidebar } from "./components/SessionSidebar.js";
import { TerminalPane } from "./components/TerminalPane.js";
import { TerminalTabs } from "./components/TerminalTabs.js";
import { terminalTabsReducer } from "./state/terminalTabs.js";
import { createClientId } from "./utils/clientId.js";

function createTab(window: TmuxWindow, mode: TerminalMode): TerminalTab {
  return {
    tabId: createClientId(),
    title: `${window.sessionName}:${window.index} ${window.name}`,
    sessionName: window.sessionName,
    windowId: window.id,
    windowIndex: window.index,
    windowName: window.name,
    mode,
    status: "connecting",
    createdAt: Date.now()
  };
}

export function App() {
  const [sessions, setSessions] = useState<TmuxSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [filterText, setFilterText] = useState("");
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [writeConfirmed, setWriteConfirmed] = useState(false);
  const [tabsState, dispatchTabs] = useReducer(terminalTabsReducer, { tabs: [] });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const tree = await fetchTmuxTree();
      setSessions(tree.sessions);
      setExpandedSessions((current) => {
        const next = { ...current };
        for (const session of tree.sessions) {
          if (next[session.name] === undefined) {
            next[session.name] = true;
          }
        }
        return next;
      });
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to load tmux sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openConnection = (window: TmuxWindow, mode: TerminalMode) => {
    if (mode === "write" && !writeConfirmed) {
      const confirmed = globalThis.confirm("Writable mode sends keyboard input to the selected tmux window.");
      if (!confirmed) {
        return;
      }
      setWriteConfirmed(true);
    }
    dispatchTabs({ type: "open", tab: createTab(window, mode) });
  };

  const handleTabStatus = useCallback(
    (tabId: string, status: TerminalTab["status"], errorMessage?: string) => {
      dispatchTabs({ type: "status", tabId, status, errorMessage });
    },
    []
  );

  const activeTab = tabsState.tabs.find((tab) => tab.tabId === tabsState.activeTabId);

  return (
    <Layout
      sidebar={
        <SessionSidebar
          sessions={sessions}
          loading={loading}
          error={error}
          filterText={filterText}
          expandedSessions={expandedSessions}
          onFilterChange={setFilterText}
          onRefresh={() => void refresh()}
          onToggleSession={(name) =>
            setExpandedSessions((current) => ({ ...current, [name]: !(current[name] ?? true) }))
          }
          onConnect={openConnection}
        />
      }
      main={
        <>
          <TerminalTabs
            tabs={tabsState.tabs}
            activeTabId={tabsState.activeTabId}
            onActivate={(tabId) => dispatchTabs({ type: "activate", tabId })}
            onClose={(tabId) => dispatchTabs({ type: "close", tabId })}
          />
          <div className="terminal-area">
            {tabsState.tabs.length === 0 ? (
              <EmptyState title="No active terminal" detail="Select a tmux window from the sidebar." />
            ) : null}
            {tabsState.tabs.map((tab) => (
              <TerminalPane
                key={tab.tabId}
                tab={tab}
                active={tab.tabId === activeTab?.tabId}
                onStatus={handleTabStatus}
              />
            ))}
          </div>
        </>
      }
    />
  );
}

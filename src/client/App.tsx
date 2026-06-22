import { useCallback, useEffect, useReducer, useState } from "react";
import type { CommandAvailabilityResponse } from "../shared/commandAvailabilityTypes.js";
import type { AgentBrowserTab, DashboardTab, ResourceMonitorTab, TerminalMode, TerminalTab, TmuxSession, TmuxWindow, WebviewTab, WorkspaceTab } from "../shared/tmuxTypes.js";
import { fetchBotmuxDashboard } from "./api/botmuxApi.js";
import { fetchCommandAvailability } from "./api/commandAvailabilityApi.js";
import { fetchTmuxTree } from "./api/tmuxApi.js";
import { DashboardPane } from "./components/DashboardPane.js";
import { EmptyState } from "./components/EmptyState.js";
import { ResourceMonitorPane } from "./components/ResourceMonitorPane.js";
import { Layout } from "./components/Layout.js";
import { SessionSidebar } from "./components/SessionSidebar.js";
import { TerminalPane } from "./components/TerminalPane.js";
import { TerminalTabs } from "./components/TerminalTabs.js";
import { useMediaQuery } from "./hooks/useMediaQuery.js";
import { terminalTabsReducer } from "./state/terminalTabs.js";
import { createClientId } from "./utils/clientId.js";

const AGENT_BROWSER_MONITOR_URL = "http://localhost:4848";

const defaultCommandAvailability: CommandAvailabilityResponse["commands"] = {
  botmux: {
    command: "botmux",
    available: true,
    missingHint: "Install botmux to open Botmux Dashboard."
  },
  tmux: {
    command: "tmux",
    available: true,
    missingHint: "Install tmux to refresh sessions."
  },
  ps: {
    command: "ps",
    available: true,
    missingHint: "Install ps to open Resource Monitor."
  }
};

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

function createDashboardTab(url: string): DashboardTab {
  return {
    kind: "dashboard",
    tabId: createClientId(),
    title: "Botmux Dashboard",
    url,
    status: "connected",
    createdAt: Date.now(),
    reloadKey: 0
  };
}

function createAgentBrowserMonitorTab(): AgentBrowserTab {
  return {
    kind: "agentBrowser",
    tabId: createClientId(),
    title: "Agent Browser",
    url: AGENT_BROWSER_MONITOR_URL,
    status: "connected",
    createdAt: Date.now(),
    reloadKey: 0
  };
}

function createResourceMonitorTab(): ResourceMonitorTab {
  return {
    kind: "resourceMonitor",
    tabId: createClientId(),
    title: "Resource Monitor",
    status: "connected",
    createdAt: Date.now()
  };
}

function isDashboardTab(tab: WorkspaceTab): tab is DashboardTab {
  return "kind" in tab && tab.kind === "dashboard";
}

function isResourceMonitorTab(tab: WorkspaceTab): tab is ResourceMonitorTab {
  return "kind" in tab && tab.kind === "resourceMonitor";
}

function isWebviewTab(tab: WorkspaceTab): tab is WebviewTab {
  return "kind" in tab && (tab.kind === "dashboard" || tab.kind === "agentBrowser");
}

export function App() {
  const [sessions, setSessions] = useState<TmuxSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [filterText, setFilterText] = useState("");
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [writeConfirmed, setWriteConfirmed] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | undefined>();
  const [commandAvailability, setCommandAvailability] =
    useState<CommandAvailabilityResponse["commands"]>(defaultCommandAvailability);
  const [mobileWritableEnabled, setMobileWritableEnabled] = useState(false);
  const [tabsState, dispatchTabs] = useReducer(terminalTabsReducer, { tabs: [] });
  const isMobileLayout = useMediaQuery("(max-width: 760px)");
  const showWritableActions = !isMobileLayout || mobileWritableEnabled;

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

  useEffect(() => {
    let cancelled = false;

    async function loadCommandAvailability() {
      try {
        const availability = await fetchCommandAvailability();
        if (!cancelled) {
          setCommandAvailability(availability.commands);
        }
      } catch {
        if (!cancelled) {
          setCommandAvailability(defaultCommandAvailability);
        }
      }
    }

    void loadCommandAvailability();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const openDashboard = async () => {
    const existingDashboardTab = tabsState.tabs.find((tab) => "kind" in tab && tab.kind === "dashboard");
    if (existingDashboardTab) {
      dispatchTabs({ type: "activate", tabId: existingDashboardTab.tabId });
      return;
    }

    setDashboardLoading(true);
    setDashboardError(undefined);
    try {
      const dashboard = await fetchBotmuxDashboard();
      dispatchTabs({ type: "open", tab: createDashboardTab(dashboard.url), position: "start" });
    } catch (loadError) {
      setDashboardError(loadError instanceof Error ? loadError.message : "Unable to load botmux dashboard");
    } finally {
      setDashboardLoading(false);
    }
  };

  const openAgentBrowserMonitor = () => {
    dispatchTabs({ type: "open", tab: createAgentBrowserMonitorTab(), position: "start" });
  };

  const openResourceMonitor = () => {
    dispatchTabs({ type: "open", tab: createResourceMonitorTab(), position: "start" });
  };

  const handleTabStatus = useCallback(
    (tabId: string, status: TerminalTab["status"], errorMessage?: string) => {
      dispatchTabs({ type: "status", tabId, status, errorMessage });
    },
    []
  );

  const activeTab = tabsState.tabs.find((tab) => tab.tabId === tabsState.activeTabId);
  const dashboardOpen = tabsState.tabs.some(isDashboardTab);

  return (
    <Layout
      sidebar={
        <SessionSidebar
          sessions={sessions}
          loading={loading}
          error={error}
          filterText={filterText}
          expandedSessions={expandedSessions}
          dashboardLoading={dashboardLoading}
          dashboardError={dashboardError}
          dashboardOpen={dashboardOpen}
          commandAvailability={commandAvailability}
          mobileWritableEnabled={mobileWritableEnabled}
          showWritableActions={showWritableActions}
          onFilterChange={setFilterText}
          onRefresh={() => void refresh()}
          onOpenDashboard={() => void openDashboard()}
          onRefreshDashboard={() => dispatchTabs({ type: "refreshDashboard" })}
          onOpenResourceMonitor={openResourceMonitor}
          onOpenAgentBrowserMonitor={openAgentBrowserMonitor}
          onMobileWritableChange={setMobileWritableEnabled}
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
            onReorder={(sourceTabId, targetTabId) => dispatchTabs({ type: "reorder", sourceTabId, targetTabId })}
          />
          <div className="terminal-area">
            {tabsState.tabs.length === 0 ? (
              <EmptyState title="No active terminal" detail="Select a tmux window from the sidebar." />
            ) : null}
            {tabsState.tabs.map((tab) => (
              isWebviewTab(tab) ? (
                <DashboardPane key={tab.tabId} tab={tab} active={tab.tabId === activeTab?.tabId} />
              ) : isResourceMonitorTab(tab) ? (
                <ResourceMonitorPane key={tab.tabId} tab={tab} active={tab.tabId === activeTab?.tabId} />
              ) : (
                <TerminalPane
                  key={tab.tabId}
                  tab={tab}
                  active={tab.tabId === activeTab?.tabId}
                  onStatus={handleTabStatus}
                />
              )
            ))}
          </div>
        </>
      }
    />
  );
}

import { Activity, Keyboard, LayoutDashboard, LoaderCircle, Lock, Monitor, RefreshCw, Search, SquareTerminal, Unlock } from "lucide-react";
import { useState } from "react";
import type { CommandAvailabilityResponse, LocalCommandAvailability } from "../../shared/commandAvailabilityTypes.js";
import type { TerminalMode, TmuxSession, TmuxWindow } from "../../shared/tmuxTypes.js";
import { EmptyState } from "./EmptyState.js";
import { ExternalLinksGrid } from "./ExternalLinksGrid.js";
import { IconButton } from "./IconButton.js";
import { SessionGroup } from "./SessionGroup.js";

interface SessionSidebarProps {
  sessions: TmuxSession[];
  loading: boolean;
  error?: string;
  filterText: string;
  expandedSessions: Record<string, boolean>;
  dashboardLoading: boolean;
  dashboardError?: string;
  dashboardOpen: boolean;
  commandAvailability: CommandAvailabilityResponse["commands"];
  mobileWritableEnabled: boolean;
  showWritableActions: boolean;
  onFilterChange: (value: string) => void;
  onRefresh: () => void;
  onOpenDashboard: () => void;
  onRefreshDashboard: () => void;
  onOpenResourceMonitor: () => void;
  onOpenAgentBrowserMonitor: () => void;
  onMobileWritableChange: (enabled: boolean) => void;
  onToggleSession: (name: string) => void;
  onConnect: (window: TmuxWindow, mode: TerminalMode) => void;
}

export function SessionSidebar({
  sessions,
  loading,
  error,
  filterText,
  expandedSessions,
  dashboardLoading,
  dashboardError,
  dashboardOpen,
  commandAvailability,
  mobileWritableEnabled,
  showWritableActions,
  onFilterChange,
  onRefresh,
  onOpenDashboard,
  onRefreshDashboard,
  onOpenResourceMonitor,
  onOpenAgentBrowserMonitor,
  onMobileWritableChange,
  onToggleSession,
  onConnect
}: SessionSidebarProps) {
  const [externalLinksEditable, setExternalLinksEditable] = useState(false);
  const botmuxCommand = commandAvailability.botmux;
  const tmuxCommand = commandAvailability.tmux;
  const psCommand = commandAvailability.ps;
  const normalizedFilter = filterText.trim().toLowerCase();
  const filteredSessions = sessions
    .map((session) => ({
      ...session,
      windows: session.windows.filter(
        (window) =>
          !normalizedFilter ||
          session.name.toLowerCase().includes(normalizedFilter) ||
          window.name.toLowerCase().includes(normalizedFilter) ||
          String(window.index).includes(normalizedFilter)
      )
    }))
    .filter((session) => !normalizedFilter || session.name.toLowerCase().includes(normalizedFilter) || session.windows.length > 0);

  return (
    <>
      <div className="sidebar__top">
        <div className="sidebar__headline">
          <div className="app-title">
            <SquareTerminal aria-hidden="true" size={20} />
            <span>Tmux Web Console</span>
          </div>
          <div className="sidebar__tools">
            <label className="mobile-write-toggle" title="Show writable terminal buttons">
              <input
                aria-label="Show writable terminal buttons"
                role="switch"
                type="checkbox"
                checked={mobileWritableEnabled}
                onChange={(event) => onMobileWritableChange(event.currentTarget.checked)}
              />
              <span className="mobile-write-toggle__track">
                <span className="mobile-write-toggle__thumb" />
              </span>
              <Keyboard aria-hidden="true" size={15} />
            </label>
            <IconButton
              icon={externalLinksEditable ? Lock : Unlock}
              label={externalLinksEditable ? "Lock external link editing" : "Unlock external link editing"}
              onClick={() => setExternalLinksEditable((current) => !current)}
              variant={externalLinksEditable ? "primary" : "ghost"}
            />
            <IconButton
              icon={RefreshCw}
              label="Refresh tmux sessions"
              title={commandHint(tmuxCommand, "Refresh tmux sessions")}
              onClick={onRefresh}
              disabled={loading || !tmuxCommand.available}
            />
          </div>
        </div>
        <div className="dashboard-actions">
          <button
            className={`dashboard-button${botmuxCommand.available ? "" : " dashboard-button--unavailable"}`}
            type="button"
            title={commandHint(botmuxCommand, "Botmux Dashboard")}
            onClick={onOpenDashboard}
            disabled={dashboardLoading || !botmuxCommand.available}
          >
            {dashboardLoading ? (
              <LoaderCircle aria-hidden="true" className="spin" size={16} />
            ) : (
              <LayoutDashboard aria-hidden="true" size={16} />
            )}
            <span>Botmux Dashboard</span>
          </button>
          <IconButton
            icon={RefreshCw}
            label="Refresh Botmux Dashboard tab"
            onClick={onRefreshDashboard}
            disabled={!dashboardOpen}
          />
          <button
            className={`dashboard-button dashboard-button--wide${psCommand.available ? "" : " dashboard-button--unavailable"}`}
            type="button"
            title={commandHint(psCommand, "Resource Monitor")}
            onClick={onOpenResourceMonitor}
            disabled={!psCommand.available}
          >
            <Activity aria-hidden="true" size={16} />
            <span>Resource Monitor</span>
          </button>
          <button className="dashboard-button dashboard-button--wide" type="button" onClick={onOpenAgentBrowserMonitor}>
            <Monitor aria-hidden="true" size={16} />
            <span>Agent Browser</span>
          </button>
        </div>
        <ExternalLinksGrid editable={externalLinksEditable} />
      </div>
      <label className="search-box">
        <Search aria-hidden="true" size={16} />
        <input
          aria-label="Search sessions and windows"
          value={filterText}
          placeholder="Search"
          onChange={(event) => onFilterChange(event.target.value)}
        />
      </label>
      <div className="sidebar__content">
        {dashboardError ? <div className="sidebar-error">{dashboardError}</div> : null}
        {error ? <div className="sidebar-error">{error}</div> : null}
        {!error && !loading && filteredSessions.length === 0 ? (
          <EmptyState kind="sessions" title="No tmux sessions" detail="No matching sessions or windows." />
        ) : null}
        {filteredSessions.map((session) => (
          <SessionGroup
            key={session.name}
            session={session}
            expanded={expandedSessions[session.name] ?? true}
            onToggle={() => onToggleSession(session.name)}
            onConnect={onConnect}
            showWritableActions={showWritableActions}
          />
        ))}
      </div>
    </>
  );
}

function commandHint(command: LocalCommandAvailability, fallback: string): string {
  return command.available ? fallback : command.missingHint;
}

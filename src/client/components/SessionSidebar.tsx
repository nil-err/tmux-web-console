import { RefreshCw, Search, SquareTerminal } from "lucide-react";
import type { TerminalMode, TmuxSession, TmuxWindow } from "../../shared/tmuxTypes.js";
import { EmptyState } from "./EmptyState.js";
import { IconButton } from "./IconButton.js";
import { SessionGroup } from "./SessionGroup.js";

interface SessionSidebarProps {
  sessions: TmuxSession[];
  loading: boolean;
  error?: string;
  filterText: string;
  expandedSessions: Record<string, boolean>;
  onFilterChange: (value: string) => void;
  onRefresh: () => void;
  onToggleSession: (name: string) => void;
  onConnect: (window: TmuxWindow, mode: TerminalMode) => void;
}

export function SessionSidebar({
  sessions,
  loading,
  error,
  filterText,
  expandedSessions,
  onFilterChange,
  onRefresh,
  onToggleSession,
  onConnect
}: SessionSidebarProps) {
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
        <div className="app-title">
          <SquareTerminal aria-hidden="true" size={20} />
          <span>Tmux Web Console</span>
        </div>
        <IconButton icon={RefreshCw} label="Refresh tmux sessions" onClick={onRefresh} disabled={loading} />
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
          />
        ))}
      </div>
    </>
  );
}

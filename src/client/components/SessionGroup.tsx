import { ChevronDown, ChevronRight, Link, Server, Unlink } from "lucide-react";
import type { TerminalMode, TmuxSession, TmuxWindow } from "../../shared/tmuxTypes.js";
import { WindowRow } from "./WindowRow.js";

interface SessionGroupProps {
  session: TmuxSession;
  expanded: boolean;
  onToggle: () => void;
  onConnect: (window: TmuxWindow, mode: TerminalMode) => void;
  showWritableActions: boolean;
}

export function SessionGroup({ session, expanded, onToggle, onConnect, showWritableActions }: SessionGroupProps) {
  const ToggleIcon = expanded ? ChevronDown : ChevronRight;
  const AttachIcon = session.attachedCount > 0 ? Link : Unlink;

  return (
    <section className="session-group">
      <button className="session-group__header" type="button" onClick={onToggle}>
        <ToggleIcon aria-hidden="true" size={16} />
        <Server aria-hidden="true" size={16} />
        <span className="session-group__name" title={session.name}>
          {session.name}
        </span>
        <span className="session-group__count">{session.windows.length}</span>
        <AttachIcon aria-label={session.attachedCount > 0 ? "attached" : "not attached"} size={15} />
      </button>
      {expanded ? (
        <div className="session-group__windows">
          {session.windows.map((window) => (
            <WindowRow
              key={window.id}
              window={window}
              showWritableAction={showWritableActions}
              onConnect={(mode) => onConnect(window, mode)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

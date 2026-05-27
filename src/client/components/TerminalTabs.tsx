import { Activity, AlertTriangle, LoaderCircle, Lock, Power, Unlock, X } from "lucide-react";
import type { TerminalTab } from "../../shared/tmuxTypes.js";

interface TerminalTabsProps {
  tabs: TerminalTab[];
  activeTabId?: string;
  onActivate: (tabId: string) => void;
  onClose: (tabId: string) => void;
}

function StatusIcon({ tab }: { tab: TerminalTab }) {
  if (tab.status === "connecting") {
    return <LoaderCircle aria-label="connecting" className="spin" size={15} />;
  }
  if (tab.status === "error") {
    return <AlertTriangle aria-label="error" size={15} />;
  }
  if (tab.status === "exited") {
    return <Power aria-label="exited" size={15} />;
  }
  return <Activity aria-label="connected" size={15} />;
}

export function TerminalTabs({ tabs, activeTabId, onActivate, onClose }: TerminalTabsProps) {
  return (
    <div className="tabs-bar" role="tablist">
      {tabs.map((tab) => {
        const ModeIcon = tab.mode === "readonly" ? Lock : Unlock;
        return (
          <button
            key={tab.tabId}
            className={`tab ${tab.tabId === activeTabId ? "tab--active" : ""} tab--${tab.status}`}
            role="tab"
            type="button"
            aria-selected={tab.tabId === activeTabId}
            onClick={() => onActivate(tab.tabId)}
          >
            <StatusIcon tab={tab} />
            <span className="tab__title" title={tab.title}>
              {tab.title}
            </span>
            <ModeIcon aria-label={tab.mode === "readonly" ? "readonly" : "writable"} size={14} />
            <span
              className="tab__close"
              role="button"
              tabIndex={0}
              title="Close connection"
              aria-label="Close connection"
              onClick={(event) => {
                event.stopPropagation();
                onClose(tab.tabId);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  onClose(tab.tabId);
                }
              }}
            >
              <X aria-hidden="true" size={14} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

import { useState } from "react";
import { Activity, AlertTriangle, LayoutDashboard, LoaderCircle, Lock, Monitor, Pin, Power, Unlock, X } from "lucide-react";
import type { TerminalTab, WorkspaceTab } from "../../shared/tmuxTypes.js";

interface TerminalTabsProps {
  tabs: WorkspaceTab[];
  activeTabId?: string;
  onActivate: (tabId: string) => void;
  onClose: (tabId: string) => void;
  onReorder: (sourceTabId: string, targetTabId: string) => void;
}

function isFixedTab(tab: WorkspaceTab) {
  return "kind" in tab;
}

function StatusIcon({ tab }: { tab: WorkspaceTab }) {
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

function TabKindIcon({ tab }: { tab: WorkspaceTab }) {
  if ("kind" in tab && tab.kind === "dashboard") {
    return <LayoutDashboard aria-label="dashboard" size={14} />;
  }
  if ("kind" in tab && tab.kind === "agentBrowser") {
    return <Monitor aria-label="agent browser" size={14} />;
  }
  if ("kind" in tab && tab.kind === "resourceMonitor") {
    return <Activity aria-label="resource monitor" size={14} />;
  }

  const terminalTab = tab as TerminalTab;
  const ModeIcon = terminalTab.mode === "readonly" ? Lock : Unlock;
  return <ModeIcon aria-label={terminalTab.mode === "readonly" ? "readonly" : "writable"} size={14} />;
}

export function TerminalTabs({ tabs, activeTabId, onActivate, onClose, onReorder }: TerminalTabsProps) {
  const [draggingTabId, setDraggingTabId] = useState<string | undefined>();

  return (
    <div className="tabs-bar" role="tablist">
      {tabs.map((tab) => {
        const fixed = isFixedTab(tab);
        const dragging = draggingTabId === tab.tabId;
        return (
          <button
            key={tab.tabId}
            className={`tab ${tab.tabId === activeTabId ? "tab--active" : ""} ${fixed ? "tab--fixed" : ""} ${dragging ? "tab--dragging" : ""} tab--${tab.status}`}
            role="tab"
            type="button"
            draggable={!fixed}
            aria-selected={tab.tabId === activeTabId}
            onClick={() => onActivate(tab.tabId)}
            onDragStart={(event) => {
              if (fixed) {
                event.preventDefault();
                return;
              }
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", tab.tabId);
              setDraggingTabId(tab.tabId);
            }}
            onDragEnd={() => setDraggingTabId(undefined)}
            onDragOver={(event) => {
              if (!fixed && draggingTabId && draggingTabId !== tab.tabId) {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }
            }}
            onDrop={(event) => {
              if (fixed) {
                return;
              }
              const sourceTabId = event.dataTransfer.getData("text/plain") || draggingTabId;
              if (sourceTabId && sourceTabId !== tab.tabId) {
                event.preventDefault();
                onReorder(sourceTabId, tab.tabId);
              }
              setDraggingTabId(undefined);
            }}
          >
            <StatusIcon tab={tab} />
            <span className="tab__title" title={tab.title}>
              {tab.title}
            </span>
            <TabKindIcon tab={tab} />
            {fixed ? <Pin aria-label="fixed tab" className="tab__pin" size={12} /> : <span className="tab__pin-placeholder" aria-hidden="true" />}
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

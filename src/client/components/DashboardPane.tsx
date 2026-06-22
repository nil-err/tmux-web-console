import type { WebviewTab } from "../../shared/tmuxTypes.js";

interface DashboardPaneProps {
  tab: WebviewTab;
  active: boolean;
}

export function DashboardPane({ tab, active }: DashboardPaneProps) {
  return (
    <div className={`webview-pane ${active ? "webview-pane--active" : ""}`} aria-hidden={!active}>
      <iframe key={tab.reloadKey} className="webview-pane__frame" src={tab.url} title={tab.title} />
      {tab.errorMessage ? <div className="terminal-overlay terminal-overlay--error">{tab.errorMessage}</div> : null}
    </div>
  );
}

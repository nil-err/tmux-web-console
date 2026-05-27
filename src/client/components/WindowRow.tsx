import { Circle, CircleDot, Columns2, Copy, Eye, Keyboard, Terminal } from "lucide-react";
import { useState } from "react";
import type { TerminalMode, TmuxWindow } from "../../shared/tmuxTypes.js";
import { copyText } from "../utils/clipboard.js";
import { IconButton } from "./IconButton.js";

interface WindowRowProps {
  window: TmuxWindow;
  onConnect: (mode: TerminalMode) => void;
}

export function WindowRow({ window, onConnect }: WindowRowProps) {
  const StatusIcon = window.active ? CircleDot : Circle;
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const handleCopy = async () => {
    const ok = await copyText(`${window.sessionName}:${window.index}`);
    setCopyState(ok ? "copied" : "failed");
    globalThis.setTimeout(() => setCopyState("idle"), 1400);
  };

  return (
    <div className="window-row">
      <div className="window-row__meta">
        <Terminal aria-hidden="true" className="window-row__icon" size={16} />
        <StatusIcon aria-label={window.active ? "active window" : "inactive window"} size={13} />
        <span className="window-row__index">{window.index}</span>
        <span className="window-row__name" title={window.name}>
          {window.name}
        </span>
        {window.paneCount > 1 ? (
          <span className="window-row__pane" title={`${window.paneCount} panes`}>
            <Columns2 aria-hidden="true" size={14} />
            {window.paneCount}
          </span>
        ) : null}
      </div>
      <div className="window-row__actions">
        {copyState !== "idle" ? <span className={`window-row__copy-state window-row__copy-state--${copyState}`}>{copyState === "copied" ? "Copied" : "Copy failed"}</span> : null}
        <IconButton icon={Copy} label="Copy tmux target" onClick={() => void handleCopy()} />
        <IconButton icon={Eye} label="Open readonly" onClick={() => onConnect("readonly")} />
        <IconButton icon={Keyboard} label="Open writable" variant="primary" onClick={() => onConnect("write")} />
      </div>
    </div>
  );
}

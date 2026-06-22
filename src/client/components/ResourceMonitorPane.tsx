import { Activity, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ResourceMonitorTab } from "../../shared/tmuxTypes.js";
import type { ProcessResourceSnapshot, SystemResourceSnapshot } from "../../shared/systemResourceTypes.js";
import { fetchSystemResources } from "../api/systemResourceApi.js";

interface ResourceMonitorPaneProps {
  tab: ResourceMonitorTab;
  active: boolean;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatBytes(bytes: number): string {
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function ResourceBar({ value }: { value: number }) {
  return (
    <div className="resource-bar" aria-hidden="true">
      <div className="resource-bar__fill" style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
    </div>
  );
}

function MetricTile({ label, value, detail, percentValue }: { label: string; value: string; detail: string; percentValue?: number }) {
  return (
    <section className="resource-tile">
      <div className="resource-tile__label">{label}</div>
      <div className="resource-tile__value">{value}</div>
      <div className="resource-tile__detail">{detail}</div>
      {percentValue === undefined ? null : <ResourceBar value={percentValue} />}
    </section>
  );
}

function ProcessRow({ process }: { process: ProcessResourceSnapshot }) {
  return (
    <tr>
      <td className="resource-table__mono">{process.pid}</td>
      <td>{formatPercent(process.cpuPercent)}</td>
      <td>{formatPercent(process.memoryPercent)}</td>
      <td>{formatBytes(process.rssBytes)}</td>
      <td className="resource-table__command" title={process.command}>
        {process.command}
      </td>
    </tr>
  );
}

export function ResourceMonitorPane({ tab, active }: ResourceMonitorPaneProps) {
  const [snapshot, setSnapshot] = useState<SystemResourceSnapshot | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(tab.errorMessage);

  const loadResources = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setSnapshot(await fetchSystemResources());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load resource usage");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    let cancelled = false;
    const loadIfMounted = async () => {
      if (!cancelled) {
        await loadResources();
      }
    };
    void loadIfMounted();
    const interval = window.setInterval(() => void loadIfMounted(), 3000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [active, loadResources]);

  return (
    <div className={`resource-monitor ${active ? "resource-monitor--active" : ""}`} aria-hidden={!active}>
      <div className="resource-monitor__header">
        <div className="resource-monitor__title">
          <Activity aria-hidden="true" size={20} />
          <div>
            <div className="resource-monitor__name">{tab.title}</div>
            <div className="resource-monitor__host">
              {snapshot ? `${snapshot.hostname} · ${snapshot.platform}` : "Loading"}
            </div>
          </div>
        </div>
        <button className="resource-monitor__refresh" type="button" onClick={() => void loadResources()} disabled={loading}>
          <RefreshCw aria-hidden="true" className={loading ? "spin" : ""} size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {snapshot ? (
        <>
          <div className="resource-grid">
            <MetricTile
              label="CPU"
              value={formatPercent(snapshot.cpu.loadPercent)}
              detail={`${snapshot.cpu.cores} cores · load ${snapshot.cpu.loadAverage.join(" ")}`}
              percentValue={snapshot.cpu.loadPercent}
            />
            <MetricTile
              label="Memory"
              value={formatPercent(snapshot.memory.usedPercent)}
              detail={`${formatBytes(snapshot.memory.usedBytes)} / ${formatBytes(snapshot.memory.totalBytes)}`}
              percentValue={snapshot.memory.usedPercent}
            />
            <MetricTile label="Uptime" value={formatUptime(snapshot.uptimeSeconds)} detail={snapshot.hostname} />
            <MetricTile label="Updated" value={new Date(snapshot.sampledAt).toLocaleTimeString()} detail={snapshot.sampledAt} />
          </div>

          <section className="resource-processes">
            <div className="resource-section-title">Processes</div>
            <div className="resource-table-wrap">
              <table className="resource-table">
                <thead>
                  <tr>
                    <th>PID</th>
                    <th>CPU</th>
                    <th>MEM</th>
                    <th>RSS</th>
                    <th>Command</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.processes.map((process) => (
                    <ProcessRow key={`${process.pid}-${process.command}`} process={process} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <div className="resource-monitor__loading">Loading</div>
      )}

      {error ? <div className="terminal-overlay terminal-overlay--error">{error}</div> : null}
    </div>
  );
}

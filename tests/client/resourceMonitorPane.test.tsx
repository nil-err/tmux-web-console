// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResourceMonitorPane } from "../../src/client/components/ResourceMonitorPane.js";
import type { ResourceMonitorTab } from "../../src/shared/tmuxTypes.js";

const tab: ResourceMonitorTab = {
  kind: "resourceMonitor",
  tabId: "resource-monitor-1",
  title: "Resource Monitor",
  status: "connected",
  createdAt: 1000
};

describe("ResourceMonitorPane", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders host resource usage and top processes", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        sampledAt: "2026-06-17T12:00:00.000Z",
        hostname: "devbox",
        platform: "linux",
        uptimeSeconds: 3661,
        cpu: {
          cores: 8,
          loadAverage: [2, 1, 0.5],
          loadPercent: 25
        },
        memory: {
          totalBytes: 16 * 1024 ** 3,
          freeBytes: 4 * 1024 ** 3,
          usedBytes: 12 * 1024 ** 3,
          usedPercent: 75
        },
        processes: [
          {
            pid: 100,
            ppid: 1,
            cpuPercent: 25.5,
            memoryPercent: 10,
            rssBytes: 512 * 1024 ** 2,
            command: "node server.js"
          }
        ]
      })
    } as Response);

    render(<ResourceMonitorPane tab={tab} active={true} />);

    await waitFor(() => expect(screen.getByText("devbox")).not.toBeNull());
    expect(screen.getByText("25.0%")).not.toBeNull();
    expect(screen.getByText("75.0%")).not.toBeNull();
    expect(screen.getByText("node server.js")).not.toBeNull();
    expect(screen.getByText("512.0 MiB")).not.toBeNull();
  });
});

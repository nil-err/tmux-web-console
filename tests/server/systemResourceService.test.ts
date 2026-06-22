import { describe, expect, it } from "vitest";
import { SystemResourceService } from "../../src/server/system/systemResourceService.js";

describe("SystemResourceService", () => {
  it("returns CPU, memory, and top process usage from the host", async () => {
    const service = new SystemResourceService({
      now: () => new Date("2026-06-17T12:00:00Z"),
      system: {
        hostname: () => "devbox",
        platform: () => "linux",
        uptime: () => 3661,
        cpus: () => [{ model: "cpu0" }, { model: "cpu1" }],
        loadavg: () => [1.25, 0.75, 0.5],
        totalmem: () => 16_000,
        freemem: () => 4_000
      },
      runner: async () => ({
        stdout: [
          " 99 1 200.0 0.0 128 ps -eo pid=,ppid=,pcpu=,pmem=,rss=,args=",
          " 100 1 25.5 10.0 2048 node server.js",
          " 200 1 3.2 1.5 1024 tmux",
          "bad line"
        ].join("\n"),
        stderr: ""
      })
    });

    await expect(service.getSnapshot()).resolves.toEqual({
      sampledAt: "2026-06-17T12:00:00.000Z",
      hostname: "devbox",
      platform: "linux",
      uptimeSeconds: 3661,
      cpu: {
        cores: 2,
        loadAverage: [1.25, 0.75, 0.5],
        loadPercent: 62.5
      },
      memory: {
        totalBytes: 16_000,
        freeBytes: 4_000,
        usedBytes: 12_000,
        usedPercent: 75
      },
      processes: [
        {
          pid: 100,
          ppid: 1,
          cpuPercent: 25.5,
          memoryPercent: 10,
          rssBytes: 2_097_152,
          command: "node server.js"
        },
        {
          pid: 200,
          ppid: 1,
          cpuPercent: 3.2,
          memoryPercent: 1.5,
          rssBytes: 1_048_576,
          command: "tmux"
        }
      ]
    });
  });
});

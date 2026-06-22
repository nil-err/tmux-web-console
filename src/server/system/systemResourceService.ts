import { execFile } from "node:child_process";
import os from "node:os";
import { promisify } from "node:util";
import type { ProcessResourceSnapshot, SystemResourceSnapshot } from "../../shared/systemResourceTypes.js";

export interface CommandRunner {
  (command: string, args: string[]): Promise<{ stdout: string; stderr: string }>;
}

interface SystemInfoProvider {
  hostname(): string;
  platform(): string;
  uptime(): number;
  cpus(): readonly unknown[];
  loadavg(): number[];
  totalmem(): number;
  freemem(): number;
}

interface SystemResourceServiceOptions {
  runner?: CommandRunner;
  system?: SystemInfoProvider;
  now?: () => Date;
  processLimit?: number;
}

const execFileAsync = promisify(execFile);

const defaultRunner: CommandRunner = async (command, args) => {
  const { stdout, stderr } = await execFileAsync(command, args, {
    timeout: 5000,
    maxBuffer: 1024 * 1024
  });
  return {
    stdout: String(stdout),
    stderr: String(stderr)
  };
};

function round(value: number, precision = 1): number {
  return Number(value.toFixed(precision));
}

function percent(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }
  return round((numerator / denominator) * 100);
}

function parseProcessLine(line: string): ProcessResourceSnapshot | undefined {
  const match = line.trim().match(/^(\d+)\s+(\d+)\s+([0-9.]+)\s+([0-9.]+)\s+(\d+)\s+(.+)$/);
  if (!match) {
    return undefined;
  }

  const [, pid, ppid, cpuPercent, memoryPercent, rssKiB, command] = match;
  return {
    pid: Number(pid),
    ppid: Number(ppid),
    cpuPercent: round(Number(cpuPercent)),
    memoryPercent: round(Number(memoryPercent)),
    rssBytes: Number(rssKiB) * 1024,
    command
  };
}

export function parseProcessList(stdout: string, limit: number): ProcessResourceSnapshot[] {
  return stdout
    .split("\n")
    .map(parseProcessLine)
    .filter((process): process is ProcessResourceSnapshot => Boolean(process))
    .filter((process) => !process.command.startsWith("ps -eo pid=,ppid=,pcpu=,pmem=,rss=,args="))
    .sort((left, right) => right.cpuPercent - left.cpuPercent || right.memoryPercent - left.memoryPercent)
    .slice(0, limit);
}

export class SystemResourceService {
  private readonly runner: CommandRunner;
  private readonly system: SystemInfoProvider;
  private readonly now: () => Date;
  private readonly processLimit: number;

  constructor(options: SystemResourceServiceOptions = {}) {
    this.runner = options.runner ?? defaultRunner;
    this.system = options.system ?? os;
    this.now = options.now ?? (() => new Date());
    this.processLimit = options.processLimit ?? 24;
  }

  async getSnapshot(): Promise<SystemResourceSnapshot> {
    const cores = Math.max(this.system.cpus().length, 1);
    const [oneMinute = 0, fiveMinute = 0, fifteenMinute = 0] = this.system.loadavg();
    const totalBytes = this.system.totalmem();
    const freeBytes = this.system.freemem();
    const usedBytes = Math.max(totalBytes - freeBytes, 0);
    const { stdout } = await this.runner("ps", ["-eo", "pid=,ppid=,pcpu=,pmem=,rss=,args="]);

    return {
      sampledAt: this.now().toISOString(),
      hostname: this.system.hostname(),
      platform: this.system.platform(),
      uptimeSeconds: Math.floor(this.system.uptime()),
      cpu: {
        cores,
        loadAverage: [round(oneMinute, 2), round(fiveMinute, 2), round(fifteenMinute, 2)],
        loadPercent: percent(oneMinute, cores)
      },
      memory: {
        totalBytes,
        freeBytes,
        usedBytes,
        usedPercent: percent(usedBytes, totalBytes)
      },
      processes: parseProcessList(stdout, this.processLimit)
    };
  }
}

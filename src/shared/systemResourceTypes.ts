export interface CpuResourceSnapshot {
  cores: number;
  loadAverage: [number, number, number];
  loadPercent: number;
}

export interface MemoryResourceSnapshot {
  totalBytes: number;
  freeBytes: number;
  usedBytes: number;
  usedPercent: number;
}

export interface ProcessResourceSnapshot {
  pid: number;
  ppid: number;
  cpuPercent: number;
  memoryPercent: number;
  rssBytes: number;
  command: string;
}

export interface SystemResourceSnapshot {
  sampledAt: string;
  hostname: string;
  platform: string;
  uptimeSeconds: number;
  cpu: CpuResourceSnapshot;
  memory: MemoryResourceSnapshot;
  processes: ProcessResourceSnapshot[];
}

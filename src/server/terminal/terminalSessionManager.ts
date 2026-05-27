import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import type { IPty, IPtyForkOptions } from "node-pty";
import * as pty from "node-pty";
import type { TerminalMode, TmuxWindow } from "../../shared/tmuxTypes.js";
import { serverConfig } from "../config.js";

export interface Disposable {
  dispose(): void;
}

export interface PtyProcess {
  onData(callback: (data: string) => void): Disposable;
  onExit(callback: (event: { exitCode: number; signal?: number }) => void): Disposable;
  write(data: string): void;
  resize(cols: number, rows: number): void;
  kill(): void;
}

export type PtySpawn = (file: string, args: string[], options: IPtyForkOptions) => PtyProcess;

export interface TerminalTmuxService {
  assertWindowTarget(sessionName: string, windowId: string): Promise<TmuxWindow>;
  createGroupedSession(sourceSession: string): Promise<string>;
  selectWindow(tempSession: string, windowIndex: number): Promise<void>;
  killSession(sessionName: string): Promise<void>;
}

export interface CreateTerminalSessionInput {
  sessionName: string;
  windowId: string;
  mode: TerminalMode;
  cols?: number;
  rows?: number;
}

export interface TerminalSessionManagerOptions {
  tmuxService: TerminalTmuxService;
  ptySpawn?: PtySpawn;
  idFactory?: () => string;
  defaultCols?: number;
  defaultRows?: number;
  maxConnections?: number;
}

export interface ExitEvent {
  exitCode: number | null;
  signal: string | null;
}

type TerminalSessionEvents = {
  output: [string];
  exit: [ExitEvent];
};

class TypedEmitter extends EventEmitter {
  emit<K extends keyof TerminalSessionEvents>(event: K, ...args: TerminalSessionEvents[K]): boolean {
    return super.emit(event, ...args);
  }

  on<K extends keyof TerminalSessionEvents>(event: K, listener: (...args: TerminalSessionEvents[K]) => void): this {
    return super.on(event, listener);
  }
}

function defaultPtySpawn(file: string, args: string[], options: IPtyForkOptions): PtyProcess {
  return pty.spawn(file, args, options) as IPty;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, Math.floor(value)));
}

export class TerminalSession {
  private readonly emitter = new TypedEmitter();
  private readonly disposables: Disposable[];
  private closed = false;

  constructor(
    public readonly connectionId: string,
    public readonly mode: TerminalMode,
    public readonly tempSession: string,
    private readonly process: PtyProcess
  ) {
    this.disposables = [
      this.process.onData((data) => this.emitter.emit("output", data)),
      this.process.onExit((event) => {
        this.closed = true;
        this.emitter.emit("exit", {
          exitCode: event.exitCode ?? null,
          signal: event.signal === undefined ? null : String(event.signal)
        });
      })
    ];
  }

  onOutput(callback: (data: string) => void): void {
    this.emitter.on("output", callback);
  }

  onExit(callback: (event: ExitEvent) => void): void {
    this.emitter.on("exit", callback);
  }

  write(data: string): void {
    if (this.mode === "write" && !this.closed) {
      this.process.write(data);
    }
  }

  resize(cols: number, rows: number): void {
    if (!this.closed) {
      this.process.resize(clamp(cols, 20, 300), clamp(rows, 5, 120));
    }
  }

  kill(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.process.kill();
  }
}

export class TerminalSessionManager {
  private readonly sessions = new Map<string, TerminalSession>();
  private readonly tmuxService: TerminalTmuxService;
  private readonly ptySpawn: PtySpawn;
  private readonly idFactory: () => string;
  private readonly defaultCols: number;
  private readonly defaultRows: number;
  private readonly maxConnections: number;

  constructor(options: TerminalSessionManagerOptions) {
    this.tmuxService = options.tmuxService;
    this.ptySpawn = options.ptySpawn ?? defaultPtySpawn;
    this.idFactory = options.idFactory ?? (() => randomUUID());
    this.defaultCols = options.defaultCols ?? serverConfig.ptyDefaultCols;
    this.defaultRows = options.defaultRows ?? serverConfig.ptyDefaultRows;
    this.maxConnections = options.maxConnections ?? serverConfig.maxConnections;
  }

  async create(input: CreateTerminalSessionInput): Promise<TerminalSession> {
    if (this.sessions.size >= this.maxConnections) {
      throw new Error("maximum terminal connection count reached");
    }

    const target = await this.tmuxService.assertWindowTarget(input.sessionName, input.windowId);
    const tempSession = await this.tmuxService.createGroupedSession(input.sessionName);
    await this.tmuxService.selectWindow(tempSession, target.index);

    const args =
      input.mode === "readonly"
        ? ["attach-session", "-r", "-t", tempSession]
        : ["attach-session", "-t", tempSession];
    const ptyProcess = this.ptySpawn("tmux", args, {
      name: "xterm-256color",
      cols: input.cols ?? this.defaultCols,
      rows: input.rows ?? this.defaultRows,
      cwd: process.cwd(),
      env: process.env
    });
    const session = new TerminalSession(this.idFactory(), input.mode, tempSession, ptyProcess);
    this.sessions.set(session.connectionId, session);
    session.onExit(() => {
      this.sessions.delete(session.connectionId);
      void this.tmuxService.killSession(tempSession).catch(() => undefined);
    });
    return session;
  }

  get(connectionId: string): TerminalSession | undefined {
    return this.sessions.get(connectionId);
  }

  async close(connectionId: string, _reason: string): Promise<void> {
    const session = this.sessions.get(connectionId);
    if (!session) {
      return;
    }
    this.sessions.delete(connectionId);
    session.kill();
    await this.tmuxService.killSession(session.tempSession).catch(() => undefined);
  }

  async closeAll(reason: string): Promise<void> {
    await Promise.all([...this.sessions.keys()].map((connectionId) => this.close(connectionId, reason)));
  }
}

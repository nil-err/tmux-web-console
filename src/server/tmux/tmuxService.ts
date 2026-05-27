import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import type { TmuxTree, TmuxWindow } from "../../shared/tmuxTypes.js";
import { serverConfig } from "../config.js";
import { AppError } from "../utils/errors.js";
import { buildTmuxTree, parseSessionRows, parseWindowRows } from "./tmuxParser.js";

const execFileAsync = promisify(execFile);

export interface CommandResult {
  stdout: string;
  stderr: string;
}

export type CommandRunner = (command: string, args: string[], options?: { timeout?: number }) => Promise<CommandResult>;

export interface TmuxServiceOptions {
  runner?: CommandRunner;
  idFactory?: () => string;
  commandTimeoutMs?: number;
  tempSessionPrefix?: string;
}

const sessionFormat = "#{session_name}\t#{session_created}\t#{session_attached}\t#{session_windows}";
const windowFormat = "#{session_name}\t#{window_id}\t#{window_index}\t#{window_name}\t#{window_active}\t#{window_panes}\t#{window_flags}";

function isNoServerError(error: unknown): boolean {
  const value = error as { stderr?: string; message?: string };
  return `${value.stderr ?? ""}\n${value.message ?? ""}`.includes("no server running");
}

async function defaultRunner(command: string, args: string[], options?: { timeout?: number }): Promise<CommandResult> {
  const result = await execFileAsync(command, args, {
    timeout: options?.timeout ?? serverConfig.tmuxCommandTimeoutMs,
    encoding: "utf8"
  });
  return {
    stdout: result.stdout,
    stderr: result.stderr
  };
}

export class TmuxService {
  private readonly runner: CommandRunner;
  private readonly idFactory: () => string;
  private readonly commandTimeoutMs: number;
  private readonly tempSessionPrefix: string;

  constructor(options: TmuxServiceOptions = {}) {
    this.runner = options.runner ?? defaultRunner;
    this.idFactory = options.idFactory ?? (() => randomUUID().replaceAll("-", "").slice(0, 8));
    this.commandTimeoutMs = options.commandTimeoutMs ?? serverConfig.tmuxCommandTimeoutMs;
    this.tempSessionPrefix = options.tempSessionPrefix ?? serverConfig.tempSessionPrefix;
  }

  async getVersion(): Promise<string> {
    try {
      const result = await this.run(["-V"]);
      return result.stdout.trim();
    } catch {
      throw new AppError("TMUX_UNAVAILABLE", "tmux command is not available", 503);
    }
  }

  async getTree(): Promise<TmuxTree> {
    try {
      const sessionsResult = await this.run(["list-sessions", "-F", sessionFormat]);
      const windowsResult = await this.run(["list-windows", "-a", "-F", windowFormat]);
      return buildTmuxTree(parseSessionRows(sessionsResult.stdout), parseWindowRows(windowsResult.stdout));
    } catch (error) {
      if (isNoServerError(error)) {
        return { sessions: [] };
      }
      throw new AppError("TMUX_TREE_FAILED", "Unable to read tmux sessions", 500);
    }
  }

  async assertWindowTarget(sessionName: string, windowId: string): Promise<TmuxWindow> {
    const tree = await this.getTree();
    const session = tree.sessions.find((candidate) => candidate.name === sessionName);
    const window = session?.windows.find((candidate) => candidate.id === windowId);
    if (!window) {
      throw new AppError("TARGET_NOT_FOUND", "tmux window target was not found", 404);
    }
    return window;
  }

  async createGroupedSession(sourceSession: string): Promise<string> {
    const tempSession = `${this.tempSessionPrefix}${this.idFactory()}`;
    await this.run(["new-session", "-d", "-t", sourceSession, "-s", tempSession]);
    return tempSession;
  }

  async selectWindow(tempSession: string, windowIndex: number): Promise<void> {
    await this.run(["select-window", "-t", `${tempSession}:${windowIndex}`]);
  }

  async killSession(sessionName: string): Promise<void> {
    await this.run(["kill-session", "-t", sessionName]);
  }

  private run(args: string[]): Promise<CommandResult> {
    return this.runner("tmux", args, { timeout: this.commandTimeoutMs });
  }
}

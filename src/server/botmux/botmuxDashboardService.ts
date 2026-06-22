import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { BotmuxDashboardResponse } from "../../shared/botmuxTypes.js";
import { AppError } from "../utils/errors.js";

const execFileAsync = promisify(execFile);
const dashboardUrlPattern = /https?:\/\/\S+/;

export interface BotmuxCommandResult {
  stdout: string;
  stderr: string;
}

export type BotmuxCommandRunner = (
  command: string,
  args: string[],
  options?: { timeout?: number }
) => Promise<BotmuxCommandResult>;

export interface BotmuxDashboardServiceOptions {
  runner?: BotmuxCommandRunner;
  commandTimeoutMs?: number;
}

async function defaultRunner(command: string, args: string[], options?: { timeout?: number }): Promise<BotmuxCommandResult> {
  const result = await execFileAsync(command, args, {
    timeout: options?.timeout ?? 5000,
    encoding: "utf8"
  });
  return {
    stdout: result.stdout,
    stderr: result.stderr
  };
}

function extractDashboardUrl(stdout: string): string {
  const match = stdout.match(dashboardUrlPattern);
  if (!match) {
    throw new AppError("BOTMUX_DASHBOARD_URL_NOT_FOUND", "botmux dashboard did not return a URL", 502);
  }

  return new URL(match[0]).toString();
}

export class BotmuxDashboardService {
  private readonly runner: BotmuxCommandRunner;
  private readonly commandTimeoutMs: number;

  constructor(options: BotmuxDashboardServiceOptions = {}) {
    this.runner = options.runner ?? defaultRunner;
    this.commandTimeoutMs = options.commandTimeoutMs ?? 5000;
  }

  async getDashboard(): Promise<BotmuxDashboardResponse> {
    try {
      const result = await this.runner("botmux", ["dashboard"], { timeout: this.commandTimeoutMs });
      return { url: extractDashboardUrl(result.stdout) };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("BOTMUX_DASHBOARD_UNAVAILABLE", "Unable to start botmux dashboard", 503);
    }
  }
}

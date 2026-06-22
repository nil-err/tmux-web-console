import { describe, expect, it } from "vitest";
import { BotmuxDashboardService, type BotmuxCommandRunner } from "../../src/server/botmux/botmuxDashboardService.js";
import { AppError } from "../../src/server/utils/errors.js";

function createRunner(stdout: string | Error): { runner: BotmuxCommandRunner; calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    runner: async (command, args) => {
      calls.push([command, ...args].join(" "));
      if (stdout instanceof Error) {
        throw stdout;
      }
      return { stdout, stderr: "" };
    }
  };
}

describe("BotmuxDashboardService", () => {
  it("runs botmux dashboard and returns the dashboard URL", async () => {
    const { runner, calls } = createRunner("http://127.0.0.1:7891/?ticket=demo\n");
    const service = new BotmuxDashboardService({ runner });

    await expect(service.getDashboard()).resolves.toEqual({
      url: "http://127.0.0.1:7891/?ticket=demo"
    });
    expect(calls).toEqual(["botmux dashboard"]);
  });

  it("extracts the first http URL when the command prints surrounding text", async () => {
    const { runner } = createRunner("Dashboard ready:\nhttp://127.0.0.1:7891/?t=abc\n");
    const service = new BotmuxDashboardService({ runner });

    await expect(service.getDashboard()).resolves.toEqual({
      url: "http://127.0.0.1:7891/?t=abc"
    });
  });

  it("returns a typed error when no URL is returned", async () => {
    const { runner } = createRunner("dashboard started without a visible url");
    const service = new BotmuxDashboardService({ runner });

    await expect(service.getDashboard()).rejects.toEqual(
      new AppError("BOTMUX_DASHBOARD_URL_NOT_FOUND", "botmux dashboard did not return a URL", 502)
    );
  });
});

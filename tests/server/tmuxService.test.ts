import { describe, expect, it } from "vitest";
import { AppError } from "../../src/server/utils/errors.js";
import { TmuxService, type CommandRunner } from "../../src/server/tmux/tmuxService.js";

function createRunner(responses: Record<string, string | Error>): { runner: CommandRunner; calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    runner: async (command, args) => {
      const key = [command, ...args].join(" ");
      calls.push(key);
      const response = responses[key];
      if (response instanceof Error) {
        throw response;
      }
      if (response === undefined) {
        throw new Error(`unexpected command: ${key}`);
      }
      return { stdout: response, stderr: "" };
    }
  };
}

describe("TmuxService", () => {
  it("groups sessions and windows into a tree", async () => {
    const { runner } = createRunner({
      'tmux list-sessions -F #{session_name}\t#{session_created}\t#{session_attached}\t#{session_windows}':
        "main\t1779893212\t0\t2\n",
      'tmux list-windows -a -F #{session_name}\t#{window_id}\t#{window_index}\t#{window_name}\t#{window_active}\t#{window_panes}\t#{window_flags}':
        "main\t@43\t0\tbash\t0\t1\t-\nmain\t@44\t1\tdev\t1\t1\t*\n"
    });

    const service = new TmuxService({ runner });

    await expect(service.getTree()).resolves.toEqual({
      sessions: [
        {
          name: "main",
          createdAtEpoch: 1779893212,
          attachedCount: 0,
          windowCount: 2,
          windows: [
            {
              id: "@43",
              sessionName: "main",
              index: 0,
              name: "bash",
              active: false,
              paneCount: 1,
              flags: "-"
            },
            {
              id: "@44",
              sessionName: "main",
              index: 1,
              name: "dev",
              active: true,
              paneCount: 1,
              flags: "*"
            }
          ]
        }
      ]
    });
  });

  it("returns an empty tree when no tmux server is running", async () => {
    const noServer = Object.assign(new Error("tmux failed"), { stderr: "no server running on /tmp/tmux" });
    const { runner } = createRunner({
      'tmux list-sessions -F #{session_name}\t#{session_created}\t#{session_attached}\t#{session_windows}':
        noServer
    });
    const service = new TmuxService({ runner });

    await expect(service.getTree()).resolves.toEqual({ sessions: [] });
  });

  it("validates that a window target belongs to its session", async () => {
    const { runner } = createRunner({
      'tmux list-sessions -F #{session_name}\t#{session_created}\t#{session_attached}\t#{session_windows}':
        "main\t1779893212\t0\t1\nother\t1779893212\t0\t1\n",
      'tmux list-windows -a -F #{session_name}\t#{window_id}\t#{window_index}\t#{window_name}\t#{window_active}\t#{window_panes}\t#{window_flags}':
        "main\t@43\t0\tbash\t1\t1\t*\nother\t@99\t0\tlogs\t1\t1\t*\n"
    });
    const service = new TmuxService({ runner });

    await expect(service.assertWindowTarget("main", "@43")).resolves.toMatchObject({ id: "@43", index: 0 });
    await expect(service.assertWindowTarget("main", "@99")).rejects.toEqual(
      new AppError("TARGET_NOT_FOUND", "tmux window target was not found", 404)
    );
  });

  it("uses argument arrays for temporary grouped session commands", async () => {
    const { runner, calls } = createRunner({
      "tmux new-session -d -t main -s __tmux_web_abcd1234": "",
      "tmux select-window -t __tmux_web_abcd1234:2": "",
      "tmux kill-session -t __tmux_web_abcd1234": ""
    });
    const service = new TmuxService({
      runner,
      idFactory: () => "abcd1234"
    });

    const temp = await service.createGroupedSession("main");
    await service.selectWindow(temp, 2);
    await service.killSession(temp);

    expect(temp).toBe("__tmux_web_abcd1234");
    expect(calls).toEqual([
      "tmux new-session -d -t main -s __tmux_web_abcd1234",
      "tmux select-window -t __tmux_web_abcd1234:2",
      "tmux kill-session -t __tmux_web_abcd1234"
    ]);
  });
});

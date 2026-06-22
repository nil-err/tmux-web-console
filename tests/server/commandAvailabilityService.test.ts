import { describe, expect, it } from "vitest";
import { CommandAvailabilityService } from "../../src/server/system/commandAvailabilityService.js";

describe("CommandAvailabilityService", () => {
  it("reports command availability from PATH and returns missing-command hints", async () => {
    const service = new CommandAvailabilityService({
      pathDirs: ["/usr/bin", "/custom/bin"],
      access: async (filePath) => {
        if (filePath === "/custom/bin/botmux" || filePath === "/usr/bin/ps") {
          return;
        }
        throw Object.assign(new Error("missing"), { code: "ENOENT" });
      }
    });

    await expect(service.getAvailability()).resolves.toEqual({
      commands: {
        botmux: {
          command: "botmux",
          available: true,
          missingHint: "Install botmux to open Botmux Dashboard."
        },
        tmux: {
          command: "tmux",
          available: false,
          missingHint: "Install tmux to refresh sessions."
        },
        ps: {
          command: "ps",
          available: true,
          missingHint: "Install ps to open Resource Monitor."
        }
      }
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  buildTmuxTree,
  parseSessionRows,
  parseWindowRows
} from "../../src/server/tmux/tmuxParser.js";

describe("tmuxParser", () => {
  it("parses tab-delimited session rows", () => {
    const sessions = parseSessionRows(
      "main\t1779893212\t0\t2\nscs_i18n\t1779894000\t1\t3\n"
    );

    expect(sessions).toEqual([
      {
        name: "main",
        createdAtEpoch: 1779893212,
        attachedCount: 0,
        windowCount: 2,
        windows: []
      },
      {
        name: "scs_i18n",
        createdAtEpoch: 1779894000,
        attachedCount: 1,
        windowCount: 3,
        windows: []
      }
    ]);
  });

  it("parses window rows with active state and pane counts", () => {
    const windows = parseWindowRows("main\t@43\t0\tbash\t0\t1\t-\nmain\t@44\t1\tdev\t1\t2\t*\n");

    expect(windows).toEqual([
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
        paneCount: 2,
        flags: "*"
      }
    ]);
  });

  it("drops malformed rows instead of throwing", () => {
    expect(parseSessionRows("bad-row\nmain\t1779893212\t0\t2\n")).toHaveLength(1);
    expect(parseWindowRows("main\t@43\tbad-index\tbash\t0\t1\t-\n")).toEqual([]);
    expect(parseWindowRows("main\t@43\t0\tbash\tx\t1\t-\n")).toEqual([]);
  });

  it("builds a grouped session tree and ignores windows for missing sessions", () => {
    const sessions = parseSessionRows("main\t1779893212\t0\t2\n");
    const windows = parseWindowRows("main\t@43\t0\tbash\t0\t1\t-\nmissing\t@99\t0\tlost\t1\t1\t*\n");

    expect(buildTmuxTree(sessions, windows)).toEqual({
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
            }
          ]
        }
      ]
    });
  });
});

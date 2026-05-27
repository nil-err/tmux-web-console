import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveClientDist } from "../../src/server/clientAssets.js";

describe("resolveClientDist", () => {
  it("resolves production client assets from the project root", () => {
    expect(resolveClientDist("/repo/tmux-web-console")).toBe(path.join("/repo/tmux-web-console", "dist/client"));
  });
});

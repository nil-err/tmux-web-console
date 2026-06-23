import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("package scripts", () => {
  it("exposes host-binding scripts for test deployments", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
      bin: Record<string, string>;
      files: string[];
      engines: { node: string; npm: string };
    };

    expect(pkg.scripts["dev:host"]).toContain("HOST=0.0.0.0");
    expect(pkg.scripts["start:host"]).toContain("HOST=0.0.0.0");
    expect(pkg.scripts["start:host"]).toContain("NODE_ENV=production");
    expect(pkg.scripts.start).toBe("NODE_ENV=production node dist/server/src/server/index.js");
    expect(pkg.bin["tmux-web-console"]).toBe("bin/tmux-web-console.js");
    expect(pkg.files).toEqual(expect.arrayContaining(["bin", "dist", "README.md", "LICENSE"]));
    expect(pkg.engines.node).toBe(">=22.14.0");
    expect(pkg.engines.npm).toBe(">=11.5.1");
  });
});

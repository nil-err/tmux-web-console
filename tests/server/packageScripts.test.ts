import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("package scripts", () => {
  it("exposes host-binding scripts for test deployments", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(pkg.scripts["dev:host"]).toContain("HOST=0.0.0.0");
    expect(pkg.scripts["start:host"]).toContain("HOST=0.0.0.0");
    expect(pkg.scripts.start).toBe("node dist/server/src/server/index.js");
  });
});

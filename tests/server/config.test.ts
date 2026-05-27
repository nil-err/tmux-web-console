import { describe, expect, it } from "vitest";
import { createServerConfig } from "../../src/server/config.js";

describe("server config", () => {
  it("defaults to loopback for normal local use", () => {
    expect(createServerConfig({}).host).toBe("127.0.0.1");
  });

  it("allows test deployments to bind all interfaces", () => {
    expect(createServerConfig({ HOST: "0.0.0.0" }).host).toBe("0.0.0.0");
  });
});

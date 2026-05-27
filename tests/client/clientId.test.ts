import { describe, expect, it } from "vitest";
import { createClientId } from "../../src/client/utils/clientId.js";

describe("createClientId", () => {
  it("uses crypto.randomUUID when the browser provides it", () => {
    const id = createClientId({
      crypto: { randomUUID: () => "uuid-value" },
      now: () => 10,
      random: () => 0.5
    });

    expect(id).toBe("uuid-value");
  });

  it("falls back outside secure browser contexts", () => {
    const id = createClientId({
      crypto: {},
      now: () => 1779893212000,
      random: () => 0.123456789
    });

    expect(id).toBe("tab-mpo6gnz4-4fzzzx");
  });
});

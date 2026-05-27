import { describe, expect, it, vi } from "vitest";
import { copyText } from "../../src/client/utils/clipboard.js";

describe("copyText", () => {
  it("uses navigator.clipboard when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    await expect(copyText("main:1", { clipboard: { writeText } })).resolves.toBe(true);

    expect(writeText).toHaveBeenCalledWith("main:1");
  });

  it("returns false instead of throwing when clipboard APIs are unavailable", async () => {
    await expect(copyText("main:1", {})).resolves.toBe(false);
  });
});

import { describe, expect, it, vi } from "vitest";
import { loadTerminalFont, TERMINAL_FONT_FAMILY } from "../../src/client/terminal/terminalFont.js";

describe("terminal font", () => {
  it("prefers bundled Hack Nerd Font Mono for terminal rendering", () => {
    expect(TERMINAL_FONT_FAMILY.startsWith("'Hack Nerd Font Mono'")).toBe(true);
    expect(TERMINAL_FONT_FAMILY).toContain("monospace");
  });

  it("loads Hack Nerd Font Mono before terminal measurement", async () => {
    const load = vi.fn().mockResolvedValue([]);
    const documentLike = { fonts: { load } };

    await loadTerminalFont(documentLike as unknown as Document, 13);

    expect(load).toHaveBeenCalledWith("13px 'Hack Nerd Font Mono'");
  });
});

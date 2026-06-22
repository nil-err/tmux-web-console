import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../src/client/styles/app.css", import.meta.url), "utf8");

describe("mobile layout CSS", () => {
  it("bundles Hack Nerd Font Mono for terminal glyphs", () => {
    expect(css).toContain("@font-face");
    expect(css).toContain("font-family: \"Hack Nerd Font Mono\";");
    expect(css).toContain("HackNerdFontMono-Regular.ttf");
  });

  it("uses dynamic viewport height for mobile browser chrome", () => {
    expect(css).toContain("height: 100dvh;");
  });

  it("adds a narrow-phone breakpoint for compact window rows and tabs", () => {
    const phoneBreakpoint = css.match(/@media\s*\(max-width:\s*480px\)\s*\{[\s\S]+$/)?.[0] ?? "";

    expect(phoneBreakpoint).toContain(".window-row");
    expect(phoneBreakpoint).toContain("grid-template-columns: minmax(0, 1fr);");
    expect(phoneBreakpoint).toContain(".tabs-bar");
    expect(phoneBreakpoint).toContain("scrollbar-width: none;");
  });

  it("lays external shortcuts out as square buttons in five columns", () => {
    expect(css).toContain(".external-links-grid");
    expect(css).toContain("grid-template-columns: repeat(5, minmax(0, 1fr));");
    expect(css).toContain("aspect-ratio: 1 / 1;");
    expect(css).toContain(".external-link-edit-button");
  });
});

export const TERMINAL_FONT_SIZE = 13;
export const TERMINAL_FONT_FAMILY =
  "'Hack Nerd Font Mono', 'HackNerdFontMono', Menlo, Consolas, 'Liberation Mono', monospace";

export async function loadTerminalFont(documentRef: Document = document, fontSize = TERMINAL_FONT_SIZE): Promise<void> {
  if (!documentRef.fonts || typeof documentRef.fonts.load !== "function") {
    return;
  }

  await documentRef.fonts.load(`${fontSize}px 'Hack Nerd Font Mono'`);
}

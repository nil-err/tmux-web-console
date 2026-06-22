// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WindowRow } from "../../src/client/components/WindowRow.js";
import type { TmuxWindow } from "../../src/shared/tmuxTypes.js";

const windowTarget: TmuxWindow = {
  id: "@44",
  sessionName: "main",
  index: 1,
  name: "dev",
  active: true,
  paneCount: 1,
  flags: "*"
};

describe("WindowRow", () => {
  it("hides the writable terminal button when writable actions are disabled", () => {
    render(<WindowRow window={windowTarget} showWritableAction={false} onConnect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Open readonly" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Open writable" })).toBeNull();
  });

  it("shows the writable terminal button when writable actions are enabled", () => {
    render(<WindowRow window={windowTarget} showWritableAction={true} onConnect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Open writable" })).not.toBeNull();
  });
});

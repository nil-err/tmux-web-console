// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionSidebar } from "../../src/client/components/SessionSidebar.js";

describe("SessionSidebar", () => {
  function createJsonResponse(body: unknown): Response {
    return {
      ok: true,
      json: async () => body
    } as Response;
  }

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(createJsonResponse({ links: [] }));
  });

  function renderSidebar(overrides: Partial<ComponentProps<typeof SessionSidebar>> = {}) {
    const props: ComponentProps<typeof SessionSidebar> = {
      sessions: [],
      loading: false,
      filterText: "",
      expandedSessions: {},
      dashboardLoading: false,
      dashboardOpen: false,
      commandAvailability: {
        botmux: { command: "botmux", available: true, missingHint: "Install botmux to open Botmux Dashboard." },
        tmux: { command: "tmux", available: true, missingHint: "Install tmux to refresh sessions." },
        ps: { command: "ps", available: true, missingHint: "Install ps to open Resource Monitor." }
      },
      mobileWritableEnabled: false,
      showWritableActions: false,
      onFilterChange: vi.fn(),
      onRefresh: vi.fn(),
      onOpenDashboard: vi.fn(),
      onRefreshDashboard: vi.fn(),
      onOpenResourceMonitor: vi.fn(),
      onOpenAgentBrowserMonitor: vi.fn(),
      onMobileWritableChange: vi.fn(),
      onToggleSession: vi.fn(),
      onConnect: vi.fn(),
      ...overrides
    };

    return render(<SessionSidebar {...props} />);
  }

  function getOpenLinkNames() {
    return screen
      .getAllByRole("button", { name: /^Open / })
      .map((button) => button.getAttribute("aria-label")?.replace(/^Open /, ""));
  }

  it("calls the dashboard handler when the dashboard button is clicked", () => {
    const onOpenDashboard = vi.fn();

    renderSidebar({ onOpenDashboard });

    fireEvent.click(screen.getByRole("button", { name: "Botmux Dashboard" }));

    expect(onOpenDashboard).toHaveBeenCalledOnce();
  });

  it("calls the agent browser monitor handler when the local monitor button is clicked", () => {
    const onOpenAgentBrowserMonitor = vi.fn();

    renderSidebar({ onOpenAgentBrowserMonitor });

    fireEvent.click(screen.getByRole("button", { name: "Agent Browser" }));

    expect(onOpenAgentBrowserMonitor).toHaveBeenCalledOnce();
  });

  it("places the resource monitor button above agent browser and opens it", () => {
    const onOpenResourceMonitor = vi.fn();
    const { container } = renderSidebar({ onOpenResourceMonitor });

    fireEvent.click(screen.getByRole("button", { name: "Resource Monitor" }));

    const actionLabels = Array.from(container.querySelectorAll(".dashboard-actions button")).map((button) =>
      button.textContent?.trim()
    );
    expect(actionLabels.indexOf("Resource Monitor")).toBeLessThan(actionLabels.indexOf("Agent Browser"));
    expect(onOpenResourceMonitor).toHaveBeenCalledOnce();
  });

  it("calls the dashboard refresh handler from the button beside dashboard", () => {
    const onRefreshDashboard = vi.fn();

    renderSidebar({ dashboardOpen: true, onRefreshDashboard });

    fireEvent.click(screen.getByRole("button", { name: "Refresh Botmux Dashboard tab" }));

    expect(onRefreshDashboard).toHaveBeenCalledOnce();
  });

  it("disables dashboard refresh until the dashboard tab is open", () => {
    renderSidebar({ dashboardOpen: false });

    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Refresh Botmux Dashboard tab" }).disabled).toBe(true);
  });

  it("renders no external shortcuts by default", () => {
    const { container } = renderSidebar();

    expect(container.querySelector(".external-links-grid")).not.toBeNull();
    expect(screen.queryAllByRole("button", { name: /^Open / })).toEqual([]);
    expect(screen.queryByRole("button", { name: "Add external link" })).toBeNull();
  });

  it("loads configured external links from the server and opens them in a new tab", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createJsonResponse({
        links: [
          {
            id: "docs",
            title: "Docs",
            url: "https://docs.example.com/",
            icon: "external"
          }
        ]
      })
    );
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    renderSidebar();

    fireEvent.click(await screen.findByRole("button", { name: "Open Docs" }));

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/config/external-links");
    expect(openSpy).toHaveBeenCalledWith("https://docs.example.com/", "_blank", "noopener,noreferrer");
  });

  it("adds a custom external link and saves it to the server", async () => {
    const savedBodies: unknown[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      if (init?.method === "PUT") {
        savedBodies.push(JSON.parse(String(init.body)) as unknown);
        return createJsonResponse(savedBodies.at(-1));
      }
      return createJsonResponse({ links: [] });
    });
    vi.spyOn(window, "prompt").mockReturnValueOnce("Docs").mockReturnValueOnce("docs.example.com");
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    renderSidebar();
    fireEvent.click(screen.getByRole("button", { name: "Unlock external link editing" }));
    fireEvent.click(screen.getByRole("button", { name: "Add external link" }));

    fireEvent.click(await screen.findByRole("button", { name: "Open Docs" }));

    expect(savedBodies).toEqual([
      {
        links: [
          {
            id: expect.stringMatching(/^custom-/),
            title: "Docs",
            url: "https://docs.example.com/",
            icon: "external"
          }
        ]
      }
    ]);
    expect(openSpy).toHaveBeenCalledWith("https://docs.example.com/", "_blank", "noopener,noreferrer");
  });

  it("unlocks editing and saves changed external link details to the server", async () => {
    const savedBodies: unknown[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      if (init?.method === "PUT") {
        savedBodies.push(JSON.parse(String(init.body)) as unknown);
        return createJsonResponse(savedBodies.at(-1));
      }
      return createJsonResponse({
        links: [
          {
            id: "docs",
            title: "Docs",
            url: "https://docs.example.com/",
            icon: "external"
          }
        ]
      });
    });
    vi.spyOn(window, "prompt").mockReturnValueOnce("Reference").mockReturnValueOnce("reference.example.com");
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    renderSidebar();
    fireEvent.click(screen.getByRole("button", { name: "Unlock external link editing" }));

    expect(screen.getByRole("button", { name: "Lock external link editing" })).not.toBeNull();
    expect(await screen.findByRole("button", { name: "Edit Docs" })).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Edit Docs" }));

    fireEvent.click(await screen.findByRole("button", { name: "Open Reference" }));

    expect(savedBodies).toEqual([
      {
        links: [
          {
            id: "docs",
            title: "Reference",
            url: "https://reference.example.com/",
            icon: "external"
          }
        ]
      }
    ]);
    expect(openSpy).toHaveBeenCalledWith("https://reference.example.com/", "_blank", "noopener,noreferrer");
  });

  it("unlocks sorting and saves changed external link order to the server", async () => {
    const savedBodies: unknown[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      if (init?.method === "PUT") {
        savedBodies.push(JSON.parse(String(init.body)) as unknown);
        return createJsonResponse(savedBodies.at(-1));
      }
      return createJsonResponse({
        links: [
          {
            id: "docs",
            title: "Docs",
            url: "https://docs.example.com/",
            icon: "external"
          },
          {
            id: "status",
            title: "Status",
            url: "https://status.example.com/",
            icon: "external"
          }
        ]
      });
    });

    renderSidebar();
    await screen.findByRole("button", { name: "Open Docs" });
    expect(getOpenLinkNames()).toEqual(["Docs", "Status"]);
    fireEvent.click(screen.getByRole("button", { name: "Unlock external link editing" }));
    fireEvent.click(screen.getByRole("button", { name: "Move Docs right" }));

    expect(getOpenLinkNames()).toEqual(["Status", "Docs"]);
    expect(savedBodies).toEqual([
      {
        links: [
          {
            id: "status",
            title: "Status",
            url: "https://status.example.com/",
            icon: "external"
          },
          {
            id: "docs",
            title: "Docs",
            url: "https://docs.example.com/",
            icon: "external"
          }
        ]
      }
    ]);
  });

  it("migrates legacy localStorage links to the server when server config is empty", async () => {
    localStorage.setItem(
      "tmux-web-console.external-links",
      JSON.stringify([
        {
          id: "legacy-docs",
          title: "Legacy Docs",
          url: "https://legacy.example.com/",
          icon: "external"
        }
      ])
    );
    const savedBodies: unknown[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      if (init?.method === "PUT") {
        savedBodies.push(JSON.parse(String(init.body)) as unknown);
        return createJsonResponse(savedBodies.at(-1));
      }
      return createJsonResponse({ links: [] });
    });

    renderSidebar();

    expect(await screen.findByRole("button", { name: "Open Legacy Docs" })).not.toBeNull();
    expect(savedBodies).toEqual([
      {
        links: [
          {
            id: "legacy-docs",
            title: "Legacy Docs",
            url: "https://legacy.example.com/",
            icon: "external"
          }
        ]
      }
    ]);
    expect(localStorage.getItem("tmux-web-console.external-links")).toBeNull();
  });

  it("calls the writable toggle handler from the mobile switch", () => {
    const onMobileWritableChange = vi.fn();

    renderSidebar({ onMobileWritableChange });

    fireEvent.click(screen.getByRole("switch", { name: "Show writable terminal buttons" }));

    expect(onMobileWritableChange).toHaveBeenCalledWith(true);
  });

  it("disables command-backed actions and exposes install hints when commands are missing", () => {
    const onOpenDashboard = vi.fn();
    const onRefresh = vi.fn();
    const onOpenResourceMonitor = vi.fn();

    renderSidebar({
      onOpenDashboard,
      onRefresh,
      onOpenResourceMonitor,
      commandAvailability: {
        botmux: { command: "botmux", available: false, missingHint: "Install botmux to open Botmux Dashboard." },
        tmux: { command: "tmux", available: false, missingHint: "Install tmux to refresh sessions." },
        ps: { command: "ps", available: false, missingHint: "Install ps to open Resource Monitor." }
      }
    });

    const dashboardButton = screen.getByRole<HTMLButtonElement>("button", { name: "Botmux Dashboard" });
    const refreshButton = screen.getByRole<HTMLButtonElement>("button", { name: "Refresh tmux sessions" });
    const resourceButton = screen.getByRole<HTMLButtonElement>("button", { name: "Resource Monitor" });

    expect(dashboardButton.disabled).toBe(true);
    expect(refreshButton.disabled).toBe(true);
    expect(resourceButton.disabled).toBe(true);
    expect(dashboardButton.title).toBe("Install botmux to open Botmux Dashboard.");
    expect(refreshButton.title).toBe("Install tmux to refresh sessions.");
    expect(resourceButton.title).toBe("Install ps to open Resource Monitor.");

    fireEvent.click(dashboardButton);
    fireEvent.click(refreshButton);
    fireEvent.click(resourceButton);

    expect(onOpenDashboard).not.toHaveBeenCalled();
    expect(onRefresh).not.toHaveBeenCalled();
    expect(onOpenResourceMonitor).not.toHaveBeenCalled();
  });
});

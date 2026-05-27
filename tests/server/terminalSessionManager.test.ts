import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import type { TmuxWindow } from "../../src/shared/tmuxTypes.js";
import {
  TerminalSessionManager,
  type PtyProcess,
  type PtySpawn
} from "../../src/server/terminal/terminalSessionManager.js";

class FakePty implements PtyProcess {
  readonly dataEmitter = new EventEmitter();
  readonly exitEmitter = new EventEmitter();
  readonly writes: string[] = [];
  readonly resizes: Array<{ cols: number; rows: number }> = [];
  killed = false;

  onData(callback: (data: string) => void): { dispose: () => void } {
    this.dataEmitter.on("data", callback);
    return { dispose: () => this.dataEmitter.off("data", callback) };
  }

  onExit(callback: (event: { exitCode: number; signal?: number }) => void): { dispose: () => void } {
    this.exitEmitter.on("exit", callback);
    return { dispose: () => this.exitEmitter.off("exit", callback) };
  }

  write(data: string): void {
    this.writes.push(data);
  }

  resize(cols: number, rows: number): void {
    this.resizes.push({ cols, rows });
  }

  kill(): void {
    this.killed = true;
  }
}

function createTargetWindow(index = 2): TmuxWindow {
  return {
    id: "@44",
    sessionName: "main",
    index,
    name: "dev",
    active: true,
    paneCount: 1,
    flags: "*"
  };
}

function createHarness(mode: "readonly" | "write") {
  const fakePty = new FakePty();
  const ptyCalls: Array<{ file: string; args: string[] }> = [];
  const ptySpawn: PtySpawn = (file, args) => {
    ptyCalls.push({ file, args });
    return fakePty;
  };
  const tmuxService = {
    assertWindowTarget: vi.fn().mockResolvedValue(createTargetWindow()),
    createGroupedSession: vi.fn().mockResolvedValue("__tmux_web_test"),
    selectWindow: vi.fn().mockResolvedValue(undefined),
    killSession: vi.fn().mockResolvedValue(undefined)
  };
  const manager = new TerminalSessionManager({
    tmuxService,
    ptySpawn,
    idFactory: () => "connection-1",
    defaultCols: 100,
    defaultRows: 30
  });

  return { manager, fakePty, ptyCalls, tmuxService, mode };
}

describe("TerminalSessionManager", () => {
  it("opens readonly tmux attach sessions and ignores input", async () => {
    const { manager, fakePty, ptyCalls, tmuxService } = createHarness("readonly");

    const session = await manager.create({
      sessionName: "main",
      windowId: "@44",
      mode: "readonly"
    });

    session.write("danger\n");

    expect(tmuxService.selectWindow).toHaveBeenCalledWith("__tmux_web_test", 2);
    expect(ptyCalls).toEqual([
      { file: "tmux", args: ["attach-session", "-r", "-t", "__tmux_web_test"] }
    ]);
    expect(fakePty.writes).toEqual([]);
  });

  it("opens writable tmux attach sessions and forwards input", async () => {
    const { manager, fakePty, ptyCalls } = createHarness("write");

    const session = await manager.create({
      sessionName: "main",
      windowId: "@44",
      mode: "write"
    });

    session.write("echo hello\n");

    expect(ptyCalls).toEqual([{ file: "tmux", args: ["attach-session", "-t", "__tmux_web_test"] }]);
    expect(fakePty.writes).toEqual(["echo hello\n"]);
  });

  it("bounds terminal resize requests before forwarding them", async () => {
    const { manager, fakePty } = createHarness("write");
    const session = await manager.create({
      sessionName: "main",
      windowId: "@44",
      mode: "write"
    });

    session.resize(5, 500);

    expect(fakePty.resizes).toEqual([{ cols: 20, rows: 120 }]);
  });

  it("cleans up pty and temporary tmux session on close", async () => {
    const { manager, fakePty, tmuxService } = createHarness("write");
    const session = await manager.create({
      sessionName: "main",
      windowId: "@44",
      mode: "write"
    });

    await manager.close(session.connectionId, "test");

    expect(fakePty.killed).toBe(true);
    expect(tmuxService.killSession).toHaveBeenCalledWith("__tmux_web_test");
    expect(manager.get(session.connectionId)).toBeUndefined();
  });

  it("emits output and exit events from the pty", async () => {
    const { manager, fakePty } = createHarness("write");
    const session = await manager.create({
      sessionName: "main",
      windowId: "@44",
      mode: "write"
    });
    const outputs: string[] = [];
    const exits: Array<{ exitCode: number | null; signal: string | null }> = [];

    session.onOutput((data) => outputs.push(data));
    session.onExit((event) => exits.push(event));
    fakePty.dataEmitter.emit("data", "hello");
    fakePty.exitEmitter.emit("exit", { exitCode: 0 });

    expect(outputs).toEqual(["hello"]);
    expect(exits).toEqual([{ exitCode: 0, signal: null }]);
  });
});

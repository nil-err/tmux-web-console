import { describe, expect, it } from "vitest";
import { parseTerminalRequest } from "../../src/server/ws/terminal.js";

describe("terminal WebSocket request parsing", () => {
  it("accepts valid readonly and write connection URLs", () => {
    expect(parseTerminalRequest("/ws/terminal?session=main&window=%4044&mode=readonly")).toEqual({
      ok: true,
      value: {
        sessionName: "main",
        windowId: "@44",
        mode: "readonly"
      }
    });
    expect(parseTerminalRequest("/ws/terminal?session=scs_i18n&window=%4056&mode=write")).toEqual({
      ok: true,
      value: {
        sessionName: "scs_i18n",
        windowId: "@56",
        mode: "write"
      }
    });
  });

  it("rejects missing params and unsupported modes", () => {
    expect(parseTerminalRequest("/ws/terminal?session=main&window=%4044")).toMatchObject({
      ok: false,
      code: "WS_PROTOCOL_ERROR"
    });
    expect(parseTerminalRequest("/ws/terminal?session=main&window=%4044&mode=root")).toMatchObject({
      ok: false,
      code: "WS_PROTOCOL_ERROR"
    });
  });
});

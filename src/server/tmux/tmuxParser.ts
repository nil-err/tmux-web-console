import type { TmuxSession, TmuxTree, TmuxWindow } from "../../shared/tmuxTypes.js";

function parseInteger(value: string): number | undefined {
  if (!/^\d+$/.test(value)) {
    return undefined;
  }
  return Number.parseInt(value, 10);
}

function parseBoolean(value: string): boolean | undefined {
  if (value === "1") {
    return true;
  }
  if (value === "0") {
    return false;
  }
  return undefined;
}

export function parseSessionRows(output: string): TmuxSession[] {
  return output
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .flatMap((line) => {
      const fields = line.split("\t");
      if (fields.length !== 4) {
        return [];
      }

      const [name, createdAtRaw, attachedRaw, windowsRaw] = fields;
      const createdAtEpoch = parseInteger(createdAtRaw);
      const attachedCount = parseInteger(attachedRaw);
      const windowCount = parseInteger(windowsRaw);
      if (!name || createdAtEpoch === undefined || attachedCount === undefined || windowCount === undefined) {
        return [];
      }

      return [
        {
          name,
          createdAtEpoch,
          attachedCount,
          windowCount,
          windows: []
        }
      ];
    });
}

export function parseWindowRows(output: string): TmuxWindow[] {
  return output
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .flatMap((line) => {
      const fields = line.split("\t");
      if (fields.length !== 7) {
        return [];
      }

      const [sessionName, id, indexRaw, name, activeRaw, paneCountRaw, flags] = fields;
      const index = parseInteger(indexRaw);
      const active = parseBoolean(activeRaw);
      const paneCount = parseInteger(paneCountRaw);
      if (
        !sessionName ||
        !id ||
        index === undefined ||
        !name ||
        active === undefined ||
        paneCount === undefined
      ) {
        return [];
      }

      return [
        {
          id,
          sessionName,
          index,
          name,
          active,
          paneCount,
          flags
        }
      ];
    });
}

export function buildTmuxTree(sessions: TmuxSession[], windows: TmuxWindow[]): TmuxTree {
  const sessionsByName = new Map<string, TmuxSession>();
  for (const session of sessions) {
    sessionsByName.set(session.name, { ...session, windows: [] });
  }

  for (const window of windows) {
    const session = sessionsByName.get(window.sessionName);
    if (session) {
      session.windows.push(window);
    }
  }

  return {
    sessions: [...sessionsByName.values()]
  };
}

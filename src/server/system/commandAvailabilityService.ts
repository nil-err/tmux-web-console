import { constants } from "node:fs";
import { access as defaultAccess } from "node:fs/promises";
import path from "node:path";
import type { CommandAvailabilityResponse, LocalCommandName } from "../../shared/commandAvailabilityTypes.js";

type AccessFunction = (filePath: string, mode?: number) => Promise<void>;

interface CommandDefinition {
  command: LocalCommandName;
  missingHint: string;
}

interface CommandAvailabilityServiceOptions {
  pathDirs?: string[];
  access?: AccessFunction;
}

const commandDefinitions: CommandDefinition[] = [
  {
    command: "botmux",
    missingHint: "Install botmux to open Botmux Dashboard."
  },
  {
    command: "tmux",
    missingHint: "Install tmux to refresh sessions."
  },
  {
    command: "ps",
    missingHint: "Install ps to open Resource Monitor."
  }
];

function defaultPathDirs(): string[] {
  return (process.env.PATH ?? "")
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export class CommandAvailabilityService {
  private readonly pathDirs: string[];
  private readonly access: AccessFunction;

  constructor(options: CommandAvailabilityServiceOptions = {}) {
    this.pathDirs = options.pathDirs ?? defaultPathDirs();
    this.access = options.access ?? defaultAccess;
  }

  async getAvailability(): Promise<CommandAvailabilityResponse> {
    const entries = await Promise.all(
      commandDefinitions.map(async (definition) => [
        definition.command,
        {
          command: definition.command,
          available: await this.isExecutableOnPath(definition.command),
          missingHint: definition.missingHint
        }
      ] as const)
    );

    return {
      commands: Object.fromEntries(entries) as CommandAvailabilityResponse["commands"]
    };
  }

  private async isExecutableOnPath(command: LocalCommandName): Promise<boolean> {
    for (const pathDir of this.pathDirs) {
      try {
        await this.access(path.join(pathDir, command), constants.X_OK);
        return true;
      } catch {
        // Keep scanning the rest of PATH.
      }
    }

    return false;
  }
}

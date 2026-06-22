export type LocalCommandName = "botmux" | "tmux" | "ps";

export interface LocalCommandAvailability {
  command: LocalCommandName;
  available: boolean;
  missingHint: string;
}

export interface CommandAvailabilityResponse {
  commands: Record<LocalCommandName, LocalCommandAvailability>;
}

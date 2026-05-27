export interface Logger {
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
}

export const logger: Logger = {
  info(message, meta) {
    console.info(message, meta ?? "");
  },
  warn(message, meta) {
    console.warn(message, meta ?? "");
  },
  error(message, meta) {
    console.error(message, meta ?? "");
  }
};

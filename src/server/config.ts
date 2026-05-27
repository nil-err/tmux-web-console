export const serverConfig = {
  host: process.env.HOST ?? "127.0.0.1",
  port: Number.parseInt(process.env.PORT ?? "5179", 10),
  maxConnections: Number.parseInt(process.env.MAX_CONNECTIONS ?? "20", 10),
  ptyDefaultCols: Number.parseInt(process.env.PTY_COLS ?? "120", 10),
  ptyDefaultRows: Number.parseInt(process.env.PTY_ROWS ?? "32", 10),
  tmuxCommandTimeoutMs: Number.parseInt(process.env.TMUX_COMMAND_TIMEOUT_MS ?? "5000", 10),
  tempSessionPrefix: process.env.TMUX_WEB_TEMP_PREFIX ?? "__tmux_web_",
  enableWriteMode: process.env.ENABLE_WRITE_MODE !== "false"
};

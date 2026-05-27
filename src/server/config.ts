export function createServerConfig(env: NodeJS.ProcessEnv) {
  return {
    host: env.HOST ?? "127.0.0.1",
    port: Number.parseInt(env.PORT ?? "5179", 10),
    maxConnections: Number.parseInt(env.MAX_CONNECTIONS ?? "20", 10),
    ptyDefaultCols: Number.parseInt(env.PTY_COLS ?? "120", 10),
    ptyDefaultRows: Number.parseInt(env.PTY_ROWS ?? "32", 10),
    tmuxCommandTimeoutMs: Number.parseInt(env.TMUX_COMMAND_TIMEOUT_MS ?? "5000", 10),
    tempSessionPrefix: env.TMUX_WEB_TEMP_PREFIX ?? "__tmux_web_",
    enableWriteMode: env.ENABLE_WRITE_MODE !== "false"
  };
}

export const serverConfig = createServerConfig(process.env);

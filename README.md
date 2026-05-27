# Tmux Web Console

Local Web UI for viewing and controlling tmux sessions on a devbox.

## Features

- Lists current tmux sessions and windows.
- Opens each tmux window as a readonly or writable browser terminal tab.
- Keeps multiple browser tabs connected independently through temporary tmux grouped sessions.
- Uses xterm.js for terminal rendering and node-pty for real TTY behavior.
- Defaults to `127.0.0.1` so it is suitable for SSH port forwarding.

## Requirements

- Node.js 22+
- npm
- tmux 3.x

## Development

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5179
```

To test from another machine on the same network or through a devbox exposed port:

```bash
npm run dev:host
```

This binds the server to `0.0.0.0:5179`.

## Production Build

```bash
npm run build
npm run start
```

For a test deployment that listens on every interface:

```bash
npm run build
npm run start:host
```

## Verification

```bash
npm test -- --run
npm run typecheck
npm run build
```

## Security Model

This is a local tool. Writable mode sends keyboard input to tmux as the Linux user running the server. `dev:host` and `start:host` are for temporary testing only. Do not bind the service to a public interface without adding authentication, authorization, and audit logging.

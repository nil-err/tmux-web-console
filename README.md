# Tmux Web Console

Local Web UI for viewing and controlling tmux sessions on a devbox.

## Main Capabilities

- Lists current tmux sessions and windows from the host running the server.
- Opens tmux windows in independent browser tabs, with readonly and writable modes.
- Uses temporary tmux grouped sessions so browser tabs can attach independently.
- Renders terminals with xterm.js and node-pty for real TTY behavior.
- Provides fixed utility tabs for Botmux Dashboard, Resource Monitor, and Agent Browser.
- Shows compact sidebar shortcuts for external tools, with unlock-gated editing and ordering stored in a server-side config file.
- Detects missing local commands and disables command-backed buttons with install hints.
- Defaults to `127.0.0.1`, which is suitable for SSH port forwarding.

## Requirements

- Node.js 22+
- npm
- tmux 3.x for tmux session listing and terminal attach
- `ps` for Resource Monitor process usage
- botmux CLI for Botmux Dashboard

Botmux is optional for core tmux browsing. If it is not installed, the Botmux Dashboard button is disabled in the UI.

Agent Browser expects a local service at:

```text
http://localhost:4848
```

The URL is resolved by the browser opening Tmux Web Console, not by the server.

## Install

```bash
git clone <repo-url>
cd tmux-web-console
npm install
```

## Development Server

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

You can override host and port with environment variables:

```bash
HOST=0.0.0.0 PORT=5180 npm run dev
```

## Configuration

External link shortcuts default to an empty list. When users add, edit, or reorder shortcuts, the server writes them to:

```text
~/.config/tmux-web-console/config.json
```

Override the config file path when needed:

```bash
TMUX_WEB_CONFIG_FILE=/path/to/config.json npm run dev
```

The server exposes the shortcut config at:

```text
GET /api/config/external-links
PUT /api/config/external-links
```

Existing browser `localStorage` shortcuts are migrated once when the server config is empty.

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

## Local Command Checks

The server exposes command availability at:

```text
GET /api/system/commands
```

The current UI uses it for:

- `botmux`: Botmux Dashboard
- `tmux`: tmux session refresh
- `ps`: Resource Monitor

## Verification

```bash
npm test -- --run
npm run typecheck
npm run build
```

## Security Model

This is a local tool. Writable mode sends keyboard input to tmux as the Linux user running the server. `dev:host` and `start:host` are for temporary testing only. Do not bind the service to a public interface without adding authentication, authorization, and audit logging.

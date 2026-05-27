# Tmux Web Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Web app that lists devbox tmux sessions/windows and opens each window in readonly or writable browser terminal tabs.

**Architecture:** A Node/Express server exposes tmux tree APIs and a WebSocket terminal bridge. The browser React app renders a two-column tool UI, manages connection tabs, and renders terminal streams with xterm.js. `node-pty` runs real `tmux attach-session` commands against per-tab temporary grouped sessions so each browser tab has an independent tmux client.

**Tech Stack:** TypeScript, React, Vite, Express, ws, node-pty, xterm.js, lucide-react, Vitest.

---

## File Structure

- `package.json`: scripts and dependencies for client, server, tests, build, and start.
- `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.config.ts`: TypeScript, Vite, and Vitest configuration.
- `index.html`: Vite HTML entrypoint.
- `src/shared/tmuxTypes.ts`: shared session/window/tab types.
- `src/shared/protocol.ts`: shared WebSocket protocol types.
- `src/server/index.ts`: Express app, static serving, WebSocket server, graceful shutdown.
- `src/server/config.ts`: host, port, tmux, pty, and connection defaults.
- `src/server/tmux/tmuxParser.ts`: parser for tmux list command output.
- `src/server/tmux/tmuxService.ts`: tmux command wrapper and target validation.
- `src/server/terminal/terminalSessionManager.ts`: pty lifecycle and temp tmux session cleanup.
- `src/server/routes/tmuxTree.ts`, `src/server/routes/health.ts`: HTTP routes.
- `src/server/utils/errors.ts`, `src/server/utils/logger.ts`: error and logging helpers.
- `src/client/*`: React app, API client, terminal socket, state reducer, components, and CSS.
- `tests/server/*.test.ts`: server parser/service/session-manager tests.
- `tests/client/*.test.tsx`: tab reducer and component behavior tests.

## Task 1: Project Skeleton

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `index.html`
- Create: `src/shared/tmuxTypes.ts`
- Create: `src/shared/protocol.ts`

- [ ] **Step 1: Add package metadata and scripts**

Use `npm install` after creating `package.json`. Scripts must include `dev`, `build`, `start`, `test`, and `typecheck`.

- [ ] **Step 2: Add TypeScript/Vite/Vitest config**

Configure path alias `@shared` to `src/shared`, client entry under `src/client`, and server build via `tsc -p tsconfig.node.json`.

- [ ] **Step 3: Add shared types**

Define `TmuxSession`, `TmuxWindow`, `TerminalMode`, `TerminalTab`, `ClientTerminalMessage`, and `ServerTerminalMessage`.

- [ ] **Step 4: Run baseline checks**

Run: `npm install`, `npm run typecheck`, `npm test -- --run`.

Expected: dependency install succeeds; checks may report no tests until Task 2.

## Task 2: tmux Parser and Tree API

**Files:**
- Create: `src/server/tmux/tmuxParser.ts`
- Create: `src/server/tmux/tmuxService.ts`
- Create: `src/server/routes/tmuxTree.ts`
- Create: `src/server/routes/health.ts`
- Create: `src/server/utils/errors.ts`
- Create: `src/server/utils/logger.ts`
- Test: `tests/server/tmuxParser.test.ts`
- Test: `tests/server/tmuxService.test.ts`

- [ ] **Step 1: Write failing parser tests**

Cover valid session/window rows, empty output, malformed rows, and strict numeric/boolean conversion.

- [ ] **Step 2: Verify parser tests fail**

Run: `npm test -- --run tests/server/tmuxParser.test.ts`

Expected: FAIL because parser module is missing.

- [ ] **Step 3: Implement parser**

Implement tab-delimited parsing with invalid row warnings.

- [ ] **Step 4: Verify parser tests pass**

Run: `npm test -- --run tests/server/tmuxParser.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing service tests**

Mock command execution and verify tree grouping, no-server empty tree, target validation, and temp session command arguments.

- [ ] **Step 6: Implement tmux service and routes**

Use `execFile`, argument arrays, timeouts, `GET /api/health`, and `GET /api/tmux/tree`.

- [ ] **Step 7: Run service tests**

Run: `npm test -- --run tests/server/tmuxService.test.ts`

Expected: PASS.

## Task 3: Terminal WebSocket Backend

**Files:**
- Create: `src/server/terminal/terminalSessionManager.ts`
- Create: `src/server/ws/terminal.ts`
- Modify: `src/server/index.ts`
- Test: `tests/server/terminalSessionManager.test.ts`

- [ ] **Step 1: Write failing terminal manager tests**

Cover readonly input ignored, write input forwarded, resize bounded, cleanup kills pty and temp session, and pty exit emits `exit`.

- [ ] **Step 2: Verify tests fail**

Run: `npm test -- --run tests/server/terminalSessionManager.test.ts`

Expected: FAIL because manager module is missing.

- [ ] **Step 3: Implement terminal manager**

Inject pty spawn and tmux service for testability. Use `tmux attach-session -r` for readonly and `tmux attach-session` for write.

- [ ] **Step 4: Implement WebSocket handler**

Validate query params, create terminal session, handle JSON protocol messages, and close resources on disconnect.

- [ ] **Step 5: Verify terminal backend tests pass**

Run: `npm test -- --run tests/server/terminalSessionManager.test.ts`

Expected: PASS.

## Task 4: React UI and Terminal Tabs

**Files:**
- Create: `src/client/main.tsx`
- Create: `src/client/App.tsx`
- Create: `src/client/api/tmuxApi.ts`
- Create: `src/client/api/terminalSocket.ts`
- Create: `src/client/state/terminalTabs.ts`
- Create: `src/client/components/Layout.tsx`
- Create: `src/client/components/SessionSidebar.tsx`
- Create: `src/client/components/SessionGroup.tsx`
- Create: `src/client/components/WindowRow.tsx`
- Create: `src/client/components/TerminalTabs.tsx`
- Create: `src/client/components/TerminalPane.tsx`
- Create: `src/client/components/EmptyState.tsx`
- Create: `src/client/components/IconButton.tsx`
- Create: `src/client/styles/app.css`
- Test: `tests/client/terminalTabs.test.ts`

- [ ] **Step 1: Write failing tab reducer tests**

Cover open tab, set active, close active tab fallback, update status, and close last tab.

- [ ] **Step 2: Implement tab reducer**

Keep state transitions deterministic and independent from React.

- [ ] **Step 3: Build UI components**

Implement two-column layout, session tree, icon buttons, tabs, empty state, and terminal pane.

- [ ] **Step 4: Integrate xterm.js**

Use FitAddon, ResizeObserver, output handling, readonly/write input rules, and tab lifecycle cleanup.

- [ ] **Step 5: Verify client tests pass**

Run: `npm test -- --run tests/client/terminalTabs.test.ts`

Expected: PASS.

## Task 5: Full Build, Integration, and Runtime Verification

**Files:**
- Create: `README.md`
- Modify: all implementation files as needed

- [ ] **Step 1: Run all automated checks**

Run: `npm test -- --run`, `npm run typecheck`, and `npm run build`.

Expected: all PASS.

- [ ] **Step 2: Verify live tmux tree API**

Run the server locally and call `GET /api/tmux/tree`. It must list current devbox tmux sessions/windows or return a clean empty state if no tmux server is running.

- [ ] **Step 3: Verify WebSocket readonly/write lifecycle**

Create a temporary tmux session, connect readonly and write WebSocket clients, verify readonly ignores input, write sends input, and temp sessions are cleaned up.

- [ ] **Step 4: Start dev server for user**

Leave the app running on an available local port and report the URL.

## Self-Review

- Spec coverage: The plan covers layout, tmux tree, readonly/write connection modes, grouped session lifecycle, WebSocket protocol, tab management, icon-based UI, security defaults, testing, and runtime verification.
- Placeholder scan: No `TBD`, `TODO`, or unspecified implementation steps remain.
- Type consistency: Shared protocol and tmux types are created before server/client usage.

# Project Map

## Purpose
Netheron: a local workspace that runs several AI coding agents (Claude Code, Codex, OpenCode, Pi, Oh My Pi, shell) side by side on your projects, each in its own git worktree, with shared memory, cost tracking, and phone access.

## Requirements
- Run and watch many agent sessions at once from one web UI (desktop and phone).
- Keep agents from damaging the main checkout (worktrees, edit guard, checkpoints).
- Track tokens/cost per call; warn on limits, cost spikes, regressions.
- Share project knowledge between agents of different vendors.
- Feature backlog: docs/research/Solutions.md (49 problem clusters, 141 options); progress in docs/BUGS.md and docs/TESTS.md.

## Components (implemented)
- **CLI** `packages/daemon/src/cli.ts` (`mm serve`, `mm usage`, `mm tunnel`): starts everything.
- **Proxy** `proxy.ts` (port 4141): sits between agents and model APIs, logs each call (tokens, cost, 429s) to SQLite.
- **Workspace server** `server.ts` (port 4142): REST API + one WebSocket; token auth (`auth.ts`); serves the web UI.
- **TaskManager** `tasks.ts`: creates tasks, worktrees (`worktree.ts`), launches agents in pseudo-terminals (`pty.ts`, `agents.ts`); hand-off, queue, schedules, pipelines, races, evals.
- **Safety** `checkpoints.ts`, `alarms.ts`, `verify.ts`, `diagnostics.ts`.
- **Router** `packages/router/src/router.ts`: picks agent/model for a prompt from a catalog + past outcomes.
- **Shared memory** `packages/memory/src/*`: SQLite graph + MCP server (`mcp.ts`) every agent connects to (mm_get_context, mm_record, mm_read_lines/mm_edit_lines, mm_diagnostics).
- **Research** `packages/research/src/*`: web/paper search features.
- **Web UI** `apps/web/` (plain JS, xterm, Monaco, service worker for push).
- **Extras** `push.ts` (web push), `workers.ts` (remote Netheron instances), `profiles.ts` (multiple accounts).

## Main Flow
```
Browser UI --REST/WS (token)--> Workspace server --> TaskManager
TaskManager --git worktree--> task folder
TaskManager --spawn in PTY--> agent CLI (claude/codex/...)
agent CLI --HTTP--> Proxy :4141 --> model provider APIs
Proxy --logCall--> SQLite (calls) --event--> TaskManager (alarms, meter)
agent CLI --stdio MCP--> memory server --> SQLite (memory graph)
TaskManager --events--> server --WS--> Browser
```

## Data and Trust Boundaries
- One SQLite DB in MM_DATA_DIR (node:sqlite, WAL): tasks, calls, alerts, memory graph, profiles, schedules, evals, push subs, workers.
- Access token in DATA_DIR/token; cookie or Bearer; same-origin check on writes and WS.
- Agents run with the user's own CLI logins; Netheron writes ~/.claude.json only for folder trust.
- Remote workers: their tokens stored server-side only.

## Build and Deployment
- Node >= 24 runs TypeScript directly (type stripping, no build step).
- `npm run serve` or `start-netheron.cmd`; `npm test` (node --test, 83 tests as of 2026-10-10).

## Shared browser (chosen 2026-10-11; all 3 steps built)
- Learner's design: agents act on screenshots (click/double_click/type_text/press_key/scroll/navigate/wait/ask_user/finish), one action per turn. ask_user or user "Take over" → Netheron hard-blocks agent actions in code; "Resume" → fresh screenshot + "Done, continue" to the agent. User watches live video in Netheron, drives in a real Chrome window. Separate Netheron-only Chrome profile. Hard blocks: typing into password fields; clicking pay/place order/buy/delete.
- AI additions (approved): direct CDP over Node's built-in WebSocket (no Playwright); one Chrome, one tab per task; blocked actions return a message telling the agent to ask_user; pay/delete check reads the element text at x,y; agents reach it via browser_* MCP tools calling the Netheron server.
- Step 2 decisions (2026-10-11): learner chose opt-in per task and keep window open after finish; approved AI additions: browser_* MCP tools call the Netheron server with the saved token, JPEG screenshots, ask_user -> Needs you + push, Resume types "Done, continue" into the agent, browser tools auto-approved for Claude, no browser for Pi/omp.
- Steps: 1 browser core (packages/daemon/src/browser.ts) IMPLEMENTED 2026-10-11; 2 agent tools (browser_* in packages/memory/src/mcp.ts -> /api/tasks/:id/browser* in server.ts) IMPLEMENTED 2026-10-11; 3 Browser tab with live view (screencast over the WebSocket, clickable while the user has control) IMPLEMENTED 2026-10-11.
- One Chrome window per task (AI proposed after background tabs took 15 s to screenshot; learner chose windows 2026-10-11 so multiple agents can browse at once). Implemented.

## Unknowns
- Which remaining Solutions.md options to build next, and in what order.

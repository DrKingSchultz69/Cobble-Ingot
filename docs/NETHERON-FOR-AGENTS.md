# Netheron: briefing for an agent

You are helping run **Netheron** on a personal server. Read this first. It tells you what Netheron is, how to start it, where things live, and the rules to keep it safe.

## What Netheron is

Netheron is a local control room for AI coding agents. It lets one person run Claude Code, Codex, OpenCode, Pi, Oh My Pi and a plain shell side by side on their own projects, from one web screen on the PC or a paired phone.

- It **does not replace** the agents. It starts each agent's own official command-line app in a real terminal, signed in with the owner's own account.
- It runs **entirely on this machine**. There is no Netheron cloud.
- The command is still called `mm` (the old project name was "multimodel-management").

## What it does (25 features)

| Area | Features |
|---|---|
| Run the agents | Tasks (one real terminal per agent) · many agents · a git worktree per task · code view (files, diffs, editor, terminal) · **+ terminals** (cmd, PowerShell or an agent CLI in a task's folder; can become a task) · hand-off and queue · pipelines and races |
| Choose and keep safe | Smart routing (picks agent + model per prompt) · evals · safety net (edit guard, checkpoints, alarms, verify) · shared browser (agents drive Chrome, the owner can take over) · automations (hourly/daily/weekdays/weekly) · Forecast (an agent uses every feature in a safe test copy and saves replayable steps) |
| Watch | Usage (tokens, cost, plan limits) · alarms · resources (CPU/memory per agent) · keep awake · board (kanban) · issues (GitHub, Linear → tasks) |
| Remember and connect | Shared memory (one knowledge graph for every vendor's agents, over MCP) · research (web and paper search) · learn (ingest the owner's documents) · sessions (find and resume past Claude/Codex chats) · phone (QR pairing, push alerts, revoke) · workers and profiles (other PCs, several accounts) |

Designed but **not built yet**: all-agent sessions hub, council of agents, draw-a-council canvas, Forecast load and security tests. Don't tell the owner these exist.

## Requirements

- Node.js **24 or newer** (it runs TypeScript directly; there is no build step).
- git.
- Whichever agent apps the owner uses (`claude`, `codex`, `opencode`, …), installed and **already signed in by the owner**.

## Start and stop

```bash
npm install
npm run serve          # same as: node packages/daemon/src/cli.ts serve
```

- On Windows, `start-netheron.cmd` does the same.
- It prints a `workspace` link that contains the access token. Give that link **only to the owner**.
- Stop it with Ctrl+C or SIGTERM. It shuts its agents down cleanly; it force-exits after 4 seconds.
- Other commands: `serve --lan`, `tunnel [preview]`, `token`, `run <claude|codex|opencode|shell>`, `usage [hours]`.
- Tests: `npm test` (offline, about 117 tests).

## Ports and what listens where

| Port | Service | Bound to |
|---|---|---|
| 4141 (`MM_PORT`) | Model proxy: logs tokens and cost for API-key traffic | **Always 127.0.0.1**. Never expose it: it forwards credentials and has no login of its own. |
| 4142 (`MM_UI_PORT`) | Workspace: web UI, REST API, one WebSocket | 127.0.0.1, or 0.0.0.0 with `--lan` / "Network access" on |
| 4143 (`MM_PREVIEW_PORT`) | Preview of a dev server on this machine | Same as 4142 |
| 5141–5143 (`MM_FORECAST_PORT`) | Forecast's throwaway test copy | 127.0.0.1, only while a Forecast run is active |

## Where data lives

- Everything is under `MM_DATA_DIR` (default `~/.mm`): the SQLite database `mm.db`, the access `token`, worktrees, and Forecast runs (`forecast/<id>/`).
- Forecast step files: `<project>/.netheron/forecast/<run>.json`.
- Netheron writes to `~/.claude.json` only to mark project folders as trusted.

## Code layout

| Path | What it is |
|---|---|
| `packages/daemon/src/cli.ts` | Entry point (`serve`, `tunnel`, …) |
| `packages/daemon/src/server.ts` | Workspace server: REST, WebSocket, token auth |
| `packages/daemon/src/tasks.ts` | TaskManager: tasks, worktrees, queue, schedules, pipelines, races |
| `packages/daemon/src/agents.ts` | How each agent CLI is launched |
| `packages/daemon/src/terminals.ts` | Plain "+" terminals (not tasks) |
| `packages/daemon/src/proxy.ts`, `sessionlogs.ts` | Usage: proxy for API keys; subscription usage read from each CLI's own logs |
| `packages/daemon/src/browser.ts` | Shared Chrome over CDP |
| `packages/daemon/src/forecast.ts` | Forecast runs, test copy, replay, analytics |
| `packages/memory/src/` | Shared memory graph and the MCP server every agent connects to |
| `packages/router/src/` | Agent/model router |
| `packages/research/src/` | Research features |
| `apps/web/` | Web UI (plain JS, xterm, Monaco) |

## Useful settings

| Variable | Effect |
|---|---|
| `MM_PORT`, `MM_UI_PORT`, `MM_PREVIEW_PORT` | Ports (default 4141 / 4142 / 4143) |
| `MM_DATA_DIR` | Data folder (default `~/.mm`) |
| `MM_PROJECTS_DIR` | Default folder for projects |
| `MM_CLAUDE_AUTH`, `MM_CODEX_AUTH` = `sub` or `key` | Force subscription or API-key mode |
| `MM_FALLBACK_ANTHROPIC_KEY`, `MM_FALLBACK_OPENAI_KEY` | Used only when a subscription hits its rate limit |
| `MM_LLM` | Research engine: `claude-cli` (default), `codex-cli`, `openrouter`, `anthropic` |
| `TAVILY_API_KEY`, `BRAVE_API_KEY`, `SEARXNG_URL` | Optional web search providers |

## Rules for running it on a server

1. **Keep it private.** Leave the workspace on 127.0.0.1 unless the owner asks otherwise. For remote access prefer a private VPN such as Tailscale (`serve --lan` on the VPN interface), or `tunnel` (Cloudflare). Never open 4141 to any network.
2. **Protect the token.** Don't print it in logs you share, put it in URLs sent to third parties, or commit it. `node packages/daemon/src/cli.ts token` shows it to the owner when needed.
3. **Never sign in for the owner.** Agent logins (Claude Pro/Max, ChatGPT plan, API keys) belong to the owner. Subscription traffic must stay inside each vendor's official app; don't route it through a proxy.
4. **Don't touch `~/.mm` by hand** while Netheron is running. Back it up by stopping Netheron first.
5. **Ask before** opening a + terminal on the owner's behalf, deleting worktrees, revoking devices, changing ports or network access, or running Forecast against anything except its own test copy.
6. **Memory pressure.** Each agent is a separate process with a terminal. On a small server, run fewer agents at once and keep an eye on the Resources view.

## Health checks

- `GET http://127.0.0.1:4141/health` → proxy is up.
- `GET http://127.0.0.1:4142/api/version` → workspace is up.
- Open the workspace link and check the status bar: agents, limits, memory and keep-awake state.

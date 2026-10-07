# mm — multimodel workspace

One window for Claude Code, Codex and OpenCode (plus OpenRouter models). A router picks the agent and model for each task. Every agent shares one project memory. Research (Perplexity/Consensus style) and learning tools (DeepTutor style) sit in the same window, and it works from your phone.

## Start

```bash
npm install
```

```bash
npm run serve
```

Open the `workspace` link it prints (it contains your access token). Then:

1. Pick your project folder (top right → "+ Add project folder…"). A git repo works best.
2. Type a task, leave the agent on **Auto**, and press **Start**.
3. Watch it in the terminal pane. Answer its questions there, or with the key bar on a phone.

## What's inside

| Area | What it does |
|---|---|
| **Proxy** (`:4141`, localhost only) | Every agent's model traffic goes through it. Logs tokens and cost per agent, task, model and auth type (subscription vs API key). Fails over from a rate-limited subscription to an API key if you set `MM_FALLBACK_ANTHROPIC_KEY` / `MM_FALLBACK_OPENAI_KEY`. |
| **Workspace** (`:4142`) | Tasks board (Needs you / Running / Done / Failed), terminal tabs and split view, a git worktree per task, diff viewer, hand-off to another agent, notifications. |
| **Router** | Classifies the task (plan, debug, review, refactor, frontend, test, docs, quick, code) and scores each available agent+model on strength, past success, cost and current rate limits. Subscriptions win ties. |
| **Shared memory** | SQLite knowledge graph: project → files → symbols, plus decisions, bugs, todos, outcomes and research. Every agent gets it as MCP tools (`mm_get_context`, `mm_search`, `mm_record`, `mm_tree`, `mm_node`, `mm_index`). |
| **Research** | Web answers with citations, follow-ups, deep research reports, threads, spaces. Papers: search (OpenAlex), study snapshot, ask a paper, consensus meter, BibTeX/RIS/CSV export. |
| **Learn** | Ingest files/folders, chat over them with citations, step-by-step solving, quizzes with a question bank. |
| **Preview** (`:4143`) | Opens a dev server running on this machine, so you can see your build from your phone. |

## Phone

- Same Wi-Fi: `node packages/daemon/src/cli.ts serve --lan` prints a phone link.
- Anywhere: install cloudflared (`winget install --id Cloudflare.cloudflared`), then `node packages/daemon/src/cli.ts tunnel`.

## Commands

```bash
node packages/daemon/src/cli.ts
```

Shows: `serve [--lan]`, `tunnel [preview]`, `token`, `run <claude|codex|opencode|shell>`, `usage [hours]`.

## Settings (environment variables)

| Variable | Effect |
|---|---|
| `MM_PORT`, `MM_UI_PORT`, `MM_PREVIEW_PORT` | Ports (default 4141 / 4142 / 4143) |
| `MM_DATA_DIR` | Where the database, token and worktrees live (default `~/.mm`) |
| `MM_FALLBACK_ANTHROPIC_KEY`, `MM_FALLBACK_OPENAI_KEY` | API keys used only when a subscription hits a 429 |
| `MM_CODEX_AUTH=sub\|key` | Force Codex's ChatGPT-plan or API-key mode |
| `MM_LLM` | Research engine: `claude-cli` (default, uses your subscription), `codex-cli`, `openrouter`, `anthropic` |
| `TAVILY_API_KEY`, `BRAVE_API_KEY`, `SEARXNG_URL` | A dedicated web search API instead of Claude's WebSearch |

## Tests and records

- `npm test` — 53 automated tests, about 4 seconds, offline.
- [docs/TESTS.md](docs/TESTS.md) — every test, including the live and browser ones.
- [docs/BUGS.md](docs/BUGS.md) — every problem found, the options considered, and what was chosen.
- [PLAN.md](PLAN.md) — the plan and its status.

Requires Node 24+, git, and whichever of `claude`, `codex`, `opencode` you use, signed in.

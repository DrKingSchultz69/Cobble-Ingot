# Multimodel Management — Build Plan

One app. One window. Every agent (Claude Code, Codex, OpenCode, OpenRouter models) runs inside it, picks its own model, shares one memory, and you can drive it from your phone.

## Status (2026-10-07)

All 8 phases are built and working; 53 automated tests pass. Details: [docs/TESTS.md](docs/TESTS.md), problems: [docs/BUGS.md](docs/BUGS.md).

| # | Phase | Status | What works |
|---|---|---|---|
| 1 | Daemon + proxy | ✅ | Claude, Codex, OpenCode through one proxy; cost per agent/task/model/auth |
| 2 | Single-window UI | ✅ | Terminals in the browser, tabs, split view, worktree per task |
| 3 | Knowledge graph MCP | ✅ | Codex wrote a decision, Claude read it (live) |
| 4 | Auto-router | ✅ | Picks agent+model with a stated reason; 429 → API-key failover |
| 5 | Mobile relay | 🟡 | Phone layout, key bar, token auth, preview proxy, LAN mode, tunnel command. Not yet tried on a real phone (T-P2, T-P3). |
| 6 | Polish | ✅ | Diff viewer, task board, notifications, hand-off, usage view |
| 7 | Research base | ✅ | Cited web answers, deep research, papers, consensus meter, export |
| 8 | Learn tools | ✅ | Ingest docs, cited chat, solve, quiz + question bank |

### Changes from the original plan (and why)

| Plan said | Built instead | Why |
|---|---|---|
| Tauri desktop app + separate PWA | One web UI served by the daemon, installable as a PWA | Same screen on desktop and phone, no Rust build. Can be wrapped in Tauri later without changing the UI. |
| OmniRoute / CLIProxyAPI as the proxy | Own small proxy (~200 lines) | Needed per-agent/per-task tags, subscription vs key labels, cache-aware cost and 429 failover. Zero dependencies. |
| Fastify | Node's built-in http + `ws` | Fewer dependencies; the API is small |
| sqlite-vec + graphify | SQLite full-text search (FTS5) + own indexer | Built into Node 24, nothing to install. Vector search can be added later. |
| Semantic Scholar | OpenAlex | Free, no key, generous limits |
| Tavily/Brave required for web search | Claude Code's WebSearch (subscription) by default; keys optional | Works with no new key (B-018) |

### Folder layout (as built)

```
apps/web            UI (workspace, research, learn, memory, usage) — desktop + phone
packages/daemon     proxy, workspace server, tasks, PTYs, worktrees, auth, CLI
packages/memory     knowledge graph, indexer, context builder, MCP server
packages/router     task classifier + agent/model scoring
packages/research   LLM engines, web/paper search, answers, learn tools
docs/               BUGS.md, TESTS.md
```

## Architecture (5 layers)

```
 Phone (PWA)  ──WebSocket over tunnel──┐
                                       ▼
 Desktop UI (single window: tabs/panes for every agent, diff, preview)
                                       │
 Orchestrator daemon (Node/TS)  ── decides: which agent + which model
   ├─ Agent adapters: claude-code | codex | opencode   (spawned in PTYs, one git worktree each)
   ├─ Router/proxy:   OmniRoute or CLIProxyAPI  → Anthropic, OpenAI, OpenRouter
   └─ Knowledge graph: SQLite + graph tables, exposed to every agent via MCP
```

## Stack (defaults)

| Piece | Choice | Why |
|---|---|---|
| Desktop shell | Tauri 2 + React | Light, cross-platform, one window |
| Terminals | xterm.js + node-pty | Run real CLIs inside panes |
| Daemon | Node 24 + TypeScript + Fastify + ws | Same language end to end |
| Model proxy | OmniRoute (already in your skills) / CLIProxyAPI | OpenAI-compatible endpoint, fallbacks, cost logs |
| Memory | SQLite (+ sqlite-vec) + graphify for code graph | Local, zero infra |
| Agent access to memory | Custom MCP server | All 3 CLIs speak MCP |
| Mobile | PWA served by daemon + Cloudflare Tunnel | No app store, works today |

## Feature map

1. **CLI proxy** — every CLI points its base URL at the local proxy (`ANTHROPIC_BASE_URL`, Codex `config.toml`, OpenCode provider). Proxy logs tokens, cost, and fails over.
   - **Subscriptions + API keys together**: proxy tags every call `subscription` or `api_key`. Only `api_key` cost is real spend; subscription cost is shown as API-price equivalent.
2. **Auto-decide router** — spend subscription quota first; on 429 or quota exhausted, fail over to an API key (same model or cheaper). classify each task (plan / code / review / quick-fix / long-context), then pick agent+model from a rules table, scored by cost, quota left, and past success stored in the graph.
3. **Orca features, one space** — per-task git worktree, parallel agents, split panes in ONE window, unified diff viewer, task board, notifications when an agent finishes or needs input.
4. **Mobile relay** — phone sees live terminal stream, approves prompts, sends new tasks, views build preview (dev server proxied through the tunnel), gets push notifications.
5. **Shared knowledge graph + tree** — nodes: files, symbols, decisions, tasks, agent runs. Tree = project/task hierarchy. Every agent reads it at start (MCP `get_context`) and writes back at end (`record_decision`, `record_outcome`). Hand-off between Codex → Claude keeps full context.

## Research & Learn module (Perplexity + Consensus + DeepTutor)

All three run on the same base: web search + paper search + RAG over the shared knowledge graph + citations. Build that base once.

| Source | Features to take | v1 / later |
|---|---|---|
| Perplexity | Web answers with inline citations, follow-up threads, Focus modes (web/academic/code), Deep Research reports, Spaces (saved collections) | v1 |
| Consensus | Paper search (Semantic Scholar / OpenAlex APIs), Consensus Meter (yes/no agreement), Study Snapshots, Ask-a-Paper, citation graph, BibTeX/RIS export | v1: search + Ask-a-Paper + export. Later: Meter, citation graph |
| DeepTutor | Chat over your docs (RAG), Solve step-by-step, Quiz + question bank, Research reports, Co-Writer, Visualize, 3-layer memory, Personas | v1: RAG chat, Solve, Quiz. Later: Mastery Path, video learning, voice, IM channels |

Skip (agent features already covered by the core app): DeepTutor "My Agents", MCP, CLI apps, multi-user admin.

Pieces:
- `packages/research` — search providers (Tavily/Brave/SearXNG), paper APIs, answer-with-citations pipeline
- `packages/memory` grows into the RAG store (docs, papers, notes all become graph nodes)
- UI: a "Research" pane next to the agent panes; any answer can be sent to a coding agent as context

## Phases

| # | Phase | Delivers | Time |
|---|---|---|---|
| 1 | Daemon + proxy | Run Claude/Codex/OpenCode through one proxy, see cost per call | 2–3 days |
| 2 | Single-window UI | Tabs/panes with live terminals + worktree per task | 4–5 days |
| 3 | Knowledge graph MCP | All agents share context; hand-off works | 4–5 days |
| 4 | Auto-router | Submit a task, app picks agent+model | 3–4 days |
| 5 | Mobile relay | Phone: watch, approve, launch, preview build | 3–4 days |
| 6 | Polish | Diff viewer, task board, notifications, auth | 1 week |
| 7 | Research base | Web + paper search with citations (Perplexity/Consensus core) | 1 week |
| 8 | Learn tools | RAG chat over docs, Solve, Quiz, Ask-a-Paper (DeepTutor core) | 1–1.5 weeks |

Original estimate: ~7–8 weeks solo full-time. All phases were built on 2026-10-07; see Status above for what is verified.

## Folder layout

```
apps/desktop      Tauri + React UI
apps/mobile       PWA
packages/daemon   orchestrator, PTY manager, worktrees, ws server
packages/router   task classifier + model selection
packages/memory   SQLite graph + MCP server
packages/adapters claude-code / codex / opencode wrappers
```

## Risks

- **ToS**: routing a Claude/ChatGPT *subscription* through a proxy may violate provider terms. Use API keys for proxied traffic.
- **Security**: the mobile tunnel exposes a shell. Require auth (token + Cloudflare Access) before Phase 5 ships.
- **CLI drift**: Claude Code/Codex/OpenCode change flags often. Keep adapters thin.

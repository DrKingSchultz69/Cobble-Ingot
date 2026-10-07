# Test Log

Every test we plan, run, or review. Update the result the moment a test is run.
**Result:** ✅ Pass · ❌ Fail · ⏳ Not run yet · ⚠️ Pass with notes · 🚫 Blocked (missing key/hardware/tool)

## Summary (2026-10-07, after building phases 1–8)

| Area | Pass | Blocked / not run | Total |
|---|---|---|---|
| Automated (`npm test`) | 56 ✅ | 0 | 56 |
| Live: agents, proxy, memory | 14 | 4 🚫 | 18 |
| Live: research and learn | 5 | 0 | 5 |
| Browser UI (desktop + phone size) | 10 | 3 ⏳ | 13 |
| Phone / remote access | 1 | 3 ⏳🚫 | 4 |
| Code review | 1 ⚠️ (self) | 1 ⏳ | 2 |

Run everything: `npm test` (about 4 seconds, offline).

---

## 1. Automated tests (56)

### Proxy and cost tracking — [proxy.test.ts](../packages/daemon/test/proxy.test.ts)
| ID | Test | Checks | Result |
|---|---|---|---|
| T-U1 | route() | `/a/claude~t7/anthropic/v1/messages` → agent `claude`, task `t7`, right upstream; unknown provider rejected | ✅ |
| T-U2 | Anthropic SSE usage | model + input/output from a stream | ✅ |
| T-U3 | OpenAI chat JSON + Responses SSE | both OpenAI formats | ✅ |
| T-U4 | Cache tokens billed separately (B-002) | read 0.1×, write 1.25×; exact $0.5664 | ✅ |
| T-U5 | OpenAI cached tokens split out | `cached_tokens` moved from input to cache_read | ✅ |
| T-U6 | authKind | Anthropic key vs OAuth, OpenAI key vs JWT, chatgpt, openrouter | ✅ |
| T-U7 | Proxy end-to-end (fake upstream) | headers forwarded, stream passed through, row logged, $6 | ✅ |
| T-U8 | Responses SSE mixed events (B-008) | input 7,293 = 13,181 − 5,888 | ✅ |
| T-U9 | OpenRouter reported cost | `usage.cost` used as real spend | ✅ |
| T-U10 | fallbackFor | only `MM_FALLBACK_*` keys (never `ANTHROPIC_API_KEY`); chatgpt → `/v1/responses` | ✅ |
| T-U11 | 429 failover end-to-end | subscription 429 → retried with API key → 200, `x-mm-failover` header, both calls logged with task id | ✅ |
| T-U12 | Model from request (B-005) | rejected calls log the requested model | ✅ |

### Agent launch and escaping — [agents.test.ts](../packages/daemon/test/agents.test.ts)
| ID | Test | Checks | Result |
|---|---|---|---|
| T-U-A1 | argvQuote | backslashes doubled before quotes and at the end | ✅ |
| T-U-A2 | Round-trip through real cmd.exe → .exe (B-017) | `" & \| > % ^ ! \`, newlines, TOML, `%PATH%` arrive exactly | ✅ |
| T-U-A3 | Round-trip through a `.cmd` shim, like codex.cmd (B-017) | same args, double-escaped | ✅ |
| T-U-A4 | launchFor wiring | Claude: proxy URL with task tag, lean, settings, prompt last. Codex: auto-approve memory, pre-trusted repo. OpenCode: MCP config, model, `--prompt` | ✅ |

### Workspace server integration — [server.test.ts](../packages/daemon/test/server.test.ts)
| ID | Test | Checks | Result |
|---|---|---|---|
| T-I1 | Auth | 401 without/with wrong token; `?token=` → HttpOnly cookie + redirect; manifest public, app not | ✅ |
| T-I2 | Static + vendor | UI and xterm/marked/DOMPurify served; `..` paths never leak files | ✅ |
| T-I3 | Router endpoint | "Fix the crash on login" → `debug`, with reason | ✅ |
| T-I4 | Task lifecycle | real git repo → worktree on `mm/…` branch → terminal over WebSocket (attach, output, input) → REST input → plain-text output → diff of an untracked file → agent exits → `done` + notify event → outcome with diff stat in memory → remove deletes worktree | ✅ |
| T-I5 | WebSocket without token | rejected | ✅ |
| T-I6 | Cross-site blocked (B-024) | POST with foreign Origin → 403; WebSocket with foreign Origin refused; same-origin allowed | ✅ |
| T-I7 | Input validation | missing folder → 400 with message; empty prompt → 400 | ✅ |
| T-I8 | Memory API | index, record, search, context; bad kind → 400 | ✅ |
| T-I9 | stripAnsi | colour/OSC codes removed | ✅ |
| T-I10 | Preview proxy (B-024) | needs token; forwards to chosen port; no open redirect; mm's own ports refused | ✅ |
| T-I11 | Folder picker (B-025) | lists sub-folders, marks git repos, hides `.git`/`node_modules`, root view lists home + drives, bad path → 400, no token → 401 | ✅ |
| T-I12 | Clone from URL (B-027) | https / ssh:// / git@ URLs parsed; file://, ext::, dash hosts, plain paths refused (400); existing clone of same URL reused; same-name different repo refused | ✅ |
| T-I13 | Remote auto-detect (B-028) | no remote → null; git@ / https / https with token / ssh.github.com:443 / GitLab subgroups → host, owner, repo, branch, web link; token stripped; exposed in /api/projects/info and the picker | ✅ |

### Shared memory — [memory.test.ts](../packages/memory/test/memory.test.ts)
| ID | Test | Result |
|---|---|---|
| T-U-M1 | upsert idempotent by (kind,key); full-text index stays in sync | ✅ |
| T-U-M2 | FTS query sanitising (quotes, `;`, `--`, `*`) | ✅ |
| T-U-M3 | edges + neighbors both directions | ✅ |
| T-U-M4 | symbol extraction TS/Python with line numbers | ✅ |
| T-U-M5 | indexProject: project → file → symbol; re-index doesn't duplicate | ✅ |
| T-U-M6 | renderTree nesting + depth cap | ✅ |
| T-U-M7 | record + buildContext: one agent's decision shows up in another's context | ✅ |
| T-U-M8 | MCP handler: initialize, tools/list, record, search, error on bad kind | ✅ |
| T-U-M9 | MCP server process over real stdio (auto-indexes on first start) | ✅ |

### Router — [router.test.ts](../packages/router/test/router.test.ts)
| ID | Test | Result |
|---|---|---|
| T-U-RT1 | classify: debug / plan / docs / frontend / code | ✅ |
| T-U-RT2 | planning → Opus; quick change → Haiku | ✅ |
| T-U-RT3 | subscription beats paid API on a tie | ✅ |
| T-U-RT4 | rate-limited agent pushed down (Claude 429s → Codex), reason says why | ✅ |
| T-U-RT5 | past failures lower a candidate | ✅ |
| T-U-RT6 | only installed/signed-in agents considered; none → clear error | ✅ |

### Research and learn — [research.test.ts](../packages/research/test/research.test.ts)
| ID | Test | Result |
|---|---|---|
| T-U-R1 | extractJson from fenced/prose model output | ✅ |
| T-U-R2 | LLM engine choice (explicit → keys → Claude CLI) | ✅ |
| T-U-R3 | answer / follow-up split | ✅ |
| T-U-R4 | htmlToText keeps paragraphs, drops nav/scripts (found B-016) | ✅ |
| T-U-R5 | bestExcerpt picks the matching paragraph (found B-016) | ✅ |
| T-U-R6 | ask(): page text used as sources, citations in the prompt, thread saved, answer in shared memory, follow-up carries history | ✅ |
| T-U-R7 | ask(): academic focus uses papers; deep mode fans out to sub-queries; duplicates removed | ✅ |
| T-U-R8 | OpenAlex abstract rebuild; BibTeX + RIS export | ✅ |
| T-U-R9 | consensus meter counts, ignores bogus indexes | ✅ |
| T-U-R10 | chunking size/overlap/empty | ✅ |
| T-U-R11 | ingest → re-ingest (no duplicates) → chat with citations → quiz (bad items dropped, answer never sent to the browser) → answers update the bank | ✅ |
| T-U-R12 | chat with nothing ingested doesn't call the model | ✅ |

---

## 2. Live tests: agents, proxy, memory

| ID | Test | Result | Notes |
|---|---|---|---|
| T-M1 | Proxy starts + health | ✅ | |
| T-M2 | Real upstream reachable (no key → 401 logged) | ✅ | |
| T-M3 | Claude Code via proxy (subscription) | ✅ | Cache reads 535K at $0.82/call. `auth=subscription` confirmed in later runs. |
| T-M4 | Codex via proxy (ChatGPT plan) | ✅ | Found B-008 |
| T-M5 | Codex via proxy (API key) | 🚫 | No OpenAI key. Label verified with a fake key (401 → `api_key`). |
| T-M6 | OpenCode via proxy (OpenRouter) | ✅ | Found B-009 |
| T-M7 | Claude via proxy (API key) | 🚫 | No Anthropic key. Label verified with a fake key. |
| T-M8 | OpenRouter via proxy | ✅ | Covered by T-M6 |
| T-M9 | DB migration on existing DB | ✅ | |
| T-M10 | Codex uses shared memory (MCP) | ✅ | `mm_get_context` + `mm_record` completed; decision saved with `agent=codex`. Found B-019. |
| T-M11 | Handoff: Claude reads Codex's decision | ✅ | Claude (lean, Haiku): "An agent recorded that tokens must be longer than 10 characters." Context 60K instead of 535K. |
| T-M12 | Claude workspace task end to end | ✅ | Worktree `mm/add-an-exported-function-…` → trust dialog (B-014) → edit approved → diff +4 lines → decision "Timestamps are in seconds" in memory → status went to `idle` (needs you). Found B-017, B-020. |
| T-M13 | Headless minimal Claude call | ✅ | ~5K tokens instead of 535K |
| T-M14 | Codex workspace task (interactive) | ⚠️ | Runs in the browser terminal; trust screen fixed (B-010). Shell commands fail because of B-013 (not mm). |
| T-M15 | Command escaping, live | ✅ | Codex received a prompt with `& 100%` intact |
| T-M16 | Failover with a real API key | 🚫 | No key. Logic covered by T-U11. |
| T-M17 | OpenCode as a workspace task | 🚫 | Free OpenRouter models were rate-limited upstream; the OpenCode → proxy path is proven by T-M6 |
| T-M18 | Daemon restart marks live tasks `stopped` | ✅ | B-023 (known limitation) |

## 3. Live tests: research and learn

| ID | Test | Result | Notes |
|---|---|---|---|
| T-M19 | Web answer with citations | ✅ | "git worktree vs clone": 5 sources read, inline [n] citations, 3 follow-ups, 30 s. Found B-018. |
| T-M20 | Claude WebSearch as search provider | ✅ | Real results, no extra key |
| T-M21 | Papers: search, BibTeX/RIS, study snapshot, consensus meter, ask-a-paper | ✅ | 8 OpenAlex papers; meter 50% yes / 50% possibly; ask-a-paper: "5 g daily, 6 weeks" |
| T-M22 | Learn: ingest, chat, solve, quiz, answer, bank | ✅ | 2 docs / 12 chunks; cited answer; solve = $0.5625 (matches T-U4); 3 questions; bank stats update |
| T-M23 | Research answer is searchable by agents | ✅ | Saved as a `research` node in shared memory |

## 4. Browser UI (built-in browser)

| ID | Test | Result | Notes |
|---|---|---|---|
| T-UI1 | Workspace loads, live connection | ✅ | |
| T-UI2 | Router preview while typing | ✅ | "Plan the architecture…" → Opus, with reason |
| T-UI3 | Shell task: type in the browser terminal, see output | ✅ | |
| T-UI4 | Codex task terminal; keyboard answers prompts | ✅ | |
| T-UI5 | Research view: sources, citation chips, markdown | ✅ | |
| T-UI6 | Memory view: decisions from Codex and Claude, outcomes | ✅ | |
| T-UI7 | Usage view: per agent / auth / model | ✅ | |
| T-UI8 | Learn view + question bank; no JS errors in any view | ✅ | |
| T-UI9 | Phone size (375×812): side menu, key bar, one-line tabs | ✅ | Found B-022 |
| T-UI10 | Preview tab shows a local dev server through the preview proxy | ✅ | |
| T-UI11 | Manual: 📁 Add → browse → Use this folder → start a task | ⏳ | Your test 1 failed before B-025 was fixed. Re-run it. |
| T-UI12 | Manual: 📁 Add → paste HTTPS URL → Clone → project set | ⏳ | Live HTTPS clone via API passed; SSH blocked by network (B-027) |
| T-UI13 | Manual: pick a folder already linked to GitHub → picker note + top-bar badge show owner/repo + branch; badge opens the repo | ⏳ | |

## 5. Phone / remote access

| ID | Test | Result | Notes |
|---|---|---|---|
| T-P1 | Phone layout + key bar (Enter, y, n, Esc, Ctrl+C, arrows, Type…) | ✅ | Emulated phone viewport (T-UI9); key bar input path tested via REST (T-I4) |
| T-P2 | Real phone on the same Wi-Fi: `mm serve --lan` | ⏳ | Needs your phone. Windows may ask to allow Node through the firewall. |
| T-P3 | Real phone from anywhere: `mm tunnel` | 🚫 | `cloudflared` is not installed (`winget install --id Cloudflare.cloudflared`) |
| T-P4 | Desktop notification when the tab is hidden | ⏳ | Needs you to click "Allow notifications" once |

## 6. Code review

| ID | Scope | Reviewer | Date | Result | Findings |
|---|---|---|---|---|---|
| CR-1 | Whole codebase, focus on security + correctness | Claude (self-review, same author) | 2026-10-07 | ⚠️ | Found and fixed B-017 (command escaping), B-021 (pipe leak), B-024 (cross-site, open redirect, preview → proxy). Not independent. |
| CR-2 | Independent review | — | — | ⏳ | Run `/code-review high` once this is in git. Needs a repository (`git init`). |

# Test Log

Every test we plan, run, or review. Update the result the moment a test is run.
**Result:** ✅ Pass · ❌ Fail · ⏳ Not run yet · ⚠️ Pass with notes · 🚫 Blocked (missing key/hardware/tool)

## Summary (2026-10-07, after building phases 1–8)

| Area | Pass | Blocked / not run | Total |
|---|---|---|---|
| Automated (`npm test`) | 94 ✅ | 0 | 94 |
| Full functionality check (`node scripts/check-all.ts`) | 49 ✅ | 0 | 49 |
| Live: agents, proxy, memory | 14 | 4 🚫 | 18 |
| Live: research and learn | 5 | 0 | 5 |
| Browser UI (desktop + phone size) | 14 | 4 ⏳ | 18 |
| Phone / remote access | 1 | 3 ⏳🚫 | 4 |
| Code review | 1 ⚠️ (self) | 1 ⏳ | 2 |

Run everything: `npm test` (about 50 seconds, offline), then `node scripts/check-all.ts` (about 50 seconds, offline, no quota).

---

## 1. Automated tests (94)

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
| T-I14 | Live diff (B-029) + remove running task (B-030) | watch-diff sends current diff, file write pushes update, 2nd edit pushes again, unwatch stops pushes; removing the still-running task doesn't crash (6/6 repeated runs) | ✅ |
| T-I15 | Code tab file API (B-031) | list (hides .git), read, save; stale hash → 409 and file untouched; force; new file; binary → 415; >2 MB → 413; `../`, absolute, drive paths, junction outside → 400 for read and write; no token → 401; cross-site POST → 403; Monaco loader + editor served; vendor path can't leak package.json | ✅ |
| T-I16 | Restart banner (B-032) | `/api/version` → `stale: false` on a fresh server; `codeChangedSinceStart()` false | ✅ |

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
| T-UI14 | Manual: open Diff tab on a running task; edits appear on their own, scroll position kept, `● live` time updates | ⏳ | |
| T-UI15 | Code tab in Chrome (phone width, test server :5142) | tree loads; `hello.ts` coloured as TypeScript; disk edit → editor reloads by itself; new file → appears in tree; unsaved edit + disk edit → conflict bar, edit kept; Keep mine → saved to disk, ● cleared | ✅ | Layout since replaced (B-033) |
| T-UI16 | Code mode, VS Code layout (B-033), Chrome 1536 px | Terminal/Code switch; Explorer + 2 file tabs; TS colours; editor ~1016 px with right panel hidden; drag terminal bar resizes; typing → ●; Ctrl+S → saved to disk; back to Terminal mode, same session runs `echo` | ✅ | Phone layout of code mode not checked yet |
| T-UI17 | 🔔 menu (B-034), Chrome on :4142 | state `on` (permission granted); menu opens / stays open on inside click / closes outside; Mute → `muted`, test disabled; Turn on → `on`; Send test → notification created + confirmation toast | ✅ | You confirmed the Windows pop-up appears (2026-10-08) |
| T-UI19 | Calm UI (B-045) in Chrome, throwaway server :4199 | opens on Home; Home (1) badge; 🌐 row "Asks for you in the browser…" + Help; "1 running · 1 task in total"; ＋ New task → Workspace, step 1, prompt focused; Next/Back; step 3 groups open, labels "3 Extras: 👥✅"; Start from step 1 sent the ticked race (checks the "nothing hidden" rule), wizard back to step 1, last agent `codex` remembered; phone 375 px: Home fits, New task slides in with prompt focused, page width 371 = screen | ✅ 2026-10-11 |
| T-UI20 | Manual: use Home for a day | does it calm things down? anything you miss on the first screen? | ⏳ you |

## 5. Phone / remote access

| ID | Test | Result | Notes |
|---|---|---|---|
| T-P1 | Phone layout + key bar (Enter, y, n, Esc, Ctrl+C, arrows, Type…) | ✅ | Emulated phone viewport (T-UI9); key bar input path tested via REST (T-I4) |
| T-P2 | Real phone on the same Wi-Fi: `mm serve --lan` | ⏳ | Needs your phone. Windows may ask to allow Node through the firewall. |
| T-P3 | Real phone from anywhere: `mm tunnel` | 🚫 | `cloudflared` is not installed (`winget install --id Cloudflare.cloudflared`) |
| T-P4 | Desktop notification when the tab is hidden | ⚠️ | Windows pop-ups work: you saw the 🔔 test notification (T-UI17). Still to check: one from a real task finishing while the tab is hidden. |

## 6. Code review

| ID | Scope | Reviewer | Date | Result | Findings |
|---|---|---|---|---|---|
| CR-1 | Whole codebase, focus on security + correctness | Claude (self-review, same author) | 2026-10-07 | ⚠️ | Found and fixed B-017 (command escaping), B-021 (pipe leak), B-024 (cross-site, open redirect, preview → proxy). Not independent. |
| CR-2 | Independent review | — | — | ⏳ | Run `/code-review high` once this is in git. Needs a repository (`git init`). |

## 7. Research tools (scripts/research/)

| ID | Test | Result | Notes |
|---|---|---|---|
| T-R1 | `collect-github.mjs`: top issues for 19 tools inside the evidence window (2025-10-01 → 2026-10-08), exact quotes and 👍 counts, raw copy saved, re-run skips existing links | ✅ | 2026-10-08: 561 rows (Crystal had only 21 issues in the window). Test run of 3 rows, then the full run. |
| T-R2 | `check-log.mjs` catches edited evidence | ✅ | Changed one quote and one 👍 count on a copy: both flagged (exit 1). After restoring: "No errors". |
| T-R3 | Agent labeling via `apply-labels.mjs` (only label columns writable) | ✅ | 2026-10-08: Claude labeled 561/561 rows in 6 batches; `check-log.mjs` after each: no errors, evidence unchanged. |
| T-R5 | `export-obsidian.mjs` + notes in Obsidian format | ✅ | 2026-10-08: "Pain log" overview + 24 theme notes generated; 9 research notes converted to wiki-links + properties; link check: 0 broken. |
| T-R6 | Solution notes + `export-solutions-index.mjs` | ✅ | 2026-10-08: 49 cluster notes, 141 options; coverage 555 + 6 not-a-pain = 561/561, 0 duplicates; 279 wiki-links, 0 broken. |
| T-R4 | Spot-check of auto rows (target ≥ 20%) | ⏳ | 2026-10-08: Claude re-read the top 20 by 👍 in full (issue + top comment): 0 wrong, 4 theme changes, 1 severity change, 9 workarounds added. Marked `rechecked_by=claude`, **not** `verified` (same author). Human check still needed. |

## 8. Wave 1 (B-036): [wave1.test.ts](../packages/daemon/test/wave1.test.ts)

| ID | Test | Checks | Result |
|---|---|---|---|
| T-W1-1 | Rate-limit reset parsing (P09) | `6m0s`, `1h2m3.5s`, `20ms`; retry-after seconds; epoch seconds; ISO date; latest of several resets; > 7 days ignored | ✅ |
| T-W1-2 | Alarms (P07/P08) | limit with reset time + cool-down; drain (4M tokens / 5 min); cache hit rate 90% → 0%; billing to API key (failover excluded) | ✅ |
| T-W1-3 | Checkpoints (P03) | real index untouched; no-op snapshot reused; single-file + whole-folder restore (new files removed, ignored kept); refs deleted | ✅ |
| T-W1-4 | Edit guard (P02) | emptied, truncated, reasoning-in-code flagged; prose and normal edits not flagged; renamed .git flagged | ✅ |
| T-W1-5 | Setup recipe (P35) | default = copy `.env` (not `.env.example`) + link `node_modules`; run command; links removed without touching the main checkout; `../` refused | ✅ |
| T-W1-6 | Claude pre-trust (P44) | only the given folder; other settings kept; backup once; "already set"; untrust; invalid JSON left untouched | ✅ |
| T-W1-7 | Task flow with a fake agent | trust + setup on create; checkpoints; queue delivered when idle; guard flags an emptied file → byte-exact restore; diff comment delivered; budget → Esc + alert; meter; 429 → wait → resume nudge; 5 errors → stuck; receipt; remove cleans links, trust entry and refs | ✅ |
| T-UI18 | Wave 1 in Chrome (isolated test copy) | guard banner → Restore file (30 lines back on disk); queue ✓ sent and ran; diff comment on app.ts:31 queued while busy → delivered; receipt; setup dialog defaults; Usage → Alerts | ✅ |
| T-W1-8 | Wave 1 with a real Claude session (Haiku, isolated test copy) | Trust prompt skipped ✅ · `.env` copied ✅ · live meter real values (6 calls, 336k in, 669 out, $0.23, 84k ctx, 57 tok/s) ✅ · checkpoints start + after turn ✅ · no false guard warning ✅ · a real 429 → limit alert ✅ but **reset time unknown** (B-037) · Claude retried itself and Netheron cancelled the pause ✅ · removing the task removed its trust entry ✅ · budget/stuck not triggered (task was small) | ⚠️ |

## 9. Wave 2 (B-038): [wave2.test.ts](../packages/daemon/test/wave2.test.ts)

| ID | Test | Checks | Result |
|---|---|---|---|
| T-W2-1 | Router exclusion | claude excluded → codex; both excluded → "No other agent available (already tried: claude, codex)" | ✅ |
| T-W2-2 | Manual hand-off | same folder + branch; child doesn't own the worktree; briefing has the reason, original task, changed file, recorded decision, last terminal output, "Don't start over"; old agent stopped; chain = codex, claude; second hand-off refused; alert; removing the first task keeps the folder and moves ownership | ✅ |
| T-W2-3 | Auto hand-off | 5 failed calls → stuck → codex automatically, setting carried over; codex 429 with nobody left → alert, no loop | ✅ |
| T-W2-5 | Budget Dial (P07) | ladder smallest first (debugging: haiku → codex → sonnet → opus); startAt; dial starts at haiku; failing checks → next step with "didn't pass the checks" + output; passing stays; manual run checks | ✅ |
| T-W2-6 | Shared rules (P26) | 2 rules → Claude and Codex prompts both start with them; rules_given listed; in mm_get_context | ✅ |
| T-W2-7 | Account profiles (P13) | own config folder; agent sees CLAUDE_CONFIG_DIR; project default; "" = normal login; wrong-agent profile refused before a worktree exists; sign-in shell types `claude`; delete refused while in use, then closes the sign-in shell and removes the folder | ✅ |
| T-W2-8 | Night Shift (P23 S1) | at-time run; daily repeat moves +24 h; **started exactly once**; after-reset = last reset + 1 min; cancel; brief; no time → error | ✅ |
| T-W2-9 | Pipeline (P23 S2) | preset claude:opus → codex → claude:sonnet (codex-only fallback); first prompt has PLAN ONLY + task + STEP DONE; moves on at STEP DONE with "finished step 1 (Plan)" + BUILD, then REVIEW; "all 3 steps done" alert; one folder | ✅ |
| T-W2-10 | Race & Judge (P34) + quality watch (P01) | 2 contenders in separate worktrees; both pass, smaller change wins; keep winner removes the loser's worktree; non-git refused. Evals on 4 models, results recorded, eval tasks cleaned up; opus regression alert; router then picks codex | ✅ |
| T-W2-4 | Wave 2 with real agents | hand-off, dial, pipeline, race, quality watch with real Claude/Codex | ⏳ after your weekly limit resets (Oct 10, 11:30 pm) |

## 10. Wave 3 (B-040): [wave3.test.ts](../packages/daemon/test/wave3.test.ts)

| ID | What | Checks | Result |
|---|---|---|---|
| T-W3-1 | Hash-anchored edits (P02 S1) | anchors in output; replace, range delete, insert at top; stale anchor refused; CRLF kept; `../` and absolute paths refused; via MCP in the agent's folder; Claude auto-approves read, not edit | ✅ |
| T-W3-2 | LSP-lite (P32) | parses tsc / pyflakes / rust / gcc-note output, skips stack lines; detects tsc; `mm_diagnostics` answers when the check finishes | ✅ |
| T-W3-3 | Pi / Oh My Pi (P28) | launch line `pi --model sonnet "fix it"`; routed only when installed; rules + shared memory in Pi's prompt, MCP hint only for Claude | ✅ |
| T-W3-4 | Web push (P24 S2) | VAPID JWT verifies with the public key; push to 2 devices, dead one (410) removed; last message kept for the service worker | ✅ |
| T-W3-5 | Remote workers (P25 S2) | two real servers: wrong token / unreachable / no folder → clear errors; task created on the remote (local path + account dropped); list without token; open link; offline shown | ✅ |
| T-W3-6 | Manual: push on the phone | `mm tunnel` → open on phone → 🔔 → push on → close the tab → finish a task → notification arrives | ⏳ you |
| T-W3-7 | Manual: Pi / Oh My Pi live | `npm i -g @mariozechner/pi-coding-agent` → `pi` → `/login` → New task → agent Pi | ⏳ you (optional) |

## 11. Shared browser (B-041): [browser.test.ts](../packages/daemon/test/browser.test.ts)

| ID | What | Checks | Result |
|---|---|---|---|
| T-BR-1 | Risky-button pattern | blocks Pay now / Submit Payment / Place order / Buy / Delete account; allows PayPal / payload / Next page / Buyer guide | ✅ |
| T-BR-2 | Actions on real Chrome | navigate, click, type, clear + retype, Enter submits, double-click, scroll; screenshot is a PNG of the page size | ✅ |
| T-BR-3 | Hard blocks | password field, Place order button, Delete link (double-click too), javascript: and file: URLs refused; nothing clicked | ✅ |
| T-BR-4 | Control | hand to user → every agent action refused; other tasks continue; resume → fresh screenshot, unblocked; each task its own window; closed window comes back fresh | ✅ |
| T-BR-5 | Manual: `node scripts/try-browser.ts` (visible window) | agent's Place order and password typing ⛔ blocked; agent blocked while you have control; you can still click/type yourself; resume → search works | ✅ you, 2026-10-11 |

Step 2, agent tools (B-043): [browser-agent.test.ts](../packages/daemon/test/browser-agent.test.ts), real server and headless Chrome.

| ID | What | Checks | Result |
|---|---|---|---|
| T-BR-6 | Launch | only 🌐 tasks get `MM_BROWSER`/`MM_API` and the 10 `browser_*` tools; Claude pre-approves them only then | ✅ |
| T-BR-7 | Opt-in | browser task: flag + browsing rules in the prompt; Pi and Shell refused (400); task without 🌐 → 403 | ✅ |
| T-BR-8 | MCP end to end | navigate → JPEG image + page URL; Place order and password typing come back as tool errors; Netheron down → "Can't reach Netheron" | ✅ |
| T-BR-9 | Hand-over | ask_user → Needs you + 🔔/push + alert; click, screenshot and wait all refused; Resume → "Done, continue" typed into the waiting agent; Take over → blocked with no notification; finish keeps the window; removing the task closes it | ✅ |
| T-BR-10 | Hand-off | browser task hands off to Codex (never Pi, even if installed); child keeps 🌐 | ✅ |
| T-BR-12 | Live view, core ([browser.test.ts](../packages/daemon/test/browser.test.ts)) | watching doesn't open a window; frames start when the agent browses; JPEG at page size with URL; ≥ ~100 ms apart; your input refused while the agent drives; after hand-over you can type into a password field and submit; stops after unwatch | ✅ |
| T-BR-13 | Live view over WebSocket ([browser-agent.test.ts](../packages/daemon/test/browser-agent.test.ts)) | frames only for 🌐 tasks; your click refused until Take over, then it drives Chrome (page changes); no frames after closing the tab | ✅ |
| T-BR-14 | UI look, by me in Chrome (throwaway server) | Browser tab only for 🌐 tasks; watch-only text + Take over; after Take over: orange frame, Resume, clicking the picture + typing + Enter searched "hello"; panel widens to 760 px and back; board badge "you're driving" | ✅ 2026-10-11 |
| T-BR-15 | Manual, **no quota**: `node scripts/try-browser-tab.ts` → open the printed link | practice Netheron on :4199 with a scripted agent: watch it search; password typing ⛔; ask_user → 🔔 + "🌐 needs you"; you sign in by clicking/typing on the live picture; Resume → agent continues; Place order ⛔; finish. Self-checked headless by me 2026-10-11 (sign-in via WebSocket input, Resume, block, finish all ✅) | ⏳ you |
| T-BR-11 | Manual, uses quota: a real Claude task with 🌐 | restart Netheron → New task "Open example.com and tell me the heading" + 🌐 Browser → a Chrome window opens, agent screenshots and answers; Info → Take over / Resume work; Browser tab shows it live; on the phone (tunnel) you can log in through the picture + Type box | ⏳ you |

## 12. Full functionality check: [check-all.ts](../scripts/check-all.ts)

One command, `node scripts/check-all.ts`. It starts a throwaway Netheron in a temp folder: the real proxy, server, WebSocket and MCP server, with a fake model API and a fake agent. No quota is used and `~/.mm` is never touched. Every check runs even if one fails. It prints ✔/✖ per check, a total per group, and the failures again at the end. It keeps the temp folder only when something failed. Run 2026-10-11: **49/49, 6 runs in a row clean** (after the B-042 fix to the check). Run 2026-10-20: **51/51** (2 new: + terminal, Make it a task).

| ID | Group | What it checks through the real API | Result |
|---|---|---|---|
| T-ALL-1 | Access and safety (8) | no/wrong token 401; `?token=` → HttpOnly cookie; manifest/icon public; cross-site POST 403; WebSocket refuses no token and a foreign origin; `../` can't escape the web or Monaco folder; UI, sw.js, xterm, Monaco served; version not stale | ✅ |
| T-ALL-2 | Tasks, terminals, files (18) | worktree + branch, Claude folder trust, `.env` copied; bad input 400; terminal over WebSocket (attach, type, resize); REST input + plain output; diff; live diff + unwatch; Code tab save / 409 / force; path escapes 400, binary 415, >2 MB 413; queue delivered on idle; diff comment; checkpoints; edit guard + byte-exact restore; Check code; receipt; exit → done + notify + outcome in memory; stop; hand-off briefing; remove with worktree + trust entry | ✅ |
| T-ALL-3 | Cost, limits, live meters (6) | proxy logs tokens/cost/agent per task; meter; budget → interrupt + alert; meter/alert/task events over WebSocket; 429 → limit alert → waits → resumes by itself; usage summary | ✅ |
| T-ALL-4 | Multi-agent (10) | router reason; shared rules in every new prompt; Race & Judge → keep winner, loser's worktree deleted; Budget Dial haiku → step 2 → checks pass; pipeline claude:opus → codex → claude:sonnet; Night Shift starts once + cancel; quality watch on 4 models, scores, cleanup; profiles; setup recipe; morning brief + alert kinds | ✅ |
| T-ALL-5 | Memory and extras (7) | memory index/record/search/context/tree/node; **MCP server as a real process**: sees the UI's decision, its note shows in the UI, anchored line edit, stale anchor refused, no escape; push key / https-only / last message; remote worker (second real Netheron); shared browser (headless Chrome: blocks, hand to user, resume); preview proxy; project picker + clone refuses `file://` | ✅ |

**Not covered here (manual):** real Claude/Codex output (T-W2-4), push on the phone (T-W3-6), Pi live (T-W3-7), research calls that need the internet, and how the UI looks.

## 13. + terminals (B-047): [terminals.test.ts](../packages/daemon/test/terminals.test.ts)

| ID | What | Checks | Result |
|---|---|---|---|
| T-XT-1 | Launch commands | cmd → `cmd.exe`, PowerShell → `powershell.exe -NoLogo` (`pwsh` elsewhere), agents bare | ✅ |
| T-XT-2 | Open in a task's folder | runs in the task's worktree; typing over the WebSocket; listed as a terminal, never a task; ending keeps the tab with its exit code; closing removes it | ✅ |
| T-XT-3 | Without a task | known project folder only (other folders 400), unknown kinds 400, missing task 404 | ✅ |
| T-XT-4 | Make it a task | same process id, output from before kept, input through the task, its ending is the task's ending | ✅ |
| T-XT-5 | UI, by me in headless Chrome (throwaway server) | + menu names the folder; cmd and PowerShell tabs with badges; Netheron colours in dark and light; network faintly behind; Info → Make it a task; 3 tabs: + and tools stay visible | ✅ 2026-10-20 |
| T-XT-6 | Manual: real Claude Code / Codex / OpenCode from + | they start in the task's folder, signed in as you | ⏳ you |


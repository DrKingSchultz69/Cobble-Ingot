# Bugs & Problems Log

One entry per problem. Newest at the top.
**Status:** ✅ Fixed · 🟡 Fixed, needs verification · ⏸️ Ignored (on purpose) · ❌ Open

| ID | Problem | Status |
|---|---|---|
| B-028 | Picking a folder already linked to GitHub didn't show or use its repo | 🟡 Fixed, needs your check |
| B-027 | No way to work on a GitHub repo by URL; SSH clone fails on this network (port 22 blocked) | 🟡 Feature added; SSH needs your call |
| B-026 | Workspace UI (4142) wasn't running; only the proxy (4141) was up | ⏸️ Watching |
| B-025 | "+ Add project folder" did nothing, so no task could start | 🟡 Fixed, needs your check |
| B-024 | Security review: cross-site requests, preview open redirect, preview could reach the model proxy | ✅ |
| B-023 | Agent sessions don't survive a daemon restart | ⏸️ |
| B-022 | Phone layout: tab titles wrapped into tall stacks | ✅ |
| B-021 | Removed tasks leaked terminal pipes (daemon + test hang) | ✅ |
| B-020 | Claude asked permission for every shared-memory tool call | ✅ |
| B-019 | Codex refused shared-memory tools ("requires approval") | ✅ |
| B-018 | DuckDuckGo search now returns a bot check | ⏸️ (replaced) |
| B-017 | Task prompts cut at the first newline; `" & %` could break the command | ✅ |
| B-016 | Web page text lost paragraph breaks, so excerpts were always the page top | ✅ |
| B-015 | `mm run` inside a worktree created a separate memory project | ✅ |
| B-014 | Claude Code asks "trust this folder?" for every new worktree | ❌ Open — your call |
| B-013 | Codex's shell tool fails on this machine, even without mm | ❌ Open — external |
| B-012 | PDFs can't be ingested without `pdftotext` | ⏸️ |
| B-011 | Interactive Codex stuck on "Running hook" | ✅ (explained by B-013) |
| B-010 | Codex asked "Trust this folder?" for every new worktree | ✅ |
| B-009 | `mm run` printed a Node DEP0190 security warning | ✅ |
| B-008 | Codex input count still included cached tokens | ✅ |
| B-007 | Codex could only use API keys, not the ChatGPT plan | ✅ |
| B-006 | Calls logged before the cache fix show inflated cost | ⏸️ |
| B-005 | Rate-limited (429) calls show model `unknown` | ✅ |
| B-004 | Every Claude call sends ~535K tokens of context | 🟡 Mitigated |
| B-003 | "Prompt caching isn't working" | ✅ (not a bug) |
| B-002 | Cost overstated ~12× (cache tokens priced as full input) | ✅ |
| B-001 | `npm test` found no tests on Windows | ✅ |

---

## B-028 — A folder already linked to GitHub wasn't recognised
- **Found:** 2026-10-07. You asked that a folder already connected to GitHub be detected and set up automatically.
- **Fix:** mm reads the folder's `origin` remote (or its first remote, if there's no `origin`) and current branch. The picker shows `GitHub: owner/repo · branch main ✓`. A badge next to the project dropdown shows the same and links to the repo page. It understands `git@`, `https://`, `ssh://`, `ssh.github.com:443` and GitLab-style nested groups. A token saved inside an HTTPS remote URL is never sent to the browser. Nothing is written to the repo, so there's nothing to configure: tasks use the folder's existing git setup.
- **Verified:** T-I13 (automated). Needs your click-through (T-UI13).

## B-027 — Work on a GitHub repo by pasting its URL; SSH port 22 blocked here
- **Found:** 2026-10-07. You asked to paste an SSH or HTTPS link and work on the repo directly.
- **What:** mm only accepted local folders.
- **Fix:** The 📁 Add dialog has a **Clone from GitHub** box. mm runs `git clone` into the folder open in the browser below it (or `~/mm-projects`, or `MM_PROJECTS_DIR`) and sets that folder as the project. If the folder already holds a clone of the same URL, mm reuses it. A folder with the same name from a different repo is refused, never overwritten. Only `https://`, `ssh://` and `git@host:owner/repo` URLs are accepted (no `file://`, `ext::`, or hosts starting with `-`). Git never waits on a hidden password prompt.
- **Found while testing:** this network blocks SSH port 22 (`ssh: connect to host github.com port 22: Connection timed out`). GitHub's port 443 works with your key `id_ed25519_new`. mm now explains this in the error.
- **Options for SSH:**
  1. Add `Hostname ssh.github.com` + `Port 443` to the `github.com` entry in `~/.ssh/config`. This fixes clone, push and agents everywhere. **← recommended (needs your OK, it's your SSH config)**
  2. Use HTTPS URLs only.
- **Verified:** T-I12 (automated). Live: an HTTPS clone of `octocat/Hello-World` worked; the SSH clone failed on port 22, as described above.

## B-026 — Workspace UI (4142) wasn't running; only the proxy (4141) was up
- **Found:** 2026-10-07, your manual test: `localhost:4142` gave ERR_CONNECTION_REFUSED.
- **What:** An older `serve` process (PID 27100) was listening on 4141 only. 4142 and 4143 were not listening.
- **Cause:** Unknown. That process may have started before the UI existed, or the UI server failed without exiting the process.
- **Workaround:** Stopped it and ran `serve` again. All three ports came up.
- **Follow-up:** If it happens again, check the `serve` output for an error on the workspace line. A possible fix is to exit the whole process when any one of the three servers fails to listen.

## B-025 — "+ Add project folder" did nothing, so no task could start
- **Found:** 2026-10-07, your manual test (test 1).
- **What:** Picking "+ Add project folder…" from the top-right dropdown did nothing. Without a project, the New task form refuses to start.
- **Cause:** With no projects yet, "+ Add" was the only option and was already selected. Picking an already selected option fires no `change` event. The handler also relied on the browser's `prompt()` popup and a pasted full path.
- **Fix:** A **📁 Add** button next to the dropdown opens a folder browser (drives, home, sub-folders, git repos marked, path box for pasting). The dropdown now shows "No project yet" first, so "+ Add" also works. New endpoint `GET /api/fs/dirs` lists folder names only, behind the token.
- **Follow-up bug (found by you):** the folder names were squashed flat and unreadable. The list is a fixed-height flex column and rows had `overflow: hidden`, so they shrank instead of scrolling. Fixed with `flex: none` on `.list .item`. This also covers the other side lists.
- **Verified:** T-I11 (automated), plus a live call to the endpoint. Needs your click-through (T-UI11).

## B-024 — Security review: cross-site requests, open redirect, model proxy via preview
- **Found:** 2026-10-07, in the self code review (CR-1).
- **What:** (1) Another website open in the same browser could send POSTs or open a WebSocket to the workspace, and the browser might attach the login cookie. (2) `/__mm/target?path=//evil.site` redirected off-site. (3) The preview proxy would forward to *any* local port, including the model proxy (:4141), which carries credentials.
- **Why:** The first server version only checked the token.
- **Fix:** Origin check on WebSocket and every non-GET API call (also accepts `X-Forwarded-Host` for tunnels); redirect only to same-site paths; preview refuses mm's own ports. The proxy itself still listens only on 127.0.0.1.
- **Verified:** T-I6, T-I10 in [TESTS.md](TESTS.md).
- **Not done:** the phone link carries the token in the URL once (then it's an HttpOnly cookie). That's fine on your own phone; don't share the link.

## B-023 — Agent sessions don't survive a daemon restart
- **What:** If `mm serve` restarts, running agents stop. Tasks are marked `stopped`, the terminal shows "session not running", and worktrees and branches stay.
- **Options:** (1) a separate always-on process that holds the terminals (like tmux), (2) re-launch with each CLI's "resume" flag, (3) accept it for v1. **← chosen**
- **Why ignored for now:** Options 1 and 2 add a second process or depend on each CLI's resume support. The work isn't lost (it's in the worktree). Revisit if you restart the daemon often.

## B-022 — Phone layout: tab titles wrapped into tall stacks
- **What:** At 375px wide, each open-task tab wrapped its title over 4 lines and the pane header took 3 lines.
- **Fix:** Tabs and headers stay on one line with "…" ([style.css](../apps/web/style.css)). Checked with the 375×812 mobile viewport.

## B-021 — Removed tasks leaked terminal pipes
- **Found:** The server test process never exited.
- **What:** On Windows, node-pty (ConPTY) keeps its pipes open after the agent exits. Removing a task deleted it from the map without releasing them, so a long-running daemon slowly leaks handles.
- **Options:** (1) release the pipes on remove and shutdown **← chosen**, (2) `node --test --test-force-exit`. Rejected: it crashed the test process on Windows (0xC0000409) and only hides the leak.
- **Fix:** `PtySession.destroy()` is called from `remove()` and `dispose()` ([pty.ts](../packages/daemon/src/pty.ts)).

## B-020 — Claude asked permission for every shared-memory tool call
- **What:** In the workspace, Claude stopped at "Do you want to proceed?" before each `mm_record` or `mm_get_context`.
- **Fix:** Each Claude task gets a settings file allowing `mcp__mm` only. File edits and shell commands still ask as usual.

## B-019 — Codex refused shared-memory tools
- **What:** `codex exec` said "MCP tool call requires approval, but approval policy is never" for our tools.
- **Fix:** Our MCP server is passed with `default_tools_approval_mode="approve"`. Verified live: Codex called `mm_get_context` and `mm_record` (T-M10).
- **Source:** [Codex MCP docs](https://developers.openai.com/codex/mcp)

## B-018 — DuckDuckGo search now returns a bot check
- **What:** The no-key web search fallback scraped DuckDuckGo's HTML page. It now answers scripts with HTTP 202 and a bot-check page.
- **Options:** (1) work around the bot check. **Rejected:** we don't evade bot detection. (2) Use Claude Code's built-in WebSearch through the subscription, plus Wikipedia. **← chosen** (3) Require a Tavily or Brave key.
- **Fix:** Default search is now `claude-websearch+wikipedia`. Setting `TAVILY_API_KEY`, `BRAVE_API_KEY` or `SEARXNG_URL` switches to a dedicated API. Live answers work (T-M13).

## B-017 — Task prompts cut at the first newline; quotes could break the command
- **Found:** In the Claude workspace test, the text after the line break ("Shared memory is available…") never reached Claude.
- **Why:** Agents start through `cmd.exe` (needed for `.cmd` shims). `cmd.exe` ends a command at a newline, and the naive quoting (`\"`) doesn't stop cmd from acting on `& | > %`. A prompt like `fix "a & b"` could split into two commands.
- **Options:** (1) escape properly: argv-quote each argument, then ^-escape every cmd metacharacter, twice for `.cmd` targets (the method the cross-spawn library uses) **← chosen**, (2) resolve each shim to its real `.js`/`.exe` (brittle), (3) write prompts to a file (CLIs take them as arguments).
- **Fix:** `commandLine()` in [agents.ts](../packages/daemon/src/agents.ts). Newlines become spaces, because cmd can't carry them.
- **Verified:** T-U-A2/A3 send `" & | > % ^ ! \` and newlines through a real `cmd.exe` and a `.cmd` shim and compare argv exactly. Live: Codex received `& 100%` intact.

## B-016 — Web page text lost paragraph breaks
- **Found:** By a unit test (T-U-R4).
- **What:** `htmlToText()` collapsed all whitespace, newlines included. `bestExcerpt()` splits on newlines to find the relevant paragraph, so it always returned the top of the page (menus, intros) instead of the part that answers the question.
- **Fix:** Keep line breaks, and score each paragraph by its own matches plus the next two ([search.ts](../packages/research/src/search.ts), [research.ts](../packages/research/src/research.ts)).

## B-015 — `mm run` inside a worktree created a separate memory project
- **What:** Running an agent from inside a worktree folder indexed that folder as its own project, so its notes didn't reach the main repo's memory.
- **Fix:** Memory is keyed by the main checkout (`git rev-parse --git-common-dir`), so every worktree of a repo shares one memory.

## B-014 — Claude Code asks "trust this folder?" for every new worktree
- **What:** Each task gets a fresh worktree folder, and interactive Claude Code shows its trust dialog once per folder. You answer it with Enter (or the phone's Enter button).
- **Options:**
  1. Leave it. One keypress per task, and Claude's safety check stays intact. **← current**
  2. Have mm mark worktree folders as trusted in `~/.claude.json` before launch. That removes the prompt, but mm would be editing Claude's own config file while other Claude sessions write to it (risk of corrupting it).
  3. Reuse a few long-lived worktree folders instead of one per task.
- **Needs your decision:** reply with 1, 2 or 3.

## B-013 — Codex's shell tool fails on this machine, even without mm
- **What:** Codex fails every shell command with "Failed to create unified exec process" / "code-mode host closed its stdout". Its MCP tools work.
- **Why (likely):** Codex's Windows sandbox can't start its process host from the environment this build session ran in. Plain `codex exec` without mm, in a folder outside Temp, fails the same way.
- **Status:** Not an mm bug, but it blocks Codex from editing files here.
- **To check:** run `codex exec "run git --version"` in your normal terminal. If that works, it's specific to how I ran things.

## B-012 — PDFs can't be ingested without `pdftotext`
- **What:** Learn → Add documents reads md, txt, html, code and json. PDFs need poppler's `pdftotext`, which isn't installed; they're listed as skipped with that hint.
- **Why ignored:** A JS PDF parser is a large dependency. Installing poppler makes PDFs work with no code change.

## B-011 — Interactive Codex stuck on "Running hook"
- **What:** In the workspace terminal, Codex showed "Working… Running hook" for minutes.
- **Real cause:** Not the hooks. Your hooks are Orca's `codex-hook.cmd`, which exits immediately when Orca isn't running. Codex was retrying shell commands that failed because of B-013.

## B-010 — Codex asked "Trust this folder?" for every new worktree
- **What:** Every task's new worktree stopped at Codex's trust screen.
- **Fix:** mm passes `-c projects.'<repo>'.trust_level="trusted"` for the project you chose, which Codex applies to linked worktrees. Verified live: a new task started straight into the prompt.

## B-009 — `mm run` printed a Node DEP0190 security warning
- **Found:** 2026-10-07, during T-M6.
- **What:** `spawn(cmd, args, { shell: true })` makes Node warn that the arguments are joined without escaping.
- **Why:** Windows needs `shell: true` to run `.cmd` shims (`codex.cmd`, `opencode.cmd`).
- **Options:** (1) quote the arguments ourselves and pass one command string **← chosen**, (2) find the real `.exe`/`.js` behind each shim (brittle), (3) silence the warning (hides the real risk).
- **Fix:** [cli.ts](../packages/daemon/src/cli.ts) builds one quoted command line.

## B-008 — Codex input count still included cached tokens
- **Found:** 2026-10-07, T-M4: input showed 13,181 with cache_read 5,888. Codex itself reported 13,186 total, so cached tokens were counted twice.
- **Why:** The Responses stream sends `usage` in several events. An earlier event had `input_tokens` without `input_tokens_details`, and the per-event "max" kept the larger un-subtracted value.
- **Options:** (1) track the max of each *raw* field and subtract once at the end **← chosen**, (2) use only the last event (breaks Anthropic, which splits input and output across events).
- **Fix:** [usage.ts](../packages/daemon/src/usage.ts), plus a regression test (T-U8).

## B-007 — Codex could only use API keys, not the ChatGPT plan
- **Found:** 2026-10-07, when the user said both subscriptions and API keys must work.
- **What:** `mm run codex` pointed Codex at `api.openai.com` with `OPENAI_API_KEY`. A ChatGPT-plan login uses a different backend (`chatgpt.com/backend-api/codex`), so subscription users couldn't route through the proxy.
- **Why it happened:** The first version only planned for API keys.
- **Options considered:**
  1. Support both: subscription by default, API key when `OPENAI_API_KEY` is set, with an `MM_CODEX_AUTH=sub|key` override. **← chosen**
  2. Make the user pick a mode every time. Rejected: an extra step on every launch.
  3. API keys only. Rejected: the user requires both.
- **Fix:** [agents.ts](../packages/daemon/src/agents.ts) builds a different Codex provider for each mode; [config.ts](../packages/daemon/src/config.ts) adds the `chatgpt` upstream.
- **Verified:** T-M4 passed 2026-10-07: `codex exec` ran through the proxy and was logged as `auth=subscription`, model `gpt-6-astra`. API-key mode (T-M5) is blocked: no `OPENAI_API_KEY` on this machine.

## B-006 — Calls logged before the cache fix show inflated cost
- **Found:** 2026-10-07
- **What:** Rows logged before B-002 was fixed have cached tokens added into `input` and priced at the full rate.
- **Why:** The original split was never stored, so it can't be recovered.
- **Options:** (1) delete the old rows, (2) estimate a correction, (3) leave them. **← chosen: leave them**
- **Why ignored:** It's test data from a single day, and real usage will quickly outweigh it. Deleting it gains nothing and loses history.

## B-005 — Rate-limited (429) calls show model `unknown`
- **Found:** 2026-10-07
- **What:** When Anthropic rejects a call with a 429, the error response has no model name, so the row says `unknown`.
- **Options:** (1) read the model from the *request* body instead, (2) leave it.
- **Why it was ignored at first:** It only affects a label, and these calls cost $0.
- **Fixed in Phase 4:** The proxy now buffers each request (needed for failover), so it reads the model from the request body when the response has none (T-U12).

## B-004 — Every Claude call sends ~535K tokens of context
- **Found:** 2026-10-07, from `mm usage` per-call rows.
- **What:** Before the user types anything, Claude Code sends about 535K tokens: the system prompt plus definitions for hundreds of MCP tools (Vercel, Supabase, Shopify, Higgsfield, Atlassian…) and about 150 skills.
- **Why:** The user's global Claude Code setup has many plugins and MCP servers turned on.
- **Effects:** A new session costs about $10 at Opus API prices (but $0 extra on a subscription); rate limits run out faster (the 429s); replies are slower.
- **Options:**
  1. Turn off unused MCP servers and plugins for this project.
  2. Use Sonnet for routine work (about 5× cheaper).
  3. Later, have our app control which tools each agent loads.
  4. Ignore it for now. **← chosen**
- **Why it was ignored at first:** You're on a subscription, so there's no real spend.
- **Mitigated (Phase 3/7):** Option 3 is built. Workspace tasks have a **lean** switch (on by default) that loads only mm's memory MCP server: ~60K tokens instead of 535K (T-M11). Research calls run headless with no tools, MCP or skills: ~5K tokens. Your normal `claude` outside mm is unchanged.

## B-003 — "Prompt caching isn't working" (not a bug)
- **Found:** 2026-10-07
- **What:** After the B-002 fix, `mm usage` still showed 0 cache reads.
- **Real cause:** The proxy process had started at 04:27, *before* the fix, so it was still running the old code.
- **Solution:** Restart the proxy. After the restart, calls #14 and #15 showed 535K cache reads at $0.82 each.
- **Lesson / follow-up:** Code changes need a proxy restart. Possible improvement: run the dev proxy with `node --watch` so it restarts automatically (not done yet).

## B-002 — Cost overstated ~12× (cache tokens priced as full input)
- **Found:** 2026-10-07, first real Claude run: $16 for 171 output tokens.
- **What:** [usage.ts](../packages/daemon/src/usage.ts) added `cache_read_input_tokens` and `cache_creation_input_tokens` into `input`, and the cost calculation charged all of it at the full input price.
- **Why:** The first version didn't account for Anthropic billing cached tokens differently (reads at 0.1×, writes at 1.25×).
- **Options:**
  1. Store cache read and cache write as separate columns and price each correctly. **← chosen**
  2. Leave cached tokens out of the cost entirely. Rejected: it under-reports, because cache writes cost *more* than normal input.
  3. Keep one combined input count with an averaged rate. Rejected: inaccurate, and it hides whether caching is working.
- **Fix:** Separate `cache_read_tokens` and `cache_write_tokens` columns (auto-migrated) and a corrected `costFor()`. OpenAI's `cached_tokens` is also subtracted from input.
- **Verified:** Unit tests plus a real Claude run (calls #14 and #15).

## B-001 — `npm test` found no tests on Windows
- **Found:** 2026-10-07, first test run.
- **What:** `node --test packages/daemon/test/` failed with `MODULE_NOT_FOUND` on Windows.
- **Fix:** Use an explicit glob: `node --test packages/daemon/test/*.test.ts`.

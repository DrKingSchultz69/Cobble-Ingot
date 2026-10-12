# Bugs & Problems Log

One entry per problem. Newest at the top.
**Status:** ✅ Fixed · 🟡 Fixed, needs verification · ⏸️ Ignored (on purpose) · ❌ Open

| ID | Problem | Status |
|---|---|---|
| B-041 | **Shared browser, step 1 of 3**: browser core (real Chrome, own profile, hard blocks, take over/resume) | 🟡 Core built + tested; agent tools and UI next |
| B-040 | **Wave 3**: hash-anchored edits, LSP-lite diagnostics, Pi / Oh My Pi adapters, web push, remote workers | 🟡 Built + tested; phone/real-agent checks pending |
| B-039 | **Wave 2 #2–#7**: Budget Dial, shared rules, account profiles, Night Shift + pipelines, Race & Judge, quality watch | 🟡 Built + tested; real agents pending |
| B-038 | **Wave 2 #1**: hand-off to another agent with a briefing (manual + automatic) | 🟡 Built + tested; real agents pending |
| B-037 | A real Anthropic 429 had no reset hint the parser understood ("reset time unknown") | 🟡 Headers now recorded; parser update after the next real 429 |
| B-036 | **Wave 1** of the research solutions: safety + cost visibility (11 features) | 🟡 Built + tested; real-agent use pending |
| B-035 | Product renamed to **Netheron** (was "mm" / Cobble Ingot) | ✅ Visible name |
| B-034 | No way to see or change whether notifications are on | ✅ |
| B-033 | Code editor crammed into the right panel; terminal squeezed, tabs scrolled sideways | ✅ Redesigned (VS Code layout) |
| B-032 | Page newer than the running server → "not found" in the Code tab, with no explanation | ✅ |
| B-031 | No way to look at or edit a task's files inside mm (IDE request) | ✅ Built (layout replaced by B-033) |
| B-030 | Removing a task while its agent was running crashed the whole mm server (Windows) | ✅ |
| B-029 | Diff tab only updated when you clicked Refresh | 🟡 Fixed, needs your check |
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
| B-014 | Claude Code asks "trust this folder?" for every new worktree | ✅ Option 2 (Wave 1) |
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

## B-045 — Calmer UI (ADHD-friendly): Home view + 3-step New task
- **When:** 2026-10-11. Your goal: every feature still there, but not all at once. Your choices: a new **Home** view that opens first and shows only what needs you; New task as steps (**1 What → 2 Who → 3 Extras**). Additions you approved: the list is worked out from live task state (rows leave by themselves), a count on the Home tab, the last agent + model remembered, other views unchanged for now.
- **Built:**
  - [index.html](../apps/web/index.html) / [app.js](../apps/web/app.js): **Home** tab with a count badge. Rows, most urgent first: 🌐 asked for you in the browser, ❌ stuck / failed (last 24 h), ⏸ budget reached, ⏸ paused by a usage limit, 💬 waiting for your reply, ✅ done in the last 24 h (review). One button per row opens the task. Below: "N running · N scheduled · N tasks" and one big **＋ New task**. Netheron opens on Home; a `#task=` link still opens that task.
  - New task wizard: step 1 prompt + project (its own project list, synced with the top bar), step 2 agent, model, account, max $ / min, 🌐; step 3 four closed groups ⏰ When, 👥 Teamwork (race, auto hand-off, pipeline), ✅ Checks, ⚙ Machine & worktree. **▶ Start works on every step.** Step buttons show what's chosen ("2 Who: Codex · 🌐", "3 Extras: 👥✅") so a ticked option is never out of sight.
- **Bugs found while building (fixed):** on a 375 px phone the top bar was 454 px wide (already too wide before; the Home tab made it worse). The views now scroll sideways inside the bar, and 📁 Add hides on phones (the project list has "+ Add project folder…"). The Checks list stuck out of the side panel.
- **Not changed yet:** Research, Learn, Memory, Usage, right panel. A calmer Usage page is the next design step.
- **Verified:** T-UI19 (Chrome, desktop + 375 px).

## B-044 — Shared browser, step 3 of 3: live Browser tab
- **When:** 2026-10-11. Your choices: a right-side tab, clickable while you have control (so you can log in from the phone), smooth (~10 frames/s). Additions you approved: frames only while the tab is open, your input only while you have control and without the agent's blocks, a Type box for phones, the tab only for 🌐 tasks.
- **Built:**
  - [browser.ts](../packages/daemon/src/browser.ts): live view through Chrome's screencast. A frame comes only when the page changes, at most one per 100 ms. Watching never opens a window by itself; frames start when the agent first browses. `userInput()` takes your click, scroll, key or text, and is refused while the agent drives.
  - [server.ts](../packages/daemon/src/server.ts): WebSocket `watch-browser` / `unwatch-browser` / `browser-input`. A slow connection (phone) skips frames instead of piling them up.
  - UI: a **🌐 Browser** tab next to Info/Diff/Preview, only on 🌐 tasks. The panel widens while it's open. It shows the page address, who's driving, Show window, Take over and Resume. While you drive, the picture gets an orange frame and takes clicks, double-clicks, scrolling and keys. The Type… box and Enter button are there for phones. The board says "🌐 needs you" (the agent asked) or "🌐 you're driving" (you took over).
- **Bugs found while building (fixed):** Chrome can have 2 frames in flight, so frames sometimes came 24 ms apart. Netheron now gates them itself and always sends the newest. The board said "needs you" even when you took over yourself.
- **Not covered:** dragging, right-click, and copy/paste from the picture (use Show window on the PC for those).
- **Verified:** T-BR-12…14; `npm test` 94/94; `check-all` 49/49.

## B-043 — Shared browser, step 2 of 3: agents can use it
- **When:** 2026-10-11. Your choices: opt-in per task, and the window stays open after `finish`. Additions you approved: tools go through Netheron's server with the saved token, JPEG screenshots, ask_user → Needs you + 🔔/push, Resume types "Done, continue", Claude doesn't ask per browser click, no browser for Pi/Oh My Pi/Shell.
- **Built:**
  - **New task → 🌐 Browser.** The agent gets 10 tools: `browser_screenshot`, `browser_click`, `browser_double_click`, `browser_type_text`, `browser_press_key`, `browser_scroll`, `browser_navigate`, `browser_wait`, `browser_ask_user`, `browser_finish`. Your browsing rules are added to its prompt. ([mcp.ts](../packages/memory/src/mcp.ts), [tasks.ts](../packages/daemon/src/tasks.ts))
  - Each tool call goes to the server (`/api/tasks/:id/browser…`), which runs it through step 1's blocks and returns a JPEG screenshot. A blocked action reaches the agent as a tool error that says what to do instead. ([server.ts](../packages/daemon/src/server.ts))
  - `browser_ask_user` → you get the browser, the board shows **🌐 needs you**, and 🔔 + phone push fire. The agent can't act or even take screenshots until you press **Resume**. Resume then types "Done, continue…" into the agent.
  - **Info tab:** Show window, Take over (any time) and Resume. Chrome starts only when a 🌐 task first uses it. Removing the task closes its window.
  - Hand-off keeps 🌐 and never picks an agent without MCP.
- **Known limits:** the blocks stop mistakes, not a hostile agent (it runs as you). If Netheron is closed while its Chrome stays open, the next start can't connect until that Chrome window is closed. There's no live view inside Netheron yet (step 3).
- **Verified:** 5 new tests (T-BR-6…10), `npm test` 92/92, `check-all` 49/49. Not tried with a real Claude yet (T-BR-11).

## B-042 — Full functionality check script; checkpoint lands just after "idle"
- **When:** 2026-10-11. You asked for a detailed check of every feature and picked a one-command smoke script that keeps going on failure.
- **Built:** [check-all.ts](../scripts/check-all.ts). 49 checks in 5 groups through the real API, WebSocket, proxy and MCP process, with a fake model API and a fake agent (TESTS.md section 12). About 50 s, no quota.
- **Found while running it (known, low impact, not changed):** a task turns **idle** a moment (about 0.1–0.5 s) *before* its "after turn" checkpoint is saved. If a new message reaches the agent and it edits a file inside that gap, the checkpoint already contains the edit, so the edit guard can't flag it and Restore can't undo it. A person can't type that fast. Queued messages wait for the checkpoint. So the gap only hit the script, which typed instantly: 2 of 6 runs failed on the edit-guard check. **Fix in the check:** wait until the checkpoint list stops changing before typing. Possible product fix later: mark the task idle only after the checkpoint is saved.
- **Script bug fixed:** the MCP path wasn't URL-decoded (the space in "Multimodel Manaagement").
- **Verified:** 49/49 in 6 runs in a row; `npm test` 87/87.

## B-041 — Shared browser, step 1 of 3: browser core
- **When:** 2026-10-11. Your design (learning mode): agents work from screenshots with one action per turn; ask_user / Take over hard-blocks the agent in code; Resume hands back; separate Netheron-only Chrome profile; never type passwords, never click pay / place order / buy / delete.
- **Built:** [browser.ts](../packages/daemon/src/browser.ts). Starts Chrome or Edge with its own profile (`~/.mm/browser-profile`) and drives it over Chrome's DevTools Protocol (no Playwright download). Actions: click, double_click, type_text, press_key, scroll, navigate, wait. Each one returns a fresh screenshot. Screenshot pixels equal click coordinates.
- **Bugs found while building (fixed):**
  - Clicking a blank spot was blocked as "Delete": the check read the whole page's text. Now it reads only the clicked button, or a small element's own text.
  - Screenshots of a background tab took **15 s** (Chrome stops drawing hidden tabs). Chrome's "don't throttle" switches didn't help. **Fix: each task gets its own Chrome window** instead of a tab: 0.08 s.
- **Not yet:** agents can't call it yet (step 2), and there's no Browser tab in the UI yet (step 3).
- **Verified:** 4 tests on real headless Chrome; full suite 87/87.

## B-040 — Wave 3: Oh My Pi ideas + reach beyond this PC
- **When:** 2026-10-10.
- **Built:**
  - **P02 S1 · Hash-anchored edits** ([hashline.ts](../packages/memory/src/hashline.ts), idea credit: Oh My Pi). Every agent with MCP gets `mm_read_lines` (lines tagged `12:a3f9|code`) and `mm_edit_lines` (replace/insert by those tags). If the lines changed since the read, the edit is **refused**, so it can't hit the wrong place or wipe a newer change. Keeps CRLF/LF. Can't leave the task folder. For Claude, reading is auto-approved; **editing still asks**, like any edit.
  - **P32 S1 · LSP-lite** ([diagnostics.ts](../packages/daemon/src/diagnostics.ts)): `mm_diagnostics` runs the project's type checker/linter (typecheck/lint script, `tsc --noEmit`, `cargo check`, `go vet`, `pyflakes`) in the agent's folder and returns real `file:line:col` errors. Code tab → **Check code** shows them as red/yellow squiggles plus a clickable list. (Not a full language server: no go-to-definition yet.)
  - **P28 S1 · Pi and Oh My Pi adapters:** new agents `pi` and `omp` (credit Mario Zechner / can1357). Launched as `pi [--model m] "prompt"`. They have no MCP, so Netheron puts the project rules **and** shared memory into their first prompt. The router uses them only if installed. Info warns that their usage isn't on the meter (they call providers directly). **Not installed on this PC, so not tried live.**
  - **P24 S2 · Web push** ([push.ts](../packages/daemon/src/push.ts), [sw.js](../apps/web/sw.js)): 🔔 → **Also when Netheron is closed (push)**. A service worker shows notifications with no Netheron tab open (desktop, or the phone over `mm tunnel` https). Uses VAPID signing, no message payload (the worker fetches the text from Netheron with your login cookie). Dead devices are dropped. No duplicate pop-ups while a tab is open.
  - **P25 S2 · Remote workers, first slice** ([workers.ts](../packages/daemon/src/workers.ts)): Usage → **Remote workers** → paste another Netheron's link (`http://host:4142/?token=…`, directly, via tunnel, or `ssh -L`). Its tasks show on your board (🖥 column, refreshed every 10 s, "offline" when unreachable). New task → **Run on** that machine. Clicking a remote task opens that machine's Netheron in a new tab for terminal/diff/code. The token stays on the server; the UI never receives it except in that open link.
- **Not in this slice:** remote terminals inside *this* UI (you use the remote's own tab); full language server (definitions, rename).
- **Verified:** 83/83 automated tests, twice (T-W3-1…6). The remote-worker test runs two real Netheron servers talking to each other.

## B-039 — Wave 2 #2–#7: the rest of "cross-vendor brains"
- **When:** 2026-10-09/10, after you asked to implement every feature on the list.
- **Built (one entry per solution note in `docs/research/solutions/`):**
  - **Checks** ([verify.ts](../packages/daemon/src/verify.ts)): a project's check command (auto-detected: `npm test`, typecheck/`tsc --noEmit`, `cargo test`, `go test`, `pytest`; or set in ⚙ Worktree setup). New task → **After each turn: run checks**. It runs only if files changed since the last run. Info shows ✓/✗ and has **Run now**.
  - **P07 · Budget Dial:** **After each turn → Budget Dial** starts on the smallest model that suits the task (model tiers 1–3: Haiku/free/DeepSeek → Sonnet/Codex → Opus). When the checks fail, it hands off one step up the ladder, with the failing output in the briefing. It stops climbing when the checks pass, the budget is reached, or the ladder ends. Info shows the ladder with the current step.
  - **P26 · Shared rules:** Memory → Add → **rule**. Every agent, whatever its vendor, gets the project's rules at the top of its prompt and in `mm_get_context`. Info lists the exact rules each task received (P26 S2).
  - **P13 · Account profiles** ([profiles.ts](../packages/daemon/src/profiles.ts)): **👤 Accounts** creates several logins per agent. Each has its own config folder (`CLAUDE_CONFIG_DIR` / `CODEX_HOME` / XDG for OpenCode), so all stay signed in. **Sign in** opens the agent's login inside Netheron. **Use for this project** sets a default; New task has an **Account** picker. A profile for another agent is refused before anything is created. Deleting closes its sign-in terminal and refuses while real tasks use it.
  - **P23 · Night Shift:** New task → **When: at a time / after the limit resets** (+ every day). Items appear under **Scheduled** on the board (cancel any). Usage → **Brief** shows what ran (overnight by default), with status, cost, checks and alerts.
  - **P23 · Pipelines:** New task → **Pipeline: Plan → Build → Review** (Claude Opus plans → Codex builds → Claude Sonnet reviews; swaps in what's installed). All steps run in one folder. Each step ends with `STEP DONE` (and passing checks, if on), then hands off with the next instruction. Info shows the steps.
  - **P34 · Race & Judge:** New task → **Race & Judge**. The same task runs on up to 3 different agents, each in its own worktree. When each has finished a turn, Netheron runs the checks in every folder and scores them: checks pass > smaller change > lower cost. Info shows the table (★ winner); **Keep** removes the others with their worktrees.
  - **P01 · Quality watch:** Usage → **Quality watch**. Add evals (a small task + a check that only passes when it's done right). **Run** sends each eval to every available model, records pass/fail, and removes the eval tasks again. Shows pass rate per model (30 days, last 5, before). Alert when a model drops ≥ 30 points from ≥ 60%. **The router counts eval results**, so it prefers models that currently pass on *your* code.
- **Bugs found while building (fixed):**
  - Scheduler race: overlapping 150 ms ticks could start a scheduled task **twice** (one even after shutdown). Fixed: one scheduler pass at a time, and a task starts only if its claim succeeded. Tested: "started exactly once".
  - Deleting an account while its sign-in terminal was open failed on Windows (folder in use). Fixed by closing it first.
  - An invalid profile choice used to be checked after the worktree was made. Fixed: checked first.
- **Verified:** 76/76 automated tests, twice (T-W2-5…10).
- **Not yet with real agents:** all of this was tested with fake agents and fake model calls. You're near your weekly Claude limit, so quality watch, races and the dial (which run several agents) haven't been run for real.

## B-038 — Wave 2 #1: hand-off to another agent with a briefing
- **When:** 2026-10-09. First Wave 2 feature; solves P10 S1 (failover with context) and P46 (Stuck Rescue), both in `docs/research/solutions/`.
- **What it does:**
  - **Hand off now** (stuck banner, limit banner) stops the agent and starts a **different** agent in the **same folder and branch**, with a briefing: why it's taking over, the original task, files changed so far, decisions recorded in shared memory, and the last ~25 lines of the previous agent's terminal. "Check the current state, don't start over."
  - **Auto hand-off** (checkbox under New task): when the task looks stuck or hits a usage limit, this happens by itself. It never goes back to an agent already tried in the chain (router `exclude`). If nobody is left, it posts an alert instead of looping.
  - The two tasks link to each other (↪ / ↩ banners). Budget and auto hand-off settings carry over.
  - Removing the first task with its worktree **keeps the folder** while a hand-off task still uses it, and passes ownership (and later cleanup) to that task.
- **B-037 follow-up:** the proxy now saves a 429's rate-limit headers (`calls.limit_info`), so the next real limit shows exactly what the provider sent and the reset parser can be fixed from that.
- **Verified:** 69/69 tests, twice (T-W2-1…3). Router exclusion; the briefing contains the original task, reason, changed file, recorded decision and last terminal output; the old agent is stopped; auto hand-off on stuck → codex; codex limited with nobody left → alert, no loop; folder ownership kept on remove.
- **Not yet with real agents:** you're at 93% of your weekly Claude limit (Claude's own message on 2026-10-09), so no live Claude→Codex hand-off was run. T-W2-4 is open for your next real stuck/limited task.

## B-037 — A real 429 came with no reset time we could read
- **Found:** 2026-10-09, T-W1-8 (real Claude Haiku task). One call returned 429; the limit alert said "reset time unknown". Claude's own screen showed "93% of your weekly limit · resets Oct 10, 11:30pm".
- **Why:** the proxy keeps the 429's reset value only if it matches the formats in `ratelimit.ts`; it doesn't record which headers actually arrived, so we can't see what Anthropic sent.
- **Fix (Wave 2 #1, done):** store the 429's rate-limit headers (names containing ratelimit/retry/reset) with the call, show them in the task's error log, and extend the parser to cover them.
- **Effect today:** harmless. Claude retried by itself, and Netheron saw the next successful call and cancelled its 5-minute default pause.

## B-036 — Wave 1: safe + cost-visible (from the research solutions)
- **When:** 2026-10-09. You asked to implement all the solution features. There are 111 options still to build (about 220 working days), so we agreed on waves, highest value first. You chose **Wave 1**.
- **Built (each linked to its solution note in `docs/research/solutions/`):**
  - **P02 · Edit guard:** after every agent turn, the folder is compared with the last checkpoint. Flags a file that was emptied, lost ≥ 50% of its lines, or got agent reasoning written into code, and a renamed/missing `.git`. You get a banner + notification with **Restore file** / **Restore whole folder**. [checkpoints.ts](../packages/daemon/src/checkpoints.ts)
  - **P03 · Checkpoints:** a snapshot at task start and after every turn, stored as hidden git refs (`refs/netheron/<task>/<n>`) built with a temporary index, so the agent's own index, branch and stash are never touched. Byte-exact (no CRLF conversion). Restoring takes a safety checkpoint first. Keeps the last 50. Deleted when the task is removed.
  - **P07/P08 · Alarms:** a task burning > 3M tokens or > $2 in 5 minutes; an agent's prompt-cache hit rate falling from ≥ 50% to < 20%; a subscription agent suddenly billed to an API key (planned failovers excluded); a rate limit hit, with its reset time. Each has a cool-down, shows as a notification, and is listed in Usage → **Alerts**. [alarms.ts](../packages/daemon/src/alarms.ts)
  - **P09 · Live meter + reset times:** the pane header shows tokens in/out, cost, context size and tokens/second live; Info shows the full meter. The proxy now reads reset hints from 429 responses (`retry-after`, `*-reset` as epoch, ISO date or `6m0s`-style durations). [ratelimit.ts](../packages/daemon/src/ratelimit.ts)
  - **P10 · Pause until the limit resets:** when a task hits a 429 with no failover, it waits and, at the reset time, asks the agent to continue (**Don't resume** cancels).
  - **P46 · Budget + stuck detection:** optional max $ / max minutes per task. When reached, the agent is interrupted once (Esc) and you're asked. "Looks stuck" means 5 failed calls in 5 minutes, or no successful model call for 10 minutes while running. It shows a **Hand off to another agent** button that pre-fills a hand-off to a different agent.
  - **P20 · Message queue:** follow-ups wait in a per-task queue and are sent when the agent is free (sent right away if it's already waiting). Unsent ones can be removed.
  - **P36 · Diff comments + receipt:** click any line in the Diff tab to send a comment to the agent (queued if it's busy). **Receipt** per task: duration, cost, files, models, memory records, alerts, checkpoints, messages, with **Copy as Markdown**.
  - **P35 · Worktree setup recipe:** per project, files to copy (default: root `.env*`), folders to link (default: `node_modules`, as a junction) and an optional command, run when a task's worktree is created. Links are removed before a worktree is deleted, so deleting can never reach into your main checkout. **⚙ Worktree setup** under New task. [setup.ts](../packages/daemon/src/setup.ts)
  - **P44 / B-014 · Claude pre-trust (option 2):** Netheron marks only its own worktree folders as trusted in `~/.claude.json`: one-time backup (`.claude.json.netheron-backup`), re-read right before writing, temp file + rename, retries if Claude wrote meanwhile, never writes if the file isn't valid JSON. The entry is removed again with the worktree. [trust.ts](../packages/daemon/src/trust.ts)
- **Bug found while building:** the server tests ran fake "claude" tasks and wrote their temp folders into the **real** `~/.claude.json`. They removed them again (0 left; checked), but a backup file was created. Fix: tests use their own home folder, and Netheron never writes Claude trust during a test run unless a test home is given.
- **Verified:**
  - 66/66 automated tests, twice (T-W1-1…7).
  - Chrome on an isolated test copy (own data folder, ports 5141–5143), with a shell task in a scratch repo. The emptied `app.ts` was flagged → **Restore file** → back to 30 lines on disk. The queued message was delivered and ran. A diff comment on `app.ts:31` was queued while busy, then delivered. The receipt, setup dialog defaults and Usage alerts all rendered.
- **Not yet seen with real agents:** live meter values, budget/stuck/limit banners and the Claude trust skip were tested with a fake agent and fake model calls, not with real Claude/Codex sessions.

## B-035 — Product renamed to Netheron
- **When:** 2026-10-08. You picked **Netheron** after comparing Minecraft-style names (Wispcraft, Glint, Kiln and Mending were taken or clashed).
- **Availability (registry lookups, 2026-10-08):** netheron.dev / .app / .io / .ai unregistered, .com taken. npm `netheron` free. GitHub `netheron` taken; `netheronhq` and `getnetheron` free. Prices weren't checked.
- **Changed (visible name only):** browser title, the top-bar logo (**N** + "Netheron"), the app manifest and icon, notification titles, the restart banner, other UI messages, the login page, the preview messages, the CLI help header and the README title. The launcher is now **`start-netheron.cmd`**; `start-mm.cmd` was removed.
- **Not changed, on purpose:** the `mm` command, `MM_*` settings, the data folder, the `mm_token` cookie, `mm/…` task branches, and the agents' memory tools `mm_get_context` / `mm_record`. Renaming those would move your data, log you out, and require reconfiguring agents. That's a separate decision, about 2 h.
- **Verified:** 59 of 59 tests pass; the UI test now checks the `Netheron` title.

## B-034 — No way to see or change whether notifications are on
- **Found:** 2026-10-08. You asked "where is the notification".
- **What:** mm only asked for permission once, on the first **Start**. Nothing showed whether notifications were on, blocked or muted, and there was no way to test them.
- **Fix:** A **🔔 button** in the top bar, next to the connection dot.
  - It's coloured when on, grey when off, with a blue dot for "not asked yet" and a red dot for "blocked".
  - Click it for a menu with the status in plain words, **Turn on / Mute**, and **Send test**.
  - When blocked, it says how to unblock (address-bar icon → Notifications → Allow).
  - On the phone over Wi-Fi (plain http), it says notifications aren't possible there: browsers require https or localhost.
  - Clicking a notification jumps to its task.
  - Mute is mm's own setting, so you don't need to touch the browser.
  - On Android, where the browser refuses page notifications, it says so instead of failing silently.
- **Verified:** In Chrome on your mm (:4142), the state showed **on** (your Chrome had already allowed it). The menu opens, stays open when you click inside, and closes when you click outside. Mute → `muted` with the test button disabled; Turn on → back to `on`. **Send test** created a real notification. You confirmed the Windows pop-up appeared.

## B-033 — Code editor crammed into the right panel
- **Found:** 2026-10-08, by you (screenshot): "very buggy… design it to work smoothly".
- **What:** The editor lived in the right panel at 55% width. That squeezed the agent's terminal to about 500 px, pushed the task tabs into a scrollbar, and left the editor itself narrow. My design mistake.
- **Fix (you chose VS Code style):**
  - A **Terminal / Code** switch in the task tab bar.
  - Code mode fills the main area: **Explorer** (folder tree with ›/⌄ arrows), **file tabs** (● when unsaved, × to close, middle-click closes), a breadcrumb, Monaco with a minimap, and the **agent's terminal underneath**. Drag the terminal's bar to resize it, or click "Terminal" to fold it. Both are remembered.
  - **◧ / ◨ buttons** hide the task list and the Info/Diff panel. Code mode hides the right panel by default, so the editor goes from about 450 px to about 1000 px on your screen.
  - Each task keeps its own open files, cursor positions and open folders when you switch tasks.
  - The phone gets a ☰ button for the Explorer.
  - The Code tab was removed from the right panel, which is back to Info / Diff / Preview.
- **Verified in Chrome at 1536 px** (test copy on :5142):
  - Opened `src/math.ts` and `README` as two tabs, with TypeScript colours.
  - Dragging the terminal bar resized it. Typing showed ●, Ctrl+S saved, and the file on disk had the new line.
  - Switching to Terminal mode kept the session: `echo terminal-ok` ran.

## B-032 — Page newer than the running server: "not found" with no explanation
- **Found:** 2026-10-08. Your Code tab showed "not found" because your mm started at 00:17 and the file API was added at 00:21. The browser always loads the newest page, but the server only picks up new code when it restarts.
- **Fix:** The server fingerprints its own source files at startup. `GET /api/version` returns `stale: true` once they change. The page checks on every connect and once a minute, and shows a yellow banner: "mm was updated… close the start-mm window and open it again". A server too old to have `/api/version` also triggers the banner. The file tree shows the same hint instead of "not found".
- **Verified:** T-I16. Your current mm answers `/api/version` with "not found", which triggers the banner.

## B-031 — Code tab: a light VS Code editor (Monaco) inside mm
- **Found:** 2026-10-08. You asked about putting an IDE in mm (a VS Code fork). You chose the light editor over full VS Code in a tab or an "Open in Cursor" button, because memory is tight (3 GB free).
- **Built (first version; the layout was replaced by B-033):**
  - New **Code** tab next to Info / Diff / Preview: file tree of the focused task's folder, plus Monaco (VS Code's editor component) with syntax colours.
  - **Save** or **Ctrl+S**. A ● dot means unsaved. The right panel widens to 55% while the tab is open.
  - Monaco only loads the first time you open the tab. It's served from `node_modules/monaco-editor/min` (0.57) via `/vendor/monaco/`, which can't be escaped.
  - Server: [files.ts](../packages/daemon/src/files.ts), with `GET /api/tasks/:id/files`, `GET /api/tasks/:id/file` and `POST /api/tasks/:id/file`.
  - Every path is checked against the task folder, including through symlinks and junctions. `.git` is hidden. Binary files and files over 2 MB are refused.
  - **Saves never overwrite an agent's newer edit:** a save includes the hash of the version you opened, and the server answers 409 if the file changed since.
- **Live with agents:** it uses the same live feed as the Diff tab (B-029).
  - When an agent edits the open file, the editor reloads it by itself and keeps your scroll position.
  - If you have unsaved edits, a bar offers **Reload theirs / Keep mine** instead.
  - New or deleted files show up in the tree, and open folders stay open.
- **Verified:**
  - T-I15 (automated). The server test file passed 3 of 3 runs.
  - In Chrome on a test copy (ports 5142): the tree loaded, a `.ts` file showed with TypeScript colours, an agent-style disk edit reloaded the editor by itself, and a new file appeared in the tree.
  - With an unsaved edit, the agent edit showed the conflict bar instead. **Keep mine** saved your version to disk.

## B-030 — Removing a running task crashed the whole mm server (Windows)
- **Found:** 2026-10-07, while testing B-029. Running the server tests repeatedly failed 3 of 4 times with exit code `0xC0000374` (heap corruption).
- **What:** Clicking **Remove** on a task whose agent was still running could kill the entire `mm serve` process. Every other task and terminal went down with it.
- **Cause:** Remove called `kill()` on the terminal, then immediately called `kill()` again and closed its pipes while Windows (ConPTY) was still shutting the process down. node-pty corrupts memory when that happens. The old tests always told the fake agent to quit before removing it, so they never hit this.
- **Fix:** [pty.ts](../packages/daemon/src/pty.ts) kills a live process at most once. `destroy()` waits for the process to exit (up to 3 s) before releasing its handles. Remove waits for that before deleting the worktree. Shutdown (`Ctrl+C`) waits for all terminals, with a 4 s cap.
- **Also found:** without the final release step, the daemon couldn't exit at all (the same pipe leak as B-021). That step now runs only after the process has exited.
- **Verified:** 6 of 6 repeated runs pass (it crashed in 3 of 4 runs before). The B-029 test removes a running task.

## B-029 — Diff tab only updated when you clicked Refresh
- **Found:** 2026-10-07, your request: changes should show in the diff automatically, like streaming.
- **Fix:** The Diff tab now subscribes over the existing WebSocket. The server watches the task's folder ([diffwatch.ts](../packages/daemon/src/diffwatch.ts)) and recomputes the diff 0.3 s after files stop changing. It pushes the diff only when it actually changed. The tab keeps your scroll position and shows `● live · <time>`. One watcher per task is shared by every open browser and stops when nobody is viewing. It skips `node_modules`, `.git/objects`, `dist` and `build`, and falls back to checking every 3 s if the folder can't be watched. The Refresh button is gone.
- **Verified:** T-I14: writing a file into the task folder pushes a diff with the new line, a second edit pushes again, and nothing more arrives after unwatching. Needs your check in the browser (T-UI14).

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
- **Decision (2026-10-09):** option 2, as part of Wave 1 (B-036): only Netheron's own worktrees, with backup, atomic write and cleanup.

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

# Design prompt: Netheron, full UI (ADHD-friendly)

Copy everything below the line into a design tool (Claude Design, Stitch, v0, Figma AI…).

---

## Role and goal

You are a senior product designer. Design the complete web UI for **Netheron**, a workspace where one person runs several AI coding agents (Claude Code, Codex, OpenCode, Pi, Oh My Pi, plain shell) side by side. Each agent works in its own git worktree, and they share one memory. The person watches, steers and reviews them from a desktop browser **and from a phone**.

**The user has ADHD.** Every feature below must stay reachable, but the screen must never feel crowded. Calm is the main design goal.

## Design rules (apply to every screen)

1. **One main action per screen.** Exactly one primary (filled) button is visible at a time. Everything else is secondary or quiet.
2. **Progressive disclosure.** Show what's needed now. Put the rest behind a *named* control ("⏰ When", "More about cost"), never behind an unlabeled "…". A hidden feature must still show its name.
3. **Nothing chosen is out of sight.** If an option is turned on inside a closed group, the group's label shows it (e.g. "3 Extras: 👥✅").
4. **Urgent first, sorted by urgency.** Use colour only for meaning: warn amber = needs a decision, red = broken, green = done, purple = waiting for a reply. Use at most 3 accent colours per screen.
5. **Short lists.** At most 5 items before "Show all (12)". Use plain words: no jargon, no numbers without units.
6. **Visible progress.** Show live state (running, cost so far, time) as small calm meters, not blinking badges. No animation except a subtle pulse on "needs you".
7. **Same layout on the phone.** Panels become full-screen sheets, there is a bottom key bar for terminals, the smallest tap target is 44 px, and nothing scrolls sideways at 375 px.
8. **Dark first**, with a light theme. Use a system font. Use a monospace font only for terminals, code, diffs and paths.
9. **Every empty state says what to do next** in one sentence, with one button.
10. **Errors are calm and literal:** what happened, and the one action that fixes it.

## Current visual language (keep it, refine it)

- Dark: bg `#0d0f12`, panel `#14171c`, panel-2 `#1a1e24`, line `#262b33`, text `#e6e8eb`, muted `#8b93a0`.
- Accent `#7c9cff`. ok `#4cc38a`, warn `#f0b429`, bad `#f2555a`, idle `#c58af9`. Radius 8 px.
- Logo: a small "N" tile in the accent colour, followed by the name "Netheron".

## App frame

- **Top bar:**
  - Logo.
  - View tabs: **Home** (with a count badge), **Workspace**, **Research**, **Learn**, **Memory**, **Usage**.
  - Right side: project picker (with GitHub repo + branch badge), 👤 Accounts, 🔔 Notifications menu, connection dot.
- **Banner** when the server was updated while running: "Restart to load the new version".
- **Toasts** in the bottom right. Clicking one opens the related task.

## Screens to design

### 1. Home (opens first)
- Title: "Needs you (N)", or "Nothing needs you".
- Rows, most urgent first, each with an icon, the task title, one plain sentence and one button:
  - 🌐 "Asks for you in the browser: <reason>" → **Help**
  - ❌ "Looks stuck" / "Failed" → **Fix** / **Look**
  - ⏸ "Budget reached" → **Decide**
  - ⏸ "Paused by a usage limit until 14:30" → Open
  - 💬 "Finished a turn, waiting for your reply" → **Reply**
  - ✅ "Done. Review the changes" → **Review**
- Quiet summary line: "3 running · 1 scheduled · 9 tasks".
- One big **＋ New task** button.
- Optional calm extras, collapsed: "Morning brief" (what happened overnight) and "Recent alerts".
- Empty state: "All quiet. Agents show up here when they need a decision from you."

### 2. New task (3-step wizard; **▶ Start** works on every step)
1. **What:** a large prompt box, the project, and a router hint ("→ Claude Opus · because it's an architecture task").
2. **Who:**
   - Agent: Auto / Claude Code / Codex / OpenCode / Pi / Oh My Pi / Shell.
   - Model (optional).
   - Account profile (only when there are several logins).
   - Limits: max $ and max minutes.
   - 🌐 Browser checkbox (disabled with a reason for agents without tool support).
3. **Extras:** 4 closed, named groups:
   - **⏰ When:** now / at a time / after the usage limit resets, plus "every day".
   - **👥 Teamwork:** Race & Judge (the same task on up to 3 agents, the best one is kept), auto hand-off (another agent continues if one gets stuck), Pipeline (Plan → Build → Review).
   - **✅ Checks:** after each turn do nothing / run checks / Budget Dial (cheapest model first, move up if checks fail).
   - **⚙ Machine & worktree:** own worktree, lean context, run on a remote worker (another PC), ⚙ Worktree setup (files to copy, folders to link, a setup command).
- The step buttons show what's chosen: "2 Who: Codex · 🌐", "3 Extras: ⏰👥".
- The button becomes **▶ Schedule** when "When" isn't "now".

### 3. Workspace (where work happens)
- **Left: task board.** Columns, with counts: Needs you / Running / Done / Failed-stopped / Scheduled 🌙 / Remote worker 🖥.
  - Each card: title, agent · model, status dot, and at most 1 badge ("🌐 needs you", "🌐 you're driving").
  - On the phone the board is a slide-in sheet.
- **Centre: terminals.**
  - Tabs for open tasks; split view (2 panes) on desktop.
  - Pane header: task name, plus a live meter "$0.42 · 12k tokens · 6 min".
  - A phone key bar: Enter, y, n, Esc, Ctrl+C, ↑, ↓, Tab, Type….
- **Centre, alternative "Code" mode** (VS Code-like):
  - File explorer, editor tabs (Monaco), a ● dirty dot, Save, and **Check code** with a problems bar.
  - A conflict bar: "An agent changed this file: Use theirs / Keep mine".
  - A resizable terminal below.
- **Right panel tabs:** Info / Diff / Preview / 🌐 Browser (only for browser tasks).
  - **Info:**
    - Task facts: agent, model, branch, worktree, budget, why the router picked it.
    - Banners, at most 1 at a time and urgent first: needs you in the browser, usage limit wait (Don't resume / Hand off now), stuck (Hand off / Stop), budget reached, edit guard ("agent deleted 30 lines": Restore file).
    - Actions: Continue, Hand off to another agent, Stop, Remove.
    - Checkpoints list (restore to any turn).
    - Message queue (messages wait until the agent is free).
    - Race results (scores, Judge now, Keep winner).
    - Pipeline steps.
    - Budget Dial ladder.
    - Rules given to the agent.
    - Receipt (cost and tokens per turn).
  - **Diff:** live diff of the worktree, with a "● live" timestamp. Click a line to leave a comment for the agent.
  - **Preview:** a dev-server port and an iframe, so you can view the build from the phone.
  - **🌐 Browser:**
    - Live picture of the agent's Chrome window, ~10 fps.
    - A state line: "Agent is driving" / "You have control".
    - Buttons: Show window, Take over, **Resume**. An orange frame appears while you drive.
    - Click, scroll and type on the picture; a "Type into the page" box and an Enter button for phones.

### 4. Research
- Left: **New thread**, Threads list, Spaces (saved collections).
- Main, two modes:
  - **Answers:** ask anything; the answer has numbered citation chips, source cards, follow-up suggestions, "Send to agent" and "Save to space".
  - **Papers:** search 250M+ papers (OpenAlex) → paper cards (title, authors, year, citations, abstract in a details element); Consensus meter; export BibTeX / RIS / CSV; Save to space.

### 5. Learn
- Left: Add documents (a path to ingest) and Your documents.
- Four modes:
  - **Chat with docs.**
  - **Solve:** paste a problem and get a numbered, checked solution.
  - **Quiz:** multiple choice; right and wrong answers are coloured.
  - **Question bank.**

### 6. Memory (what all agents share)
- Left: Project memory, **Re-index project**, and "Add to memory" (title + why).
- Main: one search box ("Search everything agents know: files, symbols, decisions, research…").
- Four modes: **Recent** / **Results** / **Tree** (files and symbols) / **Agent context** (exactly what an agent receives at start).

### 7. Usage (cost and health; must be the calmest page)
- Top: a time range picker, plus 3 big numbers at most: spent today, tokens, tasks.
- Sections, collapsed except the first:
  1. **Brief:** what happened, with links into tasks.
  2. **Alerts:** cache drain, billing, limit, budget, stuck, guard, hand-off, verify, pipeline, race, quality, browser. Each is one row with a coloured kind badge.
  3. **By task / by agent / by login / by model:** tables with stacked meters.
  4. **Quality watch:** your evals (name, prompt, check command) → run on every model → a scores table.
  5. **Remote workers:** connect another Netheron by link; online/offline; its tasks.

### 8. Dialogs and menus
- **Project picker:** clone from GitHub (URL), or browse folders on this PC (git repos marked), Use this folder.
- **Worktree setup:** files to copy, folders to link, setup command, checks command.
- **Accounts:** several logins per agent (work / personal), a default per project, add, remove, sign in through a terminal.
- **🔔 Notifications menu:** state (on / muted / blocked), turn on or mute, send test, "also when Netheron is closed (push)", and one sentence explaining when notifications appear.

## Key states to show (one frame each)
1. Home with 3 rows (🌐, ❌, ✅) and with nothing waiting.
2. New task at each step, step 3 with one group open.
3. Workspace: 2 terminals split, Info with a stuck banner.
4. Browser tab: agent driving vs. you driving (orange frame).
5. Code mode with the conflict bar.
6. Usage with everything collapsed except Brief.
7. The phone (375 × 812): Home, the New task sheet, a terminal with the key bar, and the Browser tab with the Type box.

## Deliverables
- Desktop (1440 × 900) and phone (375 × 812) frames for each screen above, dark and light.
- A small component sheet: buttons (primary / secondary / quiet / danger), badge, row, banner, meter, tabs, step pills, collapsible group, toast, empty state.
- A short note per screen: **what the one main action is** and **what is hidden, and under which label**.

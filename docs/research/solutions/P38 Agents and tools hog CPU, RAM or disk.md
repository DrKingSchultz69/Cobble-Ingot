---
type: "solution"
id: "P38"
title: "Agents and tools hog CPU, RAM or disk"
themes: ["performance", "review", "platform"]
problems: 9
upvotes: 1301
can_incorporate: "partly"
options: 3
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0038", "A-0040", "A-0028", "A-0112", "A-0384", "A-0387", "A-0390", "A-0130", "A-0142"]
tags: ["research", "solution", "theme/performance", "theme/review", "theme/platform"]
updated: "2026-10-08"
---
# P38 · Agents and tools hog CPU, RAM or disk

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/performance|performance]] · [[themes/review|review]] · [[themes/platform|platform]]

> [!question] The problem
> Logs writing terabytes, runaway CPU/memory, 10 GB VM bundles, leaks in long sessions.
>
> **9 problems · 1301 👍** · tools: zed (3), codex (2), pi (2), claude-code (1), opencode (1)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0038 | 450 | codex | Agent's local logs wrote ~37 TB in 21 days, wearing out the SSD | Quit the agent and delete its log database | [codex#28224](https://github.com/openai/codex/issues/28224) |
| A-0040 | 397 | codex | Desktop app triggers runaway CPU and memory use on macOS |  | [codex#25719](https://github.com/openai/codex/issues/25719) |
| A-0028 | 228 | claude-code | Feature creates a 10 GB VM bundle that slows the whole app down |  | [claude-code#22543](https://github.com/anthropics/claude-code/issues/22543) |
| A-0112 | 112 | opencode | Memory leaks / high memory use reported widely |  | [opencode#20695](https://github.com/anomalyco/opencode/issues/20695) |
| A-0384 | 30 | zed | No built-in view of processes/CPU/RAM used by agents and tools |  | [zed#59451](https://github.com/zed-industries/zed/issues/59451) |

> [!example]- All 9 problems in this cluster (click to open)
> - **A-0038** · 450 👍 · codex: Agent's local logs wrote ~37 TB in 21 days, wearing out the SSD · [codex#28224](https://github.com/openai/codex/issues/28224)
> - **A-0040** · 397 👍 · codex: Desktop app triggers runaway CPU and memory use on macOS · [codex#25719](https://github.com/openai/codex/issues/25719)
> - **A-0028** · 228 👍 · claude-code: Feature creates a 10 GB VM bundle that slows the whole app down · [claude-code#22543](https://github.com/anthropics/claude-code/issues/22543)
> - **A-0112** · 112 👍 · opencode: Memory leaks / high memory use reported widely · [opencode#20695](https://github.com/anomalyco/opencode/issues/20695)
> - **A-0384** · 30 👍 · zed: No built-in view of processes/CPU/RAM used by agents and tools · [zed#59451](https://github.com/zed-industries/zed/issues/59451)
> - **A-0387** · 29 👍 · zed: Editor hangs on a project because of a language extension · [zed#53811](https://github.com/zed-industries/zed/issues/53811)
> - **A-0390** · 28 👍 · zed: Severe sluggishness on a Linux desktop environment · [zed#53522](https://github.com/zed-industries/zed/issues/53522)
> - **A-0130** · 16 👍 · pi: File autocomplete freezes the UI on large repos · [pi#1278](https://github.com/earendil-works/pi/issues/1278)
> - **A-0142** · 11 👍 · pi: High CPU use in long sessions · [pi#7730](https://github.com/earendil-works/pi/issues/7730)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Resource monitor per task

> [!success] ✅ Netheron can build this
> Show CPU, RAM and disk writes of each agent process in the board; alert on runaway use.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium

### S2 · Auto-stop runaway agents

> [!success] ✅ Netheron can build this
> Stop or pause a task that exceeds limits, and notify.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium

### S3 · Netheron stays light

> [!success] ✅ Netheron can build this
> Diffs only on file changes, lazy-loaded editor, lean contexts.
>
> **Effort:** none (already exists) · **Novelty:** Low
> **Already in Netheron:** Built: B-029 event-driven diff, lazy Monaco

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Leaks inside vendors' apps are theirs.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

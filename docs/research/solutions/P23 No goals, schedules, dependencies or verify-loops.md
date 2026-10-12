---
type: "solution"
id: "P23"
title: "No goals, schedules, dependencies or verify-loops"
themes: ["control", "remote", "context"]
problems: 6
upvotes: 196
can_incorporate: "yes"
options: 4
partly_built: true
status: "wave 2 built"
decision: ""
priority: ""
rows: ["A-0100", "A-0487", "A-0282", "A-0495", "A-0506", "A-0419"]
tags: ["research", "solution", "theme/control", "theme/remote", "theme/context"]
updated: "2026-10-08"
---
# P23 · No goals, schedules, dependencies or verify-loops

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/control|control]] · [[themes/remote|remote]] · [[themes/context|context]]

> [!question] The problem
> Users want a session goal the agent keeps working toward, scheduled/recurring runs, task dependencies (start B when A merges), and loops that test and retry until done.
>
> **6 problems · 196 👍** · tools: vibe-kanban (3), opencode (1), kilo (1), openhands (1)

> [!success] Built in Wave 2 (2026-10-10)
> S1 Night Shift, S2 pipelines, S3 verify loop (Budget Dial), S4 goal via shared rules/memory. See [[BUGS]] B-039.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0100 | 152 | opencode | No way to set a session goal the agent keeps working toward |  | [opencode#27167](https://github.com/anomalyco/opencode/issues/27167) |
| A-0487 | 14 | vibe-kanban | Can't let the agent loop: test itself, retry differently and verify until done |  | [vibe-kanban#1946](https://github.com/BloopAI/vibe-kanban/issues/1946) |
| A-0282 | 13 | kilo | No goal command like another agent |  | [kilocode#11166](https://github.com/Kilo-Org/kilocode/issues/11166) |
| A-0495 | 8 | vibe-kanban | No task dependencies (start B when A is merged) |  | [vibe-kanban#1700](https://github.com/BloopAI/vibe-kanban/issues/1700) |
| A-0506 | 7 | vibe-kanban | Wants scheduled 'heartbeat' prompts that run every X minutes |  | [vibe-kanban#3039](https://github.com/BloopAI/vibe-kanban/issues/3039) |

> [!example]- All 6 problems in this cluster (click to open)
> - **A-0100** · 152 👍 · opencode: No way to set a session goal the agent keeps working toward · [opencode#27167](https://github.com/anomalyco/opencode/issues/27167)
> - **A-0487** · 14 👍 · vibe-kanban: Can't let the agent loop: test itself, retry differently and verify until done · [vibe-kanban#1946](https://github.com/BloopAI/vibe-kanban/issues/1946)
> - **A-0282** · 13 👍 · kilo: No goal command like another agent · [kilocode#11166](https://github.com/Kilo-Org/kilocode/issues/11166)
> - **A-0495** · 8 👍 · vibe-kanban: No task dependencies (start B when A is merged) · [vibe-kanban#1700](https://github.com/BloopAI/vibe-kanban/issues/1700)
> - **A-0506** · 7 👍 · vibe-kanban: Wants scheduled 'heartbeat' prompts that run every X minutes · [vibe-kanban#3039](https://github.com/BloopAI/vibe-kanban/issues/3039)
> - **A-0419** · 2 👍 · openhands: Wants scheduled, recurring agent runs · [OpenHands#12732](https://github.com/OpenHands/OpenHands/issues/12732)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Night Shift / scheduled runs

> [!success] ✅ Netheron can build this
> Schedule tasks (once, recurring, after limit reset) with a morning brief.
>
> **Effort:** M (2–5 days) · **Novelty:** High

### S2 · Task pipelines

> [!success] ✅ Netheron can build this
> Chain tasks across agents: plan (Claude) → build (Codex) → test (Pi) → review (you).
>
> **Effort:** M (2–5 days) · **Novelty:** High: cross-vendor

### S3 · Verify loop with exit criteria

> [!success] ✅ Netheron can build this
> Run tests after each attempt; retry with a different model if they fail; stop at a budget.
>
> **Effort:** M (2–5 days) · **Novelty:** High

### S4 · Goal in shared memory

> [!success] ✅ Netheron can build this
> Store the task goal so every agent and every retry sees it.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium
> **Already in Netheron:** Shared memory exists

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

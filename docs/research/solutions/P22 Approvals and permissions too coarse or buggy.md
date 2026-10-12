---
type: "solution"
id: "P22"
title: "Approvals and permissions too coarse or buggy"
themes: ["control", "security", "ux"]
problems: 9
upvotes: 352
can_incorporate: "partly"
options: 3
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0032", "A-0118", "A-0156", "A-0140", "A-0304", "A-0507", "A-0352", "A-0410", "A-0521"]
tags: ["research", "solution", "theme/control", "theme/security", "theme/ux"]
updated: "2026-10-08"
---
# P22 · Approvals and permissions too coarse or buggy

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/control|control]] · [[themes/security|security]] · [[themes/ux|ux]]

> [!question] The problem
> All-or-nothing permissions, prompts on the wrong part of a command, modes reverting by themselves, no per-command rules, can't toggle on the fly.
>
> **9 problems · 352 👍** · tools: claude-code (1), opencode (1), omp (1), pi (1), continue (1)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0032 | 209 | claude-code | Permission prompts trigger on the wrong part of compound shell commands |  | [claude-code#28240](https://github.com/anthropics/claude-code/issues/28240) |
| A-0118 | 94 | opencode | No option to skip permission prompts for trusted work |  | [opencode#8463](https://github.com/anomalyco/opencode/issues/8463) |
| A-0156 | 16 | omp | Can't toggle tool-approval mode on the fly |  | [oh-my-pi#2956](https://github.com/can1357/oh-my-pi/issues/2956) |
| A-0140 | 11 | pi | Can't enable/disable built-in tools in settings |  | [pi#5084](https://github.com/earendil-works/pi/issues/5084) |
| A-0304 | 9 | continue | Still asks for approval even when set to automatic |  | [continue#10512](https://github.com/continuedev/continue/issues/10512) |

> [!example]- All 9 problems in this cluster (click to open)
> - **A-0032** · 209 👍 · claude-code: Permission prompts trigger on the wrong part of compound shell commands · [claude-code#28240](https://github.com/anthropics/claude-code/issues/28240)
> - **A-0118** · 94 👍 · opencode: No option to skip permission prompts for trusted work · [opencode#8463](https://github.com/anomalyco/opencode/issues/8463)
> - **A-0156** · 16 👍 · omp: Can't toggle tool-approval mode on the fly · [oh-my-pi#2956](https://github.com/can1357/oh-my-pi/issues/2956)
> - **A-0140** · 11 👍 · pi: Can't enable/disable built-in tools in settings · [pi#5084](https://github.com/earendil-works/pi/issues/5084)
> - **A-0304** · 9 👍 · continue: Still asks for approval even when set to automatic · [continue#10512](https://github.com/continuedev/continue/issues/10512)
> - **A-0507** · 7 👍 · vibe-kanban: Auto-commit on exit tied to another setting · [vibe-kanban#2739](https://github.com/BloopAI/vibe-kanban/issues/2739)
> - **A-0352** · 4 👍 · goose: Shell permissions are all-or-nothing; no per-command rules · [goose#11399](https://github.com/aaif-goose/goose/issues/11399)
> - **A-0410** · 2 👍 · openhands: Can't disable an MCP server without removing it · [OpenHands#11811](https://github.com/OpenHands/OpenHands/issues/11811)
> - **A-0521** · 0 👍 · crystal: Permission mode reverts by itself and tasks hang · [crystal#221](https://github.com/stravu/crystal/issues/221)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Per-task safety level

> [!success] ✅ Netheron can build this
> Choose 'read only / edit in worktree / full' per task; Netheron passes the right flags to each agent.
>
> **Effort:** M (2–5 days) · **Novelty:** Medium

### S2 · Shared command rules

> [!success] ✅ Netheron can build this
> One allow/ask/deny list (regex) for shell commands applied to every agent via hooks or wrapper.
>
> **Effort:** M (2–5 days) · **Novelty:** High: one policy across vendors

### S3 · Approve from phone

> [!success] ✅ Netheron can build this
> Approval prompts appear as notifications you can answer remotely.
>
> **Effort:** none (already exists) · **Novelty:** Medium
> **Already in Netheron:** Built: phone key bar (y/n)

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Each agent's built-in permission engine is the vendor's.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

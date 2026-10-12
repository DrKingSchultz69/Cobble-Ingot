---
type: "solution"
id: "P18"
title: "Windows-specific friction"
themes: ["platform", "ux", "reliability"]
problems: 8
upvotes: 479
can_incorporate: "partly"
options: 3
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0020", "A-0055", "A-0379", "A-0356", "A-0327", "A-0196", "A-0478", "A-0462"]
tags: ["research", "solution", "theme/platform", "theme/ux", "theme/reliability"]
updated: "2026-10-08"
---
# P18 · Windows-specific friction

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/platform|platform]] · [[themes/ux|ux]] · [[themes/reliability|reliability]]

> [!question] The problem
> Windows windows flash or steal focus, always-on-top windows, zombie Node processes, garbled terminals, branch names broken by domain usernames, WSL issues.
>
> **8 problems · 479 👍** · tools: claude-squad (2), claude-code (1), codex (1), zed (1), goose (1)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0020 | 286 | claude-code | Desktop window stays always-on-top on Windows with no setting to turn it off |  | [claude-code#85891](https://github.com/anthropics/claude-code/issues/85891) |
| A-0055 | 153 | codex | Terminal windows flash repeatedly on Windows during requests |  | [codex#48074](https://github.com/openai/codex/issues/48074) |
| A-0379 | 33 | zed | Leaves zombie Node processes after exit on Windows |  | [zed#46474](https://github.com/zed-industries/zed/issues/46474) |
| A-0356 | 3 | goose | Every command pops up a visible window that steals focus on Windows |  | [goose#6701](https://github.com/aaif-goose/goose/issues/6701) |
| A-0327 | 3 | continue | MCP servers fail to start in WSL |  | [continue#9151](https://github.com/continuedev/continue/issues/9151) |

> [!example]- All 8 problems in this cluster (click to open)
> - **A-0020** · 286 👍 · claude-code: Desktop window stays always-on-top on Windows with no setting to turn it off · [claude-code#85891](https://github.com/anthropics/claude-code/issues/85891)
> - **A-0055** · 153 👍 · codex: Terminal windows flash repeatedly on Windows during requests · [codex#48074](https://github.com/openai/codex/issues/48074)
> - **A-0379** · 33 👍 · zed: Leaves zombie Node processes after exit on Windows · [zed#46474](https://github.com/zed-industries/zed/issues/46474)
> - **A-0356** · 3 👍 · goose: Every command pops up a visible window that steals focus on Windows · [goose#6701](https://github.com/aaif-goose/goose/issues/6701)
> - **A-0327** · 3 👍 · continue: MCP servers fail to start in WSL · [continue#9151](https://github.com/continuedev/continue/issues/9151)
> - **A-0196** · 1 👍 · aider: Errors parsing streamed responses from a local/cloud model on Windows · [aider#4594](https://github.com/Aider-AI/aider/issues/4594)
> - **A-0478** · 0 👍 · claude-squad: Garbled terminal output in Windows Terminal makes the tool unusable · [claude-squad#243](https://github.com/smtg-ai/claude-squad/issues/243)
> - **A-0462** · 0 👍 · claude-squad: Branch names break on Windows domain usernames · [claude-squad#220](https://github.com/smtg-ai/claude-squad/issues/220)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Windows-first testing

> [!success] ✅ Netheron can build this
> Netheron is developed and tested on Windows (cmd escaping, pty, worktrees).
>
> **Effort:** none (already exists) · **Novelty:** Medium
> **Already in Netheron:** Built: B-017 escaping, B-021/B-030 pty fixes

### S2 · Clean process handling

> [!success] ✅ Netheron can build this
> Hidden windows for child processes, kill process trees on exit.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Low
> **Already in Netheron:** windowsHide used for git

### S3 · Safe branch names

> [!success] ✅ Netheron can build this
> Slugify branch names from the task title only, never from usernames.
>
> **Effort:** none (already exists) · **Novelty:** Low
> **Already in Netheron:** Built: slugify()

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Windows bugs in vendors' apps are theirs.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

---
type: "solution"
id: "P35"
title: "Worktree housekeeping (deps, env, location, cleanup)"
themes: ["parallel", "setup", "ux"]
problems: 6
upvotes: 21
can_incorporate: "yes"
options: 3
partly_built: true
status: "wave 1 built"
decision: ""
priority: ""
rows: ["A-0453", "A-0504", "A-0510", "A-0520", "A-0467", "A-0464"]
tags: ["research", "solution", "theme/parallel", "theme/setup", "theme/ux"]
updated: "2026-10-08"
---
# P35 · Worktree housekeeping (deps, env, location, cleanup)

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/parallel|parallel]] · [[themes/setup|setup]] · [[themes/ux|ux]]

> [!question] The problem
> New worktrees lack node_modules, .env files and free ports; worktree location/naming isn't configurable; branches pile up after merge; env vars aren't inherited.
>
> **6 problems · 21 👍** · tools: claude-squad (3), vibe-kanban (2), crystal (1)

> [!success] Built in Wave 1 (2026-10-09)
> S1 setup recipe. See [[BUGS]] B-036.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0453 | 8 | claude-squad | New worktrees lack untracked setup (node_modules, env files, ports) |  | [claude-squad#260](https://github.com/smtg-ai/claude-squad/issues/260) |
| A-0504 | 7 | vibe-kanban | Can't choose where worktrees are stored |  | [vibe-kanban#1830](https://github.com/BloopAI/vibe-kanban/issues/1830) |
| A-0510 | 6 | vibe-kanban | Working branches pile up after merge |  | [vibe-kanban#2680](https://github.com/BloopAI/vibe-kanban/issues/2680) |
| A-0520 | 0 | crystal | Worktree naming, .gitignore and cleanup not configurable |  | [crystal#213](https://github.com/stravu/crystal/issues/213) |
| A-0467 | 0 | claude-squad | New sessions don't inherit custom environment variables |  | [claude-squad#277](https://github.com/smtg-ai/claude-squad/issues/277) |

> [!example]- All 6 problems in this cluster (click to open)
> - **A-0453** · 8 👍 · claude-squad: New worktrees lack untracked setup (node_modules, env files, ports) · [claude-squad#260](https://github.com/smtg-ai/claude-squad/issues/260)
> - **A-0504** · 7 👍 · vibe-kanban: Can't choose where worktrees are stored · [vibe-kanban#1830](https://github.com/BloopAI/vibe-kanban/issues/1830)
> - **A-0510** · 6 👍 · vibe-kanban: Working branches pile up after merge · [vibe-kanban#2680](https://github.com/BloopAI/vibe-kanban/issues/2680)
> - **A-0520** · 0 👍 · crystal: Worktree naming, .gitignore and cleanup not configurable · [crystal#213](https://github.com/stravu/crystal/issues/213)
> - **A-0467** · 0 👍 · claude-squad: New sessions don't inherit custom environment variables · [claude-squad#277](https://github.com/smtg-ai/claude-squad/issues/277)
> - **A-0464** · 0 👍 · claude-squad: Tied to one terminal multiplexer · [claude-squad#229](https://github.com/smtg-ai/claude-squad/issues/229)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Worktree setup recipe

> [!success] ✅ Netheron can build this
> Per project: files to copy (.env), install command, port offset; run automatically when a task's worktree is created.
>
> **Effort:** S (hours to 1 day) · **Novelty:** High: Netheron has this risk too

### S2 · Cleanup after merge

> [!success] ✅ Netheron can build this
> Offer to delete worktree + branch once merged.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Low
> **Already in Netheron:** Remove task can delete worktree

### S3 · Configurable worktree root

> [!success] ✅ Netheron can build this
> Setting for where worktrees live.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Low
> **Already in Netheron:** Fixed location today (data dir)

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

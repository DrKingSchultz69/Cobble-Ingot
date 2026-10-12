---
type: "solution"
id: "P45"
title: "Git hosting and tracker integrations missing"
themes: ["setup", "platform", "ux"]
problems: 7
upvotes: 60
can_incorporate: "yes"
options: 3
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0482", "A-0492", "A-0391", "A-0499", "A-0508", "A-0404", "A-0416"]
tags: ["research", "solution", "theme/setup", "theme/platform", "theme/ux"]
updated: "2026-10-08"
---
# P45 · Git hosting and tracker integrations missing

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/setup|setup]] · [[themes/platform|platform]] · [[themes/ux|ux]]

> [!question] The problem
> Self-hosted GitLab/Gitea not supported, no easy repo opening, issues not importable as tasks, no Jira/Linear link.
>
> **7 problems · 60 👍** · tools: vibe-kanban (4), openhands (3)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0482 | 26 | vibe-kanban | Self-hosted GitLab not supported (diff, PRs don't work) |  | [vibe-kanban#1697](https://github.com/BloopAI/vibe-kanban/issues/1697) |
| A-0492 | 9 | vibe-kanban | Issues from GitHub not imported as tasks |  | [vibe-kanban#1677](https://github.com/BloopAI/vibe-kanban/issues/1677) |
| A-0391 | 7 | openhands | Self-hosted git server not supported |  | [OpenHands#12351](https://github.com/OpenHands/OpenHands/issues/12351) |
| A-0499 | 7 | vibe-kanban | No issue-tracker integration (Linear/Jira/Trello) |  | [vibe-kanban#2159](https://github.com/BloopAI/vibe-kanban/issues/2159) |
| A-0508 | 7 | vibe-kanban | No published container image for self-hosting |  | [vibe-kanban#2471](https://github.com/BloopAI/vibe-kanban/issues/2471) |

> [!example]- All 7 problems in this cluster (click to open)
> - **A-0482** · 26 👍 · vibe-kanban: Self-hosted GitLab not supported (diff, PRs don't work) · [vibe-kanban#1697](https://github.com/BloopAI/vibe-kanban/issues/1697)
> - **A-0492** · 9 👍 · vibe-kanban: Issues from GitHub not imported as tasks · [vibe-kanban#1677](https://github.com/BloopAI/vibe-kanban/issues/1677)
> - **A-0391** · 7 👍 · openhands: Self-hosted git server not supported · [OpenHands#12351](https://github.com/OpenHands/OpenHands/issues/12351)
> - **A-0499** · 7 👍 · vibe-kanban: No issue-tracker integration (Linear/Jira/Trello) · [vibe-kanban#2159](https://github.com/BloopAI/vibe-kanban/issues/2159)
> - **A-0508** · 7 👍 · vibe-kanban: No published container image for self-hosting · [vibe-kanban#2471](https://github.com/BloopAI/vibe-kanban/issues/2471)
> - **A-0404** · 3 👍 · openhands: No easy way to open a repo from a git provider in local mode · [OpenHands#15758](https://github.com/OpenHands/OpenHands/issues/15758)
> - **A-0416** · 1 👍 · openhands: Self-hosted git over HTTP fails because the sandbox forces HTTPS · [OpenHands#12358](https://github.com/OpenHands/OpenHands/issues/12358)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Clone from any git URL

> [!success] ✅ Netheron can build this
> HTTPS/SSH clone into a project.
>
> **Effort:** none (already exists) · **Novelty:** Medium
> **Already in Netheron:** Built: B-027

### S2 · Import issues as tasks

> [!success] ✅ Netheron can build this
> Pull GitHub/GitLab issues into New task with one click.
>
> **Effort:** M (2–5 days) · **Novelty:** Medium
> **Already in Netheron:** GitHub remote detection exists (B-028)

### S3 · Self-hosted git support

> [!success] ✅ Netheron can build this
> Netheron uses plain git, so any host works for worktrees and diffs.
>
> **Effort:** none (already exists) · **Novelty:** Low
> **Already in Netheron:** Built

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

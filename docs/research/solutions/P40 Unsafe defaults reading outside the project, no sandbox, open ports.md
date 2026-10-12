---
type: "solution"
id: "P40"
title: "Unsafe defaults: reading outside the project, no sandbox, open ports"
themes: ["security", "control", "context"]
problems: 9
upvotes: 49
can_incorporate: "yes"
options: 4
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0555", "A-0309", "A-0310", "A-0336", "A-0317", "A-0186", "A-0398", "A-0201", "A-0210"]
tags: ["research", "solution", "theme/security", "theme/control", "theme/context"]
updated: "2026-10-08"
---
# P40 · Unsafe defaults: reading outside the project, no sandbox, open ports

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/security|security]] · [[themes/control|control]] · [[themes/context|context]]

> [!question] The problem
> Tools list or read outside the project, web UIs listen on all interfaces, no sandbox, no pre-command hooks to block secret leaks.
>
> **9 problems · 49 👍** · tools: continue (3), aider (3), litellm (1), goose (1), openhands (1)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0555 | 15 | litellm | Wants a specific guardrail built in |  | [litellm#37459](https://github.com/BerriAI/litellm/issues/37459) |
| A-0309 | 6 | continue | File-listing tool can read outside the project when auto-approved |  | [continue#8877](https://github.com/continuedev/continue/issues/8877) |
| A-0310 | 6 | continue | Agent lists the filesystem root instead of the project folder |  | [continue#9188](https://github.com/continuedev/continue/issues/9188) |
| A-0336 | 6 | goose | No pre-tool hooks to block secret leaks before commands run |  | [goose#8184](https://github.com/aaif-goose/goose/issues/8184) |
| A-0317 | 5 | continue | '.' treated as the filesystem root by the list tool |  | [continue#9135](https://github.com/continuedev/continue/issues/9135) |

> [!example]- All 9 problems in this cluster (click to open)
> - **A-0555** · 15 👍 · litellm: Wants a specific guardrail built in · [litellm#37459](https://github.com/BerriAI/litellm/issues/37459)
> - **A-0309** · 6 👍 · continue: File-listing tool can read outside the project when auto-approved · [continue#8877](https://github.com/continuedev/continue/issues/8877)
> - **A-0310** · 6 👍 · continue: Agent lists the filesystem root instead of the project folder · [continue#9188](https://github.com/continuedev/continue/issues/9188)
> - **A-0336** · 6 👍 · goose: No pre-tool hooks to block secret leaks before commands run · [goose#8184](https://github.com/aaif-goose/goose/issues/8184)
> - **A-0317** · 5 👍 · continue: '.' treated as the filesystem root by the list tool · [continue#9135](https://github.com/continuedev/continue/issues/9135)
> - **A-0186** · 5 👍 · aider: No sandbox, so users can't safely let the agent run commands · [aider#4679](https://github.com/Aider-AI/aider/issues/4679)
> - **A-0398** · 4 👍 · openhands: Corporate SSL certificates hard to debug · [OpenHands#11506](https://github.com/OpenHands/OpenHands/issues/11506)
> - **A-0201** · 1 👍 · aider: Browser/GUI mode listens on all network interfaces by default · [aider#4720](https://github.com/Aider-AI/aider/issues/4720)
> - **A-0210** · 1 👍 · aider: No safety scan before agent-driven commits/commands · [aider#5121](https://github.com/Aider-AI/aider/issues/5121)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Worktree-scoped file access

> [!success] ✅ Netheron can build this
> Netheron's file API refuses paths outside the task folder (including symlinks).
>
> **Effort:** none (already exists) · **Novelty:** Medium
> **Already in Netheron:** Built: B-031 safePath

### S2 · Localhost-only by default

> [!success] ✅ Netheron can build this
> Netheron binds to 127.0.0.1 unless --lan is given; token + origin checks.
>
> **Effort:** none (already exists) · **Novelty:** Medium
> **Already in Netheron:** Built

### S3 · Secret scan before commit/command

> [!success] ✅ Netheron can build this
> Netheron-level hook scans diffs/commands for secrets before they run or merge.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium

### S4 · Optional sandbox

> [!warning] 🟡 Netheron can partly do this
> Run agents inside a container/VM profile.
>
> **Effort:** L (1–3 weeks) · **Novelty:** Medium

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

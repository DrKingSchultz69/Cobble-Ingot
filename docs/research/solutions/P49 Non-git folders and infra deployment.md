---
type: "solution"
id: "P49"
title: "Non-git folders and infra deployment"
themes: ["infra", "setup", "data"]
problems: 3
upvotes: 17
can_incorporate: "yes"
options: 2
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0553", "A-0417", "A-0519"]
tags: ["research", "solution", "theme/infra", "theme/setup", "theme/data"]
updated: "2026-10-08"
---
# P49 · Non-git folders and infra deployment

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/infra|infra]] · [[themes/setup|setup]] · [[themes/data|data]]

> [!question] The problem
> Orchestrators require git (analysts want plain folders); health-check logs flood Kubernetes; containers can't reach the host.
>
> **3 problems · 17 👍** · tools: litellm (1), openhands (1), crystal (1)

> [!note]
> Thin evidence: only 3 rows. Revisit after the manual sessions.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0553 | 15 | litellm | Logs flooded by health-check requests in Kubernetes |  | [litellm#18992](https://github.com/BerriAI/litellm/issues/18992) |
| A-0417 | 2 | openhands | Agent containers can't reach the host in a LAN deployment |  | [OpenHands#12229](https://github.com/OpenHands/OpenHands/issues/12229) |
| A-0519 | 0 | crystal | Can't use the orchestrator on non-git folders (analysis work) |  | [crystal#217](https://github.com/stravu/crystal/issues/217) |

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Work in non-git folders

> [!success] ✅ Netheron can build this
> Tasks run directly in the folder without a worktree.
>
> **Effort:** none (already exists) · **Novelty:** Medium
> **Already in Netheron:** Built: isolate off / non-git supported

### S2 · Container/K8s friendly mode

> [!warning] 🟡 Netheron can partly do this
> Quiet health endpoint, configurable host binding for container deployments.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Low

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

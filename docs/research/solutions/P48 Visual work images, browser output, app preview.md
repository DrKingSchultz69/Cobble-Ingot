---
type: "solution"
id: "P48"
title: "Visual work: images, browser output, app preview"
themes: ["design", "models", "ux"]
problems: 3
upvotes: 7
can_incorporate: "yes"
options: 3
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0350", "A-0401", "A-0527"]
tags: ["research", "solution", "theme/design", "theme/models", "theme/ux"]
updated: "2026-10-08"
---
# P48 · Visual work: images, browser output, app preview

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/design|design]] · [[themes/models|models]] · [[themes/ux|ux]]

> [!question] The problem
> Agents can't take images from paths/URLs, can't use the app preview, users can't see each session's browser output.
>
> **3 problems · 7 👍** · tools: goose (1), openhands (1), crystal (1)

> [!note]
> Design, data and infra roles are under-represented in this GitHub data; expect more problems from the manual sessions.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0350 | 4 | goose | Agent can't load images from paths/URLs as input |  | [goose#7983](https://github.com/aaif-goose/goose/issues/7983) |
| A-0401 | 3 | openhands | Hard to get the agent to use the app preview |  | [OpenHands#12049](https://github.com/OpenHands/OpenHands/issues/12049) |
| A-0527 | 0 | crystal | Can't see each session's browser output |  | [crystal#229](https://github.com/stravu/crystal/issues/229) |

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Preview per task

> [!success] ✅ Netheron can build this
> Netheron's Preview tab shows a task's dev server (also on the phone).
>
> **Effort:** none (already exists) · **Novelty:** Medium
> **Already in Netheron:** Built: preview proxy

### S2 · Screenshot to agent

> [!success] ✅ Netheron can build this
> Capture the preview and send it to the agent as an image for visual checks.
>
> **Effort:** M (2–5 days) · **Novelty:** High: closes the design loop

### S3 · Visual diff

> [!warning] 🟡 Netheron can partly do this
> Before/after screenshots of the preview per task.
>
> **Effort:** M (2–5 days) · **Novelty:** Medium

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

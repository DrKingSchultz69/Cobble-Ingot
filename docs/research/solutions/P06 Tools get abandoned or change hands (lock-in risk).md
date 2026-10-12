---
type: "solution"
id: "P06"
title: "Tools get abandoned or change hands (lock-in risk)"
themes: ["trust", "switching", "security"]
problems: 11
upvotes: 98
can_incorporate: "partly"
options: 3
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0078", "A-0486", "A-0181", "A-0452", "A-0182", "A-0184", "A-0324", "A-0188", "A-0200", "A-0531", "A-0475"]
tags: ["research", "solution", "theme/trust", "theme/switching", "theme/security"]
updated: "2026-10-08"
---
# P06 · Tools get abandoned or change hands (lock-in risk)

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/trust|trust]] · [[themes/switching|switching]] · [[themes/security|security]]

> [!question] The problem
> Maintainers disappear, projects are archived or replaced, companies shut down cloud features. Users are stranded with their data and workflow inside a dead tool.
>
> **11 problems · 98 👍** · tools: aider (5), claude-squad (2), gemini-cli (1), vibe-kanban (1), continue (1)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0078 | 35 | gemini-cli | Tool being replaced by another product; unclear if it stays open source |  | [gemini-cli#27304](https://github.com/google-gemini/gemini-cli/issues/27304) |
| A-0486 | 14 | vibe-kanban | Company shutting down; cloud-dependent features need self-hosting and export |  | [vibe-kanban#3396](https://github.com/BloopAI/vibe-kanban/issues/3396) |
| A-0181 | 12 | aider | Unclear future of the project; maintainer silent |  | [aider#4648](https://github.com/Aider-AI/aider/issues/4648) |
| A-0452 | 11 | claude-squad | Orchestrator project seems abandoned; PRs and bugs ignored |  | [claude-squad#250](https://github.com/smtg-ai/claude-squad/issues/250) |
| A-0182 | 10 | aider | Maintainer disappeared; users unsure whether to keep relying on the tool |  | [aider#4613](https://github.com/Aider-AI/aider/issues/4613) |

> [!example]- All 11 problems in this cluster (click to open)
> - **A-0078** · 35 👍 · gemini-cli: Tool being replaced by another product; unclear if it stays open source · [gemini-cli#27304](https://github.com/google-gemini/gemini-cli/issues/27304)
> - **A-0486** · 14 👍 · vibe-kanban: Company shutting down; cloud-dependent features need self-hosting and export · [vibe-kanban#3396](https://github.com/BloopAI/vibe-kanban/issues/3396)
> - **A-0181** · 12 👍 · aider: Unclear future of the project; maintainer silent · [aider#4648](https://github.com/Aider-AI/aider/issues/4648)
> - **A-0452** · 11 👍 · claude-squad: Orchestrator project seems abandoned; PRs and bugs ignored · [claude-squad#250](https://github.com/smtg-ai/claude-squad/issues/250)
> - **A-0182** · 10 👍 · aider: Maintainer disappeared; users unsure whether to keep relying on the tool · [aider#4613](https://github.com/Aider-AI/aider/issues/4613)
> - **A-0184** · 8 👍 · aider: Uncertainty about the tool's direction vs competitors · [aider#4751](https://github.com/Aider-AI/aider/issues/4751)
> - **A-0324** · 4 👍 · continue: Project archived / no longer maintained; users stranded · [continue#12629](https://github.com/continuedev/continue/issues/12629)
> - **A-0188** · 3 👍 · aider: Confusion about maintenance status · [aider#5647](https://github.com/Aider-AI/aider/issues/5647)
> - **A-0200** · 1 👍 · aider: Project has no succession plan; community worried · [aider#4639](https://github.com/Aider-AI/aider/issues/4639)
> - **A-0531** · 0 👍 · crystal: Project looks dead; users look for alternatives · [crystal#235](https://github.com/stravu/crystal/issues/235)
> - **A-0475** · 0 👍 · claude-squad: Security fix merged but not released, blocking use at work · [claude-squad#303](https://github.com/smtg-ai/claude-squad/issues/303)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Vendor-neutral layer

> [!success] ✅ Netheron can build this
> Netheron supports several agents; if one dies, tasks move to another with no workflow change.
>
> **Effort:** none (already exists) · **Novelty:** High
> **Already in Netheron:** Built: Claude, Codex, OpenCode, shell

### S2 · Your data in open formats

> [!success] ✅ Netheron can build this
> Shared memory is a local SQLite file, tasks and research are plain files; add one-click export (JSON/Markdown).
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium
> **Already in Netheron:** Memory is local SQLite already

### S3 · Add new agents quickly

> [!success] ✅ Netheron can build this
> A small adapter format so a new agent (Pi, Gemini CLI, Goose…) can be added in under an hour.
>
> **Effort:** M (2–5 days) · **Novelty:** Medium

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Netheron can't keep another project alive; it can make leaving painless. Netheron itself must not become the next abandoned tool.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

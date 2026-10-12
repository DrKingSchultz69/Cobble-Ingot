---
type: "solution"
id: "P17"
title: "IDE plugins missing or breaking"
themes: ["platform", "reliability", "review"]
problems: 6
upvotes: 655
can_incorporate: "partly"
options: 3
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0014", "A-0099", "A-0302", "A-0298", "A-0228", "A-0325"]
tags: ["research", "solution", "theme/platform", "theme/reliability", "theme/review"]
updated: "2026-10-08"
---
# P17 · IDE plugins missing or breaking

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/platform|platform]] · [[themes/reliability|reliability]] · [[themes/review|review]]

> [!question] The problem
> No plugin for some IDEs (Visual Studio, Android Studio), plugins freeze or break after IDE updates; users fall back to a separate terminal and copy-paste errors.
>
> **6 problems · 655 👍** · tools: continue (2), claude-code (1), opencode (1), kilo (1), cline (1)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0014 | 460 | claude-code | No IDE plugin for their IDE: no integrated diff, no view of open files or compiler errors, constant alt-tabbing | Run the CLI in a separate terminal and copy-paste errors by hand | [claude-code#15942](https://github.com/anthropics/claude-code/issues/15942) |
| A-0099 | 160 | opencode | No official IDE extension; must work in the terminal only |  | [opencode#11176](https://github.com/anomalyco/opencode/issues/11176) |
| A-0302 | 17 | continue | Sidebar freezes frequently in JetBrains IDEs |  | [continue#8085](https://github.com/continuedev/continue/issues/8085) |
| A-0298 | 8 | kilo | Plugin runs commands in the wrong shell on macOS |  | [kilocode#2846](https://github.com/Kilo-Org/kilocode/issues/2846) |
| A-0228 | 7 | cline | Plugin doesn't work in Android Studio |  | [cline#11578](https://github.com/cline/cline/issues/11578) |

> [!example]- All 6 problems in this cluster (click to open)
> - **A-0014** · 460 👍 · claude-code: No IDE plugin for their IDE: no integrated diff, no view of open files or compiler errors, constant alt-tabbing · [claude-code#15942](https://github.com/anthropics/claude-code/issues/15942)
> - **A-0099** · 160 👍 · opencode: No official IDE extension; must work in the terminal only · [opencode#11176](https://github.com/anomalyco/opencode/issues/11176)
> - **A-0302** · 17 👍 · continue: Sidebar freezes frequently in JetBrains IDEs · [continue#8085](https://github.com/continuedev/continue/issues/8085)
> - **A-0298** · 8 👍 · kilo: Plugin runs commands in the wrong shell on macOS · [kilocode#2846](https://github.com/Kilo-Org/kilocode/issues/2846)
> - **A-0228** · 7 👍 · cline: Plugin doesn't work in Android Studio · [cline#11578](https://github.com/cline/cline/issues/11578)
> - **A-0325** · 3 👍 · continue: UI error in JetBrains · [continue#8182](https://github.com/continuedev/continue/issues/8182)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · IDE-independent workspace

> [!success] ✅ Netheron can build this
> Netheron's own diff, Code tab and terminal work next to any IDE.
>
> **Effort:** none (already exists) · **Novelty:** Medium
> **Already in Netheron:** Built: Code tab, diff, terminals

### S2 · 'Open in my IDE' button

> [!success] ✅ Netheron can build this
> Open the task's worktree or a file at a line in VS Code, Cursor, Visual Studio or JetBrains.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Low

### S3 · Feed IDE/compiler errors to agents

> [!warning] 🟡 Netheron can partly do this
> Collect build/LSP errors centrally (see P32) so no IDE plugin is needed for the agent to see them.
>
> **Effort:** M (2–5 days) · **Novelty:** High

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Plugins inside each IDE are the vendors'.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

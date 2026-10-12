---
type: "solution"
id: "P32"
title: "Agents lack code intelligence (LSP)"
themes: ["context", "quality"]
problems: 1
upvotes: 502
can_incorporate: "yes"
options: 2
partly_built: false
status: "wave 3 built"
decision: ""
priority: ""
rows: ["A-0036"]
tags: ["research", "solution", "theme/context", "theme/quality"]
updated: "2026-10-08"
---
# P32 · Agents lack code intelligence (LSP)

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/context|context]] · [[themes/quality|quality]]

> [!question] The problem
> Without type/compiler diagnostics, agents produce edits that fail builds, forcing repeated build-test cycles.
>
> **1 problems · 502 👍** · tools: codex (1)

> [!success] Built in Wave 3 (2026-10-10)
> S1 LSP-lite: mm_diagnostics + Check code markers (no go-to-definition yet). See [[BUGS]] B-040.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0036 | 502 | codex | Without LSP diagnostics the agent produces edits that fail type-checks/builds, forcing repeated build-test cycles |  | [codex#8745](https://github.com/openai/codex/issues/8745) |

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · One shared language server for all agents

> [!success] ✅ Netheron can build this
> Netheron runs LSP servers per project and exposes diagnostics/definitions to every agent via MCP, and to you in the Code tab.
>
> **Effort:** L (1–3 weeks) · **Novelty:** High: one code brain shared across vendors

### S2 · Run checks after each turn

> [!success] ✅ Netheron can build this
> Run the project's type-check/lint after each agent turn and feed errors back.
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

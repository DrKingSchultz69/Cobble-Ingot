---
type: "solution"
id: "P21"
title: "Agent questions get skipped, time out or can't be asked"
themes: ["control", "remote", "quality"]
problems: 8
upvotes: 878
can_incorporate: "partly"
options: 3
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0018", "A-0046", "A-0060", "A-0106", "A-0146", "A-0501", "A-0426", "A-0433"]
tags: ["research", "solution", "theme/control", "theme/remote", "theme/quality"]
updated: "2026-10-08"
---
# P21 · Agent questions get skipped, time out or can't be asked

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/control|control]] · [[themes/remote|remote]] · [[themes/quality|quality]]

> [!question] The problem
> Agents give up waiting after 60 s and continue without the answer, question tools are auto-skipped, orchestrators don't show the question at all.
>
> **8 problems · 878 👍** · tools: codex (2), copilot (2), claude-code (1), opencode (1), pi (1)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0018 | 388 | claude-code | Agent stops waiting for the user's answer after 60 s and continues without it |  | [claude-code#73125](https://github.com/anthropics/claude-code/issues/73125) |
| A-0046 | 214 | codex | Agent auto-resolves its own questions after 60 s instead of waiting for the user |  | [codex#28969](https://github.com/openai/codex/issues/28969) |
| A-0060 | 126 | codex | Agent can't ask the user questions in some modes |  | [codex#10384](https://github.com/openai/codex/issues/10384) |
| A-0106 | 126 | opencode | Plan mode doesn't ask clarifying questions like another agent does |  | [opencode#3844](https://github.com/anomalyco/opencode/issues/3844) |
| A-0146 | 9 | pi | Host apps can't tell when the agent is waiting for user input |  | [pi#5329](https://github.com/earendil-works/pi/issues/5329) |

> [!example]- All 8 problems in this cluster (click to open)
> - **A-0018** · 388 👍 · claude-code: Agent stops waiting for the user's answer after 60 s and continues without it · [claude-code#73125](https://github.com/anthropics/claude-code/issues/73125)
> - **A-0046** · 214 👍 · codex: Agent auto-resolves its own questions after 60 s instead of waiting for the user · [codex#28969](https://github.com/openai/codex/issues/28969)
> - **A-0060** · 126 👍 · codex: Agent can't ask the user questions in some modes · [codex#10384](https://github.com/openai/codex/issues/10384)
> - **A-0106** · 126 👍 · opencode: Plan mode doesn't ask clarifying questions like another agent does · [opencode#3844](https://github.com/anomalyco/opencode/issues/3844)
> - **A-0146** · 9 👍 · pi: Host apps can't tell when the agent is waiting for user input · [pi#5329](https://github.com/earendil-works/pi/issues/5329)
> - **A-0501** · 7 👍 · vibe-kanban: Orchestrator UI doesn't support the agent's question prompts · [vibe-kanban#1220](https://github.com/BloopAI/vibe-kanban/issues/1220)
> - **A-0426** · 6 👍 · copilot: Agent's question tool is always skipped; user never sees the question · [vscode-copilot-release#14105](https://github.com/microsoft/vscode-copilot-release/issues/14105)
> - **A-0433** · 2 👍 · copilot: Auto-approve also auto-skips the agent's questions · [vscode-copilot-release#14123](https://github.com/microsoft/vscode-copilot-release/issues/14123)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · 'Needs you' notification + answer from phone

> [!success] ✅ Netheron can build this
> When an agent waits for input, Netheron notifies you (🔔) and lets you answer from the phone key bar.
>
> **Effort:** none (already exists) · **Novelty:** High
> **Already in Netheron:** Built: idle detection, notifications, phone key bar

### S2 · Hold the agent until you answer

> [!warning] 🟡 Netheron can partly do this
> Send keep-alive input or pause the task while you're away (depends on agent behaviour).
>
> **Effort:** M (2–5 days) · **Novelty:** Medium

### S3 · Question log

> [!success] ✅ Netheron can build this
> Record every question and answer in shared memory so the next agent knows the decision.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium
> **Already in Netheron:** mm_record exists

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> The 60-second timeout inside a vendor's CLI is theirs.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

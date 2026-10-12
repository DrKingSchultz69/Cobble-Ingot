---
type: "solution"
id: "P34"
title: "Running many agents at once is chaotic"
themes: ["parallel", "ux", "review"]
problems: 12
upvotes: 536
can_incorporate: "yes"
options: 4
partly_built: true
status: "wave 2 built"
decision: ""
priority: ""
rows: ["A-0024", "A-0108", "A-0123", "A-0073", "A-0151", "A-0500", "A-0454", "A-0264", "A-0457", "A-0460", "A-0473", "A-0474"]
tags: ["research", "solution", "theme/parallel", "theme/ux", "theme/review"]
updated: "2026-10-08"
---
# P34 · Running many agents at once is chaotic

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/parallel|parallel]] · [[themes/ux|ux]] · [[themes/review|review]]

> [!question] The problem
> No multiple windows, no agent teams, blocking sub-agents, no single board across projects, must attach to each agent to answer, lists don't scale, no visibility into what sub-agents do.
>
> **12 problems · 536 👍** · tools: claude-squad (5), opencode (2), claude-code (1), gemini-cli (1), omp (1)

> [!success] Built in Wave 2 (2026-10-10)
> S3 Race & Judge. See [[BUGS]] B-039.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0024 | 245 | claude-code | Desktop app can't open multiple windows for parallel work |  | [claude-code#30154](https://github.com/anthropics/claude-code/issues/30154) |
| A-0108 | 119 | opencode | No multi-agent teams like a competitor has |  | [opencode#12661](https://github.com/anomalyco/opencode/issues/12661) |
| A-0123 | 83 | opencode | Sub-agents run blocking, not in the background |  | [opencode#5887](https://github.com/anomalyco/opencode/issues/5887) |
| A-0073 | 44 | gemini-cli | No parallel multi-agent teams |  | [gemini-cli#19430](https://github.com/google-gemini/gemini-cli/issues/19430) |
| A-0151 | 30 | omp | Zero visibility into what running subagents are doing |  | [oh-my-pi#3815](https://github.com/can1357/oh-my-pi/issues/3815) |

> [!example]- All 12 problems in this cluster (click to open)
> - **A-0024** · 245 👍 · claude-code: Desktop app can't open multiple windows for parallel work · [claude-code#30154](https://github.com/anthropics/claude-code/issues/30154)
> - **A-0108** · 119 👍 · opencode: No multi-agent teams like a competitor has · [opencode#12661](https://github.com/anomalyco/opencode/issues/12661)
> - **A-0123** · 83 👍 · opencode: Sub-agents run blocking, not in the background · [opencode#5887](https://github.com/anomalyco/opencode/issues/5887)
> - **A-0073** · 44 👍 · gemini-cli: No parallel multi-agent teams · [gemini-cli#19430](https://github.com/google-gemini/gemini-cli/issues/19430)
> - **A-0151** · 30 👍 · omp: Zero visibility into what running subagents are doing · [oh-my-pi#3815](https://github.com/can1357/oh-my-pi/issues/3815)
> - **A-0500** · 7 👍 · vibe-kanban: No single board across all projects · [vibe-kanban#1106](https://github.com/BloopAI/vibe-kanban/issues/1106)
> - **A-0454** · 4 👍 · claude-squad: Can't start a session in another repo without relaunching · [claude-squad#299](https://github.com/smtg-ai/claude-squad/issues/299)
> - **A-0264** · 2 👍 · roo: Can't run several agents side by side in one panel · [Roo-Code#8778](https://github.com/RooCodeInc/Roo-Code/issues/8778)
> - **A-0457** · 1 👍 · claude-squad: Session list doesn't show which repo each session belongs to · [claude-squad#238](https://github.com/smtg-ai/claude-squad/issues/238)
> - **A-0460** · 1 👍 · claude-squad: Must attach to each agent just to answer a prompt or press Enter · [claude-squad#312](https://github.com/smtg-ai/claude-squad/issues/312)
> - **A-0473** · 0 👍 · claude-squad: List doesn't scale past ~10 sessions · [claude-squad#296](https://github.com/smtg-ai/claude-squad/issues/296)
> - **A-0474** · 0 👍 · claude-squad: Has to name every session and copy-paste prompts; can't fork a session · [claude-squad#292](https://github.com/smtg-ai/claude-squad/issues/292)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · One board for every task, every project, every agent

> [!success] ✅ Netheron can build this
> Netheron's board shows all tasks with status (running / needs you / done).
>
> **Effort:** none (already exists) · **Novelty:** High
> **Already in Netheron:** Built: board + split panes

### S2 · Answer without switching

> [!success] ✅ Netheron can build this
> Key bar and quick replies send input to any task from the board.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium
> **Already in Netheron:** Key bar exists per focused task

### S3 · Race & Judge

> [!success] ✅ Netheron can build this
> Same task on several agents in parallel; tests + review pick the winner.
>
> **Effort:** M (2–5 days) · **Novelty:** High

### S4 · Live timeline per task

> [!success] ✅ Netheron can build this
> Readable list of each agent step (tool calls, files, tokens) from the proxy + terminal.
>
> **Effort:** M (2–5 days) · **Novelty:** High

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

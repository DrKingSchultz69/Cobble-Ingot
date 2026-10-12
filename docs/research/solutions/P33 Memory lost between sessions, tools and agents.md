---
type: "solution"
id: "P33"
title: "Memory lost between sessions, tools and agents"
themes: ["context", "parallel", "control"]
problems: 9
upvotes: 171
can_incorporate: "yes"
options: 3
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0105", "A-0275", "A-0161", "A-0424", "A-0438", "A-0265", "A-0447", "A-0448", "A-0528"]
tags: ["research", "solution", "theme/context", "theme/parallel", "theme/control"]
updated: "2026-10-08"
---
# P33 · Memory lost between sessions, tools and agents

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/context|context]] · [[themes/parallel|parallel]] · [[themes/control|control]]

> [!question] The problem
> Agents lose earlier context and claim no work was done, plans vanish when the workspace closes, history isn't shared across tools, sessions can't fork or coordinate.
>
> **9 problems · 171 👍** · tools: copilot (4), opencode (1), kilo (1), omp (1), roo (1)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0105 | 128 | opencode | Can't set custom system prompts per project/global |  | [opencode#7101](https://github.com/anomalyco/opencode/issues/7101) |
| A-0275 | 16 | kilo | No multi-root workspace support |  | [kilocode#7253](https://github.com/Kilo-Org/kilocode/issues/7253) |
| A-0161 | 12 | omp | Independent agent sessions can't message or coordinate with each other |  | [oh-my-pi#8077](https://github.com/can1357/oh-my-pi/issues/8077) |
| A-0424 | 9 | copilot | Chat history not shared between two editions of the editor |  | [vscode-copilot-release#14118](https://github.com/microsoft/vscode-copilot-release/issues/14118) |
| A-0438 | 2 | copilot | Agent plans lost when the workspace closes; can't save them to the repo |  | [vscode-copilot-release#14151](https://github.com/microsoft/vscode-copilot-release/issues/14151) |

> [!example]- All 9 problems in this cluster (click to open)
> - **A-0105** · 128 👍 · opencode: Can't set custom system prompts per project/global · [opencode#7101](https://github.com/anomalyco/opencode/issues/7101)
> - **A-0275** · 16 👍 · kilo: No multi-root workspace support · [kilocode#7253](https://github.com/Kilo-Org/kilocode/issues/7253)
> - **A-0161** · 12 👍 · omp: Independent agent sessions can't message or coordinate with each other · [oh-my-pi#8077](https://github.com/can1357/oh-my-pi/issues/8077)
> - **A-0424** · 9 👍 · copilot: Chat history not shared between two editions of the editor · [vscode-copilot-release#14118](https://github.com/microsoft/vscode-copilot-release/issues/14118)
> - **A-0438** · 2 👍 · copilot: Agent plans lost when the workspace closes; can't save them to the repo · [vscode-copilot-release#14151](https://github.com/microsoft/vscode-copilot-release/issues/14151)
> - **A-0265** · 2 👍 · roo: Can't fork a conversation, so expensive loaded context is lost or duplicated · [Roo-Code#10049](https://github.com/RooCodeInc/Roo-Code/issues/10049)
> - **A-0447** · 1 👍 · copilot: Agent loses earlier context and claims no prior work was done · [vscode-copilot-release#14145](https://github.com/microsoft/vscode-copilot-release/issues/14145)
> - **A-0448** · 1 👍 · copilot: Multi-agent handoffs can't start a fresh chat · [vscode-copilot-release#14161](https://github.com/microsoft/vscode-copilot-release/issues/14161)
> - **A-0528** · 0 👍 · crystal: Auto-context feature bleeds prompts into the agent's main workspace · [crystal#233](https://github.com/stravu/crystal/issues/233)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Shared project memory across agents

> [!success] ✅ Netheron can build this
> Decisions, outcomes and research saved to one memory every agent reads (mm_get_context / mm_record).
>
> **Effort:** none (already exists) · **Novelty:** High
> **Already in Netheron:** Built: shared memory (phase 2)

### S2 · Plans saved to memory and repo

> [!success] ✅ Netheron can build this
> Agent plans stored as memory nodes and optionally as a file in the repo.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium

### S3 · Fork a task to another agent

> [!success] ✅ Netheron can build this
> Duplicate a task (same worktree base + memory) into a new agent to try another approach.
>
> **Effort:** S (hours to 1 day) · **Novelty:** High
> **Already in Netheron:** Hand-off exists

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

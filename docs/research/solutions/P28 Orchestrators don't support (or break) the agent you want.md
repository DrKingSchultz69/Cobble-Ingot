---
type: "solution"
id: "P28"
title: "Orchestrators don't support (or break) the agent you want"
themes: ["reliability", "switching", "standards"]
problems: 16
upvotes: 63
can_incorporate: "yes"
options: 3
partly_built: true
status: "wave 3 built"
decision: ""
priority: ""
rows: ["A-0451", "A-0488", "A-0489", "A-0497", "A-0509", "A-0239", "A-0349", "A-0513", "A-0458", "A-0526", "A-0476", "A-0463", "A-0465", "A-0461", "A-0525", "A-0470"]
tags: ["research", "solution", "theme/reliability", "theme/switching", "theme/standards"]
updated: "2026-10-08"
---
# P28 · Orchestrators don't support (or break) the agent you want

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/reliability|reliability]] · [[themes/switching|switching]] · [[themes/standards|standards]]

> [!question] The problem
> Orchestrators lack support for some agents (Kiro, Droid…), break when an agent updates, send the prompt before the agent is ready, or fail to create sessions.
>
> **16 problems · 63 👍** · tools: claude-squad (7), vibe-kanban (4), crystal (3), cline (1), goose (1)

> [!success] Built in Wave 3 (2026-10-10)
> S1 adapters for Pi and Oh My Pi (memory + rules go in the prompt). See [[BUGS]] B-040.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0451 | 14 | claude-squad | Orchestrator errors capturing terminal output on start |  | [claude-squad#216](https://github.com/smtg-ai/claude-squad/issues/216) |
| A-0488 | 13 | vibe-kanban | External agent server exits before starting |  | [vibe-kanban#2077](https://github.com/BloopAI/vibe-kanban/issues/2077) |
| A-0489 | 11 | vibe-kanban | Another agent CLI not supported |  | [vibe-kanban#1708](https://github.com/BloopAI/vibe-kanban/issues/1708) |
| A-0497 | 8 | vibe-kanban | Can't plug in any agent via a standard protocol |  | [vibe-kanban#2365](https://github.com/BloopAI/vibe-kanban/issues/2365) |
| A-0509 | 6 | vibe-kanban | A popular agent not supported |  | [vibe-kanban#1004](https://github.com/BloopAI/vibe-kanban/issues/1004) |

> [!example]- All 16 problems in this cluster (click to open)
> - **A-0451** · 14 👍 · claude-squad: Orchestrator errors capturing terminal output on start · [claude-squad#216](https://github.com/smtg-ai/claude-squad/issues/216)
> - **A-0488** · 13 👍 · vibe-kanban: External agent server exits before starting · [vibe-kanban#2077](https://github.com/BloopAI/vibe-kanban/issues/2077)
> - **A-0489** · 11 👍 · vibe-kanban: Another agent CLI not supported · [vibe-kanban#1708](https://github.com/BloopAI/vibe-kanban/issues/1708)
> - **A-0497** · 8 👍 · vibe-kanban: Can't plug in any agent via a standard protocol · [vibe-kanban#2365](https://github.com/BloopAI/vibe-kanban/issues/2365)
> - **A-0509** · 6 👍 · vibe-kanban: A popular agent not supported · [vibe-kanban#1004](https://github.com/BloopAI/vibe-kanban/issues/1004)
> - **A-0239** · 5 👍 · cline: Kanban CLI crashes with a dependency error · [cline#9990](https://github.com/cline/cline/issues/9990)
> - **A-0349** · 4 👍 · goose: Custom streaming API instead of a standard protocol limits other clients · [goose#6642](https://github.com/aaif-goose/goose/issues/6642)
> - **A-0513** · 1 👍 · crystal: Orchestrator can't start the agent even though it works in the terminal · [crystal#228](https://github.com/stravu/crystal/issues/228)
> - **A-0458** · 1 👍 · claude-squad: Creating a new instance fails with a fatal error · [claude-squad#231](https://github.com/smtg-ai/claude-squad/issues/231)
> - **A-0526** · 0 👍 · crystal: Personas not supported for another agent · [crystal#209](https://github.com/stravu/crystal/issues/209)
> - **A-0476** · 0 👍 · claude-squad: Can't type prompts when running a different agent inside the orchestrator · [claude-squad#232](https://github.com/smtg-ai/claude-squad/issues/232)
> - **A-0463** · 0 👍 · claude-squad: Can't create new instances; terminal capture errors · [claude-squad#218](https://github.com/smtg-ai/claude-squad/issues/218)
> - **A-0465** · 0 👍 · claude-squad: Creating a new instance fails (duplicate report) · [claude-squad#230](https://github.com/smtg-ai/claude-squad/issues/230)
> - **A-0461** · 0 👍 · claude-squad: Prompt is sent before the agent CLI is ready, so it's lost · [claude-squad#266](https://github.com/smtg-ai/claude-squad/issues/266)
> - **A-0525** · 0 👍 · crystal: New session error · [crystal#226](https://github.com/stravu/crystal/issues/226)
> - **A-0470** · 0 👍 · claude-squad: Pausing a session can leave it in a broken state · [claude-squad#284](https://github.com/smtg-ai/claude-squad/issues/284)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Agent adapter kit

> [!success] ✅ Netheron can build this
> A small adapter (launch command, ready signal, input format) so new agents can be added quickly; Pi and Oh My Pi first.
>
> **Effort:** M (2–5 days) · **Novelty:** Medium

### S2 · Wait-until-ready before sending the prompt

> [!success] ✅ Netheron can build this
> Detect the agent's ready state before typing into it.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Low
> **Already in Netheron:** Prompts are passed as launch arguments today

### S3 · Standard protocol support (ACP/MCP)

> [!warning] 🟡 Netheron can partly do this
> Speak the Agent Client Protocol so any compliant agent plugs in.
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

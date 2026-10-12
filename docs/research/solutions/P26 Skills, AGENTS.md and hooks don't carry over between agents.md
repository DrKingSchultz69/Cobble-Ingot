---
type: "solution"
id: "P26"
title: "Skills, AGENTS.md and hooks don't carry over between agents"
themes: ["standards", "switching", "context"]
problems: 17
upvotes: 1150
can_incorporate: "partly"
options: 3
partly_built: true
status: "wave 2 built"
decision: ""
priority: ""
rows: ["A-0016", "A-0064", "A-0361", "A-0103", "A-0061", "A-0109", "A-0550", "A-0494", "A-0503", "A-0238", "A-0427", "A-0260", "A-0261", "A-0403", "A-0406", "A-0442", "A-0204"]
tags: ["research", "solution", "theme/standards", "theme/switching", "theme/context"]
updated: "2026-10-08"
---
# P26 · Skills, AGENTS.md and hooks don't carry over between agents

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/standards|standards]] · [[themes/switching|switching]] · [[themes/context|context]]

> [!question] The problem
> Each agent has its own instruction files, skill folders and hooks; users must duplicate and maintain them per tool; one vendor ignored a 3,000-upvote request for months.
>
> **17 problems · 1150 👍** · tools: opencode (2), vibe-kanban (2), copilot (2), roo (2), openhands (2)

> [!success] Built in Wave 2 (2026-10-10)
> S1 shared rules for every agent, S2 rules listed per task. See [[BUGS]] B-039.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0016 | 403 | claude-code | Agent ignores the shared AGENTS.md / .agents/skills standard; 3,000+ upvotes over 7 months with no vendor reply |  | [claude-code#31005](https://github.com/anthropics/claude-code/issues/31005) |
| A-0064 | 165 | gemini-cli | Agent lacks the 'skills' extension feature other agents have |  | [gemini-cli#11506](https://github.com/google-gemini/gemini-cli/issues/11506) |
| A-0361 | 158 | zed | Editor lacks the Agent Skills standard |  | [zed#49057](https://github.com/zed-industries/zed/issues/49057) |
| A-0103 | 132 | opencode | Missing 'skills' (lazily loaded instructions) that another agent has |  | [opencode#3235](https://github.com/anomalyco/opencode/issues/3235) |
| A-0061 | 118 | codex | Hard to understand which AGENTS.md instructions apply (nested files) |  | [codex#12115](https://github.com/openai/codex/issues/12115) |

> [!example]- All 17 problems in this cluster (click to open)
> - **A-0016** · 403 👍 · claude-code: Agent ignores the shared AGENTS.md / .agents/skills standard; 3,000+ upvotes over 7 months with no vendor reply · [claude-code#31005](https://github.com/anthropics/claude-code/issues/31005)
> - **A-0064** · 165 👍 · gemini-cli: Agent lacks the 'skills' extension feature other agents have · [gemini-cli#11506](https://github.com/google-gemini/gemini-cli/issues/11506)
> - **A-0361** · 158 👍 · zed: Editor lacks the Agent Skills standard · [zed#49057](https://github.com/zed-industries/zed/issues/49057)
> - **A-0103** · 132 👍 · opencode: Missing 'skills' (lazily loaded instructions) that another agent has · [opencode#3235](https://github.com/anomalyco/opencode/issues/3235)
> - **A-0061** · 118 👍 · codex: Hard to understand which AGENTS.md instructions apply (nested files) · [codex#12115](https://github.com/openai/codex/issues/12115)
> - **A-0109** · 118 👍 · opencode: No quick way to list and invoke skills · [opencode#7846](https://github.com/anomalyco/opencode/issues/7846)
> - **A-0550** · 17 👍 · litellm: Can't add skills from private repos · [litellm#26071](https://github.com/BerriAI/litellm/issues/26071)
> - **A-0494** · 8 👍 · vibe-kanban: No support for spec-driven development · [vibe-kanban#1848](https://github.com/BloopAI/vibe-kanban/issues/1848)
> - **A-0503** · 7 👍 · vibe-kanban: Skills and commands not supported · [vibe-kanban#1939](https://github.com/BloopAI/vibe-kanban/issues/1939)
> - **A-0238** · 6 👍 · cline: Skills work in the CLI but not in the IDE extension · [cline#12236](https://github.com/cline/cline/issues/12236)
> - **A-0427** · 5 👍 · copilot: Skill file validator rejects a standard attribute · [vscode-copilot-release#14131](https://github.com/microsoft/vscode-copilot-release/issues/14131)
> - **A-0260** · 3 👍 · roo: Skills folder location differs between agents, so moving between them is painful · [Roo-Code#11368](https://github.com/RooCodeInc/Roo-Code/issues/11368)
> - **A-0261** · 3 👍 · roo: Missing prompt-based hooks that another agent has · [Roo-Code#11504](https://github.com/RooCodeInc/Roo-Code/issues/11504)
> - **A-0403** · 3 👍 · openhands: Irrelevant skills pre-installed and enabled · [OpenHands#16302](https://github.com/OpenHands/OpenHands/issues/16302)
> - **A-0406** · 2 👍 · openhands: Wants a hooks system like another agent · [OpenHands#11943](https://github.com/OpenHands/OpenHands/issues/11943)
> - **A-0442** · 1 👍 · copilot: Can't see where a prompt or skill is defined · [vscode-copilot-release#14135](https://github.com/microsoft/vscode-copilot-release/issues/14135)
> - **A-0204** · 1 👍 · aider: Wants integration with a spec-driven workflow tool · [aider#4822](https://github.com/Aider-AI/aider/issues/4822)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · One skills/instructions store for every agent

> [!success] ✅ Netheron can build this
> Write skills and rules once in Netheron's shared memory; Netheron feeds them to each agent in its own format (CLAUDE.md, AGENTS.md, .agents/skills, MCP prompts).
>
> **Effort:** M (2–5 days) · **Novelty:** High: write once, works everywhere
> **Already in Netheron:** Shared memory + MCP already reach Claude/Codex/OpenCode

### S2 · Show which instructions apply

> [!success] ✅ Netheron can build this
> Per task, list the exact instruction files and skills the agent received.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium

### S3 · Cross-agent hooks

> [!success] ✅ Netheron can build this
> Netheron-level before/after hooks (format, lint, secret scan) that run for any agent.
>
> **Effort:** M (2–5 days) · **Novelty:** High

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Native support for standards inside each CLI is the vendor's.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

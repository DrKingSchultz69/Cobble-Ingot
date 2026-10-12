---
type: "research-theme"
theme: "context"
rows: 34
upvotes: 2041
avg_severity: 2.3
generated: "2026-10-08"
tags: ["research", "theme", "theme/context"]
---

# Theme: context

> [!info] Agent forgets or misses context (decisions, files, other repos)
> **34** problems · **2041** 👍 · average severity **2.3** / 5 · rank **#12** of 24

Back to [[Pain log]] · [[synthesis]] · [[Research Home]]

## Tools most affected
- codex: 5
- omp: 4
- copilot: 4
- opencode: 3
- pi: 3
- cline: 3
- kilo: 2
- openhands: 2

## Workarounds people use (1)
- **A-0194** (2 👍): Checks /tokens by hand

## Netheron ideas noted while labeling (5)
- **A-0036**: One shared LSP for all agents
- **A-0161**: Netheron shared memory lets agents coordinate across vendors
- **A-0265**: Fork a task to another agent with shared memory
- **A-0438**: Plans saved to shared memory
- **A-0447**: Shared memory survives context loss

## All problems (sorted by 👍)

Checked: ✅ verified by you · 🔁 rechecked by an agent · · not yet

| ID | 👍 | Sev | Tool | Role | Problem | Workaround | Source | Checked |
|---|---|---|---|---|---|---|---|---|
| A-0036 | 502 | 3 | codex | ? | Without LSP diagnostics the agent produces edits that fail type-checks/builds, forcing repeated build-test cycles |  | [codex#8745](https://github.com/openai/codex/issues/8745) | 🔁 |
| A-0021 | 263 | 2 | claude-code | ? | IDE extension auto-attaches the open file/selection as context with no way to disable |  | [claude-code#24726](https://github.com/anthropics/claude-code/issues/24726) | · |
| A-0049 | 176 | 2 | codex | ? | Context/token usage indicator removed from the desktop app |  | [codex#23794](https://github.com/openai/codex/issues/23794) | · |
| A-0052 | 168 | 3 | codex | ? | Context window smaller in the tool than the model officially supports |  | [codex#19464](https://github.com/openai/codex/issues/19464) | · |
| A-0054 | 154 | 2 | codex | ? | Can't manually compact context in the desktop app |  | [codex#11325](https://github.com/openai/codex/issues/11325) | · |
| A-0100 | 152 | 2 | opencode | ? | No way to set a session goal the agent keeps working toward |  | [opencode#27167](https://github.com/anomalyco/opencode/issues/27167) | · |
| A-0102 | 138 | 2 | opencode | ? | Can't see how much of the context window is used |  | [opencode#6152](https://github.com/anomalyco/opencode/issues/6152) | · |
| A-0105 | 128 | 2 | opencode | ? | Can't set custom system prompts per project/global |  | [opencode#7101](https://github.com/anomalyco/opencode/issues/7101) | · |
| A-0061 | 118 | 2 | codex | ? | Hard to understand which AGENTS.md instructions apply (nested files) |  | [codex#12115](https://github.com/openai/codex/issues/12115) | · |
| A-0368 | 45 | 3 | zed | ? | External agents stopped working with multi-folder workspaces after an update |  | [zed#54480](https://github.com/zed-industries/zed/issues/54480) | · |
| A-0153 | 26 | 3 | omp | ? | 40K-token system prompt is too heavy for local models |  | [oh-my-pi#1734](https://github.com/can1357/oh-my-pi/issues/1734) | · |
| A-0125 | 20 | 3 | pi | ? | Auto-compaction doesn't trigger, context overflows in long runs |  | [pi#6879](https://github.com/earendil-works/pi/issues/6879) | · |
| A-0127 | 19 | 3 | pi | ? | Context compaction fails with an enterprise provider |  | [pi#6768](https://github.com/earendil-works/pi/issues/6768) | · |
| A-0275 | 16 | 2 | kilo | ? | No multi-root workspace support |  | [kilocode#7253](https://github.com/Kilo-Org/kilocode/issues/7253) | · |
| A-0161 | 12 | 2 | omp | ? | Independent agent sessions can't message or coordinate with each other |  | [oh-my-pi#8077](https://github.com/can1357/oh-my-pi/issues/8077) | · |
| A-0139 | 11 | 3 | pi | ? | Context compaction breaks on some subscription models |  | [pi#6477](https://github.com/earendil-works/pi/issues/6477) | · |
| A-0284 | 11 | 2 | kilo | ? | Context window much smaller than the model supports |  | [kilocode#2778](https://github.com/Kilo-Org/kilocode/issues/2778) | · |
| A-0168 | 9 | 3 | omp | ? | Provider returns quota errors only with this agent's large system prompt |  | [oh-my-pi#11704](https://github.com/can1357/oh-my-pi/issues/11704) | · |
| A-0424 | 9 | 2 | copilot | ? | Chat history not shared between two editions of the editor |  | [vscode-copilot-release#14118](https://github.com/microsoft/vscode-copilot-release/issues/14118) | · |
| A-0178 | 8 | 1 | omp | ? | Context compaction thresholds can't differ per model |  | [oh-my-pi#6835](https://github.com/can1357/oh-my-pi/issues/6835) | · |
| A-0221 | 8 | 3 | cline | ? | Configured 1M context silently capped at 128K; tool-parsing failures |  | [cline#10551](https://github.com/cline/cline/issues/10551) | · |
| A-0494 | 8 | 2 | vibe-kanban | ? | No support for spec-driven development |  | [vibe-kanban#1848](https://github.com/BloopAI/vibe-kanban/issues/1848) | · |
| A-0226 | 7 | 2 | cline | ? | @file mentions stop finding files after an IDE update |  | [cline#11105](https://github.com/cline/cline/issues/11105) | · |
| A-0229 | 7 | 3 | cline | ? | Tool output and file content truncated in context; limits not configurable |  | [cline#13263](https://github.com/cline/cline/issues/13263) | · |
| A-0333 | 7 | 2 | goose | ? | Can't change context limit for a custom provider in the UI |  | [goose#8780](https://github.com/aaif-goose/goose/issues/8780) | · |
| A-0310 | 6 | 3 | continue | ? | Agent lists the filesystem root instead of the project folder |  | [continue#9188](https://github.com/continuedev/continue/issues/9188) | · |
| A-0403 | 3 | 1 | openhands | ? | Irrelevant skills pre-installed and enabled |  | [OpenHands#16302](https://github.com/OpenHands/OpenHands/issues/16302) | · |
| A-0194 | 2 | 2 | aider | ? | Can't cap context size for a local GPU; must check tokens manually | Checks /tokens by hand | [aider#4583](https://github.com/Aider-AI/aider/issues/4583) | · |
| A-0265 | 2 | 2 | roo | ? | Can't fork a conversation, so expensive loaded context is lost or duplicated |  | [Roo-Code#10049](https://github.com/RooCodeInc/Roo-Code/issues/10049) | · |
| A-0413 | 2 | 2 | openhands | ? | Long history overflows context; can't reset while keeping the environment |  | [OpenHands#12564](https://github.com/OpenHands/OpenHands/issues/12564) | · |
| A-0438 | 2 | 2 | copilot | ? | Agent plans lost when the workspace closes; can't save them to the repo |  | [vscode-copilot-release#14151](https://github.com/microsoft/vscode-copilot-release/issues/14151) | · |
| A-0447 | 1 | 4 | copilot | ? | Agent loses earlier context and claims no prior work was done |  | [vscode-copilot-release#14145](https://github.com/microsoft/vscode-copilot-release/issues/14145) | · |
| A-0448 | 1 | 1 | copilot | ? | Multi-agent handoffs can't start a fresh chat |  | [vscode-copilot-release#14161](https://github.com/microsoft/vscode-copilot-release/issues/14161) | · |
| A-0528 | 0 | 3 | crystal | ? | Auto-context feature bleeds prompts into the agent's main workspace |  | [crystal#233](https://github.com/stravu/crystal/issues/233) | · |

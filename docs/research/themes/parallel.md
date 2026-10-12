---
type: "research-theme"
theme: "parallel"
rows: 28
upvotes: 924
avg_severity: 2
generated: "2026-10-08"
tags: ["research", "theme", "theme/parallel"]
---

# Theme: parallel

> [!info] Running several agents at once: conflicts, chaos
> **28** problems · **924** 👍 · average severity **2.0** / 5 · rank **#18** of 24

Back to [[Pain log]] · [[synthesis]] · [[Research Home]]

## Tools most affected
- claude-squad: 9
- vibe-kanban: 5
- omp: 3
- opencode: 2
- zed: 2
- copilot: 2
- claude-code: 1
- codex: 1

## Netheron ideas noted while labeling (9)
- **A-0050**: Router picks model per subtask
- **A-0073**: Netheron runs agents in parallel worktrees across vendors
- **A-0151**: Netheron live timeline per agent
- **A-0421**: Router per subtask
- **A-0161**: Netheron shared memory lets agents coordinate across vendors
- **A-0170**: Router per subtask
- **A-0453**: Netheron worktree setup recipe: copy env, install deps, assign ports
- **A-0495**: Task pipelines across agents
- **A-0460**: Netheron board + key bar answer prompts without switching

## All problems (sorted by 👍)

Checked: ✅ verified by you · 🔁 rechecked by an agent · · not yet

| ID | 👍 | Sev | Tool | Role | Problem | Workaround | Source | Checked |
|---|---|---|---|---|---|---|---|---|
| A-0024 | 245 | 2 | claude-code | ? | Desktop app can't open multiple windows for parallel work |  | [claude-code#30154](https://github.com/anthropics/claude-code/issues/30154) | · |
| A-0050 | 176 | 3 | codex | ? | Can't choose which model subagents use; all forced to the expensive one |  | [codex#31814](https://github.com/openai/codex/issues/31814) | · |
| A-0108 | 119 | 2 | opencode | ? | No multi-agent teams like a competitor has |  | [opencode#12661](https://github.com/anomalyco/opencode/issues/12661) | · |
| A-0364 | 92 | 3 | zed | ? | No side-by-side merge conflict UI |  | [zed#58974](https://github.com/zed-industries/zed/issues/58974) | · |
| A-0123 | 83 | 2 | opencode | ? | Sub-agents run blocking, not in the background |  | [opencode#5887](https://github.com/anomalyco/opencode/issues/5887) | · |
| A-0073 | 44 | 2 | gemini-cli | ? | No parallel multi-agent teams |  | [gemini-cli#19430](https://github.com/google-gemini/gemini-cli/issues/19430) | · |
| A-0373 | 37 | 2 | zed | ? | New multi-agent layout can't be reverted |  | [zed#54545](https://github.com/zed-industries/zed/issues/54545) | · |
| A-0151 | 30 | 3 | omp | ? | Zero visibility into what running subagents are doing |  | [oh-my-pi#3815](https://github.com/can1357/oh-my-pi/issues/3815) | · |
| A-0421 | 17 | 3 | copilot | ? | Subagents always use the main model; can't pick a cheaper one |  | [vscode-copilot-release#14138](https://github.com/microsoft/vscode-copilot-release/issues/14138) | · |
| A-0485 | 15 | 2 | vibe-kanban | ? | New UI loses the satisfying, clear kanban overview |  | [vibe-kanban#2509](https://github.com/BloopAI/vibe-kanban/issues/2509) | · |
| A-0161 | 12 | 2 | omp | ? | Independent agent sessions can't message or coordinate with each other |  | [oh-my-pi#8077](https://github.com/can1357/oh-my-pi/issues/8077) | · |
| A-0170 | 9 | 2 | omp | ? | Can't choose the model for each sub-task |  | [oh-my-pi#7982](https://github.com/can1357/oh-my-pi/issues/7982) | · |
| A-0453 | 8 | 3 | claude-squad | ? | New worktrees lack untracked setup (node_modules, env files, ports) |  | [claude-squad#260](https://github.com/smtg-ai/claude-squad/issues/260) | · |
| A-0495 | 8 | 2 | vibe-kanban | ? | No task dependencies (start B when A is merged) |  | [vibe-kanban#1700](https://github.com/BloopAI/vibe-kanban/issues/1700) | · |
| A-0500 | 7 | 2 | vibe-kanban | ? | No single board across all projects |  | [vibe-kanban#1106](https://github.com/BloopAI/vibe-kanban/issues/1106) | · |
| A-0504 | 7 | 1 | vibe-kanban | ? | Can't choose where worktrees are stored |  | [vibe-kanban#1830](https://github.com/BloopAI/vibe-kanban/issues/1830) | · |
| A-0510 | 6 | 1 | vibe-kanban | ? | Working branches pile up after merge |  | [vibe-kanban#2680](https://github.com/BloopAI/vibe-kanban/issues/2680) | · |
| A-0454 | 4 | 2 | claude-squad | ? | Can't start a session in another repo without relaunching |  | [claude-squad#299](https://github.com/smtg-ai/claude-squad/issues/299) | · |
| A-0264 | 2 | 2 | roo | ? | Can't run several agents side by side in one panel |  | [Roo-Code#8778](https://github.com/RooCodeInc/Roo-Code/issues/8778) | · |
| A-0448 | 1 | 1 | copilot | ? | Multi-agent handoffs can't start a fresh chat |  | [vscode-copilot-release#14161](https://github.com/microsoft/vscode-copilot-release/issues/14161) | · |
| A-0457 | 1 | 1 | claude-squad | ? | Session list doesn't show which repo each session belongs to |  | [claude-squad#238](https://github.com/smtg-ai/claude-squad/issues/238) | · |
| A-0460 | 1 | 2 | claude-squad | ? | Must attach to each agent just to answer a prompt or press Enter |  | [claude-squad#312](https://github.com/smtg-ai/claude-squad/issues/312) | · |
| A-0461 | 0 | 3 | claude-squad | ? | Prompt is sent before the agent CLI is ready, so it's lost |  | [claude-squad#266](https://github.com/smtg-ai/claude-squad/issues/266) | · |
| A-0467 | 0 | 2 | claude-squad | ? | New sessions don't inherit custom environment variables |  | [claude-squad#277](https://github.com/smtg-ai/claude-squad/issues/277) | · |
| A-0470 | 0 | 2 | claude-squad | ? | Pausing a session can leave it in a broken state |  | [claude-squad#284](https://github.com/smtg-ai/claude-squad/issues/284) | · |
| A-0473 | 0 | 1 | claude-squad | ? | List doesn't scale past ~10 sessions |  | [claude-squad#296](https://github.com/smtg-ai/claude-squad/issues/296) | · |
| A-0474 | 0 | 2 | claude-squad | ? | Has to name every session and copy-paste prompts; can't fork a session |  | [claude-squad#292](https://github.com/smtg-ai/claude-squad/issues/292) | · |
| A-0520 | 0 | 1 | crystal | ? | Worktree naming, .gitignore and cleanup not configurable |  | [crystal#213](https://github.com/stravu/crystal/issues/213) | · |

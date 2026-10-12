---
type: "research-theme"
theme: "control"
rows: 50
upvotes: 3539
avg_severity: 2.3
generated: "2026-10-08"
tags: ["research", "theme", "theme/control"]
---

# Theme: control

> [!info] Undo, interrupt, queue, approvals, asking the user
> **50** problems · **3539** 👍 · average severity **2.3** / 5 · rank **#7** of 24

Back to [[Pain log]] · [[synthesis]] · [[Research Home]]

## Tools most affected
- opencode: 8
- codex: 5
- vibe-kanban: 5
- openhands: 5
- claude-code: 4
- pi: 3
- kilo: 3
- aider: 3

## Netheron ideas noted while labeling (10)
- **A-0037**: Worktree per task already isolates; add one-click revert/snapshot
- **A-0018**: Phone notification + answer from phone before the agent moves on
- **A-0033**: Stuck/limit rescue: hand the task to another subscription's agent with context
- **A-0487**: Verified loop with tests + cross-model retry
- **A-0287**: Netheron live diff + timeline + phone approvals
- **A-0146**: Netheron 'needs you' status + notifications
- **A-0495**: Task pipelines across agents
- **A-0506**: Night Shift / scheduled runs
- **A-0419**: Night Shift
- **A-0460**: Netheron board + key bar answer prompts without switching

## All problems (sorted by 👍)

Checked: ✅ verified by you · 🔁 rechecked by an agent · · not yet

| ID | 👍 | Sev | Tool | Role | Problem | Workaround | Source | Checked |
|---|---|---|---|---|---|---|---|---|
| A-0037 | 474 | 4 | codex | ? | Agent deleted or changed uncommitted files and there's no /undo any more; users lost work |  | [codex#9203](https://github.com/openai/codex/issues/9203) | 🔁 |
| A-0018 | 388 | 3 | claude-code | ? | Agent stops waiting for the user's answer after 60 s and continues without it |  | [claude-code#73125](https://github.com/anthropics/claude-code/issues/73125) | · |
| A-0021 | 263 | 2 | claude-code | ? | IDE extension auto-attaches the open file/selection as context with no way to disable |  | [claude-code#24726](https://github.com/anthropics/claude-code/issues/24726) | · |
| A-0045 | 226 | 3 | codex | ? | No checkpoint to rewind both the conversation and the code edits |  | [codex#11626](https://github.com/openai/codex/issues/11626) | · |
| A-0046 | 214 | 3 | codex | ? | Agent auto-resolves its own questions after 60 s instead of waiting for the user |  | [codex#28969](https://github.com/openai/codex/issues/28969) | · |
| A-0097 | 212 | 2 | opencode | ? | Can't ask a quick side question without derailing the running task |  | [opencode#16992](https://github.com/anomalyco/opencode/issues/16992) | · |
| A-0031 | 211 | 3 | claude-code | ? | Can't queue follow-up messages; only option is to interrupt the running task |  | [claude-code#50246](https://github.com/anthropics/claude-code/issues/50246) | · |
| A-0033 | 209 | 4 | claude-code | ? | Work stops dead when the session limit is reached; can't continue |  | [claude-code#13354](https://github.com/anthropics/claude-code/issues/13354) | · |
| A-0054 | 154 | 2 | codex | ? | Can't manually compact context in the desktop app |  | [codex#11325](https://github.com/openai/codex/issues/11325) | · |
| A-0100 | 152 | 2 | opencode | ? | No way to set a session goal the agent keeps working toward |  | [opencode#27167](https://github.com/anomalyco/opencode/issues/27167) | · |
| A-0105 | 128 | 2 | opencode | ? | Can't set custom system prompts per project/global |  | [opencode#7101](https://github.com/anomalyco/opencode/issues/7101) | · |
| A-0060 | 126 | 2 | codex | ? | Agent can't ask the user questions in some modes |  | [codex#10384](https://github.com/openai/codex/issues/10384) | · |
| A-0106 | 126 | 2 | opencode | ? | Plan mode doesn't ask clarifying questions like another agent does |  | [opencode#3844](https://github.com/anomalyco/opencode/issues/3844) | · |
| A-0114 | 105 | 2 | opencode | ? | Can't remove a queued message once sent |  | [opencode#4821](https://github.com/anomalyco/opencode/issues/4821) | · |
| A-0116 | 101 | 2 | opencode | ? | Must restart to reload agents, skills and commands |  | [opencode#8751](https://github.com/anomalyco/opencode/issues/8751) | · |
| A-0118 | 94 | 2 | opencode | ? | No option to skip permission prompts for trusted work |  | [opencode#8463](https://github.com/anomalyco/opencode/issues/8463) | · |
| A-0122 | 84 | 2 | opencode | ? | Unclear behaviour when messaging mid-run: queue vs steer |  | [opencode#32157](https://github.com/anomalyco/opencode/issues/32157) | · |
| A-0071 | 50 | 3 | gemini-cli | ? | Request gets stuck forever after cancelling |  | [gemini-cli#21096](https://github.com/google-gemini/gemini-cli/issues/21096) | · |
| A-0386 | 29 | 3 | zed | ? | Messages sent to an external agent while it works are silently swallowed |  | [zed#47928](https://github.com/zed-industries/zed/issues/47928) | · |
| A-0156 | 16 | 2 | omp | ? | Can't toggle tool-approval mode on the fly |  | [oh-my-pi#2956](https://github.com/can1357/oh-my-pi/issues/2956) | · |
| A-0134 | 14 | 2 | pi | ? | Changing model in one session unexpectedly changes the global default |  | [pi#5263](https://github.com/earendil-works/pi/issues/5263) | · |
| A-0487 | 14 | 3 | vibe-kanban | ? | Can't let the agent loop: test itself, retry differently and verify until done |  | [vibe-kanban#1946](https://github.com/BloopAI/vibe-kanban/issues/1946) | · |
| A-0282 | 13 | 1 | kilo | ? | No goal command like another agent |  | [kilocode#11166](https://github.com/Kilo-Org/kilocode/issues/11166) | · |
| A-0140 | 11 | 2 | pi | ? | Can't enable/disable built-in tools in settings |  | [pi#5084](https://github.com/earendil-works/pi/issues/5084) | · |
| A-0215 | 10 | 3 | cline | ? | CLI ignores the configured model and uses another |  | [cline#6936](https://github.com/cline/cline/issues/6936) | · |
| A-0287 | 10 | 3 | kilo | ? | Users need better visibility, review and control over what the agent does (human-in-the-loop) |  | [kilocode#8415](https://github.com/Kilo-Org/kilocode/issues/8415) | · |
| A-0146 | 9 | 2 | pi | ? | Host apps can't tell when the agent is waiting for user input |  | [pi#5329](https://github.com/earendil-works/pi/issues/5329) | · |
| A-0292 | 9 | 3 | kilo | ? | Agent stuck 'considering next steps' forever; can't cancel |  | [kilocode#7742](https://github.com/Kilo-Org/kilocode/issues/7742) | · |
| A-0304 | 9 | 2 | continue | ? | Still asks for approval even when set to automatic |  | [continue#10512](https://github.com/continuedev/continue/issues/10512) | · |
| A-0495 | 8 | 2 | vibe-kanban | ? | No task dependencies (start B when A is merged) |  | [vibe-kanban#1700](https://github.com/BloopAI/vibe-kanban/issues/1700) | · |
| A-0501 | 7 | 2 | vibe-kanban | ? | Orchestrator UI doesn't support the agent's question prompts |  | [vibe-kanban#1220](https://github.com/BloopAI/vibe-kanban/issues/1220) | · |
| A-0506 | 7 | 1 | vibe-kanban | ? | Wants scheduled 'heartbeat' prompts that run every X minutes |  | [vibe-kanban#3039](https://github.com/BloopAI/vibe-kanban/issues/3039) | · |
| A-0507 | 7 | 1 | vibe-kanban | ? | Auto-commit on exit tied to another setting |  | [vibe-kanban#2739](https://github.com/BloopAI/vibe-kanban/issues/2739) | · |
| A-0316 | 6 | 2 | continue | ? | Full auto-accept mode was removed |  | [continue#12500](https://github.com/continuedev/continue/issues/12500) | · |
| A-0336 | 6 | 3 | goose | sec | No pre-tool hooks to block secret leaks before commands run |  | [goose#8184](https://github.com/aaif-goose/goose/issues/8184) | · |
| A-0426 | 6 | 3 | copilot | ? | Agent's question tool is always skipped; user never sees the question |  | [vscode-copilot-release#14105](https://github.com/microsoft/vscode-copilot-release/issues/14105) | · |
| A-0186 | 5 | 3 | aider | ? | No sandbox, so users can't safely let the agent run commands |  | [aider#4679](https://github.com/Aider-AI/aider/issues/4679) | · |
| A-0352 | 4 | 3 | goose | ? | Shell permissions are all-or-nothing; no per-command rules |  | [goose#11399](https://github.com/aaif-goose/goose/issues/11399) | · |
| A-0261 | 3 | 1 | roo | ? | Missing prompt-based hooks that another agent has |  | [Roo-Code#11504](https://github.com/RooCodeInc/Roo-Code/issues/11504) | · |
| A-0405 | 3 | 1 | openhands | ? | Can't set reasoning effort for external agents |  | [OpenHands#15578](https://github.com/OpenHands/OpenHands/issues/15578) | · |
| A-0193 | 2 | 2 | aider | ? | Model keeps making an unrequested change it is obsessed with |  | [aider#4713](https://github.com/Aider-AI/aider/issues/4713) | · |
| A-0263 | 2 | 3 | roo | ? | Queued messages silently vanish |  | [Roo-Code#8536](https://github.com/RooCodeInc/Roo-Code/issues/8536) | · |
| A-0406 | 2 | 1 | openhands | ? | Wants a hooks system like another agent |  | [OpenHands#11943](https://github.com/OpenHands/OpenHands/issues/11943) | · |
| A-0410 | 2 | 1 | openhands | ? | Can't disable an MCP server without removing it |  | [OpenHands#11811](https://github.com/OpenHands/OpenHands/issues/11811) | · |
| A-0413 | 2 | 2 | openhands | ? | Long history overflows context; can't reset while keeping the environment |  | [OpenHands#12564](https://github.com/OpenHands/OpenHands/issues/12564) | · |
| A-0419 | 2 | 2 | openhands | ? | Wants scheduled, recurring agent runs |  | [OpenHands#12732](https://github.com/OpenHands/OpenHands/issues/12732) | · |
| A-0433 | 2 | 2 | copilot | ? | Auto-approve also auto-skips the agent's questions |  | [vscode-copilot-release#14123](https://github.com/microsoft/vscode-copilot-release/issues/14123) | · |
| A-0198 | 1 | 2 | aider | ? | Long waits on failed API calls because retries can't be configured |  | [aider#4659](https://github.com/Aider-AI/aider/issues/4659) | · |
| A-0460 | 1 | 2 | claude-squad | ? | Must attach to each agent just to answer a prompt or press Enter |  | [claude-squad#312](https://github.com/smtg-ai/claude-squad/issues/312) | · |
| A-0521 | 0 | 3 | crystal | ? | Permission mode reverts by itself and tasks hang |  | [crystal#221](https://github.com/stravu/crystal/issues/221) | · |

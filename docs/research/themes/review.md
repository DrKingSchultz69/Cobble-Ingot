---
type: "research-theme"
theme: "review"
rows: 18
upvotes: 1093
avg_severity: 2.4
generated: "2026-10-08"
tags: ["research", "theme", "theme/review"]
---

# Theme: review

> [!info] Hard to review or see what the agent changed
> **18** problems · **1093** 👍 · average severity **2.4** / 5 · rank **#17** of 24

Back to [[Pain log]] · [[synthesis]] · [[Research Home]]

## Tools most affected
- zed: 4
- crystal: 3
- codex: 2
- omp: 2
- kilo: 2
- claude-code: 1
- litellm: 1
- vibe-kanban: 1

## Workarounds people use (1)
- **A-0014** (460 👍): Run the CLI in a separate terminal and copy-paste errors by hand

## Netheron ideas noted while labeling (10)
- **A-0057**: Netheron timeline: readable record of every agent step across vendors
- **A-0362**: Comment on Netheron's live diff and send it to the task's agent
- **A-0371**: Netheron live diff + live editor reload
- **A-0539**: Netheron proxy tracks cost for every call
- **A-0151**: Netheron live timeline per agent
- **A-0287**: Netheron live diff + timeline + phone approvals
- **A-0438**: Plans saved to shared memory
- **A-0471**: Netheron diffs only on file change (B-029)
- **A-0523**: Netheron shows chosen model + reason per task
- **A-0527**: Netheron Preview per task

## All problems (sorted by 👍)

Checked: ✅ verified by you · 🔁 rechecked by an agent · · not yet

| ID | 👍 | Sev | Tool | Role | Problem | Workaround | Source | Checked |
|---|---|---|---|---|---|---|---|---|
| A-0014 | 460 | 3 | claude-code | ? | No IDE plugin for their IDE: no integrated diff, no view of open files or compiler errors, constant alt-tabbing | Run the CLI in a separate terminal and copy-paste errors by hand | [claude-code#15942](https://github.com/anthropics/claude-code/issues/15942) | 🔁 |
| A-0057 | 132 | 3 | codex | ? | Multi-agent messages became unreadable, removing the audit trail of what agents did |  | [codex#28058](https://github.com/openai/codex/issues/28058) | · |
| A-0058 | 128 | 3 | codex | ? | Diff view crashes in VS Code, so changes can't be reviewed |  | [codex#35058](https://github.com/openai/codex/issues/35058) | · |
| A-0362 | 113 | 3 | zed | ? | Can't leave PR-style review comments on the diff that go back to the agent |  | [zed#59157](https://github.com/zed-industries/zed/issues/59157) | · |
| A-0364 | 92 | 3 | zed | ? | No side-by-side merge conflict UI |  | [zed#58974](https://github.com/zed-industries/zed/issues/58974) | · |
| A-0371 | 40 | 3 | zed | ? | Editor shows stale files after the agent edits them |  | [zed#53182](https://github.com/zed-industries/zed/issues/53182) | · |
| A-0539 | 32 | 3 | litellm | ? | Cost tracking broken for a provider |  | [litellm#20412](https://github.com/BerriAI/litellm/issues/20412) | · |
| A-0151 | 30 | 3 | omp | ? | Zero visibility into what running subagents are doing |  | [oh-my-pi#3815](https://github.com/can1357/oh-my-pi/issues/3815) | · |
| A-0384 | 30 | 1 | zed | ? | No built-in view of processes/CPU/RAM used by agents and tools |  | [zed#59451](https://github.com/zed-industries/zed/issues/59451) | · |
| A-0287 | 10 | 3 | kilo | ? | Users need better visibility, review and control over what the agent does (human-in-the-loop) |  | [kilocode#8415](https://github.com/Kilo-Org/kilocode/issues/8415) | · |
| A-0289 | 9 | 3 | kilo | ? | API requests fail silently with no error shown |  | [kilocode#4262](https://github.com/Kilo-Org/kilocode/issues/4262) | · |
| A-0180 | 8 | 2 | omp | ? | Tool call details create too much visual noise |  | [oh-my-pi#2785](https://github.com/can1357/oh-my-pi/issues/2785) | · |
| A-0502 | 7 | 1 | vibe-kanban | ? | Can't add custom statuses like 'AI Review' |  | [vibe-kanban#1866](https://github.com/BloopAI/vibe-kanban/issues/1866) | · |
| A-0438 | 2 | 2 | copilot | ? | Agent plans lost when the workspace closes; can't save them to the repo |  | [vscode-copilot-release#14151](https://github.com/microsoft/vscode-copilot-release/issues/14151) | · |
| A-0471 | 0 | 2 | claude-squad | ? | Diff pane recomputes the full git diff every 500 ms per session, using lots of memory |  | [claude-squad#280](https://github.com/smtg-ai/claude-squad/issues/280) | · |
| A-0523 | 0 | 2 | crystal | ? | Can't see which model 'auto' actually used |  | [crystal#219](https://github.com/stravu/crystal/issues/219) | · |
| A-0524 | 0 | 1 | crystal | ? | Chat history doesn't show which model answered |  | [crystal#218](https://github.com/stravu/crystal/issues/218) | · |
| A-0527 | 0 | 2 | crystal | fe | Can't see each session's browser output |  | [crystal#229](https://github.com/stravu/crystal/issues/229) | · |

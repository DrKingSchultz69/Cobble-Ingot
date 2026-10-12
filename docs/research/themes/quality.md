---
type: "research-theme"
theme: "quality"
rows: 18
upvotes: 3769
avg_severity: 2.8
generated: "2026-10-08"
tags: ["research", "theme", "theme/quality"]
---

# Theme: quality

> [!info] Model/agent output got worse, ignores instructions, edits badly
> **18** problems · **3769** 👍 · average severity **2.8** / 5 · rank **#6** of 24

Back to [[Pain log]] · [[synthesis]] · [[Research Home]]

## Tools most affected
- claude-code: 3
- aider: 3
- codex: 2
- pi: 2
- continue: 2
- opencode: 1
- gemini-cli: 1
- omp: 1

## Workarounds people use (2)
- **A-0004** (2072 👍): Users keep rewriting their CLAUDE.md instructions to counteract it
- **A-0015** (440 👍): Pipe the output through another model to rewrite it plainly

## Netheron ideas noted while labeling (6)
- **A-0036**: One shared LSP for all agents
- **A-0093**: Router avoids weak models for edit-heavy tasks
- **A-0141**: Hashline-style robust edits for all agents
- **A-0163**: Hashline-style edits so cheap models edit safely
- **A-0314**: Hashline/safe edits + diff review before apply
- **A-0233**: Stuck Rescue with cross-model handoff

## All problems (sorted by 👍)

Checked: ✅ verified by you · 🔁 rechecked by an agent · · not yet

| ID | 👍 | Sev | Tool | Role | Problem | Workaround | Source | Checked |
|---|---|---|---|---|---|---|---|---|
| A-0004 | 2072 | 5 | claude-code | ? | Agent quality regressed after an update: ignores instructions, picks wrong 'simplest fixes', claims done when it isn't | Users keep rewriting their CLAUDE.md instructions to counteract it | [claude-code#42796](https://github.com/anthropics/claude-code/issues/42796) | 🔁 |
| A-0036 | 502 | 3 | codex | ? | Without LSP diagnostics the agent produces edits that fail type-checks/builds, forcing repeated build-test cycles |  | [codex#8745](https://github.com/openai/codex/issues/8745) | 🔁 |
| A-0015 | 440 | 3 | claude-code | ? | New model's writing is padded with jargon and tics, ignores style instructions; users consider switching provider | Pipe the output through another model to rewrite it plainly | [claude-code#77136](https://github.com/anthropics/claude-code/issues/77136) | 🔁 |
| A-0043 | 289 | 3 | codex | ? | Suspected hidden reasoning cap degrades quality on complex tasks |  | [codex#30364](https://github.com/openai/codex/issues/30364) | · |
| A-0022 | 250 | 2 | claude-code | ? | Agent writes verbose code comments and ignores instructions to stop |  | [claude-code#65961](https://github.com/anthropics/claude-code/issues/65961) | · |
| A-0106 | 126 | 2 | opencode | ? | Plan mode doesn't ask clarifying questions like another agent does |  | [opencode#3844](https://github.com/anomalyco/opencode/issues/3844) | · |
| A-0093 | 23 | 3 | gemini-cli | ? | Model is bad at editing, planning and logic compared with others |  | [gemini-cli#13671](https://github.com/google-gemini/gemini-cli/issues/13671) | · |
| A-0138 | 13 | 2 | pi | ? | System prompt change makes the agent run needless shell commands |  | [pi#7128](https://github.com/earendil-works/pi/issues/7128) | · |
| A-0141 | 11 | 3 | pi | ? | About 20% of file edits fail with newer models because of the edit tool format |  | [pi#6278](https://github.com/earendil-works/pi/issues/6278) | · |
| A-0163 | 11 | 3 | omp | ? | A cheap model keeps mangling code with the edit tool |  | [oh-my-pi#9717](https://github.com/can1357/oh-my-pi/issues/9717) | · |
| A-0183 | 9 | 2 | aider | ? | Model added but file editing works poorly with it |  | [aider#4562](https://github.com/Aider-AI/aider/issues/4562) | · |
| A-0307 | 7 | 4 | continue | ? | Edit mode writes the model's reasoning text into the file |  | [continue#8990](https://github.com/continuedev/continue/issues/8990) | · |
| A-0314 | 6 | 4 | continue | ? | Agent overwrites the file with its thoughts instead of the actual changes |  | [continue#9379](https://github.com/continuedev/continue/issues/9379) | · |
| A-0233 | 5 | 3 | cline | ? | A fast model loops on every prompt |  | [cline#7325](https://github.com/cline/cline/issues/7325) | · |
| A-0193 | 2 | 2 | aider | ? | Model keeps making an unrequested change it is obsessed with |  | [aider#4713](https://github.com/Aider-AI/aider/issues/4713) | · |
| A-0415 | 2 | 3 | openhands | ? | Agent answers like a chatbot instead of actually running commands to investigate |  | [OpenHands#12462](https://github.com/OpenHands/OpenHands/issues/12462) | · |
| A-0206 | 1 | 2 | aider | ? | Local model doesn't make file edits, asks the user to copy-paste |  | [aider#5118](https://github.com/Aider-AI/aider/issues/5118) | · |
| A-0517 | 0 | 2 | crystal | ? | Bad commit messages; push gets stuck |  | [crystal#222](https://github.com/stravu/crystal/issues/222) | · |

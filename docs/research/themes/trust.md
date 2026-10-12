---
type: "research-theme"
theme: "trust"
rows: 51
upvotes: 7815
avg_severity: 3.3
generated: "2026-10-08"
tags: ["research", "theme", "theme/trust"]
---

# Theme: trust

> [!info] Wrong or unsafe edits, silent changes; users have to double-check everything
> **51** problems · **7815** 👍 · average severity **3.3** / 5 · rank **#1** of 24

Back to [[Pain log]] · [[synthesis]] · [[Research Home]]

## Tools most affected
- claude-code: 7
- vibe-kanban: 6
- aider: 5
- litellm: 4
- codex: 4
- kilo: 4
- zed: 3
- cline: 3

## Workarounds people use (1)
- **A-0004** (2072 👍): Users keep rewriting their CLAUDE.md instructions to counteract it

## Netheron ideas noted while labeling (14)
- **A-0532**: Pin agent/gateway versions, verify before update
- **A-0010**: Budget dial + live quota view across all subscriptions
- **A-0037**: Worktree per task already isolates; add one-click revert/snapshot
- **A-0023**: Netheron proxy already sees cache reads/writes: alert when cache efficiency drops
- **A-0057**: Netheron timeline: readable record of every agent step across vendors
- **A-0371**: Netheron live diff + live editor reload
- **A-0378**: Line/hash-anchored edits
- **A-0141**: Hashline-style robust edits for all agents
- **A-0163**: Hashline-style edits so cheap models edit safely
- **A-0234**: Hashline-style safe edits
- **A-0314**: Hashline/safe edits + diff review before apply
- **A-0268**: Proxy-level cost alerts per version/agent
- **A-0441**: Safe edits + undo
- **A-0447**: Shared memory survives context loss

## All problems (sorted by 👍)

Checked: ✅ verified by you · 🔁 rechecked by an agent · · not yet

| ID | 👍 | Sev | Tool | Role | Problem | Workaround | Source | Checked |
|---|---|---|---|---|---|---|---|---|
| A-0004 | 2072 | 5 | claude-code | ? | Agent quality regressed after an update: ignores instructions, picks wrong 'simplest fixes', claims done when it isn't | Users keep rewriting their CLAUDE.md instructions to counteract it | [claude-code#42796](https://github.com/anthropics/claude-code/issues/42796) | 🔁 |
| A-0005 | 1186 | 1 | claude-code | ? | A loved companion feature was removed with no changelog or notice |  | [claude-code#45596](https://github.com/anthropics/claude-code/issues/45596) | 🔁 |
| A-0532 | 797 | 5 | litellm | ? | Gateway package release contained a credential stealer that ran on every Python start (supply-chain attack) |  | [litellm#24512](https://github.com/BerriAI/litellm/issues/24512) | 🔁 |
| A-0010 | 695 | 4 | claude-code | ? | Usage limits suddenly hit after 2 hours on the top plan, after months without hitting them; no answer from the vendor |  | [claude-code#16157](https://github.com/anthropics/claude-code/issues/16157) | 🔁 |
| A-0013 | 476 | 4 | claude-code | ? | 5-hour plan window exhausted in 1-2 hours with the same workload as before |  | [claude-code#38335](https://github.com/anthropics/claude-code/issues/38335) | 🔁 |
| A-0037 | 474 | 4 | codex | ? | Agent deleted or changed uncommitted files and there's no /undo any more; users lost work |  | [codex#9203](https://github.com/openai/codex/issues/9203) | 🔁 |
| A-0041 | 364 | 4 | codex | ? | Rate-limit cost per token jumped 10-20x, draining the budget in 2-3 prompts |  | [codex#28879](https://github.com/openai/codex/issues/28879) | · |
| A-0043 | 289 | 3 | codex | ? | Suspected hidden reasoning cap degrades quality on complex tasks |  | [codex#30364](https://github.com/openai/codex/issues/30364) | · |
| A-0023 | 243 | 4 | claude-code | ? | Prompt-cache lifetime silently shortened, inflating quota use and cost |  | [claude-code#46829](https://github.com/anthropics/claude-code/issues/46829) | · |
| A-0029 | 215 | 3 | claude-code | ? | New version silently uses ~20K more cache tokens per request |  | [claude-code#46917](https://github.com/anthropics/claude-code/issues/46917) | · |
| A-0030 | 213 | 4 | claude-code | ? | A string in git history silently routes requests to paid extra billing instead of the plan |  | [claude-code#53262](https://github.com/anthropics/claude-code/issues/53262) | · |
| A-0533 | 137 | 5 | litellm | ? | Package compromised via another tool's supply chain |  | [litellm#24518](https://github.com/BerriAI/litellm/issues/24518) | · |
| A-0057 | 132 | 3 | codex | ? | Multi-agent messages became unreadable, removing the audit trail of what agents did |  | [codex#28058](https://github.com/openai/codex/issues/28058) | · |
| A-0070 | 58 | 3 | gemini-cli | ? | Enterprise users promised latest models but don't get them |  | [gemini-cli#28625](https://github.com/google-gemini/gemini-cli/issues/28625) | · |
| A-0371 | 40 | 3 | zed | ? | Editor shows stale files after the agent edits them |  | [zed#53182](https://github.com/zed-industries/zed/issues/53182) | · |
| A-0078 | 35 | 3 | gemini-cli | ? | Tool being replaced by another product; unclear if it stays open source |  | [gemini-cli#27304](https://github.com/google-gemini/gemini-cli/issues/27304) | · |
| A-0377 | 35 | 3 | zed | ? | Thinking mode breaks the file-edit tool |  | [zed#54036](https://github.com/zed-industries/zed/issues/54036) | · |
| A-0378 | 33 | 3 | zed | ? | Agent rewrites the whole file instead of changing single lines |  | [zed#42074](https://github.com/zed-industries/zed/issues/42074) | · |
| A-0481 | 33 | 4 | vibe-kanban | ? | Update replaced a familiar UI and lost old tasks/projects |  | [vibe-kanban#2687](https://github.com/BloopAI/vibe-kanban/issues/2687) | · |
| A-0272 | 22 | 2 | kilo | ? | Announced provider choice for autocomplete doesn't work |  | [kilocode#3058](https://github.com/Kilo-Org/kilocode/issues/3058) | · |
| A-0545 | 22 | 3 | litellm | ? | Accumulated bugs; users ask to stabilise instead of adding features |  | [litellm#24825](https://github.com/BerriAI/litellm/issues/24825) | · |
| A-0273 | 20 | 3 | kilo | ? | An integration users relied on was removed in an update |  | [kilocode#5460](https://github.com/Kilo-Org/kilocode/issues/5460) | · |
| A-0547 | 18 | 4 | litellm | ? | Silent switch of API type overnight caused failures |  | [litellm#16810](https://github.com/BerriAI/litellm/issues/16810) | · |
| A-0483 | 17 | 2 | vibe-kanban | ? | Worried the task-isolated kanban workflow will be removed |  | [vibe-kanban#2288](https://github.com/BloopAI/vibe-kanban/issues/2288) | · |
| A-0276 | 15 | 3 | kilo | ? | Big 'upgrade' broke interfaces and removed features users relied on |  | [kilocode#8108](https://github.com/Kilo-Org/kilocode/issues/8108) | · |
| A-0486 | 14 | 4 | vibe-kanban | ? | Company shutting down; cloud-dependent features need self-hosting and export |  | [vibe-kanban#3396](https://github.com/BloopAI/vibe-kanban/issues/3396) | · |
| A-0281 | 13 | 4 | kilo | ? | Major update made the tool slow, buggy, duplicated code, lost checkpoints |  | [kilocode#8364](https://github.com/Kilo-Org/kilocode/issues/8364) | · |
| A-0181 | 12 | 3 | aider | ? | Unclear future of the project; maintainer silent |  | [aider#4648](https://github.com/Aider-AI/aider/issues/4648) | · |
| A-0141 | 11 | 3 | pi | ? | About 20% of file edits fail with newer models because of the edit tool format |  | [pi#6278](https://github.com/earendil-works/pi/issues/6278) | · |
| A-0163 | 11 | 3 | omp | ? | A cheap model keeps mangling code with the edit tool |  | [oh-my-pi#9717](https://github.com/can1357/oh-my-pi/issues/9717) | · |
| A-0213 | 11 | 2 | cline | ? | Useful UI option removed in an update |  | [cline#6609](https://github.com/cline/cline/issues/6609) | · |
| A-0452 | 11 | 3 | claude-squad | ? | Orchestrator project seems abandoned; PRs and bugs ignored |  | [claude-squad#250](https://github.com/smtg-ai/claude-squad/issues/250) | · |
| A-0182 | 10 | 3 | aider | ? | Maintainer disappeared; users unsure whether to keep relying on the tool |  | [aider#4613](https://github.com/Aider-AI/aider/issues/4613) | · |
| A-0214 | 10 | 4 | cline | ? | Cancelling a task leaves .git renamed to .git_disabled |  | [cline#6625](https://github.com/cline/cline/issues/6625) | · |
| A-0490 | 10 | 3 | vibe-kanban | ? | Confusing cloud migration, repo assignment issues, worse UX |  | [vibe-kanban#2812](https://github.com/BloopAI/vibe-kanban/issues/2812) | · |
| A-0491 | 10 | 2 | vibe-kanban | ? | Must log in to use local features |  | [vibe-kanban#2952](https://github.com/BloopAI/vibe-kanban/issues/2952) | · |
| A-0493 | 9 | 4 | vibe-kanban | ? | Data inaccessible after an update (time-outs loading projects) |  | [vibe-kanban#2838](https://github.com/BloopAI/vibe-kanban/issues/2838) | · |
| A-0184 | 8 | 2 | aider | ? | Uncertainty about the tool's direction vs competitors |  | [aider#4751](https://github.com/Aider-AI/aider/issues/4751) | · |
| A-0307 | 7 | 4 | continue | ? | Edit mode writes the model's reasoning text into the file |  | [continue#8990](https://github.com/continuedev/continue/issues/8990) | · |
| A-0234 | 6 | 4 | cline | ? | Edits truncate the last lines, which can cause infinite loops |  | [cline#7703](https://github.com/cline/cline/issues/7703) | · |
| A-0314 | 6 | 4 | continue | ? | Agent overwrites the file with its thoughts instead of the actual changes |  | [continue#9379](https://github.com/continuedev/continue/issues/9379) | · |
| A-0324 | 4 | 4 | continue | ? | Project archived / no longer maintained; users stranded |  | [continue#12629](https://github.com/continuedev/continue/issues/12629) | · |
| A-0188 | 3 | 2 | aider | ? | Confusion about maintenance status |  | [aider#5647](https://github.com/Aider-AI/aider/issues/5647) | · |
| A-0268 | 2 | 4 | roo | ? | An update caused a big jump in usage costs |  | [Roo-Code#10374](https://github.com/RooCodeInc/Roo-Code/issues/10374) | · |
| A-0407 | 2 | 1 | openhands | ? | Delete dialog doesn't show which conversation will be deleted |  | [OpenHands#11809](https://github.com/OpenHands/OpenHands/issues/11809) | · |
| A-0200 | 1 | 2 | aider | ? | Project has no succession plan; community worried |  | [aider#4639](https://github.com/Aider-AI/aider/issues/4639) | · |
| A-0440 | 1 | 4 | copilot | ? | Agent stops mid-edit with an internal error and breaks the code |  | [vscode-copilot-release#13973](https://github.com/microsoft/vscode-copilot-release/issues/13973) | · |
| A-0441 | 1 | 4 | copilot | ? | Agent repeatedly empties the file it's modifying |  | [vscode-copilot-release#14021](https://github.com/microsoft/vscode-copilot-release/issues/14021) | · |
| A-0447 | 1 | 4 | copilot | ? | Agent loses earlier context and claims no prior work was done |  | [vscode-copilot-release#14145](https://github.com/microsoft/vscode-copilot-release/issues/14145) | · |
| A-0475 | 0 | 2 | claude-squad | ? | Security fix merged but not released, blocking use at work |  | [claude-squad#303](https://github.com/smtg-ai/claude-squad/issues/303) | · |
| A-0531 | 0 | 3 | crystal | ? | Project looks dead; users look for alternatives |  | [crystal#235](https://github.com/stravu/crystal/issues/235) | · |

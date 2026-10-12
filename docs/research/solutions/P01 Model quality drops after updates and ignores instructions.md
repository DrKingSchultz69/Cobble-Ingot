---
type: "solution"
id: "P01"
title: "Model quality drops after updates and ignores instructions"
themes: ["quality", "trust", "cost"]
problems: 10
upvotes: 3092
can_incorporate: "partly"
options: 4
partly_built: true
status: "wave 2 built"
decision: ""
priority: ""
rows: ["A-0004", "A-0015", "A-0043", "A-0022", "A-0093", "A-0138", "A-0193", "A-0415", "A-0206", "A-0517"]
tags: ["research", "solution", "theme/quality", "theme/trust", "theme/cost"]
updated: "2026-10-08"
---
# P01 · Model quality drops after updates and ignores instructions

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/quality|quality]] · [[themes/trust|trust]] · [[themes/cost|cost]]

> [!question] The problem
> Users notice an agent or model getting worse after a vendor update: it ignores instructions, picks wrong 'simplest fixes', claims work is done when it isn't, or writes padded prose. They can't prove it, can't roll back, and keep rewriting their instruction files to compensate.
>
> **10 problems · 3092 👍** · tools: claude-code (3), aider (2), codex (1), gemini-cli (1), pi (1)

> [!success] Built in Wave 2 (2026-10-10)
> S1 quality watch, S2 router uses eval results. See [[BUGS]] B-039.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0004 | 2072 | claude-code | Agent quality regressed after an update: ignores instructions, picks wrong 'simplest fixes', claims done when it isn't | Users keep rewriting their CLAUDE.md instructions to counteract it | [claude-code#42796](https://github.com/anthropics/claude-code/issues/42796) |
| A-0015 | 440 | claude-code | New model's writing is padded with jargon and tics, ignores style instructions; users consider switching provider | Pipe the output through another model to rewrite it plainly | [claude-code#77136](https://github.com/anthropics/claude-code/issues/77136) |
| A-0043 | 289 | codex | Suspected hidden reasoning cap degrades quality on complex tasks |  | [codex#30364](https://github.com/openai/codex/issues/30364) |
| A-0022 | 250 | claude-code | Agent writes verbose code comments and ignores instructions to stop |  | [claude-code#65961](https://github.com/anthropics/claude-code/issues/65961) |
| A-0093 | 23 | gemini-cli | Model is bad at editing, planning and logic compared with others |  | [gemini-cli#13671](https://github.com/google-gemini/gemini-cli/issues/13671) |

> [!example]- All 10 problems in this cluster (click to open)
> - **A-0004** · 2072 👍 · claude-code: Agent quality regressed after an update: ignores instructions, picks wrong 'simplest fixes', claims done when it isn't · [claude-code#42796](https://github.com/anthropics/claude-code/issues/42796)
> - **A-0015** · 440 👍 · claude-code: New model's writing is padded with jargon and tics, ignores style instructions; users consider switching provider · [claude-code#77136](https://github.com/anthropics/claude-code/issues/77136)
> - **A-0043** · 289 👍 · codex: Suspected hidden reasoning cap degrades quality on complex tasks · [codex#30364](https://github.com/openai/codex/issues/30364)
> - **A-0022** · 250 👍 · claude-code: Agent writes verbose code comments and ignores instructions to stop · [claude-code#65961](https://github.com/anthropics/claude-code/issues/65961)
> - **A-0093** · 23 👍 · gemini-cli: Model is bad at editing, planning and logic compared with others · [gemini-cli#13671](https://github.com/google-gemini/gemini-cli/issues/13671)
> - **A-0138** · 13 👍 · pi: System prompt change makes the agent run needless shell commands · [pi#7128](https://github.com/earendil-works/pi/issues/7128)
> - **A-0193** · 2 👍 · aider: Model keeps making an unrequested change it is obsessed with · [aider#4713](https://github.com/Aider-AI/aider/issues/4713)
> - **A-0415** · 2 👍 · openhands: Agent answers like a chatbot instead of actually running commands to investigate · [OpenHands#12462](https://github.com/OpenHands/OpenHands/issues/12462)
> - **A-0206** · 1 👍 · aider: Local model doesn't make file edits, asks the user to copy-paste · [aider#5118](https://github.com/Aider-AI/aider/issues/5118)
> - **A-0517** · 0 👍 · crystal: Bad commit messages; push gets stuck · [crystal#222](https://github.com/stravu/crystal/issues/222)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Quality watch: private regression tests per model

> [!success] ✅ Netheron can build this
> Run a small fixed set of your own tasks (with known-good answers) against each model daily or after a version change; chart pass rate in Netheron and alert when a model drops.
>
> **Effort:** M (2–5 days) · **Novelty:** High: no harness tracks quality over time across vendors

### S2 · Route around the weak model automatically

> [!success] ✅ Netheron can build this
> Feed the quality-watch score into the router so tasks go to whichever model currently performs best for that kind of task.
>
> **Effort:** M (2–5 days) · **Novelty:** High: needs Netheron's multi-vendor router
> **Already in Netheron:** Router + per-model scores already exist (router.ts)

### S3 · Pin versions and one-click rollback

> [!warning] 🟡 Netheron can partly do this
> Record which agent CLI version ran each task; offer 'run with previous version' when quality drops. Works for CLIs (npm versions), not for server-side model changes.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium

### S4 · Instruction checker after each task

> [!success] ✅ Netheron can build this
> After a task, a cheap model checks the diff against the user's rules in shared memory ('no comments', 'don't touch /legacy') and flags violations before you merge.
>
> **Effort:** M (2–5 days) · **Novelty:** Medium-high: cross-agent rules from shared memory

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> The model itself (weights, hidden reasoning caps, writing style) is the vendor's. Netheron can only detect, compare and route around it.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

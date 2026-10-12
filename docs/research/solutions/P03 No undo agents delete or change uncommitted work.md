---
type: "solution"
id: "P03"
title: "No undo: agents delete or change uncommitted work"
themes: ["control", "trust"]
problems: 2
upvotes: 700
can_incorporate: "partly"
options: 3
partly_built: true
status: "wave 1 built"
decision: ""
priority: ""
rows: ["A-0037", "A-0045"]
tags: ["research", "solution", "theme/control", "theme/trust"]
updated: "2026-10-08"
---
# P03 · No undo: agents delete or change uncommitted work

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/control|control]] · [[themes/trust|trust]]

> [!question] The problem
> Agents delete or change files that aren't committed, and the undo/rewind command is gone or doesn't restore both the chat and the code. Users report lost progress.
>
> **2 problems · 700 👍** · tools: codex (2)

> [!success] Built in Wave 1 (2026-10-09)
> S1 checkpoints. See [[BUGS]] B-036.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0037 | 474 | codex | Agent deleted or changed uncommitted files and there's no /undo any more; users lost work |  | [codex#9203](https://github.com/openai/codex/issues/9203) |
| A-0045 | 226 | codex | No checkpoint to rewind both the conversation and the code edits |  | [codex#11626](https://github.com/openai/codex/issues/11626) |

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Automatic checkpoints per agent turn

> [!success] ✅ Netheron can build this
> Snapshot the worktree (git stash-like commit on a hidden ref) after every agent turn; a timeline in the task's Info panel lets you restore any point.
>
> **Effort:** M (2–5 days) · **Novelty:** High: works the same for every agent

### S2 · Worktree isolation

> [!success] ✅ Netheron can build this
> Agents work in their own worktree, so your main checkout is never touched.
>
> **Effort:** none (already exists) · **Novelty:** Medium
> **Already in Netheron:** Built: worktree per task

### S3 · Rewind chat + code together

> [!warning] 🟡 Netheron can partly do this
> Restore code from a checkpoint and hand the agent a summary of 'what we undid' via shared memory. True chat rewind depends on each agent supporting it.
>
> **Effort:** M (2–5 days) · **Novelty:** Medium

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Restoring the agent's own conversation state is inside each vendor's CLI.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

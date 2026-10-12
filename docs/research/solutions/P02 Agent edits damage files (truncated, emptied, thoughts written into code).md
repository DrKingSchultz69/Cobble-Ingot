---
type: "solution"
id: "P02"
title: "Agent edits damage files (truncated, emptied, thoughts written into code)"
themes: ["trust", "reliability", "quality"]
problems: 14
upvotes: 148
can_incorporate: "partly"
options: 4
partly_built: true
status: "wave 3 built"
decision: ""
priority: ""
rows: ["A-0377", "A-0378", "A-0141", "A-0163", "A-0214", "A-0183", "A-0222", "A-0307", "A-0234", "A-0314", "A-0235", "A-0318", "A-0440", "A-0441"]
tags: ["research", "solution", "theme/trust", "theme/reliability", "theme/quality"]
updated: "2026-10-08"
---
# P02 · Agent edits damage files (truncated, emptied, thoughts written into code)

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/trust|trust]] · [[themes/reliability|reliability]] · [[themes/quality|quality]]

> [!question] The problem
> Edits fail or corrupt files: last lines truncated, whole file emptied or rewritten, reasoning text written into the file, edit-tool format errors (~20% failure with some models), even .git renamed after a cancel. Users lose work or burn tokens in retry loops.
>
> **14 problems · 148 👍** · tools: cline (4), continue (3), zed (2), copilot (2), pi (1)

> [!success] Built in Wave 3 (2026-10-10)
> S1 hash-anchored edit tool for every agent (mm_read_lines / mm_edit_lines). See [[BUGS]] B-040.

> [!success] Built in Wave 1 (2026-10-09)
> S2 edit guard. See [[BUGS]] B-036.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0377 | 35 | zed | Thinking mode breaks the file-edit tool |  | [zed#54036](https://github.com/zed-industries/zed/issues/54036) |
| A-0378 | 33 | zed | Agent rewrites the whole file instead of changing single lines |  | [zed#42074](https://github.com/zed-industries/zed/issues/42074) |
| A-0141 | 11 | pi | About 20% of file edits fail with newer models because of the edit tool format |  | [pi#6278](https://github.com/earendil-works/pi/issues/6278) |
| A-0163 | 11 | omp | A cheap model keeps mangling code with the edit tool |  | [oh-my-pi#9717](https://github.com/can1357/oh-my-pi/issues/9717) |
| A-0214 | 10 | cline | Cancelling a task leaves .git renamed to .git_disabled |  | [cline#6625](https://github.com/cline/cline/issues/6625) |

> [!example]- All 14 problems in this cluster (click to open)
> - **A-0377** · 35 👍 · zed: Thinking mode breaks the file-edit tool · [zed#54036](https://github.com/zed-industries/zed/issues/54036)
> - **A-0378** · 33 👍 · zed: Agent rewrites the whole file instead of changing single lines · [zed#42074](https://github.com/zed-industries/zed/issues/42074)
> - **A-0141** · 11 👍 · pi: About 20% of file edits fail with newer models because of the edit tool format · [pi#6278](https://github.com/earendil-works/pi/issues/6278)
> - **A-0163** · 11 👍 · omp: A cheap model keeps mangling code with the edit tool · [oh-my-pi#9717](https://github.com/can1357/oh-my-pi/issues/9717)
> - **A-0214** · 10 👍 · cline: Cancelling a task leaves .git renamed to .git_disabled · [cline#6625](https://github.com/cline/cline/issues/6625)
> - **A-0183** · 9 👍 · aider: Model added but file editing works poorly with it · [aider#4562](https://github.com/Aider-AI/aider/issues/4562)
> - **A-0222** · 8 👍 · cline: Repeated empty/unparsable responses on large file writes · [cline#7262](https://github.com/cline/cline/issues/7262)
> - **A-0307** · 7 👍 · continue: Edit mode writes the model's reasoning text into the file · [continue#8990](https://github.com/continuedev/continue/issues/8990)
> - **A-0234** · 6 👍 · cline: Edits truncate the last lines, which can cause infinite loops · [cline#7703](https://github.com/cline/cline/issues/7703)
> - **A-0314** · 6 👍 · continue: Agent overwrites the file with its thoughts instead of the actual changes · [continue#9379](https://github.com/continuedev/continue/issues/9379)
> - **A-0235** · 5 👍 · cline: Agent retries file writes with missing content · [cline#7998](https://github.com/cline/cline/issues/7998)
> - **A-0318** · 5 👍 · continue: Writing code to a file fails · [continue#9045](https://github.com/continuedev/continue/issues/9045)
> - **A-0440** · 1 👍 · copilot: Agent stops mid-edit with an internal error and breaks the code · [vscode-copilot-release#13973](https://github.com/microsoft/vscode-copilot-release/issues/13973)
> - **A-0441** · 1 👍 · copilot: Agent repeatedly empties the file it's modifying · [vscode-copilot-release#14021](https://github.com/microsoft/vscode-copilot-release/issues/14021)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Hash-anchored edit tool for every agent (credit: Oh My Pi)

> [!success] ✅ Netheron can build this
> Expose a `netheron_edit` MCP tool that addresses lines by short content hashes and refuses stale or ambiguous edits. Any agent (Claude, Codex, OpenCode, Pi) can use it via the shared MCP server.
>
> **Effort:** M (2–5 days) · **Novelty:** High: same edit safety across all vendors; makes cheap models usable

### S2 · Edit guard on the worktree

> [!success] ✅ Netheron can build this
> After each agent turn, compare files against the last snapshot: flag a file that shrank by >50%, lost its tail, or contains reasoning markers; offer one-click restore.
>
> **Effort:** S (hours to 1 day) · **Novelty:** High
> **Already in Netheron:** Live diff watcher already sees every change (diffwatch.ts)

### S3 · Isolation so damage can't reach your main checkout

> [!success] ✅ Netheron can build this
> Every task runs in its own git worktree; nothing touches your branch until you merge.
>
> **Effort:** none (already exists) · **Novelty:** Medium
> **Already in Netheron:** Built: worktree per task

### S4 · Protect .git and project files

> [!success] ✅ Netheron can build this
> Refuse agent commands that rename/delete .git or files outside the worktree (shell guard).
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Bugs inside each vendor's own edit tool remain theirs; Netheron limits the damage and offers a safer tool.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

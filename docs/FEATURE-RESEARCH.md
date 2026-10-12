# Feature research: making mm a better agent workspace

Date: 2026-10-08

## Product direction

The strongest version of mm is a local-first control room for coding agents:

`idea → plan → isolated run → evidence → review → merge → shared memory`

The current product already has the hard foundation: multiple native CLIs, routing, git worktrees, terminal streaming, shared memory, research, learning, usage, and phone access. The next improvements should make each task easier to trust, resume, review, and learn from.

## What current products emphasize

- Cursor's background agents are asynchronous, isolated, resumable from web/mobile, and support follow-up prompts. Its agents also produce artifacts such as logs, screenshots, and videos so a user can validate work without reopening the environment. Sources: [Background Agents](https://docs.cursor.com/background-agent), [Web & Mobile](https://docs.cursor.com/en/background-agent/web-and-mobile).
- Cursor checkpoints provide local snapshots that let users preview and restore an agent's changes. They are deliberately separate from Git history and exist for fast recovery. Source: [Checkpoints](https://docs.cursor.com/en/agent/chat/checkpoints).
- Continue separates **Chat**, **Plan**, and **Agent** modes. Plan mode is read-only; Agent mode can edit files and run commands. It also exposes explicit codebase exploration and context-selection tools. Sources: [Agent mode](https://docs.continue.dev/ide-extensions/agent/how-it-works), [Context selection](https://docs.continue.dev/ide-extensions/agent/context-selection).
- DeepTutor treats learning as a persistent path rather than a single chat. A path has goals, materials, editable modules, typed knowledge points, and assessed mastery. Sources: [Mastery Path](https://docs.deeptutor.info/explore/mastery-path/), [DeepTutor documentation](https://docs.deeptutor.info/).

## Highest-value additions

### P0 — Review gates and evidence bundles

Add a required task lifecycle:

`Needs input → Planning → Running → Verify → Review → Approved → Merged`

For every task, store and show:

- the original prompt and acceptance criteria;
- the plan/checklist the agent produced;
- commands run, exit codes, test output, and changed files;
- a preview URL or screenshot when the task changes UI;
- a short agent summary: what changed, what was not changed, and remaining risks.

Why first: your current UI shows a terminal and diff, but the user still has to infer whether the task is actually complete. Evidence makes “done” inspectable and makes mobile review practical.

Implementation fit: extend the existing task table with `phase`, `criteria`, `verification`, and `artifacts` JSON. Add a Verify panel beside Diff. Start with command output and screenshots; video can come later.

### P0 — Checkpoints and one-click recovery

Create an automatic checkpoint before the first agent write and after each completed phase. Add:

- Preview checkpoint
- Restore checkpoint
- Compare checkpoint to current worktree
- Discard task changes

Use Git/worktrees for durable history, but keep lightweight task snapshots for fast recovery, following the distinction Cursor makes between checkpoints and version control.

Implementation fit: a checkpoint can initially be a worktree commit or a patch stored under `~/.mm/checkpoints/<taskId>`. The UI only needs a timeline and restore endpoint.

### P0 — Explicit agent modes and approvals

Expose three modes in the task form:

- **Plan:** read-only inspection and proposed steps;
- **Build:** edits and commands, with approval prompts;
- **Review:** read-only diff/test analysis and acceptance-criteria checks.

This follows Continue's useful separation of read-only planning from write-capable execution. It also makes routing safer: a cheap model can plan or summarize while a stronger model implements.

Implementation fit: pass mode-specific policy into each adapter. For the first version, enforce it in mm around shell/file operations and require a user approval before the first write or network command.

### P1 — Durable background tasks and better follow-ups

Make a task survive browser refreshes and daemon restarts with:

- resumable task state;
- `Continue`, `Retry`, `Change direction`, and `Ask for status` actions;
- a clear “waiting for you” state;
- task logs stored independently from the live PTY;
- a retry reason and model/agent history.

Cursor's background-agent workflow shows the value of follow-up prompts and checking work from another device. mm already has the task database and hand-off concept, so this is a natural extension.

### P1 — Context packs and project rules

Let each project define a small `.mm/rules.md` or `AGENTS.md` policy containing architecture, test commands, forbidden files, preferred models, and review rules. Add a context picker showing exactly which files, memory records, research notes, and rules are being sent to the agent.

This improves reliability more than simply increasing context size. Continue's current guidance emphasizes tool-based codebase exploration, explicit rules, and targeted context selection.

Implementation fit: build on `packages/memory/src/context.ts`; add a `context_manifest` to each task and show it in Info.

### P1 — GitHub completion flow

The product currently detects remotes and can clone repositories, but the end-to-end GitHub loop should become visible:

`clone/open → branch → task → diff → commit → push → draft PR → review comments → fix`

Add GitHub account/repository/branch selectors, commit and push buttons, draft PR creation, and a PR review pane. This directly addresses the existing functional-test note that folder adding did not trigger GitHub integration.

### P1 — Model comparison and routing feedback

Add “ask two agents” for planning/review tasks. Show:

- side-by-side answers or diffs;
- latency, tokens, estimated cost, and test result;
- a user-selected winner;
- a feedback button that records “this route worked” or “wrong agent”.

Feed those outcomes back into the router. The current router already stores category, candidate, success history, and rate-limit pressure; this would turn that into a measurable routing system.

### P1 — Reliable notifications

Treat notifications as a task delivery feature, not a browser extra. Add:

- a notification inbox inside mm;
- browser notification only as a secondary channel;
- explicit `needs input`, `done`, `failed`, and `verification failed` events;
- a test button for notification permission;
- a finite shell command mode so a shell task can actually finish.

Your current test reached permission grant but could not observe a completion alert because the interactive shell task stayed alive. A notification inbox would still preserve the event even when the browser is closed.

### P2 — DeepTutor-style learning loop for developers

The current Learn view has ingestion, cited chat, solving, quizzes, and a question bank. Add a developer-focused mastery path:

1. Choose a goal, such as “understand this repository's daemon architecture.”
2. Build modules from indexed files, decisions, research, and task outcomes.
3. Label knowledge points as concept, procedure, decision, or design tradeoff.
4. Generate short explanations, code-reading exercises, and spaced review questions.
5. Track mastery and link weak points back to files or tasks.

This is the most useful DeepTutor idea for mm because it turns project memory into an active skill-building system instead of a passive search index.

### P2 — Artifact-first UI review

For frontend tasks, let an agent attach:

- a preview URL;
- before/after screenshots;
- a short change summary;
- browser console/network errors;
- a “looks good / needs changes” review action.

This makes mobile review useful even when the user cannot open the worktree or terminal.

## Recommended build order

1. **Task contract:** acceptance criteria, phases, verification, and artifacts.
2. **Verify panel:** tests, logs, preview, screenshots, and risks.
3. **Checkpoints:** restore/discard/compare.
4. **Plan/Build/Review modes:** read-only planning and approval gates.
5. **Durable follow-ups:** retry, continue, status, and notification inbox.
6. **GitHub completion:** commit, push, draft PR, and review comments.
7. **Context manifests and project rules.**
8. **DeepTutor mastery paths and spaced review.**

## Defer for now

- A full VS Code replacement. The existing Monaco Code tab is enough for targeted review.
- Multi-user collaboration and hosted execution. They add identity, secrets, isolation, and billing complexity before the local workflow is finished.
- Vector search before context manifests and memory quality are measurable.
- Video artifacts before screenshots, logs, and test evidence are reliable.

## First concrete slice

Implement one vertical slice called **Verified task**:

1. Add an acceptance-criteria field to New task.
2. Have the agent produce a checklist before editing.
3. Add a Verify button that runs the project's test command.
4. Store the output and exit code in task memory.
5. Show `Ready for review` only when criteria and verification pass.
6. Add Restore checkpoint and Discard changes.

That slice improves trust, mobile usefulness, notifications, memory, and routing without requiring a new service.

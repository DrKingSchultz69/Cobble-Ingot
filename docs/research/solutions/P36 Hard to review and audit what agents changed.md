---
type: "solution"
id: "P36"
title: "Hard to review and audit what agents changed"
themes: ["review", "trust", "ux"]
problems: 11
upvotes: 530
can_incorporate: "yes"
options: 4
partly_built: true
status: "wave 1 built"
decision: ""
priority: ""
rows: ["A-0057", "A-0058", "A-0362", "A-0364", "A-0371", "A-0287", "A-0180", "A-0502", "A-0523", "A-0524", "A-0471"]
tags: ["research", "solution", "theme/review", "theme/trust", "theme/ux"]
updated: "2026-10-08"
---
# P36 · Hard to review and audit what agents changed

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/review|review]] · [[themes/trust|trust]] · [[themes/ux|ux]]

> [!question] The problem
> Diff views crash or show stale files, no way to comment on a diff and send it back to the agent, no audit trail, can't see which model answered, merge conflicts hard to resolve.
>
> **11 problems · 530 👍** · tools: zed (3), codex (2), crystal (2), kilo (1), omp (1)

> [!success] Built in Wave 1 (2026-10-09)
> S2 diff comments, S3 receipt. See [[BUGS]] B-036.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0057 | 132 | codex | Multi-agent messages became unreadable, removing the audit trail of what agents did |  | [codex#28058](https://github.com/openai/codex/issues/28058) |
| A-0058 | 128 | codex | Diff view crashes in VS Code, so changes can't be reviewed |  | [codex#35058](https://github.com/openai/codex/issues/35058) |
| A-0362 | 113 | zed | Can't leave PR-style review comments on the diff that go back to the agent |  | [zed#59157](https://github.com/zed-industries/zed/issues/59157) |
| A-0364 | 92 | zed | No side-by-side merge conflict UI |  | [zed#58974](https://github.com/zed-industries/zed/issues/58974) |
| A-0371 | 40 | zed | Editor shows stale files after the agent edits them |  | [zed#53182](https://github.com/zed-industries/zed/issues/53182) |

> [!example]- All 11 problems in this cluster (click to open)
> - **A-0057** · 132 👍 · codex: Multi-agent messages became unreadable, removing the audit trail of what agents did · [codex#28058](https://github.com/openai/codex/issues/28058)
> - **A-0058** · 128 👍 · codex: Diff view crashes in VS Code, so changes can't be reviewed · [codex#35058](https://github.com/openai/codex/issues/35058)
> - **A-0362** · 113 👍 · zed: Can't leave PR-style review comments on the diff that go back to the agent · [zed#59157](https://github.com/zed-industries/zed/issues/59157)
> - **A-0364** · 92 👍 · zed: No side-by-side merge conflict UI · [zed#58974](https://github.com/zed-industries/zed/issues/58974)
> - **A-0371** · 40 👍 · zed: Editor shows stale files after the agent edits them · [zed#53182](https://github.com/zed-industries/zed/issues/53182)
> - **A-0287** · 10 👍 · kilo: Users need better visibility, review and control over what the agent does (human-in-the-loop) · [kilocode#8415](https://github.com/Kilo-Org/kilocode/issues/8415)
> - **A-0180** · 8 👍 · omp: Tool call details create too much visual noise · [oh-my-pi#2785](https://github.com/can1357/oh-my-pi/issues/2785)
> - **A-0502** · 7 👍 · vibe-kanban: Can't add custom statuses like 'AI Review' · [vibe-kanban#1866](https://github.com/BloopAI/vibe-kanban/issues/1866)
> - **A-0523** · 0 👍 · crystal: Can't see which model 'auto' actually used · [crystal#219](https://github.com/stravu/crystal/issues/219)
> - **A-0524** · 0 👍 · crystal: Chat history doesn't show which model answered · [crystal#218](https://github.com/stravu/crystal/issues/218)
> - **A-0471** · 0 👍 · claude-squad: Diff pane recomputes the full git diff every 500 ms per session, using lots of memory · [claude-squad#280](https://github.com/smtg-ai/claude-squad/issues/280)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Live diff per task

> [!success] ✅ Netheron can build this
> Diff updates as the agent edits, no refresh.
>
> **Effort:** none (already exists) · **Novelty:** Medium
> **Already in Netheron:** Built: B-029

### S2 · Comment on the diff → back to the agent

> [!success] ✅ Netheron can build this
> Click a line in Netheron's diff, write a comment, and it's sent to the task's agent as an instruction.
>
> **Effort:** S (hours to 1 day) · **Novelty:** High

### S3 · Task receipt

> [!success] ✅ Netheron can build this
> One screen per finished task: what changed, which model(s), tokens, cost, tests run, decisions recorded.
>
> **Effort:** S (hours to 1 day) · **Novelty:** High

### S4 · Model shown per step

> [!success] ✅ Netheron can build this
> Every call's model is logged by the proxy; show it in the timeline.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium
> **Already in Netheron:** Proxy logs the model

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

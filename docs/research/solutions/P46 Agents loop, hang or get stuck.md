---
type: "solution"
id: "P46"
title: "Agents loop, hang or get stuck"
themes: ["loops", "reliability", "control"]
problems: 10
upvotes: 312
can_incorporate: "yes"
options: 3
partly_built: true
status: "wave 2 built"
decision: ""
priority: ""
rows: ["A-0065", "A-0071", "A-0124", "A-0086", "A-0422", "A-0292", "A-0233", "A-0253", "A-0400", "A-0420"]
tags: ["research", "solution", "theme/loops", "theme/reliability", "theme/control"]
updated: "2026-10-08"
---
# P46 · Agents loop, hang or get stuck

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/loops|loops]] · [[themes/reliability|reliability]] · [[themes/control|control]]

> [!question] The problem
> Agents loop for an hour on small edits, hang on 'Working…', can't be cancelled, or repeat the same failing step.
>
> **10 problems · 312 👍** · tools: gemini-cli (3), openhands (2), pi (1), copilot (1), kilo (1)

> [!success] Built in Wave 1 (2026-10-09)
> S3 loop budget, stuck detection. See [[BUGS]] B-036.

> [!success] Built in Wave 2 (2026-10-09)
> S1 Stuck Rescue: hand off to another vendor's agent with a 'what failed' briefing. See [[BUGS]] B-038.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0065 | 164 | gemini-cli | Agent loops or stalls for an hour on small edits |  | [gemini-cli#22141](https://github.com/google-gemini/gemini-cli/issues/22141) |
| A-0071 | 50 | gemini-cli | Request gets stuck forever after cancelling |  | [gemini-cli#21096](https://github.com/google-gemini/gemini-cli/issues/21096) |
| A-0124 | 34 | pi | Agent stuck on 'Working...' with no output or error |  | [pi#4945](https://github.com/earendil-works/pi/issues/4945) |
| A-0086 | 27 | gemini-cli | CLI hangs indefinitely, possibly in a retry loop |  | [gemini-cli#22415](https://github.com/google-gemini/gemini-cli/issues/22415) |
| A-0422 | 14 | copilot | Assistant suddenly stops responding |  | [vscode-copilot-release#14053](https://github.com/microsoft/vscode-copilot-release/issues/14053) |

> [!example]- All 10 problems in this cluster (click to open)
> - **A-0065** · 164 👍 · gemini-cli: Agent loops or stalls for an hour on small edits · [gemini-cli#22141](https://github.com/google-gemini/gemini-cli/issues/22141)
> - **A-0071** · 50 👍 · gemini-cli: Request gets stuck forever after cancelling · [gemini-cli#21096](https://github.com/google-gemini/gemini-cli/issues/21096)
> - **A-0124** · 34 👍 · pi: Agent stuck on 'Working...' with no output or error · [pi#4945](https://github.com/earendil-works/pi/issues/4945)
> - **A-0086** · 27 👍 · gemini-cli: CLI hangs indefinitely, possibly in a retry loop · [gemini-cli#22415](https://github.com/google-gemini/gemini-cli/issues/22415)
> - **A-0422** · 14 👍 · copilot: Assistant suddenly stops responding · [vscode-copilot-release#14053](https://github.com/microsoft/vscode-copilot-release/issues/14053)
> - **A-0292** · 9 👍 · kilo: Agent stuck 'considering next steps' forever; can't cancel · [kilocode#7742](https://github.com/Kilo-Org/kilocode/issues/7742)
> - **A-0233** · 5 👍 · cline: A fast model loops on every prompt · [cline#7325](https://github.com/cline/cline/issues/7325)
> - **A-0253** · 4 👍 · roo: Agent loops when a model answers without a tool call · [Roo-Code#10322](https://github.com/RooCodeInc/Roo-Code/issues/10322)
> - **A-0400** · 3 👍 · openhands: UI stuck 'Starting' when reopening an old conversation · [OpenHands#12684](https://github.com/OpenHands/OpenHands/issues/12684)
> - **A-0420** · 2 👍 · openhands: GUI always shows 'Disconnected' with no error in logs · [OpenHands#12502](https://github.com/OpenHands/OpenHands/issues/12502)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Stuck Rescue

> [!success] ✅ Netheron can build this
> Detect no-progress (no diff change, repeated errors, no output) and hand the task to another vendor's agent with a 'what failed' note.
>
> **Effort:** M (2–5 days) · **Novelty:** High

### S2 · Hard stop that always works

> [!success] ✅ Netheron can build this
> Kill the agent's process tree from the board.
>
> **Effort:** none (already exists) · **Novelty:** Low
> **Already in Netheron:** Built: Stop + B-030 safe kill

### S3 · Loop budget

> [!success] ✅ Netheron can build this
> Cap time/tokens per task; pause and notify at the cap.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

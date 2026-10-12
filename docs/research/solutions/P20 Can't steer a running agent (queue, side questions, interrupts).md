---
type: "solution"
id: "P20"
title: "Can't steer a running agent (queue, side questions, interrupts)"
themes: ["control", "reliability", "ux"]
problems: 7
upvotes: 643
can_incorporate: "partly"
options: 3
partly_built: true
status: "wave 1 built"
decision: ""
priority: ""
rows: ["A-0097", "A-0031", "A-0114", "A-0122", "A-0386", "A-0263", "A-0480"]
tags: ["research", "solution", "theme/control", "theme/reliability", "theme/ux"]
updated: "2026-10-08"
---
# P20 · Can't steer a running agent (queue, side questions, interrupts)

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/control|control]] · [[themes/reliability|reliability]] · [[themes/ux|ux]]

> [!question] The problem
> Only option mid-run is interrupting; queued messages vanish or can't be removed; side questions derail the task; messages to external agents get swallowed.
>
> **7 problems · 643 👍** · tools: opencode (3), claude-code (1), zed (1), roo (1), claude-squad (1)

> [!success] Built in Wave 1 (2026-10-09)
> S1 message queue. See [[BUGS]] B-036.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0097 | 212 | opencode | Can't ask a quick side question without derailing the running task |  | [opencode#16992](https://github.com/anomalyco/opencode/issues/16992) |
| A-0031 | 211 | claude-code | Can't queue follow-up messages; only option is to interrupt the running task |  | [claude-code#50246](https://github.com/anthropics/claude-code/issues/50246) |
| A-0114 | 105 | opencode | Can't remove a queued message once sent |  | [opencode#4821](https://github.com/anomalyco/opencode/issues/4821) |
| A-0122 | 84 | opencode | Unclear behaviour when messaging mid-run: queue vs steer |  | [opencode#32157](https://github.com/anomalyco/opencode/issues/32157) |
| A-0386 | 29 | zed | Messages sent to an external agent while it works are silently swallowed |  | [zed#47928](https://github.com/zed-industries/zed/issues/47928) |

> [!example]- All 7 problems in this cluster (click to open)
> - **A-0097** · 212 👍 · opencode: Can't ask a quick side question without derailing the running task · [opencode#16992](https://github.com/anomalyco/opencode/issues/16992)
> - **A-0031** · 211 👍 · claude-code: Can't queue follow-up messages; only option is to interrupt the running task · [claude-code#50246](https://github.com/anthropics/claude-code/issues/50246)
> - **A-0114** · 105 👍 · opencode: Can't remove a queued message once sent · [opencode#4821](https://github.com/anomalyco/opencode/issues/4821)
> - **A-0122** · 84 👍 · opencode: Unclear behaviour when messaging mid-run: queue vs steer · [opencode#32157](https://github.com/anomalyco/opencode/issues/32157)
> - **A-0386** · 29 👍 · zed: Messages sent to an external agent while it works are silently swallowed · [zed#47928](https://github.com/zed-industries/zed/issues/47928)
> - **A-0263** · 2 👍 · roo: Queued messages silently vanish · [Roo-Code#8536](https://github.com/RooCodeInc/Roo-Code/issues/8536)
> - **A-0480** · 0 👍 · claude-squad: Keyboard input silently swallowed while attached · [claude-squad#325](https://github.com/smtg-ai/claude-squad/issues/325)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Message queue per task

> [!success] ✅ Netheron can build this
> Netheron holds your follow-ups and sends them when the agent is idle; edit or delete before sending.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium
> **Already in Netheron:** Netheron already detects idle ('needs you')

### S2 · Side question to another agent

> [!success] ✅ Netheron can build this
> Ask a quick question to a separate cheap agent with read access to the task's memory, without touching the running task.
>
> **Effort:** S (hours to 1 day) · **Novelty:** High: uses shared memory

### S3 · Delivery confirmation

> [!success] ✅ Netheron can build this
> Show whether each message reached the agent (echo seen in terminal).
>
> **Effort:** S (hours to 1 day) · **Novelty:** Low

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> How each CLI handles input mid-run is the vendor's.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

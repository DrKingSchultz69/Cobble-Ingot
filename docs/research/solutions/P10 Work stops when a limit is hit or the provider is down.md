---
type: "solution"
id: "P10"
title: "Work stops when a limit is hit or the provider is down"
themes: ["reliability", "performance", "cost"]
problems: 7
upvotes: 441
can_incorporate: "partly"
options: 3
partly_built: true
status: "wave 2 built"
decision: ""
priority: ""
rows: ["A-0033", "A-0110", "A-0075", "A-0088", "A-0090", "A-0091", "A-0432"]
tags: ["research", "solution", "theme/reliability", "theme/performance", "theme/cost"]
updated: "2026-10-08"
---
# P10 · Work stops when a limit is hit or the provider is down

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/reliability|reliability]] · [[themes/performance|performance]] · [[themes/cost|cost]]

> [!question] The problem
> Tasks die mid-way on usage limits, 'high demand' errors, timeouts or 503s; no fallback to another model or provider.
>
> **7 problems · 441 👍** · tools: gemini-cli (4), claude-code (1), opencode (1), copilot (1)

> [!success] Built in Wave 1 (2026-10-09)
> S2 pause until reset. See [[BUGS]] B-036.

> [!success] Built in Wave 2 (2026-10-09)
> S1 failover with context hand-off (manual + automatic). See [[BUGS]] B-038.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0033 | 209 | claude-code | Work stops dead when the session limit is reached; can't continue |  | [claude-code#13354](https://github.com/anthropics/claude-code/issues/13354) |
| A-0110 | 119 | opencode | No automatic fallback to a different model when one fails |  | [opencode#7602](https://github.com/anomalyco/opencode/issues/7602) |
| A-0075 | 37 | gemini-cli | Tool 'thinks' 10+ minutes and times out constantly |  | [gemini-cli#23795](https://github.com/google-gemini/gemini-cli/issues/23795) |
| A-0088 | 25 | gemini-cli | Work stops mid-task due to provider 'high demand' |  | [gemini-cli#15481](https://github.com/google-gemini/gemini-cli/issues/15481) |
| A-0090 | 24 | gemini-cli | Very slow responses and frequent 'high demand' errors |  | [gemini-cli#15397](https://github.com/google-gemini/gemini-cli/issues/15397) |

> [!example]- All 7 problems in this cluster (click to open)
> - **A-0033** · 209 👍 · claude-code: Work stops dead when the session limit is reached; can't continue · [claude-code#13354](https://github.com/anthropics/claude-code/issues/13354)
> - **A-0110** · 119 👍 · opencode: No automatic fallback to a different model when one fails · [opencode#7602](https://github.com/anomalyco/opencode/issues/7602)
> - **A-0075** · 37 👍 · gemini-cli: Tool 'thinks' 10+ minutes and times out constantly · [gemini-cli#23795](https://github.com/google-gemini/gemini-cli/issues/23795)
> - **A-0088** · 25 👍 · gemini-cli: Work stops mid-task due to provider 'high demand' · [gemini-cli#15481](https://github.com/google-gemini/gemini-cli/issues/15481)
> - **A-0090** · 24 👍 · gemini-cli: Very slow responses and frequent 'high demand' errors · [gemini-cli#15397](https://github.com/google-gemini/gemini-cli/issues/15397)
> - **A-0091** · 24 👍 · gemini-cli: Extremely high latency or no response from the model · [gemini-cli#22160](https://github.com/google-gemini/gemini-cli/issues/22160)
> - **A-0432** · 3 👍 · copilot: Requests fail with server errors (503) · [vscode-copilot-release#14110](https://github.com/microsoft/vscode-copilot-release/issues/14110)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Cross-vendor failover with context handoff

> [!success] ✅ Netheron can build this
> On limit/outage, hand the task to another agent/model with a summary from shared memory and the current diff, then continue.
>
> **Effort:** M (2–5 days) · **Novelty:** High: vendor tools can't fail over to competitors
> **Already in Netheron:** 429 failover to API key exists

### S2 · Pause and resume at reset

> [!success] ✅ Netheron can build this
> If no fallback is allowed, pause the task and resume it automatically when the limit resets; notify on phone.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium

### S3 · Stuck Rescue

> [!success] ✅ Netheron can build this
> Detect 'thinking for 10 minutes' with no progress and offer a switch.
>
> **Effort:** S (hours to 1 day) · **Novelty:** High

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Provider outages themselves are the provider's.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

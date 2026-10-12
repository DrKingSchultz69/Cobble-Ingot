---
type: "solution"
id: "P09"
title: "Can't see usage, quota, limits or context while working"
themes: ["cost", "ux", "reliability"]
problems: 10
upvotes: 844
can_incorporate: "partly"
options: 3
partly_built: true
status: "wave 1 built"
decision: ""
priority: ""
rows: ["A-0048", "A-0049", "A-0101", "A-0102", "A-0113", "A-0074", "A-0155", "A-0293", "A-0176", "A-0430"]
tags: ["research", "solution", "theme/cost", "theme/ux", "theme/reliability"]
updated: "2026-10-08"
---
# P09 · Can't see usage, quota, limits or context while working

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/cost|cost]] · [[themes/ux|ux]] · [[themes/reliability|reliability]]

> [!question] The problem
> No status line with tokens/limits, context indicators removed, no API for remaining quota, generic 'rate limited' errors without reset time, and even wrong 'quota exhausted' errors.
>
> **10 problems · 844 👍** · tools: opencode (3), codex (2), omp (2), gemini-cli (1), kilo (1)

> [!success] Built in Wave 1 (2026-10-09)
> S2 live meter, S3 reset times. See [[BUGS]] B-036.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0048 | 202 | codex | No status line showing tokens, model and limits while working |  | [codex#17827](https://github.com/openai/codex/issues/17827) |
| A-0049 | 176 | codex | Context/token usage indicator removed from the desktop app |  | [codex#23794](https://github.com/openai/codex/issues/23794) |
| A-0101 | 138 | opencode | Can't check remaining plan usage/balance programmatically |  | [opencode#16017](https://github.com/anomalyco/opencode/issues/16017) |
| A-0102 | 138 | opencode | Can't see how much of the context window is used |  | [opencode#6152](https://github.com/anomalyco/opencode/issues/6152) |
| A-0113 | 112 | opencode | No tokens-per-second display to judge speed |  | [opencode#5374](https://github.com/anomalyco/opencode/issues/5374) |

> [!example]- All 10 problems in this cluster (click to open)
> - **A-0048** · 202 👍 · codex: No status line showing tokens, model and limits while working · [codex#17827](https://github.com/openai/codex/issues/17827)
> - **A-0049** · 176 👍 · codex: Context/token usage indicator removed from the desktop app · [codex#23794](https://github.com/openai/codex/issues/23794)
> - **A-0101** · 138 👍 · opencode: Can't check remaining plan usage/balance programmatically · [opencode#16017](https://github.com/anomalyco/opencode/issues/16017)
> - **A-0102** · 138 👍 · opencode: Can't see how much of the context window is used · [opencode#6152](https://github.com/anomalyco/opencode/issues/6152)
> - **A-0113** · 112 👍 · opencode: No tokens-per-second display to judge speed · [opencode#5374](https://github.com/anomalyco/opencode/issues/5374)
> - **A-0074** · 38 👍 · gemini-cli: 'Usage limit reached' shown despite only 1-8% usage · [gemini-cli#28761](https://github.com/google-gemini/gemini-cli/issues/28761)
> - **A-0155** · 19 👍 · omp: Wrong 'quota exhausted' errors while quota remains · [oh-my-pi#11689](https://github.com/can1357/oh-my-pi/issues/11689)
> - **A-0293** · 9 👍 · kilo: No speed metric (tokens/s) · [kilocode#6579](https://github.com/Kilo-Org/kilocode/issues/6579)
> - **A-0176** · 8 👍 · omp: Incorrect quota-exhausted errors persist after a fix · [oh-my-pi#12655](https://github.com/can1357/oh-my-pi/issues/12655)
> - **A-0430** · 4 👍 · copilot: Only a generic 'rate limited' error; no usage or reset time shown · [vscode-copilot-release#14168](https://github.com/microsoft/vscode-copilot-release/issues/14168)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · One quota view across every subscription

> [!success] ✅ Netheron can build this
> A Usage panel showing, per subscription: used, estimated remaining, reset time, and the current task's tokens and speed.
>
> **Effort:** M (2–5 days) · **Novelty:** High: cross-vendor
> **Already in Netheron:** Usage view exists (per agent/model/auth)

### S2 · Live per-task meter

> [!success] ✅ Netheron can build this
> Each task tab shows tokens, cost, context size and tokens/second live.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium
> **Already in Netheron:** Per-task usage exists in Info

### S3 · Explain rate-limit errors

> [!success] ✅ Netheron can build this
> When a 429 arrives, read the provider's headers and show 'resets at 14:30' plus what Netheron did (failover, queued).
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium
> **Already in Netheron:** 429 failover exists (T-U11)

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Wrong quota numbers inside a vendor's service can only be fixed by the vendor.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

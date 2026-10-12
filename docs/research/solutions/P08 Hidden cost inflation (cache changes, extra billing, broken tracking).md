---
type: "solution"
id: "P08"
title: "Hidden cost inflation (cache changes, extra billing, broken tracking)"
themes: ["cost", "trust", "review"]
problems: 6
upvotes: 714
can_incorporate: "partly"
options: 3
partly_built: true
status: "wave 1 built"
decision: ""
priority: ""
rows: ["A-0023", "A-0029", "A-0030", "A-0539", "A-0145", "A-0207"]
tags: ["research", "solution", "theme/cost", "theme/trust", "theme/review"]
updated: "2026-10-08"
---
# P08 · Hidden cost inflation (cache changes, extra billing, broken tracking)

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/cost|cost]] · [[themes/trust|trust]] · [[themes/review|review]]

> [!question] The problem
> Prompt-cache lifetimes shortened silently, new versions use thousands more cache tokens, a string in git history routes requests to paid billing, caching doesn't work with some plans, cost tracking breaks.
>
> **6 problems · 714 👍** · tools: claude-code (3), litellm (1), pi (1), aider (1)

> [!success] Built in Wave 1 (2026-10-09)
> S1 cache monitor, S2 billing check. See [[BUGS]] B-036.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0023 | 243 | claude-code | Prompt-cache lifetime silently shortened, inflating quota use and cost |  | [claude-code#46829](https://github.com/anthropics/claude-code/issues/46829) |
| A-0029 | 215 | claude-code | New version silently uses ~20K more cache tokens per request |  | [claude-code#46917](https://github.com/anthropics/claude-code/issues/46917) |
| A-0030 | 213 | claude-code | A string in git history silently routes requests to paid extra billing instead of the plan |  | [claude-code#53262](https://github.com/anthropics/claude-code/issues/53262) |
| A-0539 | 32 | litellm | Cost tracking broken for a provider |  | [litellm#20412](https://github.com/BerriAI/litellm/issues/20412) |
| A-0145 | 10 | pi | Prompt cache not working with a coding plan, burning the session fast |  | [pi#6083](https://github.com/earendil-works/pi/issues/6083) |

> [!example]- All 6 problems in this cluster (click to open)
> - **A-0023** · 243 👍 · claude-code: Prompt-cache lifetime silently shortened, inflating quota use and cost · [claude-code#46829](https://github.com/anthropics/claude-code/issues/46829)
> - **A-0029** · 215 👍 · claude-code: New version silently uses ~20K more cache tokens per request · [claude-code#46917](https://github.com/anthropics/claude-code/issues/46917)
> - **A-0030** · 213 👍 · claude-code: A string in git history silently routes requests to paid extra billing instead of the plan · [claude-code#53262](https://github.com/anthropics/claude-code/issues/53262)
> - **A-0539** · 32 👍 · litellm: Cost tracking broken for a provider · [litellm#20412](https://github.com/BerriAI/litellm/issues/20412)
> - **A-0145** · 10 👍 · pi: Prompt cache not working with a coding plan, burning the session fast · [pi#6083](https://github.com/earendil-works/pi/issues/6083)
> - **A-0207** · 1 👍 · aider: Prompt caching appears not to work · [aider#4676](https://github.com/Aider-AI/aider/issues/4676)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Cache efficiency monitor

> [!success] ✅ Netheron can build this
> The proxy already splits cache reads/writes: show cache-hit rate per agent/version and alert when it drops.
>
> **Effort:** S (hours to 1 day) · **Novelty:** High: only possible from the proxy
> **Already in Netheron:** Proxy tracks cache_read/cache_write (B-002)

### S2 · Billing route check

> [!success] ✅ Netheron can build this
> Flag calls that went to API-key billing instead of the subscription (auth kind is logged per call).
>
> **Effort:** S (hours to 1 day) · **Novelty:** High
> **Already in Netheron:** Proxy logs auth=subscription/api_key

### S3 · Version cost diff

> [!success] ✅ Netheron can build this
> Compare average tokens per task before/after an agent version change and show it in Usage.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Vendors' billing logic is theirs; Netheron makes it visible.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

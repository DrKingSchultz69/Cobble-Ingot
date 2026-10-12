---
type: "solution"
id: "P07"
title: "Usage limits drain fast; sudden changes to how fast"
themes: ["cost", "trust", "reliability"]
problems: 9
upvotes: 2085
can_incorporate: "partly"
options: 4
partly_built: true
status: "wave 2 built"
decision: ""
priority: ""
rows: ["A-0010", "A-0013", "A-0041", "A-0044", "A-0053", "A-0120", "A-0294", "A-0346", "A-0268"]
tags: ["research", "solution", "theme/cost", "theme/trust", "theme/reliability"]
updated: "2026-10-08"
---
# P07 · Usage limits drain fast; sudden changes to how fast

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/cost|cost]] · [[themes/trust|trust]] · [[themes/reliability|reliability]]

> [!question] The problem
> Paid plans hit limits after 1–2 hours, budgets drain in a few prompts after a silent change, and simple requests burn huge amounts. Users can't tell why.
>
> **9 problems · 2085 👍** · tools: codex (3), claude-code (2), opencode (1), kilo (1), goose (1)

> [!success] Built in Wave 2 (2026-10-10)
> S1 Budget Dial. See [[BUGS]] B-039.

> [!success] Built in Wave 1 (2026-10-09)
> S3 drain alarm. See [[BUGS]] B-036.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0010 | 695 | claude-code | Usage limits suddenly hit after 2 hours on the top plan, after months without hitting them; no answer from the vendor |  | [claude-code#16157](https://github.com/anthropics/claude-code/issues/16157) |
| A-0013 | 476 | claude-code | 5-hour plan window exhausted in 1-2 hours with the same workload as before |  | [claude-code#38335](https://github.com/anthropics/claude-code/issues/38335) |
| A-0041 | 364 | codex | Rate-limit cost per token jumped 10-20x, draining the budget in 2-3 prompts |  | [codex#28879](https://github.com/openai/codex/issues/28879) |
| A-0044 | 285 | codex | Tokens burn very fast in the IDE extension |  | [codex#14593](https://github.com/openai/codex/issues/14593) |
| A-0053 | 166 | codex | Short (5-hour) usage windows interrupt work |  | [codex#34035](https://github.com/openai/codex/issues/34035) |

> [!example]- All 9 problems in this cluster (click to open)
> - **A-0010** · 695 👍 · claude-code: Usage limits suddenly hit after 2 hours on the top plan, after months without hitting them; no answer from the vendor · [claude-code#16157](https://github.com/anthropics/claude-code/issues/16157)
> - **A-0013** · 476 👍 · claude-code: 5-hour plan window exhausted in 1-2 hours with the same workload as before · [claude-code#38335](https://github.com/anthropics/claude-code/issues/38335)
> - **A-0041** · 364 👍 · codex: Rate-limit cost per token jumped 10-20x, draining the budget in 2-3 prompts · [codex#28879](https://github.com/openai/codex/issues/28879)
> - **A-0044** · 285 👍 · codex: Tokens burn very fast in the IDE extension · [codex#14593](https://github.com/openai/codex/issues/14593)
> - **A-0053** · 166 👍 · codex: Short (5-hour) usage windows interrupt work · [codex#34035](https://github.com/openai/codex/issues/34035)
> - **A-0120** · 84 👍 · opencode: Plan limits not adjusted when the underlying model got cheaper · [opencode#28846](https://github.com/anomalyco/opencode/issues/28846)
> - **A-0294** · 9 👍 · kilo: Model hits its output limit while reasoning and produces nothing usable · [kilocode#10558](https://github.com/Kilo-Org/kilocode/issues/10558)
> - **A-0346** · 4 👍 · goose: Simple requests consume a huge number of premium requests · [goose#6915](https://github.com/aaif-goose/goose/issues/6915)
> - **A-0268** · 2 👍 · roo: An update caused a big jump in usage costs · [Roo-Code#10374](https://github.com/RooCodeInc/Roo-Code/issues/10374)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Budget Dial: cheapest model first, escalate only if needed

> [!success] ✅ Netheron can build this
> Per task, set a budget or 'free only'; the router starts cheap and moves up only if checks fail.
>
> **Effort:** M (2–5 days) · **Novelty:** High: mixing vendors and subscriptions

### S2 · Spread work across all your subscriptions

> [!success] ✅ Netheron can build this
> Route to whichever subscription has quota left (Claude, ChatGPT, Copilot, OpenRouter free models) instead of draining one.
>
> **Effort:** M (2–5 days) · **Novelty:** High
> **Already in Netheron:** Router already prefers subscriptions; 429 failover exists

### S3 · Drain alarm

> [!success] ✅ Netheron can build this
> The proxy sees every call: alert when a task uses tokens far faster than its usual rate, with the cause (cache misses, huge context, loops).
>
> **Effort:** S (hours to 1 day) · **Novelty:** High
> **Already in Netheron:** Proxy logs every call with tokens + cost

### S4 · Night Shift: run heavy tasks when limits reset

> [!success] ✅ Netheron can build this
> Queue tasks to run overnight or right after a limit window resets.
>
> **Effort:** M (2–5 days) · **Novelty:** High

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Plan sizes, limit rules and per-token pricing are set by vendors.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

---
type: "solution"
id: "P31"
title: "Context window limits and compaction failures"
themes: ["context", "reliability", "control"]
problems: 15
upvotes: 715
can_incorporate: "partly"
options: 3
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0021", "A-0052", "A-0054", "A-0153", "A-0125", "A-0127", "A-0139", "A-0284", "A-0168", "A-0221", "A-0178", "A-0333", "A-0229", "A-0194", "A-0413"]
tags: ["research", "solution", "theme/context", "theme/reliability", "theme/control"]
updated: "2026-10-08"
---
# P31 · Context window limits and compaction failures

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/context|context]] · [[themes/reliability|reliability]] · [[themes/control|control]]

> [!question] The problem
> Tools cap context below what the model supports, compaction doesn't trigger or fails, huge system prompts (40K tokens) choke local models, auto-attached files waste context.
>
> **15 problems · 715 👍** · tools: omp (3), pi (3), codex (2), cline (2), claude-code (1)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0021 | 263 | claude-code | IDE extension auto-attaches the open file/selection as context with no way to disable |  | [claude-code#24726](https://github.com/anthropics/claude-code/issues/24726) |
| A-0052 | 168 | codex | Context window smaller in the tool than the model officially supports |  | [codex#19464](https://github.com/openai/codex/issues/19464) |
| A-0054 | 154 | codex | Can't manually compact context in the desktop app |  | [codex#11325](https://github.com/openai/codex/issues/11325) |
| A-0153 | 26 | omp | 40K-token system prompt is too heavy for local models |  | [oh-my-pi#1734](https://github.com/can1357/oh-my-pi/issues/1734) |
| A-0125 | 20 | pi | Auto-compaction doesn't trigger, context overflows in long runs |  | [pi#6879](https://github.com/earendil-works/pi/issues/6879) |

> [!example]- All 15 problems in this cluster (click to open)
> - **A-0021** · 263 👍 · claude-code: IDE extension auto-attaches the open file/selection as context with no way to disable · [claude-code#24726](https://github.com/anthropics/claude-code/issues/24726)
> - **A-0052** · 168 👍 · codex: Context window smaller in the tool than the model officially supports · [codex#19464](https://github.com/openai/codex/issues/19464)
> - **A-0054** · 154 👍 · codex: Can't manually compact context in the desktop app · [codex#11325](https://github.com/openai/codex/issues/11325)
> - **A-0153** · 26 👍 · omp: 40K-token system prompt is too heavy for local models · [oh-my-pi#1734](https://github.com/can1357/oh-my-pi/issues/1734)
> - **A-0125** · 20 👍 · pi: Auto-compaction doesn't trigger, context overflows in long runs · [pi#6879](https://github.com/earendil-works/pi/issues/6879)
> - **A-0127** · 19 👍 · pi: Context compaction fails with an enterprise provider · [pi#6768](https://github.com/earendil-works/pi/issues/6768)
> - **A-0139** · 11 👍 · pi: Context compaction breaks on some subscription models · [pi#6477](https://github.com/earendil-works/pi/issues/6477)
> - **A-0284** · 11 👍 · kilo: Context window much smaller than the model supports · [kilocode#2778](https://github.com/Kilo-Org/kilocode/issues/2778)
> - **A-0168** · 9 👍 · omp: Provider returns quota errors only with this agent's large system prompt · [oh-my-pi#11704](https://github.com/can1357/oh-my-pi/issues/11704)
> - **A-0221** · 8 👍 · cline: Configured 1M context silently capped at 128K; tool-parsing failures · [cline#10551](https://github.com/cline/cline/issues/10551)
> - **A-0178** · 8 👍 · omp: Context compaction thresholds can't differ per model · [oh-my-pi#6835](https://github.com/can1357/oh-my-pi/issues/6835)
> - **A-0333** · 7 👍 · goose: Can't change context limit for a custom provider in the UI · [goose#8780](https://github.com/aaif-goose/goose/issues/8780)
> - **A-0229** · 7 👍 · cline: Tool output and file content truncated in context; limits not configurable · [cline#13263](https://github.com/cline/cline/issues/13263)
> - **A-0194** · 2 👍 · aider: Can't cap context size for a local GPU; must check tokens manually · [aider#4583](https://github.com/Aider-AI/aider/issues/4583)
> - **A-0413** · 2 👍 · openhands: Long history overflows context; can't reset while keeping the environment · [OpenHands#12564](https://github.com/OpenHands/OpenHands/issues/12564)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Lean mode for every agent

> [!success] ✅ Netheron can build this
> Load only what the task needs (memory MCP + task context) to keep prompts small.
>
> **Effort:** none (already exists) · **Novelty:** High
> **Already in Netheron:** Built for Claude (lean, B-004: 535K → 60K)

### S2 · Context budget shown before starting

> [!success] ✅ Netheron can build this
> Estimate the starting context per agent and warn if it's too big for the chosen model.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium

### S3 · Restart fresh with a memory summary

> [!success] ✅ Netheron can build this
> Instead of fragile compaction, start a new session with the shared-memory summary when context fills.
>
> **Effort:** S (hours to 1 day) · **Novelty:** High

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Compaction logic inside each CLI is the vendor's.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

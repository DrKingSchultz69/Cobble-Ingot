---
type: "solution"
id: "P37"
title: "Slow startup"
themes: ["performance", "platform"]
problems: 4
upvotes: 178
can_incorporate: "partly"
options: 2
partly_built: false
status: "to review"
decision: ""
priority: ""
rows: ["A-0068", "A-0076", "A-0079", "A-0081"]
tags: ["research", "solution", "theme/performance", "theme/platform"]
updated: "2026-10-08"
---
# P37 · Slow startup

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/performance|performance]] · [[themes/platform|platform]]

> [!question] The problem
> CLIs take 20 s to 2 minutes to start, worse on Windows.
>
> **4 problems · 178 👍** · tools: gemini-cli (4)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0068 | 78 | gemini-cli | CLI takes up to 39 s to start on Windows |  | [gemini-cli#11511](https://github.com/google-gemini/gemini-cli/issues/11511) |
| A-0076 | 37 | gemini-cli | Startup takes up to 60 s |  | [gemini-cli#10726](https://github.com/google-gemini/gemini-cli/issues/10726) |
| A-0079 | 32 | gemini-cli | CLI takes over 2 minutes to start |  | [gemini-cli#14626](https://github.com/google-gemini/gemini-cli/issues/14626) |
| A-0081 | 31 | gemini-cli | CLI startup takes 20-30 s every launch |  | [gemini-cli#21623](https://github.com/google-gemini/gemini-cli/issues/21623) |

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Warm agent pool

> [!warning] 🟡 Netheron can partly do this
> Netheron keeps one idle instance of each agent ready so a new task starts instantly.
>
> **Effort:** M (2–5 days) · **Novelty:** Medium

### S2 · Startup time tracking

> [!success] ✅ Netheron can build this
> Measure and show each agent's start time; route quick tasks to fast-starting agents.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Low

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> CLI startup code is the vendor's.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

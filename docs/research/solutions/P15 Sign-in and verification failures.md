---
type: "solution"
id: "P15"
title: "Sign-in and verification failures"
themes: ["accounts", "setup", "cost"]
problems: 11
upvotes: 1125
can_incorporate: "partly"
options: 2
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0007", "A-0056", "A-0069", "A-0385", "A-0084", "A-0286", "A-0491", "A-0291", "A-0392", "A-0337", "A-0339"]
tags: ["research", "solution", "theme/accounts", "theme/setup", "theme/cost"]
updated: "2026-10-08"
---
# P15 · Sign-in and verification failures

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/accounts|accounts]] · [[themes/setup|setup]] · [[themes/cost|cost]]

> [!question] The problem
> Phone verification loops, sign-in buttons that do nothing, OAuth errors, paid plans not recognised, local features that need a login.
>
> **11 problems · 1125 👍** · tools: gemini-cli (2), kilo (2), goose (2), claude-code (1), codex (1)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0007 | 820 | claude-code | Sign-up phone verification fails with useless errors and blocks new users for hours |  | [claude-code#34229](https://github.com/anthropics/claude-code/issues/34229) |
| A-0056 | 138 | codex | Phone verification breaks login on a new device |  | [codex#20161](https://github.com/openai/codex/issues/20161) |
| A-0069 | 65 | gemini-cli | Paying subscriber blocked from API access despite correct plan detection |  | [gemini-cli#24517](https://github.com/google-gemini/gemini-cli/issues/24517) |
| A-0385 | 30 | zed | Sign-in button for a provider doesn't work |  | [zed#47352](https://github.com/zed-industries/zed/issues/47352) |
| A-0084 | 27 | gemini-cli | Can't complete sign-in in the VS Code extension |  | [gemini-cli#10918](https://github.com/google-gemini/gemini-cli/issues/10918) |

> [!example]- All 11 problems in this cluster (click to open)
> - **A-0007** · 820 👍 · claude-code: Sign-up phone verification fails with useless errors and blocks new users for hours · [claude-code#34229](https://github.com/anthropics/claude-code/issues/34229)
> - **A-0056** · 138 👍 · codex: Phone verification breaks login on a new device · [codex#20161](https://github.com/openai/codex/issues/20161)
> - **A-0069** · 65 👍 · gemini-cli: Paying subscriber blocked from API access despite correct plan detection · [gemini-cli#24517](https://github.com/google-gemini/gemini-cli/issues/24517)
> - **A-0385** · 30 👍 · zed: Sign-in button for a provider doesn't work · [zed#47352](https://github.com/zed-industries/zed/issues/47352)
> - **A-0084** · 27 👍 · gemini-cli: Can't complete sign-in in the VS Code extension · [gemini-cli#10918](https://github.com/google-gemini/gemini-cli/issues/10918)
> - **A-0286** · 10 👍 · kilo: Paid subscription quota not recognised; stuck on free-tier rate limits · [kilocode#3978](https://github.com/Kilo-Org/kilocode/issues/3978)
> - **A-0491** · 10 👍 · vibe-kanban: Must log in to use local features · [vibe-kanban#2952](https://github.com/BloopAI/vibe-kanban/issues/2952)
> - **A-0291** · 9 👍 · kilo: Sign-in fails with a 403 · [kilocode#8148](https://github.com/Kilo-Org/kilocode/issues/8148)
> - **A-0392** · 6 👍 · openhands: Can't complete OAuth for MCP servers from the GUI · [OpenHands#11881](https://github.com/OpenHands/OpenHands/issues/11881)
> - **A-0337** · 5 👍 · goose: Sign-in stuck on Windows desktop · [goose#6957](https://github.com/aaif-goose/goose/issues/6957)
> - **A-0339** · 5 👍 · goose: OAuth fails for paid accounts · [goose#8894](https://github.com/aaif-goose/goose/issues/8894)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Auth health panel

> [!success] ✅ Netheron can build this
> Show per agent: signed in or not, which plan, last successful call, with a 'fix' link to the vendor's login command.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium
> **Already in Netheron:** Availability detection exists (router)

### S2 · Fallback when one login breaks

> [!success] ✅ Netheron can build this
> If one agent's login fails, route its tasks to another signed-in agent.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Account sign-up and verification are run by vendors.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

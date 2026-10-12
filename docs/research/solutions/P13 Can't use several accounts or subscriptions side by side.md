---
type: "solution"
id: "P13"
title: "Can't use several accounts or subscriptions side by side"
themes: ["accounts", "cost", "remote"]
problems: 6
upvotes: 2208
can_incorporate: "partly"
options: 3
partly_built: true
status: "wave 2 built"
decision: ""
priority: ""
rows: ["A-0006", "A-0009", "A-0017", "A-0062", "A-0536", "A-0542"]
tags: ["research", "solution", "theme/accounts", "theme/cost", "theme/remote"]
updated: "2026-10-08"
---
# P13 · Can't use several accounts or subscriptions side by side

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/accounts|accounts]] · [[themes/cost|cost]] · [[themes/remote|remote]]

> [!question] The problem
> Switching work/personal accounts means signing out and losing context; mobile apps can't hold two accounts; gateways allow only one ChatGPT login; connectors allow one account each.
>
> **6 problems · 2208 👍** · tools: claude-code (3), litellm (2), codex (1)

> [!success] Built in Wave 2 (2026-10-10)
> S1 account profiles, S2 per-project default, S3 every account on one board. See [[BUGS]] B-039.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0006 | 868 | claude-code | Switching between work and personal accounts means signing out, re-entering credentials and losing context, several times a day | Separate browser profiles instead of the desktop app | [claude-code#18435](https://github.com/anthropics/claude-code/issues/18435) |
| A-0009 | 750 | claude-code | Mobile app can't hold work and personal accounts at once, so phone remote control of work sessions needs sign-out/sign-in |  | [claude-code#36151](https://github.com/anthropics/claude-code/issues/36151) |
| A-0017 | 402 | claude-code | Can't connect multiple accounts of the same connector (e.g. two GitHub orgs) |  | [claude-code#27302](https://github.com/anthropics/claude-code/issues/27302) |
| A-0062 | 115 | codex | Can't connect multiple accounts per connector with clear separation |  | [codex#20500](https://github.com/openai/codex/issues/20500) |
| A-0536 | 45 | litellm | Only one ChatGPT subscription account per gateway |  | [litellm#23777](https://github.com/BerriAI/litellm/issues/23777) |

> [!example]- All 6 problems in this cluster (click to open)
> - **A-0006** · 868 👍 · claude-code: Switching between work and personal accounts means signing out, re-entering credentials and losing context, several times a day · [claude-code#18435](https://github.com/anthropics/claude-code/issues/18435)
> - **A-0009** · 750 👍 · claude-code: Mobile app can't hold work and personal accounts at once, so phone remote control of work sessions needs sign-out/sign-in · [claude-code#36151](https://github.com/anthropics/claude-code/issues/36151)
> - **A-0017** · 402 👍 · claude-code: Can't connect multiple accounts of the same connector (e.g. two GitHub orgs) · [claude-code#27302](https://github.com/anthropics/claude-code/issues/27302)
> - **A-0062** · 115 👍 · codex: Can't connect multiple accounts per connector with clear separation · [codex#20500](https://github.com/openai/codex/issues/20500)
> - **A-0536** · 45 👍 · litellm: Only one ChatGPT subscription account per gateway · [litellm#23777](https://github.com/BerriAI/litellm/issues/23777)
> - **A-0542** · 28 👍 · litellm: SSO login limited to 5 users on the standard plan · [litellm#25762](https://github.com/BerriAI/litellm/issues/25762)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Named account profiles per agent

> [!success] ✅ Netheron can build this
> Netheron stores several logins per vendor (work, personal) and launches each task with the chosen profile (separate config dirs/env).
>
> **Effort:** M (2–5 days) · **Novelty:** High

### S2 · Per-project default profile

> [!success] ✅ Netheron can build this
> Each project remembers which account to use, so work repos always use the work plan.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium

### S3 · Phone control across profiles

> [!success] ✅ Netheron can build this
> One Netheron phone UI shows tasks from every account; no sign-out needed.
>
> **Effort:** S (hours to 1 day) · **Novelty:** High
> **Already in Netheron:** Phone UI exists

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Multi-account support inside vendors' own apps is theirs. Check each vendor's terms before sharing or rotating accounts.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

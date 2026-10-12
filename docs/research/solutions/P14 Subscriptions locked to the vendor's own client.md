---
type: "solution"
id: "P14"
title: "Subscriptions locked to the vendor's own client"
themes: ["switching", "accounts", "models"]
problems: 8
upvotes: 1205
can_incorporate: "partly"
options: 2
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0008", "A-0094", "A-0241", "A-0169", "A-0175", "A-0177", "A-0334", "A-0429"]
tags: ["research", "solution", "theme/switching", "theme/accounts", "theme/models"]
updated: "2026-10-08"
---
# P14 · Subscriptions locked to the vendor's own client

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/switching|switching]] · [[themes/accounts|accounts]] · [[themes/models|models]]

> [!question] The problem
> Plans like Claude Max are blocked in third-party harnesses (OpenCode, Roo), credentials are refused outside official clients, latest models need the official client.
>
> **8 problems · 1205 👍** · tools: omp (3), claude-code (1), opencode (1), roo (1), goose (1)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0008 | 795 | claude-code | Provider blocked using the Max subscription in a third-party harness (OpenCode); users threaten to cancel |  | [claude-code#17118](https://github.com/anthropics/claude-code/issues/17118) |
| A-0094 | 357 | opencode | Subscription login in a third-party harness suddenly stopped working |  | [opencode#7410](https://github.com/anomalyco/opencode/issues/7410) |
| A-0241 | 18 | roo | Subscription credential refused outside the official client |  | [Roo-Code#10566](https://github.com/RooCodeInc/Roo-Code/issues/10566) |
| A-0169 | 9 | omp | Latest model blocked unless the official client version is used |  | [oh-my-pi#12870](https://github.com/can1357/oh-my-pi/issues/12870) |
| A-0175 | 8 | omp | Can't use another tool's subscription models in this agent |  | [oh-my-pi#1666](https://github.com/can1357/oh-my-pi/issues/1666) |

> [!example]- All 8 problems in this cluster (click to open)
> - **A-0008** · 795 👍 · claude-code: Provider blocked using the Max subscription in a third-party harness (OpenCode); users threaten to cancel · [claude-code#17118](https://github.com/anthropics/claude-code/issues/17118)
> - **A-0094** · 357 👍 · opencode: Subscription login in a third-party harness suddenly stopped working · [opencode#7410](https://github.com/anomalyco/opencode/issues/7410)
> - **A-0241** · 18 👍 · roo: Subscription credential refused outside the official client · [Roo-Code#10566](https://github.com/RooCodeInc/Roo-Code/issues/10566)
> - **A-0169** · 9 👍 · omp: Latest model blocked unless the official client version is used · [oh-my-pi#12870](https://github.com/can1357/oh-my-pi/issues/12870)
> - **A-0175** · 8 👍 · omp: Can't use another tool's subscription models in this agent · [oh-my-pi#1666](https://github.com/can1357/oh-my-pi/issues/1666)
> - **A-0177** · 8 👍 · omp: Free model works in one tool but is refused in another · [oh-my-pi#12306](https://github.com/can1357/oh-my-pi/issues/12306)
> - **A-0334** · 6 👍 · goose: Can't use another tool's subscription as a provider · [goose#8381](https://github.com/aaif-goose/goose/issues/8381)
> - **A-0429** · 4 👍 · copilot: Can't use a different vendor's agent with an enterprise subscription · [vscode-copilot-release#14167](https://github.com/microsoft/vscode-copilot-release/issues/14167)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Run the official CLIs, don't impersonate them

> [!success] ✅ Netheron can build this
> Netheron launches the vendor's own CLI with your subscription, so it stays within the rules while still giving you one workspace.
>
> **Effort:** none (already exists) · **Novelty:** High: the legal way to combine subscriptions
> **Already in Netheron:** Built: Netheron runs claude/codex as-is

### S2 · Terms check per route

> [!success] ✅ Netheron can build this
> Warn when a routing choice would use a subscription outside its allowed client.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Whether a subscription may be used in other tools is the vendor's policy. Netheron must respect it.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

---
type: "solution"
id: "P39"
title: "Supply-chain attacks on AI tooling"
themes: ["security", "trust"]
problems: 3
upvotes: 936
can_incorporate: "partly"
options: 3
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0532", "A-0533", "A-0189"]
tags: ["research", "solution", "theme/security", "theme/trust"]
updated: "2026-10-08"
---
# P39 · Supply-chain attacks on AI tooling

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/security|security]] · [[themes/trust|trust]]

> [!question] The problem
> A popular gateway package shipped a credential stealer that ran on every Python start; package names can be squatted.
>
> **3 problems · 936 👍** · tools: litellm (2), aider (1)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0532 | 797 | litellm | Gateway package release contained a credential stealer that ran on every Python start (supply-chain attack) |  | [litellm#24512](https://github.com/BerriAI/litellm/issues/24512) |
| A-0533 | 137 | litellm | Package compromised via another tool's supply chain |  | [litellm#24518](https://github.com/BerriAI/litellm/issues/24518) |
| A-0189 | 2 | aider | Package name on PyPI may be squatted (supply-chain risk) |  | [aider#4900](https://github.com/Aider-AI/aider/issues/4900) |

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Pin and verify agent versions

> [!success] ✅ Netheron can build this
> Install agents at pinned versions; show a warning before upgrades; check package signatures/provenance where available.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium

### S2 · Secrets never in agent env by default

> [!success] ✅ Netheron can build this
> Netheron's proxy holds API keys; agents get only what they need.
>
> **Effort:** M (2–5 days) · **Novelty:** High
> **Already in Netheron:** Proxy forwards auth; fallback keys only via MM_FALLBACK_*

### S3 · Minimal dependencies in Netheron

> [!success] ✅ Netheron can build this
> Keep Netheron's own dependency list small.
>
> **Effort:** none (already exists) · **Novelty:** Low
> **Already in Netheron:** 6 runtime deps today

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Package registries and other projects' security are outside Netheron.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

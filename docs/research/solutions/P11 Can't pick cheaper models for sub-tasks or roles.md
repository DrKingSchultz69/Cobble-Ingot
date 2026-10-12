---
type: "solution"
id: "P11"
title: "Can't pick cheaper models for sub-tasks or roles"
themes: ["cost", "parallel", "setup"]
problems: 6
upvotes: 248
can_incorporate: "partly"
options: 3
partly_built: false
status: "to review"
decision: ""
priority: ""
rows: ["A-0050", "A-0077", "A-0421", "A-0215", "A-0170", "A-0514"]
tags: ["research", "solution", "theme/cost", "theme/parallel", "theme/setup"]
updated: "2026-10-08"
---
# P11 · Can't pick cheaper models for sub-tasks or roles

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/cost|cost]] · [[themes/parallel|parallel]] · [[themes/setup|setup]]

> [!question] The problem
> Subagents are forced onto the expensive main model, configured models are ignored, users can't plug cheaper compatible models into a harness, or choose priority tiers.
>
> **6 problems · 248 👍** · tools: codex (1), gemini-cli (1), copilot (1), cline (1), omp (1)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0050 | 176 | codex | Can't choose which model subagents use; all forced to the expensive one |  | [codex#31814](https://github.com/openai/codex/issues/31814) |
| A-0077 | 36 | gemini-cli | Can't choose priority pay-as-you-go tier via the company cloud |  | [gemini-cli#21390](https://github.com/google-gemini/gemini-cli/issues/21390) |
| A-0421 | 17 | copilot | Subagents always use the main model; can't pick a cheaper one |  | [vscode-copilot-release#14138](https://github.com/microsoft/vscode-copilot-release/issues/14138) |
| A-0215 | 10 | cline | CLI ignores the configured model and uses another |  | [cline#6936](https://github.com/cline/cline/issues/6936) |
| A-0170 | 9 | omp | Can't choose the model for each sub-task |  | [oh-my-pi#7982](https://github.com/can1357/oh-my-pi/issues/7982) |

> [!example]- All 6 problems in this cluster (click to open)
> - **A-0050** · 176 👍 · codex: Can't choose which model subagents use; all forced to the expensive one · [codex#31814](https://github.com/openai/codex/issues/31814)
> - **A-0077** · 36 👍 · gemini-cli: Can't choose priority pay-as-you-go tier via the company cloud · [gemini-cli#21390](https://github.com/google-gemini/gemini-cli/issues/21390)
> - **A-0421** · 17 👍 · copilot: Subagents always use the main model; can't pick a cheaper one · [vscode-copilot-release#14138](https://github.com/microsoft/vscode-copilot-release/issues/14138)
> - **A-0215** · 10 👍 · cline: CLI ignores the configured model and uses another · [cline#6936](https://github.com/cline/cline/issues/6936)
> - **A-0170** · 9 👍 · omp: Can't choose the model for each sub-task · [oh-my-pi#7982](https://github.com/can1357/oh-my-pi/issues/7982)
> - **A-0514** · 0 👍 · crystal: Can't set custom env vars for the agent (to use cheaper compatible models) · [crystal#203](https://github.com/stravu/crystal/issues/203)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Router per sub-task

> [!success] ✅ Netheron can build this
> Split a task into steps (plan/build/test/review) and let the router choose a model per step.
>
> **Effort:** M (2–5 days) · **Novelty:** High

### S2 · Model mapping in the proxy

> [!success] ✅ Netheron can build this
> Rewrite the model per request in Netheron's proxy (e.g. send subagent calls to a cheaper model) without changing the agent.
>
> **Effort:** M (2–5 days) · **Novelty:** High: works even when the agent doesn't allow it

### S3 · Per-agent environment presets

> [!success] ✅ Netheron can build this
> Let users set env vars/base URLs per agent from Netheron (e.g. Claude Code → GLM-compatible endpoint).
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> If a vendor hard-blocks other models in its client, only the vendor can lift it.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

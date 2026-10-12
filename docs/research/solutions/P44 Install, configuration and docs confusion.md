---
type: "solution"
id: "P44"
title: "Install, configuration and docs confusion"
themes: ["setup", "reliability", "learning"]
problems: 24
upvotes: 187
can_incorporate: "partly"
options: 3
partly_built: true
status: "wave 1 built"
decision: ""
priority: ""
rows: ["A-0537", "A-0380", "A-0540", "A-0092", "A-0136", "A-0224", "A-0511", "A-0311", "A-0338", "A-0347", "A-0343", "A-0355", "A-0436", "A-0408", "A-0412", "A-0192", "A-0195", "A-0202", "A-0203", "A-0208", "A-0209", "A-0199", "A-0205", "A-0522"]
tags: ["research", "solution", "theme/setup", "theme/reliability", "theme/learning"]
updated: "2026-10-08"
---
# P44 · Install, configuration and docs confusion

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/setup|setup]] · [[themes/reliability|reliability]] · [[themes/learning|learning]]

> [!question] The problem
> Install fails, config silently ignored, MCP servers stuck connecting, confusing errors and docs, repeated 'trust this folder?' prompts.
>
> **24 problems · 187 👍** · tools: aider (8), goose (4), litellm (2), crystal (2), openhands (2)

> [!success] Built in Wave 1 (2026-10-09)
> S2 pre-trust. See [[BUGS]] B-036.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0537 | 35 | litellm | Documentation site down |  | [litellm#22554](https://github.com/BerriAI/litellm/issues/22554) |
| A-0380 | 33 | zed | API key for an edit-prediction provider not picked up |  | [zed#46506](https://github.com/zed-industries/zed/issues/46506) |
| A-0540 | 31 | litellm | New Python version not supported |  | [litellm#26343](https://github.com/BerriAI/litellm/issues/26343) |
| A-0092 | 24 | gemini-cli | MCP servers stuck 'connecting' in the IDE extension |  | [gemini-cli#18987](https://github.com/google-gemini/gemini-cli/issues/18987) |
| A-0136 | 13 | pi | Repeated 'trust this folder?' prompts annoy users who know their projects |  | [pi#5514](https://github.com/earendil-works/pi/issues/5514) |

> [!example]- All 24 problems in this cluster (click to open)
> - **A-0537** · 35 👍 · litellm: Documentation site down · [litellm#22554](https://github.com/BerriAI/litellm/issues/22554)
> - **A-0380** · 33 👍 · zed: API key for an edit-prediction provider not picked up · [zed#46506](https://github.com/zed-industries/zed/issues/46506)
> - **A-0540** · 31 👍 · litellm: New Python version not supported · [litellm#26343](https://github.com/BerriAI/litellm/issues/26343)
> - **A-0092** · 24 👍 · gemini-cli: MCP servers stuck 'connecting' in the IDE extension · [gemini-cli#18987](https://github.com/google-gemini/gemini-cli/issues/18987)
> - **A-0136** · 13 👍 · pi: Repeated 'trust this folder?' prompts annoy users who know their projects · [pi#5514](https://github.com/earendil-works/pi/issues/5514)
> - **A-0224** · 7 👍 · cline: CLI fails to start · [cline#7011](https://github.com/cline/cline/issues/7011)
> - **A-0511** · 7 👍 · crystal: App crashes on first run on macOS · [crystal#208](https://github.com/stravu/crystal/issues/208)
> - **A-0311** · 6 👍 · continue: Multiple configs poorly documented · [continue#8484](https://github.com/continuedev/continue/issues/8484)
> - **A-0338** · 5 👍 · goose: CLI won't launch (terminal errors) · [goose#8727](https://github.com/aaif-goose/goose/issues/8727)
> - **A-0347** · 4 👍 · goose: MCP client fails to connect to a server · [goose#6576](https://github.com/aaif-goose/goose/issues/6576)
> - **A-0343** · 4 👍 · goose: Configure quietly fails for an agent-protocol provider · [goose#8373](https://github.com/aaif-goose/goose/issues/8373)
> - **A-0355** · 3 👍 · goose: Terminal integration setup fails with a syntax error · [goose#6142](https://github.com/aaif-goose/goose/issues/6142)
> - **A-0436** · 2 👍 · copilot: MCP servers don't auto-start despite config · [vscode-copilot-release#14166](https://github.com/microsoft/vscode-copilot-release/issues/14166)
> - **A-0408** · 2 👍 · openhands: Sandbox fails to start within 120 s · [OpenHands#12495](https://github.com/OpenHands/OpenHands/issues/12495)
> - **A-0412** · 2 👍 · openhands: Sandbox fails to start · [OpenHands#12528](https://github.com/OpenHands/OpenHands/issues/12528)
> - **A-0192** · 2 👍 · aider: Voice mode fails with an undocumented error; wants local-only option · [aider#4980](https://github.com/Aider-AI/aider/issues/4980)
> - **A-0195** · 1 👍 · aider: Install via a package manager fails · [aider#4705](https://github.com/Aider-AI/aider/issues/4705)
> - **A-0202** · 1 👍 · aider: Environment variable breaks the installed tool · [aider#4770](https://github.com/Aider-AI/aider/issues/4770)
> - **A-0203** · 1 👍 · aider: Setup needs a paid key upfront, outdated model list, settings lost on exit (accessibility user) · [aider#4781](https://github.com/Aider-AI/aider/issues/4781)
> - **A-0208** · 1 👍 · aider: Install guide confusing for new users · [aider#5115](https://github.com/Aider-AI/aider/issues/5115)
> - **A-0209** · 1 👍 · aider: Error message and docs for provider setup make no sense · [aider#4638](https://github.com/Aider-AI/aider/issues/4638)
> - **A-0199** · 1 👍 · aider: Unclear what a setting actually does · [aider#4675](https://github.com/Aider-AI/aider/issues/4675)
> - **A-0205** · 1 👍 · aider: Unclear which workflow mode to use and why · [aider#4984](https://github.com/Aider-AI/aider/issues/4984)
> - **A-0522** · 0 👍 · crystal: Globally configured MCP servers not picked up, plus UI issues · [crystal#223](https://github.com/stravu/crystal/issues/223)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Guided first run

> [!success] ✅ Netheron can build this
> Netheron detects installed agents, logins and MCP status and shows exactly what's missing with fix commands.
>
> **Effort:** M (2–5 days) · **Novelty:** Medium
> **Already in Netheron:** Availability detection exists

### S2 · Pre-trust Netheron's own worktrees

> [!success] ✅ Netheron can build this
> Skip repeated trust prompts for folders Netheron created.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Low
> **Already in Netheron:** Done for Codex (B-010); Claude pending (B-014)

### S3 · Plain-language errors

> [!success] ✅ Netheron can build this
> Translate common agent errors into what to do next.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Low

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Each vendor's installer and docs are theirs.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

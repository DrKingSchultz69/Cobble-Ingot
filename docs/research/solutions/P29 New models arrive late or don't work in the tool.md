---
type: "solution"
id: "P29"
title: "New models arrive late or don't work in the tool"
themes: ["models", "setup", "accounts"]
problems: 42
upvotes: 1014
can_incorporate: "partly"
options: 3
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0107", "A-0111", "A-0066", "A-0115", "A-0070", "A-0072", "A-0372", "A-0374", "A-0376", "A-0538", "A-0089", "A-0272", "A-0549", "A-0129", "A-0242", "A-0552", "A-0277", "A-0133", "A-0160", "A-0166", "A-0144", "A-0167", "A-0244", "A-0288", "A-0174", "A-0245", "A-0297", "A-0295", "A-0220", "A-0300", "A-0148", "A-0173", "A-0149", "A-0232", "A-0236", "A-0185", "A-0428", "A-0353", "A-0262", "A-0258", "A-0269", "A-0435"]
tags: ["research", "solution", "theme/models", "theme/setup", "theme/accounts"]
updated: "2026-10-08"
---
# P29 · New models arrive late or don't work in the tool

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/models|models]] · [[themes/setup|setup]] · [[themes/accounts|accounts]]

> [!question] The problem
> New models take weeks to appear, listed models return 'not found', enterprise/free plans miss models, regional and cloud providers aren't supported.
>
> **42 problems · 1014 👍** · tools: kilo (6), roo (6), pi (5), omp (5), gemini-cli (4)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0107 | 121 | opencode | Newest model not available through a subscription provider |  | [opencode#12954](https://github.com/anomalyco/opencode/issues/12954) |
| A-0111 | 116 | opencode | New models not added quickly |  | [opencode#16219](https://github.com/anomalyco/opencode/issues/16219) |
| A-0066 | 110 | gemini-cli | Newest model missing from the tool's model list |  | [gemini-cli#19532](https://github.com/google-gemini/gemini-cli/issues/19532) |
| A-0115 | 101 | opencode | Listed model returns 'not found' with subscription login |  | [opencode#36140](https://github.com/anomalyco/opencode/issues/36140) |
| A-0070 | 58 | gemini-cli | Enterprise users promised latest models but don't get them |  | [gemini-cli#28625](https://github.com/google-gemini/gemini-cli/issues/28625) |

> [!example]- All 42 problems in this cluster (click to open)
> - **A-0107** · 121 👍 · opencode: Newest model not available through a subscription provider · [opencode#12954](https://github.com/anomalyco/opencode/issues/12954)
> - **A-0111** · 116 👍 · opencode: New models not added quickly · [opencode#16219](https://github.com/anomalyco/opencode/issues/16219)
> - **A-0066** · 110 👍 · gemini-cli: Newest model missing from the tool's model list · [gemini-cli#19532](https://github.com/google-gemini/gemini-cli/issues/19532)
> - **A-0115** · 101 👍 · opencode: Listed model returns 'not found' with subscription login · [opencode#36140](https://github.com/anomalyco/opencode/issues/36140)
> - **A-0070** · 58 👍 · gemini-cli: Enterprise users promised latest models but don't get them · [gemini-cli#28625](https://github.com/google-gemini/gemini-cli/issues/28625)
> - **A-0072** · 47 👍 · gemini-cli: Latest models not available in the CLI · [gemini-cli#28802](https://github.com/google-gemini/gemini-cli/issues/28802)
> - **A-0372** · 40 👍 · zed: Only one model available via an enterprise subscription · [zed#49691](https://github.com/zed-industries/zed/issues/49691)
> - **A-0374** · 37 👍 · zed: Subscription models missing from the picker · [zed#47540](https://github.com/zed-industries/zed/issues/47540)
> - **A-0376** · 36 👍 · zed: Models missing for free/student plans after a provider change · [zed#60029](https://github.com/zed-industries/zed/issues/60029)
> - **A-0538** · 32 👍 · litellm: New models via a company cloud API not supported · [litellm#29463](https://github.com/BerriAI/litellm/issues/29463)
> - **A-0089** · 25 👍 · gemini-cli: Newly released model doesn't work in the CLI · [gemini-cli#27258](https://github.com/google-gemini/gemini-cli/issues/27258)
> - **A-0272** · 22 👍 · kilo: Announced provider choice for autocomplete doesn't work · [kilocode#3058](https://github.com/Kilo-Org/kilocode/issues/3058)
> - **A-0549** · 18 👍 · litellm: New models via company cloud not supported · [litellm#37285](https://github.com/BerriAI/litellm/issues/37285)
> - **A-0129** · 18 👍 · pi: New 'max' thinking level not supported · [pi#6097](https://github.com/earendil-works/pi/issues/6097)
> - **A-0242** · 18 👍 · roo: Regional model provider not supported · [Roo-Code#9320](https://github.com/RooCodeInc/Roo-Code/issues/9320)
> - **A-0552** · 16 👍 · litellm: New model version not added · [litellm#27651](https://github.com/BerriAI/litellm/issues/27651)
> - **A-0277** · 15 👍 · kilo: Only one model available for autocomplete · [kilocode#4498](https://github.com/Kilo-Org/kilocode/issues/4498)
> - **A-0133** · 15 👍 · pi: Missing provider for a company cloud endpoint · [pi#5363](https://github.com/earendil-works/pi/issues/5363)
> - **A-0160** · 13 👍 · omp: A model provider is missing · [oh-my-pi#2959](https://github.com/can1357/oh-my-pi/issues/2959)
> - **A-0166** · 10 👍 · omp: New model missing from the catalog · [oh-my-pi#11508](https://github.com/can1357/oh-my-pi/issues/11508)
> - **A-0144** · 10 👍 · pi: Thinking not supported for a model family · [pi#2812](https://github.com/earendil-works/pi/issues/2812)
> - **A-0167** · 10 👍 · omp: Can't reach some frontier models via the company cloud API · [oh-my-pi#1732](https://github.com/can1357/oh-my-pi/issues/1732)
> - **A-0244** · 9 👍 · roo: New model on a coding plan not supported · [Roo-Code#11438](https://github.com/RooCodeInc/Roo-Code/issues/11438)
> - **A-0288** · 9 👍 · kilo: New model not supported · [kilocode#9452](https://github.com/Kilo-Org/kilocode/issues/9452)
> - **A-0174** · 8 👍 · omp: New model not supported · [oh-my-pi#4859](https://github.com/can1357/oh-my-pi/issues/4859)
> - **A-0245** · 8 👍 · roo: New model on a coding plan not supported · [Roo-Code#12024](https://github.com/RooCodeInc/Roo-Code/issues/12024)
> - **A-0297** · 8 👍 · kilo: Latest model missing from the list · [kilocode#5846](https://github.com/Kilo-Org/kilocode/issues/5846)
> - **A-0295** · 8 👍 · kilo: Can't select a model for autocomplete · [kilocode#3321](https://github.com/Kilo-Org/kilocode/issues/3321)
> - **A-0220** · 8 👍 · cline: Missing option needed to use a model via company cloud · [cline#7658](https://github.com/cline/cline/issues/7658)
> - **A-0300** · 8 👍 · kilo: Regional provider not supported natively · [kilocode#6171](https://github.com/Kilo-Org/kilocode/issues/6171)
> - **A-0148** · 8 👍 · pi: A subscription provider is missing · [pi#1757](https://github.com/earendil-works/pi/issues/1757)
> - **A-0173** · 8 👍 · omp: Popular provider not built in; manual config needed · [oh-my-pi#830](https://github.com/can1357/oh-my-pi/issues/830)
> - **A-0149** · 8 👍 · pi: Can't pass video/audio to the model · [pi#3200](https://github.com/earendil-works/pi/issues/3200)
> - **A-0232** · 6 👍 · cline: New models not listed · [cline#10469](https://github.com/cline/cline/issues/10469)
> - **A-0236** · 6 👍 · cline: Can't select newer models from a provider · [cline#10427](https://github.com/cline/cline/issues/10427)
> - **A-0185** · 6 👍 · aider: New models unrecognised because a dependency lags · [aider#5255](https://github.com/Aider-AI/aider/issues/5255)
> - **A-0428** · 4 👍 · copilot: A model is not accessible · [vscode-copilot-release#14091](https://github.com/microsoft/vscode-copilot-release/issues/14091)
> - **A-0353** · 4 👍 · goose: EU provider not offered · [goose#12437](https://github.com/aaif-goose/goose/issues/12437)
> - **A-0262** · 3 👍 · roo: New model not supported · [Roo-Code#12018](https://github.com/RooCodeInc/Roo-Code/issues/12018)
> - **A-0258** · 3 👍 · roo: No first-class support for a company cloud endpoint · [Roo-Code#9940](https://github.com/RooCodeInc/Roo-Code/issues/9940)
> - **A-0269** · 2 👍 · roo: Model not available via a company cloud provider · [Roo-Code#9268](https://github.com/RooCodeInc/Roo-Code/issues/9268)
> - **A-0435** · 2 👍 · copilot: Assistant doesn't load; model not accessible · [vscode-copilot-release#14088](https://github.com/microsoft/vscode-copilot-release/issues/14088)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Use whichever agent already has the model

> [!success] ✅ Netheron can build this
> If Codex has the new model first, the router uses Codex for that model; no waiting for every tool.
>
> **Effort:** none (already exists) · **Novelty:** High
> **Already in Netheron:** Router chooses among agents

### S2 · OpenRouter / custom endpoint passthrough

> [!success] ✅ Netheron can build this
> New models reachable via OpenRouter or any OpenAI/Anthropic-compatible URL are usable at once.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium
> **Already in Netheron:** OpenRouter route exists

### S3 · Model catalogue auto-update

> [!success] ✅ Netheron can build this
> Fetch model lists from providers ('/models') instead of hard-coding them.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Low

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Which models a vendor exposes in its plans is the vendor's decision.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

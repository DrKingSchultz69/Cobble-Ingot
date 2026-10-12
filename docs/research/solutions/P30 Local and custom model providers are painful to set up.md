---
type: "solution"
id: "P30"
title: "Local and custom model providers are painful to set up"
themes: ["models", "setup", "ux"]
problems: 22
upvotes: 678
can_incorporate: "yes"
options: 3
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0096", "A-0025", "A-0003", "A-0274", "A-0131", "A-0132", "A-0134", "A-0561", "A-0164", "A-0216", "A-0171", "A-0217", "A-0305", "A-0320", "A-0247", "A-0250", "A-0252", "A-0357", "A-0405", "A-0409", "A-0411", "A-0477"]
tags: ["research", "solution", "theme/models", "theme/setup", "theme/ux"]
updated: "2026-10-08"
---
# P30 · Local and custom model providers are painful to set up

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/models|models]] · [[themes/setup|setup]] · [[themes/ux|ux]]

> [!question] The problem
> Users must list every local model by hand, can't set a local model as default, company cloud endpoints (Bedrock, Azure) are hard to configure, settings like thinking level are clunky.
>
> **22 problems · 678 👍** · tools: pi (4), roo (3), openhands (3), omp (2), cline (2)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0096 | 243 | opencode | Must manually list every model for local/OpenAI-compatible providers |  | [opencode#6231](https://github.com/anomalyco/opencode/issues/6231) |
| A-0025 | 242 | claude-code | Desktop app can't use a company cloud backend (Bedrock) like the CLI can |  | [claude-code#32668](https://github.com/anthropics/claude-code/issues/32668) |
| A-0003 | 43 | pi | Hooking the agent to local models (llama.cpp/Ollama/LM Studio) needs manual model lists |  | [pi#3357](https://github.com/earendil-works/pi/issues/3357) |
| A-0274 | 18 | kilo | Hard-coded model names block Anthropic-compatible providers |  | [kilocode#3545](https://github.com/Kilo-Org/kilocode/issues/3545) |
| A-0131 | 15 | pi | Can't set a local model as the default |  | [pi#6922](https://github.com/earendil-works/pi/issues/6922) |

> [!example]- All 22 problems in this cluster (click to open)
> - **A-0096** · 243 👍 · opencode: Must manually list every model for local/OpenAI-compatible providers · [opencode#6231](https://github.com/anomalyco/opencode/issues/6231)
> - **A-0025** · 242 👍 · claude-code: Desktop app can't use a company cloud backend (Bedrock) like the CLI can · [claude-code#32668](https://github.com/anthropics/claude-code/issues/32668)
> - **A-0003** · 43 👍 · pi: Hooking the agent to local models (llama.cpp/Ollama/LM Studio) needs manual model lists · [pi#3357](https://github.com/earendil-works/pi/issues/3357)
> - **A-0274** · 18 👍 · kilo: Hard-coded model names block Anthropic-compatible providers · [kilocode#3545](https://github.com/Kilo-Org/kilocode/issues/3545)
> - **A-0131** · 15 👍 · pi: Can't set a local model as the default · [pi#6922](https://github.com/earendil-works/pi/issues/6922)
> - **A-0132** · 15 👍 · pi: Thinking levels not tailored per model · [pi#3208](https://github.com/earendil-works/pi/issues/3208)
> - **A-0134** · 14 👍 · pi: Changing model in one session unexpectedly changes the global default · [pi#5263](https://github.com/earendil-works/pi/issues/5263)
> - **A-0561** · 13 👍 · litellm: No automatic model discovery for custom providers · [litellm#20064](https://github.com/BerriAI/litellm/issues/20064)
> - **A-0164** · 11 👍 · omp: Setting reasoning effort is clunky · [oh-my-pi#2694](https://github.com/can1357/oh-my-pi/issues/2694)
> - **A-0216** · 10 👍 · cline: Can't use an authenticated local model server · [cline#9668](https://github.com/cline/cline/issues/9668)
> - **A-0171** · 9 👍 · omp: Local inference server not recognised · [oh-my-pi#1957](https://github.com/can1357/oh-my-pi/issues/1957)
> - **A-0217** · 9 👍 · cline: Company cloud provider can't be configured in the CLI · [cline#6958](https://github.com/cline/cline/issues/6958)
> - **A-0305** · 8 👍 · continue: Responses from a local model server not detected · [continue#10113](https://github.com/continuedev/continue/issues/10113)
> - **A-0320** · 5 👍 · continue: Local autocomplete broken · [continue#11954](https://github.com/continuedev/continue/issues/11954)
> - **A-0247** · 5 👍 · roo: Hard to see which model each mode uses · [Roo-Code#9921](https://github.com/RooCodeInc/Roo-Code/issues/9921)
> - **A-0250** · 4 👍 · roo: Local model server returns completion errors · [Roo-Code#10684](https://github.com/RooCodeInc/Roo-Code/issues/10684)
> - **A-0252** · 4 👍 · roo: Can't use Anthropic-compatible providers with custom model names · [Roo-Code#9093](https://github.com/RooCodeInc/Roo-Code/issues/9093)
> - **A-0357** · 3 👍 · goose: Company cloud API-key auth not supported · [goose#6577](https://github.com/aaif-goose/goose/issues/6577)
> - **A-0405** · 3 👍 · openhands: Can't set reasoning effort for external agents · [OpenHands#15578](https://github.com/OpenHands/OpenHands/issues/15578)
> - **A-0409** · 2 👍 · openhands: Long local-model requests time out; settings not passed through · [OpenHands#12854](https://github.com/OpenHands/OpenHands/issues/12854)
> - **A-0411** · 2 👍 · openhands: Custom provider URL setup fails with a confusing error · [OpenHands#11608](https://github.com/OpenHands/OpenHands/issues/11608)
> - **A-0477** · 0 👍 · claude-squad: Unclear how to run sessions with a cloud model provider · [claude-squad#311](https://github.com/smtg-ai/claude-squad/issues/311)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Auto-discover local servers

> [!success] ✅ Netheron can build this
> Detect Ollama / LM Studio / llama.cpp / vLLM on standard ports and list their models automatically.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium

### S2 · Provider presets

> [!success] ✅ Netheron can build this
> One-click presets for Bedrock, Vertex, Azure, OpenRouter, z.ai etc.
>
> **Effort:** M (2–5 days) · **Novelty:** Low

### S3 · Per-task model + effort picker

> [!success] ✅ Netheron can build this
> Choose model and reasoning effort per task in the New task form.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Low
> **Already in Netheron:** Model field exists in New task

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

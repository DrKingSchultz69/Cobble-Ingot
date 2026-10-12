---
type: "solution"
id: "P27"
title: "Switching models breaks requests (format/protocol errors)"
themes: ["reliability", "models", "switching"]
problems: 37
upvotes: 665
can_incorporate: "partly"
options: 3
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0027", "A-0271", "A-0534", "A-0383", "A-0541", "A-0544", "A-0128", "A-0211", "A-0212", "A-0551", "A-0557", "A-0556", "A-0560", "A-0243", "A-0150", "A-0332", "A-0296", "A-0306", "A-0230", "A-0335", "A-0240", "A-0340", "A-0341", "A-0319", "A-0395", "A-0248", "A-0255", "A-0251", "A-0249", "A-0344", "A-0358", "A-0259", "A-0360", "A-0431", "A-0266", "A-0270", "A-0443"]
tags: ["research", "solution", "theme/reliability", "theme/models", "theme/switching"]
updated: "2026-10-08"
---
# P27 · Switching models breaks requests (format/protocol errors)

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/reliability|reliability]] · [[themes/models|models]] · [[themes/switching|switching]]

> [!question] The problem
> Mixing or switching models (plan with one, act with another), or routing through gateways, causes 400 errors: missing reasoning fields, thinking signatures, tool formats, extra fields, wrong token limits.
>
> **37 problems · 665 👍** · tools: roo (8), litellm (7), goose (7), cline (4), kilo (2)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0027 | 238 | claude-code | Tool-use concurrency causes API 400 errors that break the conversation |  | [claude-code#8763](https://github.com/anthropics/claude-code/issues/8763) |
| A-0271 | 65 | kilo | Provider-required header missing, breaking requests for many orgs |  | [kilocode#13723](https://github.com/Kilo-Org/kilocode/issues/13723) |
| A-0534 | 52 | litellm | Provider-required header missing, breaking requests for many orgs |  | [litellm#39503](https://github.com/BerriAI/litellm/issues/39503) |
| A-0383 | 32 | zed | A model via a subscription fails after tool calls |  | [zed#43024](https://github.com/zed-industries/zed/issues/43024) |
| A-0541 | 30 | litellm | Coding agent breaks through the gateway with a provider due to thinking format |  | [litellm#20743](https://github.com/BerriAI/litellm/issues/20743) |

> [!example]- All 37 problems in this cluster (click to open)
> - **A-0027** · 238 👍 · claude-code: Tool-use concurrency causes API 400 errors that break the conversation · [claude-code#8763](https://github.com/anthropics/claude-code/issues/8763)
> - **A-0271** · 65 👍 · kilo: Provider-required header missing, breaking requests for many orgs · [kilocode#13723](https://github.com/Kilo-Org/kilocode/issues/13723)
> - **A-0534** · 52 👍 · litellm: Provider-required header missing, breaking requests for many orgs · [litellm#39503](https://github.com/BerriAI/litellm/issues/39503)
> - **A-0383** · 32 👍 · zed: A model via a subscription fails after tool calls · [zed#43024](https://github.com/zed-industries/zed/issues/43024)
> - **A-0541** · 30 👍 · litellm: Coding agent breaks through the gateway with a provider due to thinking format · [litellm#20743](https://github.com/BerriAI/litellm/issues/20743)
> - **A-0544** · 25 👍 · litellm: Model fails in multi-turn because reasoning data is stripped · [litellm#26395](https://github.com/BerriAI/litellm/issues/26395)
> - **A-0128** · 18 👍 · pi: A model breaks with a reasoning-format error on a subscription provider · [pi#4251](https://github.com/earendil-works/pi/issues/4251)
> - **A-0211** · 17 👍 · cline: All models fail with 'not supported' via the IDE's model API · [cline#7228](https://github.com/cline/cline/issues/7228)
> - **A-0212** · 17 👍 · cline: Every request fails via the IDE's model API · [cline#7229](https://github.com/cline/cline/issues/7229)
> - **A-0551** · 16 👍 · litellm: Coding agent requests fail through the gateway because of a beta header · [litellm#19984](https://github.com/BerriAI/litellm/issues/19984)
> - **A-0557** · 14 👍 · litellm: Coding agent hits sporadic schema errors through the gateway · [litellm#16679](https://github.com/BerriAI/litellm/issues/16679)
> - **A-0556** · 14 👍 · litellm: Tools not translated correctly for a model via company cloud · [litellm#15164](https://github.com/BerriAI/litellm/issues/15164)
> - **A-0560** · 13 👍 · litellm: Requests rejected for extra fields when routing · [litellm#23741](https://github.com/BerriAI/litellm/issues/23741)
> - **A-0243** · 9 👍 · roo: A new model fails to call tools in this agent · [Roo-Code#8702](https://github.com/RooCodeInc/Roo-Code/issues/8702)
> - **A-0150** · 8 👍 · pi: Provider rejects requests with a reasoning-field error · [pi#4514](https://github.com/earendil-works/pi/issues/4514)
> - **A-0332** · 8 👍 · goose: A model's reasoning protocol causes 400 errors on new sessions · [goose#10012](https://github.com/aaif-goose/goose/issues/10012)
> - **A-0296** · 8 👍 · kilo: Free model starts working then chokes on tool-call errors · [kilocode#3967](https://github.com/Kilo-Org/kilocode/issues/3967)
> - **A-0306** · 7 👍 · continue: A model fails with a protocol error on tool calls · [continue#8785](https://github.com/continuedev/continue/issues/8785)
> - **A-0230** · 7 👍 · cline: A model returns repeated invalid responses after the first message · [cline#12385](https://github.com/cline/cline/issues/12385)
> - **A-0335** · 6 👍 · goose: Model via compatible provider fails because reasoning isn't handled · [goose#9041](https://github.com/aaif-goose/goose/issues/9041)
> - **A-0240** · 5 👍 · cline: Using different models for plan vs act causes API errors · [cline#7620](https://github.com/cline/cline/issues/7620)
> - **A-0340** · 5 👍 · goose: Thinking mode errors with a model · [goose#8807](https://github.com/aaif-goose/goose/issues/8807)
> - **A-0341** · 5 👍 · goose: Provider intermittently drops reasoning data, breaking tool calls · [goose#9397](https://github.com/aaif-goose/goose/issues/9397)
> - **A-0319** · 5 👍 · continue: Some open models can't call tools · [continue#12131](https://github.com/continuedev/continue/issues/12131)
> - **A-0395** · 4 👍 · openhands: CLI crashes when the model omits a required tool field · [OpenHands#11378](https://github.com/OpenHands/OpenHands/issues/11378)
> - **A-0248** · 4 👍 · roo: Proxy reports the wrong token limit, causing errors · [Roo-Code#8454](https://github.com/RooCodeInc/Roo-Code/issues/8454)
> - **A-0255** · 4 👍 · roo: Model via router returns completion errors · [Roo-Code#10618](https://github.com/RooCodeInc/Roo-Code/issues/10618)
> - **A-0251** · 4 👍 · roo: All models fail with 400 via the IDE's model API · [Roo-Code#8991](https://github.com/RooCodeInc/Roo-Code/issues/8991)
> - **A-0249** · 4 👍 · roo: Model doesn't produce reasoning via a compatible endpoint · [Roo-Code#8547](https://github.com/RooCodeInc/Roo-Code/issues/8547)
> - **A-0344** · 4 👍 · goose: New provider API not supported, causing errors · [goose#5270](https://github.com/aaif-goose/goose/issues/5270)
> - **A-0358** · 3 👍 · goose: Provider rejects tool-use message order · [goose#5998](https://github.com/aaif-goose/goose/issues/5998)
> - **A-0259** · 3 👍 · roo: Persistent schema error with a model · [Roo-Code#9583](https://github.com/RooCodeInc/Roo-Code/issues/9583)
> - **A-0360** · 3 👍 · goose: Tool calls fail mid-session on large payloads · [goose#8272](https://github.com/aaif-goose/goose/issues/8272)
> - **A-0431** · 3 👍 · copilot: Requests with a model fail with 400 · [vscode-copilot-release#14005](https://github.com/microsoft/vscode-copilot-release/issues/14005)
> - **A-0266** · 2 👍 · roo: Mixing models across modes breaks tool calls · [Roo-Code#10075](https://github.com/RooCodeInc/Roo-Code/issues/10075)
> - **A-0270** · 2 👍 · roo: Switching model mid-conversation causes an API error · [Roo-Code#9392](https://github.com/RooCodeInc/Roo-Code/issues/9392)
> - **A-0443** · 1 👍 · copilot: Preview model fails consistently with 400 · [vscode-copilot-release#14143](https://github.com/microsoft/vscode-copilot-release/issues/14143)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Hand off through memory, not raw transcripts

> [!success] ✅ Netheron can build this
> When switching vendors, start a fresh session for the new agent with a summary + decisions from shared memory, instead of replaying another vendor's message format.
>
> **Effort:** none (already exists) · **Novelty:** High
> **Already in Netheron:** Built: hand-off via shared memory (T-M11)

### S2 · Protocol normaliser in the proxy

> [!warning] 🟡 Netheron can partly do this
> Netheron's proxy fixes known incompatibilities (strip/rename fields) per provider.
>
> **Effort:** M (2–5 days) · **Novelty:** Medium

### S3 · Compatibility matrix

> [!success] ✅ Netheron can build this
> Track which agent+model pairs work (from real task results) and steer the router away from broken pairs.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Each provider's API format is theirs.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

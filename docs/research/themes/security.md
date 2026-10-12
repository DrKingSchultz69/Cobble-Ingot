---
type: "research-theme"
theme: "security"
rows: 22
upvotes: 1454
avg_severity: 2.5
generated: "2026-10-08"
tags: ["research", "theme", "theme/security"]
---

# Theme: security

> [!info] Secrets, dangerous commands, permissions, supply chain
> **22** problems · **1454** 👍 · average severity **2.5** / 5 · rank **#15** of 24

Back to [[Pain log]] · [[synthesis]] · [[Research Home]]

## Tools most affected
- litellm: 5
- aider: 5
- continue: 3
- goose: 3
- claude-code: 1
- codex: 1
- opencode: 1
- pi: 1

## Netheron ideas noted while labeling (1)
- **A-0532**: Pin agent/gateway versions, verify before update

## All problems (sorted by 👍)

Checked: ✅ verified by you · 🔁 rechecked by an agent · · not yet

| ID | 👍 | Sev | Tool | Role | Problem | Workaround | Source | Checked |
|---|---|---|---|---|---|---|---|---|
| A-0532 | 797 | 5 | litellm | ? | Gateway package release contained a credential stealer that ran on every Python start (supply-chain attack) |  | [litellm#24512](https://github.com/BerriAI/litellm/issues/24512) | 🔁 |
| A-0032 | 209 | 2 | claude-code | ? | Permission prompts trigger on the wrong part of compound shell commands |  | [claude-code#28240](https://github.com/anthropics/claude-code/issues/28240) | · |
| A-0533 | 137 | 5 | litellm | ? | Package compromised via another tool's supply chain |  | [litellm#24518](https://github.com/BerriAI/litellm/issues/24518) | · |
| A-0062 | 115 | 3 | codex | ? | Can't connect multiple accounts per connector with clear separation |  | [codex#20500](https://github.com/openai/codex/issues/20500) | · |
| A-0118 | 94 | 2 | opencode | ? | No option to skip permission prompts for trusted work |  | [opencode#8463](https://github.com/anomalyco/opencode/issues/8463) | · |
| A-0550 | 17 | 1 | litellm | ? | Can't add skills from private repos |  | [litellm#26071](https://github.com/BerriAI/litellm/issues/26071) | · |
| A-0555 | 15 | 1 | litellm | sec | Wants a specific guardrail built in |  | [litellm#37459](https://github.com/BerriAI/litellm/issues/37459) | · |
| A-0559 | 13 | 1 | litellm | ? | Unexpected dependency pinning change |  | [litellm#25280](https://github.com/BerriAI/litellm/issues/25280) | · |
| A-0140 | 11 | 2 | pi | ? | Can't enable/disable built-in tools in settings |  | [pi#5084](https://github.com/earendil-works/pi/issues/5084) | · |
| A-0309 | 6 | 4 | continue | ? | File-listing tool can read outside the project when auto-approved |  | [continue#8877](https://github.com/continuedev/continue/issues/8877) | · |
| A-0310 | 6 | 3 | continue | ? | Agent lists the filesystem root instead of the project folder |  | [continue#9188](https://github.com/continuedev/continue/issues/9188) | · |
| A-0336 | 6 | 3 | goose | sec | No pre-tool hooks to block secret leaks before commands run |  | [goose#8184](https://github.com/aaif-goose/goose/issues/8184) | · |
| A-0186 | 5 | 3 | aider | ? | No sandbox, so users can't safely let the agent run commands |  | [aider#4679](https://github.com/Aider-AI/aider/issues/4679) | · |
| A-0317 | 5 | 3 | continue | ? | '.' treated as the filesystem root by the list tool |  | [continue#9135](https://github.com/continuedev/continue/issues/9135) | · |
| A-0352 | 4 | 3 | goose | ? | Shell permissions are all-or-nothing; no per-command rules |  | [goose#11399](https://github.com/aaif-goose/goose/issues/11399) | · |
| A-0353 | 4 | 1 | goose | ? | EU provider not offered |  | [goose#12437](https://github.com/aaif-goose/goose/issues/12437) | · |
| A-0398 | 4 | 2 | openhands | ? | Corporate SSL certificates hard to debug |  | [OpenHands#11506](https://github.com/OpenHands/OpenHands/issues/11506) | · |
| A-0189 | 2 | 2 | aider | ? | Package name on PyPI may be squatted (supply-chain risk) |  | [aider#4900](https://github.com/Aider-AI/aider/issues/4900) | · |
| A-0192 | 2 | 1 | aider | ? | Voice mode fails with an undocumented error; wants local-only option |  | [aider#4980](https://github.com/Aider-AI/aider/issues/4980) | · |
| A-0201 | 1 | 3 | aider | ? | Browser/GUI mode listens on all network interfaces by default |  | [aider#4720](https://github.com/Aider-AI/aider/issues/4720) | · |
| A-0210 | 1 | 2 | aider | ? | No safety scan before agent-driven commits/commands |  | [aider#5121](https://github.com/Aider-AI/aider/issues/5121) | · |
| A-0475 | 0 | 2 | claude-squad | ? | Security fix merged but not released, blocking use at work |  | [claude-squad#303](https://github.com/smtg-ai/claude-squad/issues/303) | · |

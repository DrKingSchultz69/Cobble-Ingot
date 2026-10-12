---
type: "research-theme"
theme: "accounts"
rows: 31
upvotes: 5069
avg_severity: 3
generated: "2026-10-08"
tags: ["research", "theme", "theme/accounts"]
---

# Theme: accounts

> [!info] Login, verification, multiple accounts or subscriptions
> **31** problems · **5069** 👍 · average severity **3.0** / 5 · rank **#2** of 24

Back to [[Pain log]] · [[synthesis]] · [[Research Home]]

## Tools most affected
- claude-code: 6
- goose: 4
- kilo: 3
- litellm: 3
- zed: 3
- opencode: 2
- codex: 2
- gemini-cli: 2

## Workarounds people use (1)
- **A-0006** (868 👍): Separate browser profiles instead of the desktop app

## Netheron ideas noted while labeling (3)
- **A-0006**: Netheron already juggles several subscriptions; add named account profiles per agent
- **A-0008**: Route each agent through the subscription it's allowed to use; warn before a ToS conflict
- **A-0536**: Netheron: several subscriptions per vendor with rotation

## All problems (sorted by 👍)

Checked: ✅ verified by you · 🔁 rechecked by an agent · · not yet

| ID | 👍 | Sev | Tool | Role | Problem | Workaround | Source | Checked |
|---|---|---|---|---|---|---|---|---|
| A-0006 | 868 | 3 | claude-code | ? | Switching between work and personal accounts means signing out, re-entering credentials and losing context, several times a day | Separate browser profiles instead of the desktop app | [claude-code#18435](https://github.com/anthropics/claude-code/issues/18435) | 🔁 |
| A-0007 | 820 | 4 | claude-code | ? | Sign-up phone verification fails with useless errors and blocks new users for hours |  | [claude-code#34229](https://github.com/anthropics/claude-code/issues/34229) | 🔁 |
| A-0008 | 795 | 4 | claude-code | ? | Provider blocked using the Max subscription in a third-party harness (OpenCode); users threaten to cancel |  | [claude-code#17118](https://github.com/anthropics/claude-code/issues/17118) | 🔁 |
| A-0009 | 750 | 3 | claude-code | ? | Mobile app can't hold work and personal accounts at once, so phone remote control of work sessions needs sign-out/sign-in |  | [claude-code#36151](https://github.com/anthropics/claude-code/issues/36151) | 🔁 |
| A-0017 | 402 | 3 | claude-code | ? | Can't connect multiple accounts of the same connector (e.g. two GitHub orgs) |  | [claude-code#27302](https://github.com/anthropics/claude-code/issues/27302) | · |
| A-0094 | 357 | 4 | opencode | ? | Subscription login in a third-party harness suddenly stopped working |  | [opencode#7410](https://github.com/anomalyco/opencode/issues/7410) | · |
| A-0025 | 242 | 3 | claude-code | ? | Desktop app can't use a company cloud backend (Bedrock) like the CLI can |  | [claude-code#32668](https://github.com/anthropics/claude-code/issues/32668) | · |
| A-0056 | 138 | 4 | codex | ? | Phone verification breaks login on a new device |  | [codex#20161](https://github.com/openai/codex/issues/20161) | · |
| A-0062 | 115 | 3 | codex | ? | Can't connect multiple accounts per connector with clear separation |  | [codex#20500](https://github.com/openai/codex/issues/20500) | · |
| A-0115 | 101 | 3 | opencode | ? | Listed model returns 'not found' with subscription login |  | [opencode#36140](https://github.com/anomalyco/opencode/issues/36140) | · |
| A-0069 | 65 | 4 | gemini-cli | ? | Paying subscriber blocked from API access despite correct plan detection |  | [gemini-cli#24517](https://github.com/google-gemini/gemini-cli/issues/24517) | · |
| A-0271 | 65 | 3 | kilo | ? | Provider-required header missing, breaking requests for many orgs |  | [kilocode#13723](https://github.com/Kilo-Org/kilocode/issues/13723) | · |
| A-0534 | 52 | 3 | litellm | ? | Provider-required header missing, breaking requests for many orgs |  | [litellm#39503](https://github.com/BerriAI/litellm/issues/39503) | · |
| A-0536 | 45 | 3 | litellm | ? | Only one ChatGPT subscription account per gateway |  | [litellm#23777](https://github.com/BerriAI/litellm/issues/23777) | · |
| A-0372 | 40 | 3 | zed | ? | Only one model available via an enterprise subscription |  | [zed#49691](https://github.com/zed-industries/zed/issues/49691) | · |
| A-0374 | 37 | 2 | zed | ? | Subscription models missing from the picker |  | [zed#47540](https://github.com/zed-industries/zed/issues/47540) | · |
| A-0385 | 30 | 3 | zed | ? | Sign-in button for a provider doesn't work |  | [zed#47352](https://github.com/zed-industries/zed/issues/47352) | · |
| A-0542 | 28 | 2 | litellm | em | SSO login limited to 5 users on the standard plan |  | [litellm#25762](https://github.com/BerriAI/litellm/issues/25762) | · |
| A-0084 | 27 | 4 | gemini-cli | ? | Can't complete sign-in in the VS Code extension |  | [gemini-cli#10918](https://github.com/google-gemini/gemini-cli/issues/10918) | · |
| A-0241 | 18 | 4 | roo | ? | Subscription credential refused outside the official client |  | [Roo-Code#10566](https://github.com/RooCodeInc/Roo-Code/issues/10566) | · |
| A-0286 | 10 | 3 | kilo | ? | Paid subscription quota not recognised; stuck on free-tier rate limits |  | [kilocode#3978](https://github.com/Kilo-Org/kilocode/issues/3978) | · |
| A-0491 | 10 | 2 | vibe-kanban | ? | Must log in to use local features |  | [vibe-kanban#2952](https://github.com/BloopAI/vibe-kanban/issues/2952) | · |
| A-0291 | 9 | 4 | kilo | ? | Sign-in fails with a 403 |  | [kilocode#8148](https://github.com/Kilo-Org/kilocode/issues/8148) | · |
| A-0148 | 8 | 1 | pi | ? | A subscription provider is missing |  | [pi#1757](https://github.com/earendil-works/pi/issues/1757) | · |
| A-0175 | 8 | 2 | omp | ? | Can't use another tool's subscription models in this agent |  | [oh-my-pi#1666](https://github.com/can1357/oh-my-pi/issues/1666) | · |
| A-0334 | 6 | 2 | goose | ? | Can't use another tool's subscription as a provider |  | [goose#8381](https://github.com/aaif-goose/goose/issues/8381) | · |
| A-0392 | 6 | 2 | openhands | ? | Can't complete OAuth for MCP servers from the GUI |  | [OpenHands#11881](https://github.com/OpenHands/OpenHands/issues/11881) | · |
| A-0337 | 5 | 3 | goose | ? | Sign-in stuck on Windows desktop |  | [goose#6957](https://github.com/aaif-goose/goose/issues/6957) | · |
| A-0339 | 5 | 3 | goose | ? | OAuth fails for paid accounts |  | [goose#8894](https://github.com/aaif-goose/goose/issues/8894) | · |
| A-0429 | 4 | 3 | copilot | ? | Can't use a different vendor's agent with an enterprise subscription |  | [vscode-copilot-release#14167](https://github.com/microsoft/vscode-copilot-release/issues/14167) | · |
| A-0357 | 3 | 2 | goose | ? | Company cloud API-key auth not supported |  | [goose#6577](https://github.com/aaif-goose/goose/issues/6577) | · |

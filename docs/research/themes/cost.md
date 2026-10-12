---
type: "research-theme"
theme: "cost"
rows: 42
upvotes: 4738
avg_severity: 2.9
generated: "2026-10-08"
tags: ["research", "theme", "theme/cost"]
---

# Theme: cost

> [!info] Surprise cost, credits, usage limits, rate limits
> **42** problems · **4738** 👍 · average severity **2.9** / 5 · rank **#3** of 24

Back to [[Pain log]] · [[synthesis]] · [[Research Home]]

## Tools most affected
- claude-code: 7
- codex: 6
- omp: 4
- opencode: 3
- gemini-cli: 3
- litellm: 3
- zed: 2
- copilot: 2

## Netheron ideas noted while labeling (17)
- **A-0010**: Budget dial + live quota view across all subscriptions
- **A-0023**: Netheron proxy already sees cache reads/writes: alert when cache efficiency drops
- **A-0033**: Stuck/limit rescue: hand the task to another subscription's agent with context
- **A-0048**: Netheron live usage view per task
- **A-0050**: Router picks model per subtask
- **A-0053**: Night Shift: schedule work around limit resets
- **A-0101**: Unified quota view across all subscriptions
- **A-0536**: Netheron: several subscriptions per vendor with rotation
- **A-0378**: Line/hash-anchored edits
- **A-0539**: Netheron proxy tracks cost for every call
- **A-0421**: Router per subtask
- **A-0170**: Router per subtask
- **A-0346**: Budget Dial with per-task caps
- **A-0430**: Quota + reset-time view across subscriptions
- **A-0265**: Fork a task to another agent with shared memory
- **A-0268**: Proxy-level cost alerts per version/agent
- **A-0523**: Netheron shows chosen model + reason per task

## All problems (sorted by 👍)

Checked: ✅ verified by you · 🔁 rechecked by an agent · · not yet

| ID | 👍 | Sev | Tool | Role | Problem | Workaround | Source | Checked |
|---|---|---|---|---|---|---|---|---|
| A-0010 | 695 | 4 | claude-code | ? | Usage limits suddenly hit after 2 hours on the top plan, after months without hitting them; no answer from the vendor |  | [claude-code#16157](https://github.com/anthropics/claude-code/issues/16157) | 🔁 |
| A-0011 | 500 | 3 | claude-code | ? | Subscriptions only in USD: forex fees, 18% GST and no UPI make it much more expensive in India than competitors |  | [claude-code#17432](https://github.com/anthropics/claude-code/issues/17432) | 🔁 |
| A-0013 | 476 | 4 | claude-code | ? | 5-hour plan window exhausted in 1-2 hours with the same workload as before |  | [claude-code#38335](https://github.com/anthropics/claude-code/issues/38335) | 🔁 |
| A-0041 | 364 | 4 | codex | ? | Rate-limit cost per token jumped 10-20x, draining the budget in 2-3 prompts |  | [codex#28879](https://github.com/openai/codex/issues/28879) | · |
| A-0044 | 285 | 3 | codex | ? | Tokens burn very fast in the IDE extension |  | [codex#14593](https://github.com/openai/codex/issues/14593) | · |
| A-0023 | 243 | 4 | claude-code | ? | Prompt-cache lifetime silently shortened, inflating quota use and cost |  | [claude-code#46829](https://github.com/anthropics/claude-code/issues/46829) | · |
| A-0029 | 215 | 3 | claude-code | ? | New version silently uses ~20K more cache tokens per request |  | [claude-code#46917](https://github.com/anthropics/claude-code/issues/46917) | · |
| A-0030 | 213 | 4 | claude-code | ? | A string in git history silently routes requests to paid extra billing instead of the plan |  | [claude-code#53262](https://github.com/anthropics/claude-code/issues/53262) | · |
| A-0033 | 209 | 4 | claude-code | ? | Work stops dead when the session limit is reached; can't continue |  | [claude-code#13354](https://github.com/anthropics/claude-code/issues/13354) | · |
| A-0048 | 202 | 2 | codex | ? | No status line showing tokens, model and limits while working |  | [codex#17827](https://github.com/openai/codex/issues/17827) | · |
| A-0049 | 176 | 2 | codex | ? | Context/token usage indicator removed from the desktop app |  | [codex#23794](https://github.com/openai/codex/issues/23794) | · |
| A-0050 | 176 | 3 | codex | ? | Can't choose which model subagents use; all forced to the expensive one |  | [codex#31814](https://github.com/openai/codex/issues/31814) | · |
| A-0053 | 166 | 3 | codex | ? | Short (5-hour) usage windows interrupt work |  | [codex#34035](https://github.com/openai/codex/issues/34035) | · |
| A-0101 | 138 | 3 | opencode | ? | Can't check remaining plan usage/balance programmatically |  | [opencode#16017](https://github.com/anomalyco/opencode/issues/16017) | · |
| A-0102 | 138 | 2 | opencode | ? | Can't see how much of the context window is used |  | [opencode#6152](https://github.com/anomalyco/opencode/issues/6152) | · |
| A-0120 | 84 | 2 | opencode | ? | Plan limits not adjusted when the underlying model got cheaper |  | [opencode#28846](https://github.com/anomalyco/opencode/issues/28846) | · |
| A-0069 | 65 | 4 | gemini-cli | ? | Paying subscriber blocked from API access despite correct plan detection |  | [gemini-cli#24517](https://github.com/google-gemini/gemini-cli/issues/24517) | · |
| A-0536 | 45 | 3 | litellm | ? | Only one ChatGPT subscription account per gateway |  | [litellm#23777](https://github.com/BerriAI/litellm/issues/23777) | · |
| A-0074 | 38 | 4 | gemini-cli | ? | 'Usage limit reached' shown despite only 1-8% usage |  | [gemini-cli#28761](https://github.com/google-gemini/gemini-cli/issues/28761) | · |
| A-0077 | 36 | 2 | gemini-cli | ? | Can't choose priority pay-as-you-go tier via the company cloud |  | [gemini-cli#21390](https://github.com/google-gemini/gemini-cli/issues/21390) | · |
| A-0376 | 36 | 2 | zed | student | Models missing for free/student plans after a provider change |  | [zed#60029](https://github.com/zed-industries/zed/issues/60029) | · |
| A-0378 | 33 | 3 | zed | ? | Agent rewrites the whole file instead of changing single lines |  | [zed#42074](https://github.com/zed-industries/zed/issues/42074) | · |
| A-0539 | 32 | 3 | litellm | ? | Cost tracking broken for a provider |  | [litellm#20412](https://github.com/BerriAI/litellm/issues/20412) | · |
| A-0542 | 28 | 2 | litellm | em | SSO login limited to 5 users on the standard plan |  | [litellm#25762](https://github.com/BerriAI/litellm/issues/25762) | · |
| A-0153 | 26 | 3 | omp | ? | 40K-token system prompt is too heavy for local models |  | [oh-my-pi#1734](https://github.com/can1357/oh-my-pi/issues/1734) | · |
| A-0155 | 19 | 3 | omp | ? | Wrong 'quota exhausted' errors while quota remains |  | [oh-my-pi#11689](https://github.com/can1357/oh-my-pi/issues/11689) | · |
| A-0421 | 17 | 3 | copilot | ? | Subagents always use the main model; can't pick a cheaper one |  | [vscode-copilot-release#14138](https://github.com/microsoft/vscode-copilot-release/issues/14138) | · |
| A-0138 | 13 | 2 | pi | ? | System prompt change makes the agent run needless shell commands |  | [pi#7128](https://github.com/earendil-works/pi/issues/7128) | · |
| A-0145 | 10 | 3 | pi | ? | Prompt cache not working with a coding plan, burning the session fast |  | [pi#6083](https://github.com/earendil-works/pi/issues/6083) | · |
| A-0215 | 10 | 3 | cline | ? | CLI ignores the configured model and uses another |  | [cline#6936](https://github.com/cline/cline/issues/6936) | · |
| A-0286 | 10 | 3 | kilo | ? | Paid subscription quota not recognised; stuck on free-tier rate limits |  | [kilocode#3978](https://github.com/Kilo-Org/kilocode/issues/3978) | · |
| A-0170 | 9 | 2 | omp | ? | Can't choose the model for each sub-task |  | [oh-my-pi#7982](https://github.com/can1357/oh-my-pi/issues/7982) | · |
| A-0294 | 9 | 3 | kilo | ? | Model hits its output limit while reasoning and produces nothing usable |  | [kilocode#10558](https://github.com/Kilo-Org/kilocode/issues/10558) | · |
| A-0176 | 8 | 3 | omp | ? | Incorrect quota-exhausted errors persist after a fix |  | [oh-my-pi#12655](https://github.com/can1357/oh-my-pi/issues/12655) | · |
| A-0346 | 4 | 4 | goose | ? | Simple requests consume a huge number of premium requests |  | [goose#6915](https://github.com/aaif-goose/goose/issues/6915) | · |
| A-0430 | 4 | 3 | copilot | ? | Only a generic 'rate limited' error; no usage or reset time shown |  | [vscode-copilot-release#14168](https://github.com/microsoft/vscode-copilot-release/issues/14168) | · |
| A-0265 | 2 | 2 | roo | ? | Can't fork a conversation, so expensive loaded context is lost or duplicated |  | [Roo-Code#10049](https://github.com/RooCodeInc/Roo-Code/issues/10049) | · |
| A-0268 | 2 | 4 | roo | ? | An update caused a big jump in usage costs |  | [Roo-Code#10374](https://github.com/RooCodeInc/Roo-Code/issues/10374) | · |
| A-0203 | 1 | 3 | aider | ? | Setup needs a paid key upfront, outdated model list, settings lost on exit (accessibility user) |  | [aider#4781](https://github.com/Aider-AI/aider/issues/4781) | · |
| A-0207 | 1 | 2 | aider | ? | Prompt caching appears not to work |  | [aider#4676](https://github.com/Aider-AI/aider/issues/4676) | · |
| A-0514 | 0 | 2 | crystal | ? | Can't set custom env vars for the agent (to use cheaper compatible models) |  | [crystal#203](https://github.com/stravu/crystal/issues/203) | · |
| A-0523 | 0 | 2 | crystal | ? | Can't see which model 'auto' actually used |  | [crystal#219](https://github.com/stravu/crystal/issues/219) | · |

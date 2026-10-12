---
type: "research-log"
rows: 561
labeled: 561
verified: 0
rechecked: 20
generated: "2026-10-08"
tags: ["research", "pain-log"]
---

# Pain log

> [!note] Generated from `pain-log.csv` on 2026-10-08
> Don't edit this note; edit the CSV and run `node scripts/research/export-obsidian.mjs`.

Back to [[Research Home]] · method: [[README]] · themes explained: [[synthesis]]

## Totals
- **561** problems · labeled **561** · verified by you **0** · rechecked by agent **20**
- Sources: github 561

## Themes ranked (👍 + 5 × problems)

| # | Theme | Problems | 👍 | Avg severity | What it is |
|---|---|---|---|---|---|
| 1 | [[themes/trust\|trust]] | 51 | 7815 | 3.3 | Wrong or unsafe edits, silent changes; users have to double-check everything |
| 2 | [[themes/accounts\|accounts]] | 31 | 5069 | 3.0 | Login, verification, multiple accounts or subscriptions |
| 3 | [[themes/cost\|cost]] | 42 | 4738 | 2.9 | Surprise cost, credits, usage limits, rate limits |
| 4 | [[themes/ux\|ux]] | 87 | 4496 | 1.6 | Interface annoyances |
| 5 | [[themes/platform\|platform]] | 37 | 4107 | 2.4 | OS / IDE support (Linux, Windows, Intel Mac, JetBrains…) |
| 6 | [[themes/quality\|quality]] | 18 | 3769 | 2.8 | Model/agent output got worse, ignores instructions, edits badly |
| 7 | [[themes/control\|control]] | 50 | 3539 | 2.3 | Undo, interrupt, queue, approvals, asking the user |
| 8 | [[themes/reliability\|reliability]] | 162 | 2436 | 2.7 | Errors, hangs, crashes, broken after an update |
| 9 | [[themes/remote\|remote]] | 24 | 2958 | 2.4 | Can't watch or steer agents away from the desk |
| 10 | [[themes/setup\|setup]] | 91 | 2506 | 2.1 | Install, config, auth, Windows/WSL, environment trouble |
| 11 | [[themes/switching\|switching]] | 37 | 2453 | 2.6 | Switching tools or models loses context, setup or time |
| 12 | [[themes/context\|context]] | 34 | 2041 | 2.3 | Agent forgets or misses context (decisions, files, other repos) |
| 13 | [[themes/models\|models]] | 96 | 1722 | 2.0 | Model missing or unsupported, provider-format errors |
| 14 | [[themes/performance\|performance]] | 25 | 1949 | 2.7 | Slow start, CPU/RAM/disk heavy, UI lag |
| 15 | [[themes/security\|security]] | 22 | 1454 | 2.5 | Secrets, dangerous commands, permissions, supply chain |
| 16 | [[themes/standards\|standards]] | 20 | 1175 | 1.6 | AGENTS.md, skills, hooks, protocols differ between agents |
| 17 | [[themes/review\|review]] | 18 | 1093 | 2.4 | Hard to review or see what the agent changed |
| 18 | [[themes/parallel\|parallel]] | 28 | 924 | 2.0 | Running several agents at once: conflicts, chaos |
| 19 | [[themes/loops\|loops]] | 11 | 277 | 3.2 | Agent loops, retries, gets stuck, says done when it isn't |
| 20 | [[themes/not-a-pain\|not-a-pain]] | 6 | 276 | 1.0 | Not a real problem (announcements, empty, spam) |
| 21 | [[themes/learning\|learning]] | 10 | 54 | 1.5 | Over-reliance, not learning, confusing docs |
| 22 | [[themes/infra\|infra]] | 4 | 25 | 2.0 | CI, cloud, Terraform, Kubernetes, production risk |
| 23 | [[themes/design\|design]] | 3 | 7 | 2.0 | Design to code fidelity, visual checks |
| 24 | [[themes/data\|data]] | 1 | 0 | 2.0 | Notebooks, SQL correctness, data privacy |

## Top 30 problems by 👍

| ID | 👍 | Sev | Tool | Problem | Themes | Workaround | Source | Checked |
|---|---|---|---|---|---|---|---|---|
| A-0004 | 2072 | 5 | claude-code | Agent quality regressed after an update: ignores instructions, picks wrong 'simplest fixes', claims done when it isn't | [[themes/quality\|quality]] [[themes/trust\|trust]] | Users keep rewriting their CLAUDE.md instructions to counteract it | [claude-code#42796](https://github.com/anthropics/claude-code/issues/42796) | 🔁 |
| A-0005 | 1186 | 1 | claude-code | A loved companion feature was removed with no changelog or notice | [[themes/trust\|trust]] [[themes/ux\|ux]] |  | [claude-code#45596](https://github.com/anthropics/claude-code/issues/45596) | 🔁 |
| A-0034 | 953 | 3 | codex | No desktop app for Linux (the macOS app also drains battery) | [[themes/platform\|platform]] |  | [codex#11023](https://github.com/openai/codex/issues/11023) | 🔁 |
| A-0006 | 868 | 3 | claude-code | Switching between work and personal accounts means signing out, re-entering credentials and losing context, several times a day | [[themes/accounts\|accounts]] | Separate browser profiles instead of the desktop app | [claude-code#18435](https://github.com/anthropics/claude-code/issues/18435) | 🔁 |
| A-0007 | 820 | 4 | claude-code | Sign-up phone verification fails with useless errors and blocks new users for hours | [[themes/accounts\|accounts]] [[themes/setup\|setup]] |  | [claude-code#34229](https://github.com/anthropics/claude-code/issues/34229) | 🔁 |
| A-0532 | 797 | 5 | litellm | Gateway package release contained a credential stealer that ran on every Python start (supply-chain attack) | [[themes/security\|security]] [[themes/trust\|trust]] |  | [litellm#24512](https://github.com/BerriAI/litellm/issues/24512) | 🔁 |
| A-0008 | 795 | 4 | claude-code | Provider blocked using the Max subscription in a third-party harness (OpenCode); users threaten to cancel | [[themes/switching\|switching]] [[themes/accounts\|accounts]] |  | [claude-code#17118](https://github.com/anthropics/claude-code/issues/17118) | 🔁 |
| A-0009 | 750 | 3 | claude-code | Mobile app can't hold work and personal accounts at once, so phone remote control of work sessions needs sign-out/sign-in | [[themes/accounts\|accounts]] [[themes/remote\|remote]] |  | [claude-code#36151](https://github.com/anthropics/claude-code/issues/36151) | 🔁 |
| A-0010 | 695 | 4 | claude-code | Usage limits suddenly hit after 2 hours on the top plan, after months without hitting them; no answer from the vendor | [[themes/cost\|cost]] [[themes/trust\|trust]] |  | [claude-code#16157](https://github.com/anthropics/claude-code/issues/16157) | 🔁 |
| A-0035 | 693 | 3 | codex | Desktop app only works on local projects; can't develop on remote hosts (SSH, cloud machines) | [[themes/remote\|remote]] [[themes/platform\|platform]] | Keep using VS Code Remote SSH instead of the app | [codex#10450](https://github.com/openai/codex/issues/10450) | 🔁 |
| A-0036 | 502 | 3 | codex | Without LSP diagnostics the agent produces edits that fail type-checks/builds, forcing repeated build-test cycles | [[themes/context\|context]] [[themes/quality\|quality]] |  | [codex#8745](https://github.com/openai/codex/issues/8745) | 🔁 |
| A-0011 | 500 | 3 | claude-code | Subscriptions only in USD: forex fees, 18% GST and no UPI make it much more expensive in India than competitors | [[themes/cost\|cost]] |  | [claude-code#17432](https://github.com/anthropics/claude-code/issues/17432) | 🔁 |
| A-0012 | 498 | 3 | claude-code | No official Linux desktop app, so plugin work needs a different OS | [[themes/platform\|platform]] | Unofficial builds reverse-engineered from the Windows app | [claude-code#65697](https://github.com/anthropics/claude-code/issues/65697) | 🔁 |
| A-0013 | 476 | 4 | claude-code | 5-hour plan window exhausted in 1-2 hours with the same workload as before | [[themes/cost\|cost]] [[themes/trust\|trust]] |  | [claude-code#38335](https://github.com/anthropics/claude-code/issues/38335) | 🔁 |
| A-0037 | 474 | 4 | codex | Agent deleted or changed uncommitted files and there's no /undo any more; users lost work | [[themes/control\|control]] [[themes/trust\|trust]] |  | [codex#9203](https://github.com/openai/codex/issues/9203) | 🔁 |
| A-0014 | 460 | 3 | claude-code | No IDE plugin for their IDE: no integrated diff, no view of open files or compiler errors, constant alt-tabbing | [[themes/platform\|platform]] [[themes/review\|review]] | Run the CLI in a separate terminal and copy-paste errors by hand | [claude-code#15942](https://github.com/anthropics/claude-code/issues/15942) | 🔁 |
| A-0038 | 450 | 4 | codex | Agent's local logs wrote ~37 TB in 21 days, wearing out the SSD | [[themes/performance\|performance]] | Quit the agent and delete its log database | [codex#28224](https://github.com/openai/codex/issues/28224) | 🔁 |
| A-0015 | 440 | 3 | claude-code | New model's writing is padded with jargon and tics, ignores style instructions; users consider switching provider | [[themes/quality\|quality]] | Pipe the output through another model to rewrite it plainly | [claude-code#77136](https://github.com/anthropics/claude-code/issues/77136) | 🔁 |
| A-0039 | 411 | 3 | codex | Can't control the agent on a desktop PC from a phone app | [[themes/remote\|remote]] | Tailscale VPN + an SSH app + tmux | [codex#9224](https://github.com/openai/codex/issues/9224) | 🔁 |
| A-0016 | 403 | 3 | claude-code | Agent ignores the shared AGENTS.md / .agents/skills standard; 3,000+ upvotes over 7 months with no vendor reply | [[themes/standards\|standards]] [[themes/switching\|switching]] |  | [claude-code#31005](https://github.com/anthropics/claude-code/issues/31005) | 🔁 |
| A-0017 | 402 | 3 | claude-code | Can't connect multiple accounts of the same connector (e.g. two GitHub orgs) | [[themes/accounts\|accounts]] |  | [claude-code#27302](https://github.com/anthropics/claude-code/issues/27302) | · |
| A-0040 | 397 | 3 | codex | Desktop app triggers runaway CPU and memory use on macOS | [[themes/performance\|performance]] |  | [codex#25719](https://github.com/openai/codex/issues/25719) | · |
| A-0018 | 388 | 3 | claude-code | Agent stops waiting for the user's answer after 60 s and continues without it | [[themes/control\|control]] [[themes/remote\|remote]] |  | [claude-code#73125](https://github.com/anthropics/claude-code/issues/73125) | · |
| A-0041 | 364 | 4 | codex | Rate-limit cost per token jumped 10-20x, draining the budget in 2-3 prompts | [[themes/cost\|cost]] [[themes/trust\|trust]] |  | [codex#28879](https://github.com/openai/codex/issues/28879) | · |
| A-0094 | 357 | 4 | opencode | Subscription login in a third-party harness suddenly stopped working | [[themes/accounts\|accounts]] [[themes/switching\|switching]] |  | [opencode#7410](https://github.com/anomalyco/opencode/issues/7410) | · |
| A-0019 | 299 | 2 | claude-code | Copying text from the terminal UI includes unwanted indentation and spaces | [[themes/ux\|ux]] |  | [claude-code#18170](https://github.com/anthropics/claude-code/issues/18170) | · |
| A-0042 | 293 | 2 | codex | No desktop app for Intel Macs | [[themes/platform\|platform]] |  | [codex#10410](https://github.com/openai/codex/issues/10410) | · |
| A-0043 | 289 | 3 | codex | Suspected hidden reasoning cap degrades quality on complex tasks | [[themes/quality\|quality]] [[themes/trust\|trust]] |  | [codex#30364](https://github.com/openai/codex/issues/30364) | · |
| A-0020 | 286 | 2 | claude-code | Desktop window stays always-on-top on Windows with no setting to turn it off | [[themes/ux\|ux]] [[themes/platform\|platform]] |  | [claude-code#85891](https://github.com/anthropics/claude-code/issues/85891) | · |
| A-0044 | 285 | 3 | codex | Tokens burn very fast in the IDE extension | [[themes/cost\|cost]] |  | [codex#14593](https://github.com/openai/codex/issues/14593) | · |

## By tool
- pi: 30
- claude-code: 30
- codex: 30
- gemini-cli: 30
- opencode: 30
- omp: 30
- aider: 30
- cline: 30
- roo: 30
- kilo: 30
- continue: 30
- goose: 30
- zed: 30
- openhands: 30
- copilot: 30
- claude-squad: 30
- vibe-kanban: 30
- litellm: 30
- crystal: 21

## By role
- unknown (?): 547
- student: 3
- sec: 2
- devops: 2
- mob: 1
- des: 1
- pm: 1
- da: 1
- fe: 1
- em: 1
- sre: 1

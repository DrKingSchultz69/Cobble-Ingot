---
type: "research-theme"
theme: "switching"
rows: 37
upvotes: 2453
avg_severity: 2.6
generated: "2026-10-08"
tags: ["research", "theme", "theme/switching"]
---

# Theme: switching

> [!info] Switching tools or models loses context, setup or time
> **37** problems · **2453** 👍 · average severity **2.6** / 5 · rank **#11** of 24

Back to [[Pain log]] · [[synthesis]] · [[Research Home]]

## Tools most affected
- vibe-kanban: 6
- litellm: 4
- roo: 4
- opencode: 3
- omp: 3
- claude-code: 2
- gemini-cli: 2
- zed: 2

## Netheron ideas noted while labeling (5)
- **A-0008**: Route each agent through the subscription it's allowed to use; warn before a ToS conflict
- **A-0016**: Netheron shared memory/skills fed to every agent regardless of its file convention
- **A-0110**: Cross-vendor failover (Netheron already does 429 failover)
- **A-0240**: Netheron hands off between vendors via memory, not raw transcripts
- **A-0260**: Netheron: one skills store fed to every agent

## All problems (sorted by 👍)

Checked: ✅ verified by you · 🔁 rechecked by an agent · · not yet

| ID | 👍 | Sev | Tool | Role | Problem | Workaround | Source | Checked |
|---|---|---|---|---|---|---|---|---|
| A-0008 | 795 | 4 | claude-code | ? | Provider blocked using the Max subscription in a third-party harness (OpenCode); users threaten to cancel |  | [claude-code#17118](https://github.com/anthropics/claude-code/issues/17118) | 🔁 |
| A-0016 | 403 | 3 | claude-code | ? | Agent ignores the shared AGENTS.md / .agents/skills standard; 3,000+ upvotes over 7 months with no vendor reply |  | [claude-code#31005](https://github.com/anthropics/claude-code/issues/31005) | 🔁 |
| A-0094 | 357 | 4 | opencode | ? | Subscription login in a third-party harness suddenly stopped working |  | [opencode#7410](https://github.com/anomalyco/opencode/issues/7410) | · |
| A-0064 | 165 | 2 | gemini-cli | ? | Agent lacks the 'skills' extension feature other agents have |  | [gemini-cli#11506](https://github.com/google-gemini/gemini-cli/issues/11506) | · |
| A-0361 | 158 | 3 | zed | ? | Editor lacks the Agent Skills standard |  | [zed#49057](https://github.com/zed-industries/zed/issues/49057) | · |
| A-0103 | 132 | 2 | opencode | ? | Missing 'skills' (lazily loaded instructions) that another agent has |  | [opencode#3235](https://github.com/anomalyco/opencode/issues/3235) | · |
| A-0110 | 119 | 3 | opencode | ? | No automatic fallback to a different model when one fails |  | [opencode#7602](https://github.com/anomalyco/opencode/issues/7602) | · |
| A-0369 | 43 | 3 | zed | ? | External agent integration broke after the agent auto-updated |  | [zed#43025](https://github.com/zed-industries/zed/issues/43025) | · |
| A-0078 | 35 | 3 | gemini-cli | ? | Tool being replaced by another product; unclear if it stays open source |  | [gemini-cli#27304](https://github.com/google-gemini/gemini-cli/issues/27304) | · |
| A-0541 | 30 | 3 | litellm | ? | Coding agent breaks through the gateway with a provider due to thinking format |  | [litellm#20743](https://github.com/BerriAI/litellm/issues/20743) | · |
| A-0273 | 20 | 3 | kilo | ? | An integration users relied on was removed in an update |  | [kilocode#5460](https://github.com/Kilo-Org/kilocode/issues/5460) | · |
| A-0241 | 18 | 4 | roo | ? | Subscription credential refused outside the official client |  | [Roo-Code#10566](https://github.com/RooCodeInc/Roo-Code/issues/10566) | · |
| A-0551 | 16 | 3 | litellm | ? | Coding agent requests fail through the gateway because of a beta header |  | [litellm#19984](https://github.com/BerriAI/litellm/issues/19984) | · |
| A-0486 | 14 | 4 | vibe-kanban | ? | Company shutting down; cloud-dependent features need self-hosting and export |  | [vibe-kanban#3396](https://github.com/BloopAI/vibe-kanban/issues/3396) | · |
| A-0557 | 14 | 3 | litellm | ? | Coding agent hits sporadic schema errors through the gateway |  | [litellm#16679](https://github.com/BerriAI/litellm/issues/16679) | · |
| A-0560 | 13 | 2 | litellm | ? | Requests rejected for extra fields when routing |  | [litellm#23741](https://github.com/BerriAI/litellm/issues/23741) | · |
| A-0285 | 11 | 1 | kilo | ? | Settings not carried over between the extension and the CLI |  | [kilocode#3063](https://github.com/Kilo-Org/kilocode/issues/3063) | · |
| A-0489 | 11 | 1 | vibe-kanban | ? | Another agent CLI not supported |  | [vibe-kanban#1708](https://github.com/BloopAI/vibe-kanban/issues/1708) | · |
| A-0182 | 10 | 3 | aider | ? | Maintainer disappeared; users unsure whether to keep relying on the tool |  | [aider#4613](https://github.com/Aider-AI/aider/issues/4613) | · |
| A-0169 | 9 | 3 | omp | ? | Latest model blocked unless the official client version is used |  | [oh-my-pi#12870](https://github.com/can1357/oh-my-pi/issues/12870) | · |
| A-0424 | 9 | 2 | copilot | ? | Chat history not shared between two editions of the editor |  | [vscode-copilot-release#14118](https://github.com/microsoft/vscode-copilot-release/issues/14118) | · |
| A-0175 | 8 | 2 | omp | ? | Can't use another tool's subscription models in this agent |  | [oh-my-pi#1666](https://github.com/can1357/oh-my-pi/issues/1666) | · |
| A-0177 | 8 | 2 | omp | ? | Free model works in one tool but is refused in another |  | [oh-my-pi#12306](https://github.com/can1357/oh-my-pi/issues/12306) | · |
| A-0496 | 8 | 2 | vibe-kanban | ? | Agent SDK update breaks integration |  | [vibe-kanban#2794](https://github.com/BloopAI/vibe-kanban/issues/2794) | · |
| A-0497 | 8 | 2 | vibe-kanban | ? | Can't plug in any agent via a standard protocol |  | [vibe-kanban#2365](https://github.com/BloopAI/vibe-kanban/issues/2365) | · |
| A-0501 | 7 | 2 | vibe-kanban | ? | Orchestrator UI doesn't support the agent's question prompts |  | [vibe-kanban#1220](https://github.com/BloopAI/vibe-kanban/issues/1220) | · |
| A-0334 | 6 | 2 | goose | ? | Can't use another tool's subscription as a provider |  | [goose#8381](https://github.com/aaif-goose/goose/issues/8381) | · |
| A-0509 | 6 | 1 | vibe-kanban | ? | A popular agent not supported |  | [vibe-kanban#1004](https://github.com/BloopAI/vibe-kanban/issues/1004) | · |
| A-0240 | 5 | 3 | cline | ? | Using different models for plan vs act causes API errors |  | [cline#7620](https://github.com/cline/cline/issues/7620) | · |
| A-0324 | 4 | 4 | continue | ? | Project archived / no longer maintained; users stranded |  | [continue#12629](https://github.com/continuedev/continue/issues/12629) | · |
| A-0429 | 4 | 3 | copilot | ? | Can't use a different vendor's agent with an enterprise subscription |  | [vscode-copilot-release#14167](https://github.com/microsoft/vscode-copilot-release/issues/14167) | · |
| A-0260 | 3 | 2 | roo | ? | Skills folder location differs between agents, so moving between them is painful |  | [Roo-Code#11368](https://github.com/RooCodeInc/Roo-Code/issues/11368) | · |
| A-0266 | 2 | 3 | roo | ? | Mixing models across modes breaks tool calls |  | [Roo-Code#10075](https://github.com/RooCodeInc/Roo-Code/issues/10075) | · |
| A-0270 | 2 | 3 | roo | ? | Switching model mid-conversation causes an API error |  | [Roo-Code#9392](https://github.com/RooCodeInc/Roo-Code/issues/9392) | · |
| A-0476 | 0 | 3 | claude-squad | ? | Can't type prompts when running a different agent inside the orchestrator |  | [claude-squad#232](https://github.com/smtg-ai/claude-squad/issues/232) | · |
| A-0526 | 0 | 1 | crystal | ? | Personas not supported for another agent |  | [crystal#209](https://github.com/stravu/crystal/issues/209) | · |
| A-0531 | 0 | 3 | crystal | ? | Project looks dead; users look for alternatives |  | [crystal#235](https://github.com/stravu/crystal/issues/235) | · |

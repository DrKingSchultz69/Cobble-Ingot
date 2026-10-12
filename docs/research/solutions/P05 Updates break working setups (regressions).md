---
type: "solution"
id: "P05"
title: "Updates break working setups (regressions)"
themes: ["reliability", "setup", "models"]
problems: 32
upvotes: 398
can_incorporate: "partly"
options: 4
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0368", "A-0369", "A-0375", "A-0382", "A-0083", "A-0547", "A-0548", "A-0554", "A-0159", "A-0280", "A-0281", "A-0559", "A-0135", "A-0165", "A-0143", "A-0219", "A-0493", "A-0496", "A-0227", "A-0223", "A-0225", "A-0226", "A-0315", "A-0342", "A-0256", "A-0257", "A-0328", "A-0437", "A-0449", "A-0445", "A-0446", "A-0512"]
tags: ["research", "solution", "theme/reliability", "theme/setup", "theme/models"]
updated: "2026-10-08"
---
# P05 · Updates break working setups (regressions)

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/reliability|reliability]] · [[themes/setup|setup]] · [[themes/models|models]]

> [!question] The problem
> After an update the tool crashes on start, extensions stop loading, providers or integrations break, performance collapses, or data becomes inaccessible. The usual fix is downgrading.
>
> **32 problems · 398 👍** · tools: cline (5), zed (4), litellm (4), copilot (4), omp (2)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0368 | 45 | zed | External agents stopped working with multi-folder workspaces after an update |  | [zed#54480](https://github.com/zed-industries/zed/issues/54480) |
| A-0369 | 43 | zed | External agent integration broke after the agent auto-updated |  | [zed#43025](https://github.com/zed-industries/zed/issues/43025) |
| A-0375 | 37 | zed | Installing extensions broken |  | [zed#54280](https://github.com/zed-industries/zed/issues/54280) |
| A-0382 | 32 | zed | Edit predictions broken after an update |  | [zed#46880](https://github.com/zed-industries/zed/issues/46880) |
| A-0083 | 28 | gemini-cli | New version extremely slow; fixed only by downgrading | Downgrade to the previous version | [gemini-cli#24294](https://github.com/google-gemini/gemini-cli/issues/24294) |

> [!example]- All 32 problems in this cluster (click to open)
> - **A-0368** · 45 👍 · zed: External agents stopped working with multi-folder workspaces after an update · [zed#54480](https://github.com/zed-industries/zed/issues/54480)
> - **A-0369** · 43 👍 · zed: External agent integration broke after the agent auto-updated · [zed#43025](https://github.com/zed-industries/zed/issues/43025)
> - **A-0375** · 37 👍 · zed: Installing extensions broken · [zed#54280](https://github.com/zed-industries/zed/issues/54280)
> - **A-0382** · 32 👍 · zed: Edit predictions broken after an update · [zed#46880](https://github.com/zed-industries/zed/issues/46880)
> - **A-0083** · 28 👍 · gemini-cli: New version extremely slow; fixed only by downgrading · [gemini-cli#24294](https://github.com/google-gemini/gemini-cli/issues/24294)
> - **A-0547** · 18 👍 · litellm: Silent switch of API type overnight caused failures · [litellm#16810](https://github.com/BerriAI/litellm/issues/16810)
> - **A-0548** · 17 👍 · litellm: Model IDs from a router stopped working after an update · [litellm#22667](https://github.com/BerriAI/litellm/issues/22667)
> - **A-0554** · 15 👍 · litellm: Big performance regression after an upgrade · [litellm#19921](https://github.com/BerriAI/litellm/issues/19921)
> - **A-0159** · 13 👍 · omp: Update makes the app crash immediately · [oh-my-pi#651](https://github.com/can1357/oh-my-pi/issues/651)
> - **A-0280** · 13 👍 · kilo: Cloud model provider broke after an update · [kilocode#4331](https://github.com/Kilo-Org/kilocode/issues/4331)
> - **A-0281** · 13 👍 · kilo: Major update made the tool slow, buggy, duplicated code, lost checkpoints · [kilocode#8364](https://github.com/Kilo-Org/kilocode/issues/8364)
> - **A-0559** · 13 👍 · litellm: Unexpected dependency pinning change · [litellm#25280](https://github.com/BerriAI/litellm/issues/25280)
> - **A-0135** · 12 👍 · pi: Update breaks extensions (missing module) · [pi#1820](https://github.com/earendil-works/pi/issues/1820)
> - **A-0165** · 10 👍 · omp: Update leaves the CLI unable to start · [oh-my-pi#116](https://github.com/can1357/oh-my-pi/issues/116)
> - **A-0143** · 9 👍 · pi: Global install breaks extension loading after an update · [pi#1831](https://github.com/earendil-works/pi/issues/1831)
> - **A-0219** · 9 👍 · cline: Plugin window empty after an IDE update · [cline#12361](https://github.com/cline/cline/issues/12361)
> - **A-0493** · 9 👍 · vibe-kanban: Data inaccessible after an update (time-outs loading projects) · [vibe-kanban#2838](https://github.com/BloopAI/vibe-kanban/issues/2838)
> - **A-0496** · 8 👍 · vibe-kanban: Agent SDK update breaks integration · [vibe-kanban#2794](https://github.com/BloopAI/vibe-kanban/issues/2794)
> - **A-0227** · 7 👍 · cline: IDE becomes unresponsive with a new extension version · [cline#11906](https://github.com/cline/cline/issues/11906)
> - **A-0223** · 7 👍 · cline: Update causes 400 errors on file reads · [cline#7545](https://github.com/cline/cline/issues/7545)
> - **A-0225** · 7 👍 · cline: MCP connection broken after an IDE update · [cline#7577](https://github.com/cline/cline/issues/7577)
> - **A-0226** · 7 👍 · cline: @file mentions stop finding files after an IDE update · [cline#11105](https://github.com/cline/cline/issues/11105)
> - **A-0315** · 6 👍 · continue: Integration with a local LLM front-end broke after an update · [continue#8878](https://github.com/continuedev/continue/issues/8878)
> - **A-0342** · 5 👍 · goose: Model update breaks the provider config · [goose#9333](https://github.com/aaif-goose/goose/issues/9333)
> - **A-0256** · 3 👍 · roo: Update forces a tool-calling format that breaks a self-hosted model · [Roo-Code#10319](https://github.com/RooCodeInc/Roo-Code/issues/10319)
> - **A-0257** · 3 👍 · roo: Tool calls broke with a provider after an update · [Roo-Code#10349](https://github.com/RooCodeInc/Roo-Code/issues/10349)
> - **A-0328** · 3 👍 · continue: Plugin fails to load in the newest IDE versions · [continue#13185](https://github.com/continuedev/continue/issues/13185)
> - **A-0437** · 2 👍 · copilot: Chat unavailable after an editor upgrade · [vscode-copilot-release#14157](https://github.com/microsoft/vscode-copilot-release/issues/14157)
> - **A-0449** · 1 👍 · copilot: Chat extension incompatible with a preview editor version · [vscode-copilot-release#14156](https://github.com/microsoft/vscode-copilot-release/issues/14156)
> - **A-0445** · 1 👍 · copilot: Extension error on an editor preview build · [vscode-copilot-release#14154](https://github.com/microsoft/vscode-copilot-release/issues/14154)
> - **A-0446** · 1 👍 · copilot: Extension error on an editor preview build (duplicate report) · [vscode-copilot-release#14155](https://github.com/microsoft/vscode-copilot-release/issues/14155)
> - **A-0512** · 1 👍 · crystal: Latest release broken on Mac (database error) · [crystal#210](https://github.com/stravu/crystal/issues/210)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Health check + auto-rollback for agent CLIs

> [!success] ✅ Netheron can build this
> Netheron runs a 10-second smoke test of each agent after an update; if it fails, it switches back to the last good version and tells you.
>
> **Effort:** M (2–5 days) · **Novelty:** High

### S2 · Pin + staged updates

> [!success] ✅ Netheron can build this
> Agents update only when you approve, one at a time, with the changelog shown.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium

### S3 · Failover to another agent while one is broken

> [!success] ✅ Netheron can build this
> If Claude Code breaks after an update, the router sends tasks to Codex/OpenCode/Pi until it's fixed.
>
> **Effort:** S (hours to 1 day) · **Novelty:** High: only possible with several agents
> **Already in Netheron:** Router + availability detection exist

### S4 · Netheron's own stability rules

> [!warning] 🟡 Netheron can partly do this
> For Netheron itself: automated tests (59 today), the stale-server banner, and changelogs, so Netheron doesn't become part of the problem.
>
> **Effort:** none (already exists) · **Novelty:** -
> **Already in Netheron:** Built: 59 tests, restart banner (B-032)

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Bugs inside each vendor's release are theirs.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

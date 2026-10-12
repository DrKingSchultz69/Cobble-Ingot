---
type: "research-theme"
theme: "performance"
rows: 25
upvotes: 1949
avg_severity: 2.7
generated: "2026-10-08"
tags: ["research", "theme", "theme/performance"]
---

# Theme: performance

> [!info] Slow start, CPU/RAM/disk heavy, UI lag
> **25** problems · **1949** 👍 · average severity **2.7** / 5 · rank **#14** of 24

Back to [[Pain log]] · [[synthesis]] · [[Research Home]]

## Tools most affected
- gemini-cli: 9
- zed: 4
- codex: 2
- opencode: 2
- pi: 2
- claude-code: 1
- continue: 1
- litellm: 1

## Workarounds people use (2)
- **A-0038** (450 👍): Quit the agent and delete its log database
- **A-0083** (28 👍): Downgrade to the previous version

## Netheron ideas noted while labeling (2)
- **A-0065**: Stuck Rescue
- **A-0471**: Netheron diffs only on file change (B-029)

## All problems (sorted by 👍)

Checked: ✅ verified by you · 🔁 rechecked by an agent · · not yet

| ID | 👍 | Sev | Tool | Role | Problem | Workaround | Source | Checked |
|---|---|---|---|---|---|---|---|---|
| A-0038 | 450 | 4 | codex | ? | Agent's local logs wrote ~37 TB in 21 days, wearing out the SSD | Quit the agent and delete its log database | [codex#28224](https://github.com/openai/codex/issues/28224) | 🔁 |
| A-0040 | 397 | 3 | codex | ? | Desktop app triggers runaway CPU and memory use on macOS |  | [codex#25719](https://github.com/openai/codex/issues/25719) | · |
| A-0028 | 228 | 3 | claude-code | ? | Feature creates a 10 GB VM bundle that slows the whole app down |  | [claude-code#22543](https://github.com/anthropics/claude-code/issues/22543) | · |
| A-0065 | 164 | 4 | gemini-cli | ? | Agent loops or stalls for an hour on small edits |  | [gemini-cli#22141](https://github.com/google-gemini/gemini-cli/issues/22141) | · |
| A-0112 | 112 | 3 | opencode | ? | Memory leaks / high memory use reported widely |  | [opencode#20695](https://github.com/anomalyco/opencode/issues/20695) | · |
| A-0113 | 112 | 1 | opencode | ? | No tokens-per-second display to judge speed |  | [opencode#5374](https://github.com/anomalyco/opencode/issues/5374) | · |
| A-0068 | 78 | 2 | gemini-cli | ? | CLI takes up to 39 s to start on Windows |  | [gemini-cli#11511](https://github.com/google-gemini/gemini-cli/issues/11511) | · |
| A-0075 | 37 | 4 | gemini-cli | ? | Tool 'thinks' 10+ minutes and times out constantly |  | [gemini-cli#23795](https://github.com/google-gemini/gemini-cli/issues/23795) | · |
| A-0076 | 37 | 2 | gemini-cli | ? | Startup takes up to 60 s |  | [gemini-cli#10726](https://github.com/google-gemini/gemini-cli/issues/10726) | · |
| A-0379 | 33 | 2 | zed | ? | Leaves zombie Node processes after exit on Windows |  | [zed#46474](https://github.com/zed-industries/zed/issues/46474) | · |
| A-0079 | 32 | 3 | gemini-cli | ? | CLI takes over 2 minutes to start |  | [gemini-cli#14626](https://github.com/google-gemini/gemini-cli/issues/14626) | · |
| A-0081 | 31 | 2 | gemini-cli | ? | CLI startup takes 20-30 s every launch |  | [gemini-cli#21623](https://github.com/google-gemini/gemini-cli/issues/21623) | · |
| A-0384 | 30 | 1 | zed | ? | No built-in view of processes/CPU/RAM used by agents and tools |  | [zed#59451](https://github.com/zed-industries/zed/issues/59451) | · |
| A-0387 | 29 | 3 | zed | ? | Editor hangs on a project because of a language extension |  | [zed#53811](https://github.com/zed-industries/zed/issues/53811) | · |
| A-0083 | 28 | 3 | gemini-cli | ? | New version extremely slow; fixed only by downgrading | Downgrade to the previous version | [gemini-cli#24294](https://github.com/google-gemini/gemini-cli/issues/24294) | · |
| A-0390 | 28 | 3 | zed | ? | Severe sluggishness on a Linux desktop environment |  | [zed#53522](https://github.com/zed-industries/zed/issues/53522) | · |
| A-0090 | 24 | 3 | gemini-cli | ? | Very slow responses and frequent 'high demand' errors |  | [gemini-cli#15397](https://github.com/google-gemini/gemini-cli/issues/15397) | · |
| A-0091 | 24 | 3 | gemini-cli | ? | Extremely high latency or no response from the model |  | [gemini-cli#22160](https://github.com/google-gemini/gemini-cli/issues/22160) | · |
| A-0302 | 17 | 3 | continue | ? | Sidebar freezes frequently in JetBrains IDEs |  | [continue#8085](https://github.com/continuedev/continue/issues/8085) | · |
| A-0130 | 16 | 2 | pi | ? | File autocomplete freezes the UI on large repos |  | [pi#1278](https://github.com/earendil-works/pi/issues/1278) | · |
| A-0554 | 15 | 3 | litellm | ? | Big performance regression after an upgrade |  | [litellm#19921](https://github.com/BerriAI/litellm/issues/19921) | · |
| A-0142 | 11 | 3 | pi | ? | High CPU use in long sessions |  | [pi#7730](https://github.com/earendil-works/pi/issues/7730) | · |
| A-0293 | 9 | 1 | kilo | ? | No speed metric (tokens/s) |  | [kilocode#6579](https://github.com/Kilo-Org/kilocode/issues/6579) | · |
| A-0227 | 7 | 4 | cline | ? | IDE becomes unresponsive with a new extension version |  | [cline#11906](https://github.com/cline/cline/issues/11906) | · |
| A-0471 | 0 | 2 | claude-squad | ? | Diff pane recomputes the full git diff every 500 ms per session, using lots of memory |  | [claude-squad#280](https://github.com/smtg-ai/claude-squad/issues/280) | · |

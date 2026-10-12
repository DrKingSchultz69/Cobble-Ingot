---
type: "solution"
id: "P19"
title: "Config and settings friction (location, reload, sync)"
themes: ["setup", "platform", "ux"]
problems: 12
upvotes: 452
can_incorporate: "partly"
options: 3
partly_built: false
status: "to review"
decision: ""
priority: ""
rows: ["A-0116", "A-0119", "A-0365", "A-0001", "A-0002", "A-0389", "A-0285", "A-0393", "A-0345", "A-0397", "A-0456", "A-0418"]
tags: ["research", "solution", "theme/setup", "theme/platform", "theme/ux"]
updated: "2026-10-08"
---
# P19 · Config and settings friction (location, reload, sync)

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/setup|setup]] · [[themes/platform|platform]] · [[themes/ux|ux]]

> [!question] The problem
> Config clutters $HOME, changes need restarts, settings don't sync between machines or between CLI and extension, config files are silently ignored.
>
> **12 problems · 452 👍** · tools: openhands (3), opencode (2), zed (2), pi (2), kilo (1)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0116 | 101 | opencode | Must restart to reload agents, skills and commands |  | [opencode#8751](https://github.com/anomalyco/opencode/issues/8751) |
| A-0119 | 92 | opencode | Config changes need a full restart |  | [opencode#6815](https://github.com/anomalyco/opencode/issues/6815) |
| A-0365 | 87 | zed | No settings sync across machines |  | [zed#59978](https://github.com/zed-industries/zed/issues/59978) |
| A-0001 | 64 | pi | Tool clutters the home folder instead of following OS config-folder standards (XDG) |  | [pi#2870](https://github.com/earendil-works/pi/issues/2870) |
| A-0002 | 51 | pi | Config folder placed directly in $HOME on Linux, ignoring XDG standard |  | [pi#534](https://github.com/earendil-works/pi/issues/534) |

> [!example]- All 12 problems in this cluster (click to open)
> - **A-0116** · 101 👍 · opencode: Must restart to reload agents, skills and commands · [opencode#8751](https://github.com/anomalyco/opencode/issues/8751)
> - **A-0119** · 92 👍 · opencode: Config changes need a full restart · [opencode#6815](https://github.com/anomalyco/opencode/issues/6815)
> - **A-0365** · 87 👍 · zed: No settings sync across machines · [zed#59978](https://github.com/zed-industries/zed/issues/59978)
> - **A-0001** · 64 👍 · pi: Tool clutters the home folder instead of following OS config-folder standards (XDG) · [pi#2870](https://github.com/earendil-works/pi/issues/2870)
> - **A-0002** · 51 👍 · pi: Config folder placed directly in $HOME on Linux, ignoring XDG standard · [pi#534](https://github.com/earendil-works/pi/issues/534)
> - **A-0389** · 29 👍 · zed: Config in a symlinked folder doesn't reload · [zed#48729](https://github.com/zed-industries/zed/issues/48729)
> - **A-0285** · 11 👍 · kilo: Settings not carried over between the extension and the CLI · [kilocode#3063](https://github.com/Kilo-Org/kilocode/issues/3063)
> - **A-0393** · 5 👍 · openhands: Config file silently ignored in Docker; wastes time · [OpenHands#11928](https://github.com/OpenHands/OpenHands/issues/11928)
> - **A-0345** · 4 👍 · goose: Setting to disable the keyring ignored on Linux · [goose#6287](https://github.com/aaif-goose/goose/issues/6287)
> - **A-0397** · 4 👍 · openhands: Docs refer to a config file that Docker ignores · [OpenHands#11927](https://github.com/OpenHands/OpenHands/issues/11927)
> - **A-0456** · 2 👍 · claude-squad: Config folder path hard-coded · [claude-squad#245](https://github.com/smtg-ai/claude-squad/issues/245)
> - **A-0418** · 2 👍 · openhands: Can't save environment variables for the agent · [OpenHands#12359](https://github.com/OpenHands/OpenHands/issues/12359)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · One settings place for all agents

> [!success] ✅ Netheron can build this
> Netheron settings page manages env vars, keys, profiles and agent options, applied at launch.
>
> **Effort:** M (2–5 days) · **Novelty:** Medium

### S2 · Live reload

> [!success] ✅ Netheron can build this
> Settings apply to the next task without restarting Netheron.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Low

### S3 · Settings export/sync

> [!warning] 🟡 Netheron can partly do this
> Export settings to a file you can sync (git/cloud folder).
>
> **Effort:** S (hours to 1 day) · **Novelty:** Low

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Each agent's own config format stays theirs.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

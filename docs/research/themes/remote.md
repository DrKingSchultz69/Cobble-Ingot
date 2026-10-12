---
type: "research-theme"
theme: "remote"
rows: 24
upvotes: 2958
avg_severity: 2.4
generated: "2026-10-08"
tags: ["research", "theme", "theme/remote"]
---

# Theme: remote

> [!info] Can't watch or steer agents away from the desk
> **24** problems · **2958** 👍 · average severity **2.4** / 5 · rank **#9** of 24

Back to [[Pain log]] · [[synthesis]] · [[Research Home]]

## Tools most affected
- continue: 5
- codex: 3
- openhands: 3
- claude-code: 2
- zed: 2
- opencode: 2
- gemini-cli: 2
- omp: 2

## Workarounds people use (3)
- **A-0035** (693 👍): Keep using VS Code Remote SSH instead of the app
- **A-0039** (411 👍): Tailscale VPN + an SSH app + tmux
- **A-0082** (30 👍): User built their own remote WebSocket API

## Netheron ideas noted while labeling (7)
- **A-0039**: Netheron already does phone control; highlight it
- **A-0018**: Phone notification + answer from phone before the agent moves on
- **A-0117**: Netheron's phone UI
- **A-0146**: Netheron 'needs you' status + notifications
- **A-0299**: Netheron notifications (🔔)
- **A-0506**: Night Shift / scheduled runs
- **A-0419**: Night Shift

## All problems (sorted by 👍)

Checked: ✅ verified by you · 🔁 rechecked by an agent · · not yet

| ID | 👍 | Sev | Tool | Role | Problem | Workaround | Source | Checked |
|---|---|---|---|---|---|---|---|---|
| A-0009 | 750 | 3 | claude-code | ? | Mobile app can't hold work and personal accounts at once, so phone remote control of work sessions needs sign-out/sign-in |  | [claude-code#36151](https://github.com/anthropics/claude-code/issues/36151) | 🔁 |
| A-0035 | 693 | 3 | codex | ? | Desktop app only works on local projects; can't develop on remote hosts (SSH, cloud machines) | Keep using VS Code Remote SSH instead of the app | [codex#10450](https://github.com/openai/codex/issues/10450) | 🔁 |
| A-0039 | 411 | 3 | codex | ? | Can't control the agent on a desktop PC from a phone app | Tailscale VPN + an SSH app + tmux | [codex#9224](https://github.com/openai/codex/issues/9224) | 🔁 |
| A-0018 | 388 | 3 | claude-code | ? | Agent stops waiting for the user's answer after 60 s and continues without it |  | [claude-code#73125](https://github.com/anthropics/claude-code/issues/73125) | · |
| A-0046 | 214 | 3 | codex | ? | Agent auto-resolves its own questions after 60 s instead of waiting for the user |  | [codex#28969](https://github.com/openai/codex/issues/28969) | · |
| A-0363 | 110 | 3 | zed | ? | Can't connect to dev containers on a remote host |  | [zed#59500](https://github.com/zed-industries/zed/issues/59500) | · |
| A-0117 | 96 | 3 | opencode | ? | No mobile or web UI; terminal only |  | [opencode#10288](https://github.com/anomalyco/opencode/issues/10288) | · |
| A-0121 | 84 | 3 | opencode | ? | Desktop app can't connect to remote servers over SSH |  | [opencode#7790](https://github.com/anomalyco/opencode/issues/7790) | · |
| A-0366 | 53 | 2 | zed | ? | SSH/GPG agents not forwarded into dev containers |  | [zed#47121](https://github.com/zed-industries/zed/issues/47121) | · |
| A-0082 | 30 | 2 | gemini-cli | ? | No remote API to control the CLI from elsewhere | User built their own remote WebSocket API | [gemini-cli#20782](https://github.com/google-gemini/gemini-cli/issues/20782) | · |
| A-0085 | 27 | 2 | gemini-cli | ? | No remote-control mode from phone/browser |  | [gemini-cli#22559](https://github.com/google-gemini/gemini-cli/issues/22559) | · |
| A-0152 | 27 | 2 | omp | ? | Terminal-only; users want a desktop/web GUI |  | [oh-my-pi#5742](https://github.com/can1357/oh-my-pi/issues/5742) | · |
| A-0154 | 19 | 3 | omp | ? | Can't control the agent remotely from a browser on another device |  | [oh-my-pi#436](https://github.com/can1357/oh-my-pi/issues/436) | · |
| A-0146 | 9 | 2 | pi | ? | Host apps can't tell when the agent is waiting for user input |  | [pi#5329](https://github.com/earendil-works/pi/issues/5329) | · |
| A-0303 | 9 | 3 | continue | ? | Commands don't run in remote terminals (SSH, dev containers) |  | [continue#10542](https://github.com/continuedev/continue/issues/10542) | · |
| A-0299 | 8 | 1 | kilo | ? | No sound when a task finishes or a reply arrives |  | [kilocode#8127](https://github.com/Kilo-Org/kilocode/issues/8127) | · |
| A-0506 | 7 | 1 | vibe-kanban | ? | Wants scheduled 'heartbeat' prompts that run every X minutes |  | [vibe-kanban#3039](https://github.com/BloopAI/vibe-kanban/issues/3039) | · |
| A-0312 | 6 | 3 | continue | ? | Broken in VS Code remote SSH |  | [continue#8826](https://github.com/continuedev/continue/issues/8826) | · |
| A-0323 | 4 | 2 | continue | ? | Terminal output not captured in Docker after an IDE update |  | [continue#12102](https://github.com/continuedev/continue/issues/12102) | · |
| A-0326 | 3 | 2 | continue | ? | MCP doesn't work on a remote server |  | [continue#8732](https://github.com/continuedev/continue/issues/8732) | · |
| A-0330 | 3 | 2 | continue | ? | Terminal tool fails in dev containers |  | [continue#11129](https://github.com/continuedev/continue/issues/11129) | · |
| A-0402 | 3 | 2 | openhands | ? | Web interface can't be used from another machine |  | [OpenHands#12679](https://github.com/OpenHands/OpenHands/issues/12679) | · |
| A-0414 | 2 | 3 | openhands | ? | Non-localhost setup stopped working after a major version |  | [OpenHands#12072](https://github.com/OpenHands/OpenHands/issues/12072) | · |
| A-0419 | 2 | 2 | openhands | ? | Wants scheduled, recurring agent runs |  | [OpenHands#12732](https://github.com/OpenHands/OpenHands/issues/12732) | · |

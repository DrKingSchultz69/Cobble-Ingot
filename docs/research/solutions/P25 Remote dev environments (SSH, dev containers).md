---
type: "solution"
id: "P25"
title: "Remote dev environments (SSH, dev containers)"
themes: ["remote", "reliability", "setup"]
problems: 9
upvotes: 965
can_incorporate: "partly"
options: 2
partly_built: true
status: "wave 3 built"
decision: ""
priority: ""
rows: ["A-0035", "A-0363", "A-0121", "A-0366", "A-0303", "A-0312", "A-0323", "A-0326", "A-0330"]
tags: ["research", "solution", "theme/remote", "theme/reliability", "theme/setup"]
updated: "2026-10-08"
---
# P25 · Remote dev environments (SSH, dev containers)

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/remote|remote]] · [[themes/reliability|reliability]] · [[themes/setup|setup]]

> [!question] The problem
> Agents/apps only work on local projects; commands fail in SSH sessions and dev containers; SSH/GPG agents aren't forwarded.
>
> **9 problems · 965 👍** · tools: continue (5), zed (2), codex (1), opencode (1)

> [!success] Built in Wave 3 (2026-10-10)
> S2 remote workers, first slice (board + start tasks; terminal opens on the remote). See [[BUGS]] B-040.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0035 | 693 | codex | Desktop app only works on local projects; can't develop on remote hosts (SSH, cloud machines) | Keep using VS Code Remote SSH instead of the app | [codex#10450](https://github.com/openai/codex/issues/10450) |
| A-0363 | 110 | zed | Can't connect to dev containers on a remote host |  | [zed#59500](https://github.com/zed-industries/zed/issues/59500) |
| A-0121 | 84 | opencode | Desktop app can't connect to remote servers over SSH |  | [opencode#7790](https://github.com/anomalyco/opencode/issues/7790) |
| A-0366 | 53 | zed | SSH/GPG agents not forwarded into dev containers |  | [zed#47121](https://github.com/zed-industries/zed/issues/47121) |
| A-0303 | 9 | continue | Commands don't run in remote terminals (SSH, dev containers) |  | [continue#10542](https://github.com/continuedev/continue/issues/10542) |

> [!example]- All 9 problems in this cluster (click to open)
> - **A-0035** · 693 👍 · codex: Desktop app only works on local projects; can't develop on remote hosts (SSH, cloud machines) · [codex#10450](https://github.com/openai/codex/issues/10450)
> - **A-0363** · 110 👍 · zed: Can't connect to dev containers on a remote host · [zed#59500](https://github.com/zed-industries/zed/issues/59500)
> - **A-0121** · 84 👍 · opencode: Desktop app can't connect to remote servers over SSH · [opencode#7790](https://github.com/anomalyco/opencode/issues/7790)
> - **A-0366** · 53 👍 · zed: SSH/GPG agents not forwarded into dev containers · [zed#47121](https://github.com/zed-industries/zed/issues/47121)
> - **A-0303** · 9 👍 · continue: Commands don't run in remote terminals (SSH, dev containers) · [continue#10542](https://github.com/continuedev/continue/issues/10542)
> - **A-0312** · 6 👍 · continue: Broken in VS Code remote SSH · [continue#8826](https://github.com/continuedev/continue/issues/8826)
> - **A-0323** · 4 👍 · continue: Terminal output not captured in Docker after an IDE update · [continue#12102](https://github.com/continuedev/continue/issues/12102)
> - **A-0326** · 3 👍 · continue: MCP doesn't work on a remote server · [continue#8732](https://github.com/continuedev/continue/issues/8732)
> - **A-0330** · 3 👍 · continue: Terminal tool fails in dev containers · [continue#11129](https://github.com/continuedev/continue/issues/11129)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Run Netheron on the remote machine

> [!success] ✅ Netheron can build this
> Netheron is a Node server: run it on the remote host and open it from anywhere (tunnel).
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium
> **Already in Netheron:** Works today in principle; needs docs + test

### S2 · Remote worker mode

> [!warning] 🟡 Netheron can partly do this
> Local Netheron UI, agents running on a remote host over SSH.
>
> **Effort:** L (1–3 weeks) · **Novelty:** High

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Dev-container integration inside each IDE is the vendor's.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

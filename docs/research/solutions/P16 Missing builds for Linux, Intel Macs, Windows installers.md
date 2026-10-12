---
type: "solution"
id: "P16"
title: "Missing builds for Linux, Intel Macs, Windows installers"
themes: ["platform", "setup", "reliability"]
problems: 12
upvotes: 1992
can_incorporate: "partly"
options: 2
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0034", "A-0012", "A-0042", "A-0047", "A-0126", "A-0331", "A-0399", "A-0348", "A-0354", "A-0469", "A-0479", "A-0530"]
tags: ["research", "solution", "theme/platform", "theme/setup", "theme/reliability"]
updated: "2026-10-08"
---
# P16 · Missing builds for Linux, Intel Macs, Windows installers

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/platform|platform]] · [[themes/setup|setup]] · [[themes/reliability|reliability]]

> [!question] The problem
> No Linux or Intel Mac desktop apps, no standalone Windows installer, broken install scripts, missing Flatpak/Nix packages.
>
> **12 problems · 1992 👍** · tools: codex (3), goose (3), claude-squad (2), claude-code (1), pi (1)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0034 | 953 | codex | No desktop app for Linux (the macOS app also drains battery) |  | [codex#11023](https://github.com/openai/codex/issues/11023) |
| A-0012 | 498 | claude-code | No official Linux desktop app, so plugin work needs a different OS | Unofficial builds reverse-engineered from the Windows app | [claude-code#65697](https://github.com/anthropics/claude-code/issues/65697) |
| A-0042 | 293 | codex | No desktop app for Intel Macs |  | [codex#10410](https://github.com/openai/codex/issues/10410) |
| A-0047 | 203 | codex | Windows users can't install from the Microsoft Store; no standalone installer |  | [codex#13993](https://github.com/openai/codex/issues/13993) |
| A-0126 | 20 | pi | No Nix packaging |  | [pi#2310](https://github.com/earendil-works/pi/issues/2310) |

> [!example]- All 12 problems in this cluster (click to open)
> - **A-0034** · 953 👍 · codex: No desktop app for Linux (the macOS app also drains battery) · [codex#11023](https://github.com/openai/codex/issues/11023)
> - **A-0012** · 498 👍 · claude-code: No official Linux desktop app, so plugin work needs a different OS · [claude-code#65697](https://github.com/anthropics/claude-code/issues/65697)
> - **A-0042** · 293 👍 · codex: No desktop app for Intel Macs · [codex#10410](https://github.com/openai/codex/issues/10410)
> - **A-0047** · 203 👍 · codex: Windows users can't install from the Microsoft Store; no standalone installer · [codex#13993](https://github.com/openai/codex/issues/13993)
> - **A-0126** · 20 👍 · pi: No Nix packaging · [pi#2310](https://github.com/earendil-works/pi/issues/2310)
> - **A-0331** · 14 👍 · goose: No Flatpak package for Linux desktop · [goose#6602](https://github.com/aaif-goose/goose/issues/6602)
> - **A-0399** · 4 👍 · openhands: Mac installer produces a damaged app · [OpenHands#16774](https://github.com/OpenHands/OpenHands/issues/16774)
> - **A-0348** · 4 👍 · goose: Install fails on Windows 11 with Git Bash · [goose#5910](https://github.com/aaif-goose/goose/issues/5910)
> - **A-0354** · 3 👍 · goose: Install script fails (broken download link) · [goose#6858](https://github.com/aaif-goose/goose/issues/6858)
> - **A-0469** · 0 👍 · claude-squad: Doesn't run on Windows 11 · [claude-squad#291](https://github.com/smtg-ai/claude-squad/issues/291)
> - **A-0479** · 0 👍 · claude-squad: Windows build fails on creating any session · [claude-squad#275](https://github.com/smtg-ai/claude-squad/issues/275)
> - **A-0530** · 0 👍 · crystal: Package name clashes with an existing system package · [crystal#236](https://github.com/stravu/crystal/issues/236)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Browser-based Netheron works on any OS

> [!success] ✅ Netheron can build this
> Netheron's UI is a web page served by Node, so Linux, Intel Mac, Windows and phones all work.
>
> **Effort:** none (already exists) · **Novelty:** High
> **Already in Netheron:** Built: web UI + Node

### S2 · Simple installers

> [!warning] 🟡 Netheron can partly do this
> One-command install per OS plus a Windows double-click launcher.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Low
> **Already in Netheron:** start-netheron.cmd exists for Windows

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Vendors' own desktop apps are theirs.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

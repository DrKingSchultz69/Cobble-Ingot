---
type: "research-theme"
theme: "platform"
rows: 37
upvotes: 4107
avg_severity: 2.4
generated: "2026-10-08"
tags: ["research", "theme", "theme/platform"]
---

# Theme: platform

> [!info] OS / IDE support (Linux, Windows, Intel Mac, JetBrains…)
> **37** problems · **4107** 👍 · average severity **2.4** / 5 · rank **#5** of 24

Back to [[Pain log]] · [[synthesis]] · [[Research Home]]

## Tools most affected
- codex: 5
- goose: 5
- continue: 4
- claude-squad: 4
- claude-code: 3
- pi: 3
- zed: 2
- kilo: 2

## Workarounds people use (3)
- **A-0035** (693 👍): Keep using VS Code Remote SSH instead of the app
- **A-0012** (498 👍): Unofficial builds reverse-engineered from the Windows app
- **A-0014** (460 👍): Run the CLI in a separate terminal and copy-paste errors by hand

## All problems (sorted by 👍)

Checked: ✅ verified by you · 🔁 rechecked by an agent · · not yet

| ID | 👍 | Sev | Tool | Role | Problem | Workaround | Source | Checked |
|---|---|---|---|---|---|---|---|---|
| A-0034 | 953 | 3 | codex | ? | No desktop app for Linux (the macOS app also drains battery) |  | [codex#11023](https://github.com/openai/codex/issues/11023) | 🔁 |
| A-0035 | 693 | 3 | codex | ? | Desktop app only works on local projects; can't develop on remote hosts (SSH, cloud machines) | Keep using VS Code Remote SSH instead of the app | [codex#10450](https://github.com/openai/codex/issues/10450) | 🔁 |
| A-0012 | 498 | 3 | claude-code | ? | No official Linux desktop app, so plugin work needs a different OS | Unofficial builds reverse-engineered from the Windows app | [claude-code#65697](https://github.com/anthropics/claude-code/issues/65697) | 🔁 |
| A-0014 | 460 | 3 | claude-code | ? | No IDE plugin for their IDE: no integrated diff, no view of open files or compiler errors, constant alt-tabbing | Run the CLI in a separate terminal and copy-paste errors by hand | [claude-code#15942](https://github.com/anthropics/claude-code/issues/15942) | 🔁 |
| A-0042 | 293 | 2 | codex | ? | No desktop app for Intel Macs |  | [codex#10410](https://github.com/openai/codex/issues/10410) | · |
| A-0020 | 286 | 2 | claude-code | ? | Desktop window stays always-on-top on Windows with no setting to turn it off |  | [claude-code#85891](https://github.com/anthropics/claude-code/issues/85891) | · |
| A-0047 | 203 | 3 | codex | ? | Windows users can't install from the Microsoft Store; no standalone installer |  | [codex#13993](https://github.com/openai/codex/issues/13993) | · |
| A-0099 | 160 | 2 | opencode | ? | No official IDE extension; must work in the terminal only |  | [opencode#11176](https://github.com/anomalyco/opencode/issues/11176) | · |
| A-0055 | 153 | 2 | codex | ? | Terminal windows flash repeatedly on Windows during requests |  | [codex#48074](https://github.com/openai/codex/issues/48074) | · |
| A-0068 | 78 | 2 | gemini-cli | ? | CLI takes up to 39 s to start on Windows |  | [gemini-cli#11511](https://github.com/google-gemini/gemini-cli/issues/11511) | · |
| A-0001 | 64 | 1 | pi | ? | Tool clutters the home folder instead of following OS config-folder standards (XDG) |  | [pi#2870](https://github.com/earendil-works/pi/issues/2870) | · |
| A-0002 | 51 | 1 | pi | ? | Config folder placed directly in $HOME on Linux, ignoring XDG standard |  | [pi#534](https://github.com/earendil-works/pi/issues/534) | · |
| A-0379 | 33 | 2 | zed | ? | Leaves zombie Node processes after exit on Windows |  | [zed#46474](https://github.com/zed-industries/zed/issues/46474) | · |
| A-0390 | 28 | 3 | zed | ? | Severe sluggishness on a Linux desktop environment |  | [zed#53522](https://github.com/zed-industries/zed/issues/53522) | · |
| A-0482 | 26 | 3 | vibe-kanban | ? | Self-hosted GitLab not supported (diff, PRs don't work) |  | [vibe-kanban#1697](https://github.com/BloopAI/vibe-kanban/issues/1697) | · |
| A-0126 | 20 | 1 | pi | ? | No Nix packaging |  | [pi#2310](https://github.com/earendil-works/pi/issues/2310) | · |
| A-0302 | 17 | 3 | continue | ? | Sidebar freezes frequently in JetBrains IDEs |  | [continue#8085](https://github.com/continuedev/continue/issues/8085) | · |
| A-0275 | 16 | 2 | kilo | ? | No multi-root workspace support |  | [kilocode#7253](https://github.com/Kilo-Org/kilocode/issues/7253) | · |
| A-0331 | 14 | 1 | goose | ? | No Flatpak package for Linux desktop |  | [goose#6602](https://github.com/aaif-goose/goose/issues/6602) | · |
| A-0219 | 9 | 3 | cline | ? | Plugin window empty after an IDE update |  | [cline#12361](https://github.com/cline/cline/issues/12361) | · |
| A-0298 | 8 | 2 | kilo | ? | Plugin runs commands in the wrong shell on macOS |  | [kilocode#2846](https://github.com/Kilo-Org/kilocode/issues/2846) | · |
| A-0228 | 7 | 3 | cline | mob | Plugin doesn't work in Android Studio |  | [cline#11578](https://github.com/cline/cline/issues/11578) | · |
| A-0391 | 7 | 2 | openhands | ? | Self-hosted git server not supported |  | [OpenHands#12351](https://github.com/OpenHands/OpenHands/issues/12351) | · |
| A-0337 | 5 | 3 | goose | ? | Sign-in stuck on Windows desktop |  | [goose#6957](https://github.com/aaif-goose/goose/issues/6957) | · |
| A-0345 | 4 | 2 | goose | ? | Setting to disable the keyring ignored on Linux |  | [goose#6287](https://github.com/aaif-goose/goose/issues/6287) | · |
| A-0348 | 4 | 2 | goose | ? | Install fails on Windows 11 with Git Bash |  | [goose#5910](https://github.com/aaif-goose/goose/issues/5910) | · |
| A-0399 | 4 | 3 | openhands | ? | Mac installer produces a damaged app |  | [OpenHands#16774](https://github.com/OpenHands/OpenHands/issues/16774) | · |
| A-0325 | 3 | 1 | continue | ? | UI error in JetBrains |  | [continue#8182](https://github.com/continuedev/continue/issues/8182) | · |
| A-0327 | 3 | 2 | continue | ? | MCP servers fail to start in WSL |  | [continue#9151](https://github.com/continuedev/continue/issues/9151) | · |
| A-0328 | 3 | 3 | continue | ? | Plugin fails to load in the newest IDE versions |  | [continue#13185](https://github.com/continuedev/continue/issues/13185) | · |
| A-0356 | 3 | 3 | goose | ? | Every command pops up a visible window that steals focus on Windows |  | [goose#6701](https://github.com/aaif-goose/goose/issues/6701) | · |
| A-0196 | 1 | 2 | aider | ? | Errors parsing streamed responses from a local/cloud model on Windows |  | [aider#4594](https://github.com/Aider-AI/aider/issues/4594) | · |
| A-0462 | 0 | 2 | claude-squad | ? | Branch names break on Windows domain usernames |  | [claude-squad#220](https://github.com/smtg-ai/claude-squad/issues/220) | · |
| A-0469 | 0 | 3 | claude-squad | ? | Doesn't run on Windows 11 |  | [claude-squad#291](https://github.com/smtg-ai/claude-squad/issues/291) | · |
| A-0478 | 0 | 3 | claude-squad | ? | Garbled terminal output in Windows Terminal makes the tool unusable |  | [claude-squad#243](https://github.com/smtg-ai/claude-squad/issues/243) | · |
| A-0479 | 0 | 4 | claude-squad | ? | Windows build fails on creating any session |  | [claude-squad#275](https://github.com/smtg-ai/claude-squad/issues/275) | · |
| A-0530 | 0 | 2 | crystal | ? | Package name clashes with an existing system package |  | [crystal#236](https://github.com/stravu/crystal/issues/236) | · |

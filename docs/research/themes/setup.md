---
type: "research-theme"
theme: "setup"
rows: 91
upvotes: 2506
avg_severity: 2.1
generated: "2026-10-08"
tags: ["research", "theme", "theme/setup"]
---

# Theme: setup

> [!info] Install, config, auth, Windows/WSL, environment trouble
> **91** problems · **2506** 👍 · average severity **2.1** / 5 · rank **#10** of 24

Back to [[Pain log]] · [[synthesis]] · [[Research Home]]

## Tools most affected
- openhands: 15
- goose: 10
- pi: 7
- crystal: 7
- aider: 7
- zed: 6
- vibe-kanban: 5
- cline: 5

## Workarounds people use (1)
- **A-0194** (2 👍): Checks /tokens by hand

## Netheron ideas noted while labeling (4)
- **A-0136**: Netheron pre-trusts its own worktrees (B-014)
- **A-0453**: Netheron worktree setup recipe: copy env, install deps, assign ports
- **A-0404**: Netheron clone-from-URL (built, B-027)
- **A-0519**: Netheron already supports non-git folders (no worktree)

## All problems (sorted by 👍)

Checked: ✅ verified by you · 🔁 rechecked by an agent · · not yet

| ID | 👍 | Sev | Tool | Role | Problem | Workaround | Source | Checked |
|---|---|---|---|---|---|---|---|---|
| A-0007 | 820 | 4 | claude-code | ? | Sign-up phone verification fails with useless errors and blocks new users for hours |  | [claude-code#34229](https://github.com/anthropics/claude-code/issues/34229) | 🔁 |
| A-0096 | 243 | 2 | opencode | ? | Must manually list every model for local/OpenAI-compatible providers |  | [opencode#6231](https://github.com/anomalyco/opencode/issues/6231) | · |
| A-0025 | 242 | 3 | claude-code | ? | Desktop app can't use a company cloud backend (Bedrock) like the CLI can |  | [claude-code#32668](https://github.com/anthropics/claude-code/issues/32668) | · |
| A-0047 | 203 | 3 | codex | ? | Windows users can't install from the Microsoft Store; no standalone installer |  | [codex#13993](https://github.com/openai/codex/issues/13993) | · |
| A-0056 | 138 | 4 | codex | ? | Phone verification breaks login on a new device |  | [codex#20161](https://github.com/openai/codex/issues/20161) | · |
| A-0365 | 87 | 2 | zed | ? | No settings sync across machines |  | [zed#59978](https://github.com/zed-industries/zed/issues/59978) | · |
| A-0366 | 53 | 2 | zed | ? | SSH/GPG agents not forwarded into dev containers |  | [zed#47121](https://github.com/zed-industries/zed/issues/47121) | · |
| A-0003 | 43 | 2 | pi | ? | Hooking the agent to local models (llama.cpp/Ollama/LM Studio) needs manual model lists |  | [pi#3357](https://github.com/earendil-works/pi/issues/3357) | · |
| A-0375 | 37 | 3 | zed | ? | Installing extensions broken |  | [zed#54280](https://github.com/zed-industries/zed/issues/54280) | · |
| A-0077 | 36 | 2 | gemini-cli | ? | Can't choose priority pay-as-you-go tier via the company cloud |  | [gemini-cli#21390](https://github.com/google-gemini/gemini-cli/issues/21390) | · |
| A-0380 | 33 | 2 | zed | ? | API key for an edit-prediction provider not picked up |  | [zed#46506](https://github.com/zed-industries/zed/issues/46506) | · |
| A-0540 | 31 | 1 | litellm | ? | New Python version not supported |  | [litellm#26343](https://github.com/BerriAI/litellm/issues/26343) | · |
| A-0385 | 30 | 3 | zed | ? | Sign-in button for a provider doesn't work |  | [zed#47352](https://github.com/zed-industries/zed/issues/47352) | · |
| A-0389 | 29 | 1 | zed | ? | Config in a symlinked folder doesn't reload |  | [zed#48729](https://github.com/zed-industries/zed/issues/48729) | · |
| A-0084 | 27 | 4 | gemini-cli | ? | Can't complete sign-in in the VS Code extension |  | [gemini-cli#10918](https://github.com/google-gemini/gemini-cli/issues/10918) | · |
| A-0482 | 26 | 3 | vibe-kanban | ? | Self-hosted GitLab not supported (diff, PRs don't work) |  | [vibe-kanban#1697](https://github.com/BloopAI/vibe-kanban/issues/1697) | · |
| A-0092 | 24 | 3 | gemini-cli | ? | MCP servers stuck 'connecting' in the IDE extension |  | [gemini-cli#18987](https://github.com/google-gemini/gemini-cli/issues/18987) | · |
| A-0126 | 20 | 1 | pi | ? | No Nix packaging |  | [pi#2310](https://github.com/earendil-works/pi/issues/2310) | · |
| A-0274 | 18 | 2 | kilo | ? | Hard-coded model names block Anthropic-compatible providers |  | [kilocode#3545](https://github.com/Kilo-Org/kilocode/issues/3545) | · |
| A-0131 | 15 | 2 | pi | ? | Can't set a local model as the default |  | [pi#6922](https://github.com/earendil-works/pi/issues/6922) | · |
| A-0133 | 15 | 2 | pi | ? | Missing provider for a company cloud endpoint |  | [pi#5363](https://github.com/earendil-works/pi/issues/5363) | · |
| A-0331 | 14 | 1 | goose | ? | No Flatpak package for Linux desktop |  | [goose#6602](https://github.com/aaif-goose/goose/issues/6602) | · |
| A-0136 | 13 | 2 | pi | ? | Repeated 'trust this folder?' prompts annoy users who know their projects |  | [pi#5514](https://github.com/earendil-works/pi/issues/5514) | · |
| A-0559 | 13 | 1 | litellm | ? | Unexpected dependency pinning change |  | [litellm#25280](https://github.com/BerriAI/litellm/issues/25280) | · |
| A-0561 | 13 | 2 | litellm | ? | No automatic model discovery for custom providers |  | [litellm#20064](https://github.com/BerriAI/litellm/issues/20064) | · |
| A-0135 | 12 | 3 | pi | ? | Update breaks extensions (missing module) |  | [pi#1820](https://github.com/earendil-works/pi/issues/1820) | · |
| A-0285 | 11 | 1 | kilo | ? | Settings not carried over between the extension and the CLI |  | [kilocode#3063](https://github.com/Kilo-Org/kilocode/issues/3063) | · |
| A-0165 | 10 | 4 | omp | ? | Update leaves the CLI unable to start |  | [oh-my-pi#116](https://github.com/can1357/oh-my-pi/issues/116) | · |
| A-0167 | 10 | 2 | omp | ? | Can't reach some frontier models via the company cloud API |  | [oh-my-pi#1732](https://github.com/can1357/oh-my-pi/issues/1732) | · |
| A-0216 | 10 | 2 | cline | ? | Can't use an authenticated local model server |  | [cline#9668](https://github.com/cline/cline/issues/9668) | · |
| A-0143 | 9 | 3 | pi | ? | Global install breaks extension loading after an update |  | [pi#1831](https://github.com/earendil-works/pi/issues/1831) | · |
| A-0171 | 9 | 1 | omp | ? | Local inference server not recognised |  | [oh-my-pi#1957](https://github.com/can1357/oh-my-pi/issues/1957) | · |
| A-0217 | 9 | 3 | cline | ? | Company cloud provider can't be configured in the CLI |  | [cline#6958](https://github.com/cline/cline/issues/6958) | · |
| A-0291 | 9 | 4 | kilo | ? | Sign-in fails with a 403 |  | [kilocode#8148](https://github.com/Kilo-Org/kilocode/issues/8148) | · |
| A-0492 | 9 | 1 | vibe-kanban | ? | Issues from GitHub not imported as tasks |  | [vibe-kanban#1677](https://github.com/BloopAI/vibe-kanban/issues/1677) | · |
| A-0173 | 8 | 2 | omp | ? | Popular provider not built in; manual config needed |  | [oh-my-pi#830](https://github.com/can1357/oh-my-pi/issues/830) | · |
| A-0220 | 8 | 2 | cline | ? | Missing option needed to use a model via company cloud |  | [cline#7658](https://github.com/cline/cline/issues/7658) | · |
| A-0453 | 8 | 3 | claude-squad | ? | New worktrees lack untracked setup (node_modules, env files, ports) |  | [claude-squad#260](https://github.com/smtg-ai/claude-squad/issues/260) | · |
| A-0224 | 7 | 3 | cline | ? | CLI fails to start |  | [cline#7011](https://github.com/cline/cline/issues/7011) | · |
| A-0225 | 7 | 3 | cline | ? | MCP connection broken after an IDE update |  | [cline#7577](https://github.com/cline/cline/issues/7577) | · |
| A-0333 | 7 | 2 | goose | ? | Can't change context limit for a custom provider in the UI |  | [goose#8780](https://github.com/aaif-goose/goose/issues/8780) | · |
| A-0391 | 7 | 2 | openhands | ? | Self-hosted git server not supported |  | [OpenHands#12351](https://github.com/OpenHands/OpenHands/issues/12351) | · |
| A-0499 | 7 | 1 | vibe-kanban | pm | No issue-tracker integration (Linear/Jira/Trello) |  | [vibe-kanban#2159](https://github.com/BloopAI/vibe-kanban/issues/2159) | · |
| A-0504 | 7 | 1 | vibe-kanban | ? | Can't choose where worktrees are stored |  | [vibe-kanban#1830](https://github.com/BloopAI/vibe-kanban/issues/1830) | · |
| A-0508 | 7 | 1 | vibe-kanban | devops | No published container image for self-hosting |  | [vibe-kanban#2471](https://github.com/BloopAI/vibe-kanban/issues/2471) | · |
| A-0511 | 7 | 3 | crystal | ? | App crashes on first run on macOS |  | [crystal#208](https://github.com/stravu/crystal/issues/208) | · |
| A-0311 | 6 | 1 | continue | ? | Multiple configs poorly documented |  | [continue#8484](https://github.com/continuedev/continue/issues/8484) | · |
| A-0392 | 6 | 2 | openhands | ? | Can't complete OAuth for MCP servers from the GUI |  | [OpenHands#11881](https://github.com/OpenHands/OpenHands/issues/11881) | · |
| A-0338 | 5 | 3 | goose | ? | CLI won't launch (terminal errors) |  | [goose#8727](https://github.com/aaif-goose/goose/issues/8727) | · |
| A-0393 | 5 | 2 | openhands | ? | Config file silently ignored in Docker; wastes time |  | [OpenHands#11928](https://github.com/OpenHands/OpenHands/issues/11928) | · |
| A-0252 | 4 | 2 | roo | ? | Can't use Anthropic-compatible providers with custom model names |  | [Roo-Code#9093](https://github.com/RooCodeInc/Roo-Code/issues/9093) | · |
| A-0343 | 4 | 2 | goose | ? | Configure quietly fails for an agent-protocol provider |  | [goose#8373](https://github.com/aaif-goose/goose/issues/8373) | · |
| A-0345 | 4 | 2 | goose | ? | Setting to disable the keyring ignored on Linux |  | [goose#6287](https://github.com/aaif-goose/goose/issues/6287) | · |
| A-0347 | 4 | 2 | goose | ? | MCP client fails to connect to a server |  | [goose#6576](https://github.com/aaif-goose/goose/issues/6576) | · |
| A-0348 | 4 | 2 | goose | ? | Install fails on Windows 11 with Git Bash |  | [goose#5910](https://github.com/aaif-goose/goose/issues/5910) | · |
| A-0397 | 4 | 2 | openhands | ? | Docs refer to a config file that Docker ignores |  | [OpenHands#11927](https://github.com/OpenHands/OpenHands/issues/11927) | · |
| A-0398 | 4 | 2 | openhands | ? | Corporate SSL certificates hard to debug |  | [OpenHands#11506](https://github.com/OpenHands/OpenHands/issues/11506) | · |
| A-0399 | 4 | 3 | openhands | ? | Mac installer produces a damaged app |  | [OpenHands#16774](https://github.com/OpenHands/OpenHands/issues/16774) | · |
| A-0258 | 3 | 2 | roo | ? | No first-class support for a company cloud endpoint |  | [Roo-Code#9940](https://github.com/RooCodeInc/Roo-Code/issues/9940) | · |
| A-0326 | 3 | 2 | continue | ? | MCP doesn't work on a remote server |  | [continue#8732](https://github.com/continuedev/continue/issues/8732) | · |
| A-0327 | 3 | 2 | continue | ? | MCP servers fail to start in WSL |  | [continue#9151](https://github.com/continuedev/continue/issues/9151) | · |
| A-0354 | 3 | 3 | goose | ? | Install script fails (broken download link) |  | [goose#6858](https://github.com/aaif-goose/goose/issues/6858) | · |
| A-0355 | 3 | 2 | goose | ? | Terminal integration setup fails with a syntax error |  | [goose#6142](https://github.com/aaif-goose/goose/issues/6142) | · |
| A-0357 | 3 | 2 | goose | ? | Company cloud API-key auth not supported |  | [goose#6577](https://github.com/aaif-goose/goose/issues/6577) | · |
| A-0402 | 3 | 2 | openhands | ? | Web interface can't be used from another machine |  | [OpenHands#12679](https://github.com/OpenHands/OpenHands/issues/12679) | · |
| A-0404 | 3 | 2 | openhands | ? | No easy way to open a repo from a git provider in local mode |  | [OpenHands#15758](https://github.com/OpenHands/OpenHands/issues/15758) | · |
| A-0192 | 2 | 1 | aider | ? | Voice mode fails with an undocumented error; wants local-only option |  | [aider#4980](https://github.com/Aider-AI/aider/issues/4980) | · |
| A-0194 | 2 | 2 | aider | ? | Can't cap context size for a local GPU; must check tokens manually | Checks /tokens by hand | [aider#4583](https://github.com/Aider-AI/aider/issues/4583) | · |
| A-0408 | 2 | 3 | openhands | ? | Sandbox fails to start within 120 s |  | [OpenHands#12495](https://github.com/OpenHands/OpenHands/issues/12495) | · |
| A-0409 | 2 | 2 | openhands | ? | Long local-model requests time out; settings not passed through |  | [OpenHands#12854](https://github.com/OpenHands/OpenHands/issues/12854) | · |
| A-0411 | 2 | 2 | openhands | ? | Custom provider URL setup fails with a confusing error |  | [OpenHands#11608](https://github.com/OpenHands/OpenHands/issues/11608) | · |
| A-0412 | 2 | 3 | openhands | ? | Sandbox fails to start |  | [OpenHands#12528](https://github.com/OpenHands/OpenHands/issues/12528) | · |
| A-0417 | 2 | 3 | openhands | devops | Agent containers can't reach the host in a LAN deployment |  | [OpenHands#12229](https://github.com/OpenHands/OpenHands/issues/12229) | · |
| A-0418 | 2 | 1 | openhands | ? | Can't save environment variables for the agent |  | [OpenHands#12359](https://github.com/OpenHands/OpenHands/issues/12359) | · |
| A-0436 | 2 | 2 | copilot | ? | MCP servers don't auto-start despite config |  | [vscode-copilot-release#14166](https://github.com/microsoft/vscode-copilot-release/issues/14166) | · |
| A-0456 | 2 | 1 | claude-squad | ? | Config folder path hard-coded |  | [claude-squad#245](https://github.com/smtg-ai/claude-squad/issues/245) | · |
| A-0195 | 1 | 2 | aider | ? | Install via a package manager fails |  | [aider#4705](https://github.com/Aider-AI/aider/issues/4705) | · |
| A-0202 | 1 | 2 | aider | ? | Environment variable breaks the installed tool |  | [aider#4770](https://github.com/Aider-AI/aider/issues/4770) | · |
| A-0203 | 1 | 3 | aider | ? | Setup needs a paid key upfront, outdated model list, settings lost on exit (accessibility user) |  | [aider#4781](https://github.com/Aider-AI/aider/issues/4781) | · |
| A-0208 | 1 | 2 | aider | student | Install guide confusing for new users |  | [aider#5115](https://github.com/Aider-AI/aider/issues/5115) | · |
| A-0209 | 1 | 2 | aider | ? | Error message and docs for provider setup make no sense |  | [aider#4638](https://github.com/Aider-AI/aider/issues/4638) | · |
| A-0416 | 1 | 2 | openhands | ? | Self-hosted git over HTTP fails because the sandbox forces HTTPS |  | [OpenHands#12358](https://github.com/OpenHands/OpenHands/issues/12358) | · |
| A-0513 | 1 | 3 | crystal | ? | Orchestrator can't start the agent even though it works in the terminal |  | [crystal#228](https://github.com/stravu/crystal/issues/228) | · |
| A-0464 | 0 | 1 | claude-squad | ? | Tied to one terminal multiplexer |  | [claude-squad#229](https://github.com/smtg-ai/claude-squad/issues/229) | · |
| A-0467 | 0 | 2 | claude-squad | ? | New sessions don't inherit custom environment variables |  | [claude-squad#277](https://github.com/smtg-ai/claude-squad/issues/277) | · |
| A-0477 | 0 | 1 | claude-squad | ? | Unclear how to run sessions with a cloud model provider |  | [claude-squad#311](https://github.com/smtg-ai/claude-squad/issues/311) | · |
| A-0514 | 0 | 2 | crystal | ? | Can't set custom env vars for the agent (to use cheaper compatible models) |  | [crystal#203](https://github.com/stravu/crystal/issues/203) | · |
| A-0519 | 0 | 2 | crystal | da | Can't use the orchestrator on non-git folders (analysis work) |  | [crystal#217](https://github.com/stravu/crystal/issues/217) | · |
| A-0520 | 0 | 1 | crystal | ? | Worktree naming, .gitignore and cleanup not configurable |  | [crystal#213](https://github.com/stravu/crystal/issues/213) | · |
| A-0522 | 0 | 2 | crystal | ? | Globally configured MCP servers not picked up, plus UI issues |  | [crystal#223](https://github.com/stravu/crystal/issues/223) | · |
| A-0530 | 0 | 2 | crystal | ? | Package name clashes with an existing system package |  | [crystal#236](https://github.com/stravu/crystal/issues/236) | · |

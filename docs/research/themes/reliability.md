---
type: "research-theme"
theme: "reliability"
rows: 162
upvotes: 2436
avg_severity: 2.7
generated: "2026-10-08"
tags: ["research", "theme", "theme/reliability"]
---

# Theme: reliability

> [!info] Errors, hangs, crashes, broken after an update
> **162** problems · **2436** 👍 · average severity **2.7** / 5 · rank **#8** of 24

Back to [[Pain log]] · [[synthesis]] · [[Research Home]]

## Tools most affected
- cline: 17
- copilot: 17
- roo: 13
- continue: 13
- litellm: 12
- gemini-cli: 11
- claude-squad: 10
- goose: 10

## Workarounds people use (2)
- **A-0083** (28 👍): Downgrade to the previous version
- **A-0256** (3 👍): Stay on the older version

## Netheron ideas noted while labeling (3)
- **A-0110**: Cross-vendor failover (Netheron already does 429 failover)
- **A-0088**: Automatic failover to another provider/agent
- **A-0240**: Netheron hands off between vendors via memory, not raw transcripts

## All problems (sorted by 👍)

Checked: ✅ verified by you · 🔁 rechecked by an agent · · not yet

| ID | 👍 | Sev | Tool | Role | Problem | Workaround | Source | Checked |
|---|---|---|---|---|---|---|---|---|
| A-0027 | 238 | 3 | claude-code | ? | Tool-use concurrency causes API 400 errors that break the conversation |  | [claude-code#8763](https://github.com/anthropics/claude-code/issues/8763) | · |
| A-0051 | 170 | 2 | codex | ? | Connection drops and falls back to slower transport |  | [codex#13041](https://github.com/openai/codex/issues/13041) | · |
| A-0058 | 128 | 3 | codex | ? | Diff view crashes in VS Code, so changes can't be reviewed |  | [codex#35058](https://github.com/openai/codex/issues/35058) | · |
| A-0110 | 119 | 3 | opencode | ? | No automatic fallback to a different model when one fails |  | [opencode#7602](https://github.com/anomalyco/opencode/issues/7602) | · |
| A-0067 | 86 | 4 | gemini-cli | ? | Every request fails with an API error |  | [gemini-cli#18621](https://github.com/google-gemini/gemini-cli/issues/18621) | · |
| A-0271 | 65 | 3 | kilo | ? | Provider-required header missing, breaking requests for many orgs |  | [kilocode#13723](https://github.com/Kilo-Org/kilocode/issues/13723) | · |
| A-0534 | 52 | 3 | litellm | ? | Provider-required header missing, breaking requests for many orgs |  | [litellm#39503](https://github.com/BerriAI/litellm/issues/39503) | · |
| A-0071 | 50 | 3 | gemini-cli | ? | Request gets stuck forever after cancelling |  | [gemini-cli#21096](https://github.com/google-gemini/gemini-cli/issues/21096) | · |
| A-0368 | 45 | 3 | zed | ? | External agents stopped working with multi-folder workspaces after an update |  | [zed#54480](https://github.com/zed-industries/zed/issues/54480) | · |
| A-0369 | 43 | 3 | zed | ? | External agent integration broke after the agent auto-updated |  | [zed#43025](https://github.com/zed-industries/zed/issues/43025) | · |
| A-0370 | 43 | 3 | zed | ? | Editor breaks system-wide copy/paste |  | [zed#58651](https://github.com/zed-industries/zed/issues/58651) | · |
| A-0074 | 38 | 4 | gemini-cli | ? | 'Usage limit reached' shown despite only 1-8% usage |  | [gemini-cli#28761](https://github.com/google-gemini/gemini-cli/issues/28761) | · |
| A-0075 | 37 | 4 | gemini-cli | ? | Tool 'thinks' 10+ minutes and times out constantly |  | [gemini-cli#23795](https://github.com/google-gemini/gemini-cli/issues/23795) | · |
| A-0375 | 37 | 3 | zed | ? | Installing extensions broken |  | [zed#54280](https://github.com/zed-industries/zed/issues/54280) | · |
| A-0377 | 35 | 3 | zed | ? | Thinking mode breaks the file-edit tool |  | [zed#54036](https://github.com/zed-industries/zed/issues/54036) | · |
| A-0537 | 35 | 2 | litellm | ? | Documentation site down |  | [litellm#22554](https://github.com/BerriAI/litellm/issues/22554) | · |
| A-0124 | 34 | 3 | pi | ? | Agent stuck on 'Working...' with no output or error |  | [pi#4945](https://github.com/earendil-works/pi/issues/4945) | · |
| A-0381 | 33 | 1 | zed | ? | AI commit-message generation disabled/broken |  | [zed#49222](https://github.com/zed-industries/zed/issues/49222) | · |
| A-0382 | 32 | 2 | zed | ? | Edit predictions broken after an update |  | [zed#46880](https://github.com/zed-industries/zed/issues/46880) | · |
| A-0383 | 32 | 3 | zed | ? | A model via a subscription fails after tool calls |  | [zed#43024](https://github.com/zed-industries/zed/issues/43024) | · |
| A-0541 | 30 | 3 | litellm | ? | Coding agent breaks through the gateway with a provider due to thinking format |  | [litellm#20743](https://github.com/BerriAI/litellm/issues/20743) | · |
| A-0386 | 29 | 3 | zed | ? | Messages sent to an external agent while it works are silently swallowed |  | [zed#47928](https://github.com/zed-industries/zed/issues/47928) | · |
| A-0083 | 28 | 3 | gemini-cli | ? | New version extremely slow; fixed only by downgrading | Downgrade to the previous version | [gemini-cli#24294](https://github.com/google-gemini/gemini-cli/issues/24294) | · |
| A-0086 | 27 | 3 | gemini-cli | ? | CLI hangs indefinitely, possibly in a retry loop |  | [gemini-cli#22415](https://github.com/google-gemini/gemini-cli/issues/22415) | · |
| A-0543 | 26 | 2 | litellm | ? | Chat UI page returns 404 |  | [litellm#24037](https://github.com/BerriAI/litellm/issues/24037) | · |
| A-0087 | 25 | 3 | gemini-cli | ? | First run fails with an empty-response API error |  | [gemini-cli#10672](https://github.com/google-gemini/gemini-cli/issues/10672) | · |
| A-0088 | 25 | 3 | gemini-cli | ? | Work stops mid-task due to provider 'high demand' |  | [gemini-cli#15481](https://github.com/google-gemini/gemini-cli/issues/15481) | · |
| A-0544 | 25 | 3 | litellm | ? | Model fails in multi-turn because reasoning data is stripped |  | [litellm#26395](https://github.com/BerriAI/litellm/issues/26395) | · |
| A-0090 | 24 | 3 | gemini-cli | ? | Very slow responses and frequent 'high demand' errors |  | [gemini-cli#15397](https://github.com/google-gemini/gemini-cli/issues/15397) | · |
| A-0091 | 24 | 3 | gemini-cli | ? | Extremely high latency or no response from the model |  | [gemini-cli#22160](https://github.com/google-gemini/gemini-cli/issues/22160) | · |
| A-0092 | 24 | 3 | gemini-cli | ? | MCP servers stuck 'connecting' in the IDE extension |  | [gemini-cli#18987](https://github.com/google-gemini/gemini-cli/issues/18987) | · |
| A-0545 | 22 | 3 | litellm | ? | Accumulated bugs; users ask to stabilise instead of adding features |  | [litellm#24825](https://github.com/BerriAI/litellm/issues/24825) | · |
| A-0125 | 20 | 3 | pi | ? | Auto-compaction doesn't trigger, context overflows in long runs |  | [pi#6879](https://github.com/earendil-works/pi/issues/6879) | · |
| A-0127 | 19 | 3 | pi | ? | Context compaction fails with an enterprise provider |  | [pi#6768](https://github.com/earendil-works/pi/issues/6768) | · |
| A-0155 | 19 | 3 | omp | ? | Wrong 'quota exhausted' errors while quota remains |  | [oh-my-pi#11689](https://github.com/can1357/oh-my-pi/issues/11689) | · |
| A-0128 | 18 | 3 | pi | ? | A model breaks with a reasoning-format error on a subscription provider |  | [pi#4251](https://github.com/earendil-works/pi/issues/4251) | · |
| A-0547 | 18 | 4 | litellm | ? | Silent switch of API type overnight caused failures |  | [litellm#16810](https://github.com/BerriAI/litellm/issues/16810) | · |
| A-0211 | 17 | 4 | cline | ? | All models fail with 'not supported' via the IDE's model API |  | [cline#7228](https://github.com/cline/cline/issues/7228) | · |
| A-0212 | 17 | 4 | cline | ? | Every request fails via the IDE's model API |  | [cline#7229](https://github.com/cline/cline/issues/7229) | · |
| A-0548 | 17 | 3 | litellm | ? | Model IDs from a router stopped working after an update |  | [litellm#22667](https://github.com/BerriAI/litellm/issues/22667) | · |
| A-0551 | 16 | 3 | litellm | ? | Coding agent requests fail through the gateway because of a beta header |  | [litellm#19984](https://github.com/BerriAI/litellm/issues/19984) | · |
| A-0278 | 14 | 2 | kilo | ? | Frequent 'task file not found' errors since a major version |  | [kilocode#5475](https://github.com/Kilo-Org/kilocode/issues/5475) | · |
| A-0422 | 14 | 3 | copilot | ? | Assistant suddenly stops responding |  | [vscode-copilot-release#14053](https://github.com/microsoft/vscode-copilot-release/issues/14053) | · |
| A-0451 | 14 | 3 | claude-squad | ? | Orchestrator errors capturing terminal output on start |  | [claude-squad#216](https://github.com/smtg-ai/claude-squad/issues/216) | · |
| A-0556 | 14 | 3 | litellm | ? | Tools not translated correctly for a model via company cloud |  | [litellm#15164](https://github.com/BerriAI/litellm/issues/15164) | · |
| A-0557 | 14 | 3 | litellm | ? | Coding agent hits sporadic schema errors through the gateway |  | [litellm#16679](https://github.com/BerriAI/litellm/issues/16679) | · |
| A-0159 | 13 | 4 | omp | ? | Update makes the app crash immediately |  | [oh-my-pi#651](https://github.com/can1357/oh-my-pi/issues/651) | · |
| A-0280 | 13 | 3 | kilo | ? | Cloud model provider broke after an update |  | [kilocode#4331](https://github.com/Kilo-Org/kilocode/issues/4331) | · |
| A-0281 | 13 | 4 | kilo | ? | Major update made the tool slow, buggy, duplicated code, lost checkpoints |  | [kilocode#8364](https://github.com/Kilo-Org/kilocode/issues/8364) | · |
| A-0488 | 13 | 3 | vibe-kanban | ? | External agent server exits before starting |  | [vibe-kanban#2077](https://github.com/BloopAI/vibe-kanban/issues/2077) | · |
| A-0560 | 13 | 2 | litellm | ? | Requests rejected for extra fields when routing |  | [litellm#23741](https://github.com/BerriAI/litellm/issues/23741) | · |
| A-0135 | 12 | 3 | pi | ? | Update breaks extensions (missing module) |  | [pi#1820](https://github.com/earendil-works/pi/issues/1820) | · |
| A-0139 | 11 | 3 | pi | ? | Context compaction breaks on some subscription models |  | [pi#6477](https://github.com/earendil-works/pi/issues/6477) | · |
| A-0165 | 10 | 4 | omp | ? | Update leaves the CLI unable to start |  | [oh-my-pi#116](https://github.com/can1357/oh-my-pi/issues/116) | · |
| A-0214 | 10 | 4 | cline | ? | Cancelling a task leaves .git renamed to .git_disabled |  | [cline#6625](https://github.com/cline/cline/issues/6625) | · |
| A-0423 | 10 | 2 | copilot | ? | Terminal tool drops commands after a heredoc |  | [vscode-copilot-release#14124](https://github.com/microsoft/vscode-copilot-release/issues/14124) | · |
| A-0143 | 9 | 3 | pi | ? | Global install breaks extension loading after an update |  | [pi#1831](https://github.com/earendil-works/pi/issues/1831) | · |
| A-0147 | 9 | 2 | pi | ? | Terminal UI output gets garbled during streaming |  | [pi#8584](https://github.com/earendil-works/pi/issues/8584) | · |
| A-0168 | 9 | 3 | omp | ? | Provider returns quota errors only with this agent's large system prompt |  | [oh-my-pi#11704](https://github.com/can1357/oh-my-pi/issues/11704) | · |
| A-0219 | 9 | 3 | cline | ? | Plugin window empty after an IDE update |  | [cline#12361](https://github.com/cline/cline/issues/12361) | · |
| A-0243 | 9 | 3 | roo | ? | A new model fails to call tools in this agent |  | [Roo-Code#8702](https://github.com/RooCodeInc/Roo-Code/issues/8702) | · |
| A-0289 | 9 | 3 | kilo | ? | API requests fail silently with no error shown |  | [kilocode#4262](https://github.com/Kilo-Org/kilocode/issues/4262) | · |
| A-0290 | 9 | 2 | kilo | ? | CLI breaks after the computer wakes from sleep |  | [kilocode#5917](https://github.com/Kilo-Org/kilocode/issues/5917) | · |
| A-0294 | 9 | 3 | kilo | ? | Model hits its output limit while reasoning and produces nothing usable |  | [kilocode#10558](https://github.com/Kilo-Org/kilocode/issues/10558) | · |
| A-0303 | 9 | 3 | continue | ? | Commands don't run in remote terminals (SSH, dev containers) |  | [continue#10542](https://github.com/continuedev/continue/issues/10542) | · |
| A-0493 | 9 | 4 | vibe-kanban | ? | Data inaccessible after an update (time-outs loading projects) |  | [vibe-kanban#2838](https://github.com/BloopAI/vibe-kanban/issues/2838) | · |
| A-0150 | 8 | 3 | pi | ? | Provider rejects requests with a reasoning-field error |  | [pi#4514](https://github.com/earendil-works/pi/issues/4514) | · |
| A-0176 | 8 | 3 | omp | ? | Incorrect quota-exhausted errors persist after a fix |  | [oh-my-pi#12655](https://github.com/can1357/oh-my-pi/issues/12655) | · |
| A-0221 | 8 | 3 | cline | ? | Configured 1M context silently capped at 128K; tool-parsing failures |  | [cline#10551](https://github.com/cline/cline/issues/10551) | · |
| A-0222 | 8 | 3 | cline | ? | Repeated empty/unparsable responses on large file writes |  | [cline#7262](https://github.com/cline/cline/issues/7262) | · |
| A-0296 | 8 | 2 | kilo | ? | Free model starts working then chokes on tool-call errors |  | [kilocode#3967](https://github.com/Kilo-Org/kilocode/issues/3967) | · |
| A-0298 | 8 | 2 | kilo | ? | Plugin runs commands in the wrong shell on macOS |  | [kilocode#2846](https://github.com/Kilo-Org/kilocode/issues/2846) | · |
| A-0305 | 8 | 2 | continue | ? | Responses from a local model server not detected |  | [continue#10113](https://github.com/continuedev/continue/issues/10113) | · |
| A-0332 | 8 | 3 | goose | ? | A model's reasoning protocol causes 400 errors on new sessions |  | [goose#10012](https://github.com/aaif-goose/goose/issues/10012) | · |
| A-0496 | 8 | 2 | vibe-kanban | ? | Agent SDK update breaks integration |  | [vibe-kanban#2794](https://github.com/BloopAI/vibe-kanban/issues/2794) | · |
| A-0223 | 7 | 3 | cline | ? | Update causes 400 errors on file reads |  | [cline#7545](https://github.com/cline/cline/issues/7545) | · |
| A-0224 | 7 | 3 | cline | ? | CLI fails to start |  | [cline#7011](https://github.com/cline/cline/issues/7011) | · |
| A-0225 | 7 | 3 | cline | ? | MCP connection broken after an IDE update |  | [cline#7577](https://github.com/cline/cline/issues/7577) | · |
| A-0226 | 7 | 2 | cline | ? | @file mentions stop finding files after an IDE update |  | [cline#11105](https://github.com/cline/cline/issues/11105) | · |
| A-0227 | 7 | 4 | cline | ? | IDE becomes unresponsive with a new extension version |  | [cline#11906](https://github.com/cline/cline/issues/11906) | · |
| A-0230 | 7 | 3 | cline | ? | A model returns repeated invalid responses after the first message |  | [cline#12385](https://github.com/cline/cline/issues/12385) | · |
| A-0306 | 7 | 3 | continue | ? | A model fails with a protocol error on tool calls |  | [continue#8785](https://github.com/continuedev/continue/issues/8785) | · |
| A-0511 | 7 | 3 | crystal | ? | App crashes on first run on macOS |  | [crystal#208](https://github.com/stravu/crystal/issues/208) | · |
| A-0237 | 6 | 3 | cline | ? | Saving a file sometimes broken (buttons disabled) |  | [cline#9790](https://github.com/cline/cline/issues/9790) | · |
| A-0238 | 6 | 2 | cline | ? | Skills work in the CLI but not in the IDE extension |  | [cline#12236](https://github.com/cline/cline/issues/12236) | · |
| A-0312 | 6 | 3 | continue | ? | Broken in VS Code remote SSH |  | [continue#8826](https://github.com/continuedev/continue/issues/8826) | · |
| A-0315 | 6 | 2 | continue | ? | Integration with a local LLM front-end broke after an update |  | [continue#8878](https://github.com/continuedev/continue/issues/8878) | · |
| A-0335 | 6 | 3 | goose | ? | Model via compatible provider fails because reasoning isn't handled |  | [goose#9041](https://github.com/aaif-goose/goose/issues/9041) | · |
| A-0426 | 6 | 3 | copilot | ? | Agent's question tool is always skipped; user never sees the question |  | [vscode-copilot-release#14105](https://github.com/microsoft/vscode-copilot-release/issues/14105) | · |
| A-0235 | 5 | 2 | cline | ? | Agent retries file writes with missing content |  | [cline#7998](https://github.com/cline/cline/issues/7998) | · |
| A-0239 | 5 | 2 | cline | ? | Kanban CLI crashes with a dependency error |  | [cline#9990](https://github.com/cline/cline/issues/9990) | · |
| A-0240 | 5 | 3 | cline | ? | Using different models for plan vs act causes API errors |  | [cline#7620](https://github.com/cline/cline/issues/7620) | · |
| A-0246 | 5 | 3 | roo | ? | Unknown API errors regardless of provider |  | [Roo-Code#10106](https://github.com/RooCodeInc/Roo-Code/issues/10106) | · |
| A-0317 | 5 | 3 | continue | ? | '.' treated as the filesystem root by the list tool |  | [continue#9135](https://github.com/continuedev/continue/issues/9135) | · |
| A-0318 | 5 | 3 | continue | ? | Writing code to a file fails |  | [continue#9045](https://github.com/continuedev/continue/issues/9045) | · |
| A-0320 | 5 | 2 | continue | ? | Local autocomplete broken |  | [continue#11954](https://github.com/continuedev/continue/issues/11954) | · |
| A-0338 | 5 | 3 | goose | ? | CLI won't launch (terminal errors) |  | [goose#8727](https://github.com/aaif-goose/goose/issues/8727) | · |
| A-0340 | 5 | 2 | goose | ? | Thinking mode errors with a model |  | [goose#8807](https://github.com/aaif-goose/goose/issues/8807) | · |
| A-0341 | 5 | 3 | goose | ? | Provider intermittently drops reasoning data, breaking tool calls |  | [goose#9397](https://github.com/aaif-goose/goose/issues/9397) | · |
| A-0342 | 5 | 3 | goose | ? | Model update breaks the provider config |  | [goose#9333](https://github.com/aaif-goose/goose/issues/9333) | · |
| A-0394 | 5 | 3 | openhands | ? | New conversation fails with a server error |  | [OpenHands#12083](https://github.com/OpenHands/OpenHands/issues/12083) | · |
| A-0248 | 4 | 2 | roo | ? | Proxy reports the wrong token limit, causing errors |  | [Roo-Code#8454](https://github.com/RooCodeInc/Roo-Code/issues/8454) | · |
| A-0250 | 4 | 2 | roo | ? | Local model server returns completion errors |  | [Roo-Code#10684](https://github.com/RooCodeInc/Roo-Code/issues/10684) | · |
| A-0251 | 4 | 3 | roo | ? | All models fail with 400 via the IDE's model API |  | [Roo-Code#8991](https://github.com/RooCodeInc/Roo-Code/issues/8991) | · |
| A-0255 | 4 | 2 | roo | ? | Model via router returns completion errors |  | [Roo-Code#10618](https://github.com/RooCodeInc/Roo-Code/issues/10618) | · |
| A-0322 | 4 | 2 | continue | ? | Autocomplete computed but not shown in the editor |  | [continue#8661](https://github.com/continuedev/continue/issues/8661) | · |
| A-0323 | 4 | 2 | continue | ? | Terminal output not captured in Docker after an IDE update |  | [continue#12102](https://github.com/continuedev/continue/issues/12102) | · |
| A-0344 | 4 | 2 | goose | ? | New provider API not supported, causing errors |  | [goose#5270](https://github.com/aaif-goose/goose/issues/5270) | · |
| A-0347 | 4 | 2 | goose | ? | MCP client fails to connect to a server |  | [goose#6576](https://github.com/aaif-goose/goose/issues/6576) | · |
| A-0395 | 4 | 3 | openhands | ? | CLI crashes when the model omits a required tool field |  | [OpenHands#11378](https://github.com/OpenHands/OpenHands/issues/11378) | · |
| A-0187 | 3 | 2 | aider | ? | Tool crashes on a specific language |  | [aider#4867](https://github.com/Aider-AI/aider/issues/4867) | · |
| A-0256 | 3 | 3 | roo | ? | Update forces a tool-calling format that breaks a self-hosted model | Stay on the older version | [Roo-Code#10319](https://github.com/RooCodeInc/Roo-Code/issues/10319) | · |
| A-0257 | 3 | 3 | roo | ? | Tool calls broke with a provider after an update |  | [Roo-Code#10349](https://github.com/RooCodeInc/Roo-Code/issues/10349) | · |
| A-0259 | 3 | 3 | roo | ? | Persistent schema error with a model |  | [Roo-Code#9583](https://github.com/RooCodeInc/Roo-Code/issues/9583) | · |
| A-0325 | 3 | 1 | continue | ? | UI error in JetBrains |  | [continue#8182](https://github.com/continuedev/continue/issues/8182) | · |
| A-0328 | 3 | 3 | continue | ? | Plugin fails to load in the newest IDE versions |  | [continue#13185](https://github.com/continuedev/continue/issues/13185) | · |
| A-0330 | 3 | 2 | continue | ? | Terminal tool fails in dev containers |  | [continue#11129](https://github.com/continuedev/continue/issues/11129) | · |
| A-0358 | 3 | 2 | goose | ? | Provider rejects tool-use message order |  | [goose#5998](https://github.com/aaif-goose/goose/issues/5998) | · |
| A-0360 | 3 | 3 | goose | ? | Tool calls fail mid-session on large payloads |  | [goose#8272](https://github.com/aaif-goose/goose/issues/8272) | · |
| A-0400 | 3 | 2 | openhands | ? | UI stuck 'Starting' when reopening an old conversation |  | [OpenHands#12684](https://github.com/OpenHands/OpenHands/issues/12684) | · |
| A-0431 | 3 | 2 | copilot | ? | Requests with a model fail with 400 |  | [vscode-copilot-release#14005](https://github.com/microsoft/vscode-copilot-release/issues/14005) | · |
| A-0432 | 3 | 2 | copilot | ? | Requests fail with server errors (503) |  | [vscode-copilot-release#14110](https://github.com/microsoft/vscode-copilot-release/issues/14110) | · |
| A-0190 | 2 | 2 | aider | ? | Can't read staged files with a newer git index version |  | [aider#4629](https://github.com/Aider-AI/aider/issues/4629) | · |
| A-0191 | 2 | 2 | aider | ? | Crash in the repo-map feature |  | [aider#4888](https://github.com/Aider-AI/aider/issues/4888) | · |
| A-0263 | 2 | 3 | roo | ? | Queued messages silently vanish |  | [Roo-Code#8536](https://github.com/RooCodeInc/Roo-Code/issues/8536) | · |
| A-0266 | 2 | 3 | roo | ? | Mixing models across modes breaks tool calls |  | [Roo-Code#10075](https://github.com/RooCodeInc/Roo-Code/issues/10075) | · |
| A-0267 | 2 | 2 | roo | ? | Model returns no assistant message |  | [Roo-Code#10337](https://github.com/RooCodeInc/Roo-Code/issues/10337) | · |
| A-0270 | 2 | 3 | roo | ? | Switching model mid-conversation causes an API error |  | [Roo-Code#9392](https://github.com/RooCodeInc/Roo-Code/issues/9392) | · |
| A-0408 | 2 | 3 | openhands | ? | Sandbox fails to start within 120 s |  | [OpenHands#12495](https://github.com/OpenHands/OpenHands/issues/12495) | · |
| A-0412 | 2 | 3 | openhands | ? | Sandbox fails to start |  | [OpenHands#12528](https://github.com/OpenHands/OpenHands/issues/12528) | · |
| A-0414 | 2 | 3 | openhands | ? | Non-localhost setup stopped working after a major version |  | [OpenHands#12072](https://github.com/OpenHands/OpenHands/issues/12072) | · |
| A-0420 | 2 | 3 | openhands | ? | GUI always shows 'Disconnected' with no error in logs |  | [OpenHands#12502](https://github.com/OpenHands/OpenHands/issues/12502) | · |
| A-0434 | 2 | 2 | copilot | ? | Requests fail repeatedly |  | [vscode-copilot-release#14102](https://github.com/microsoft/vscode-copilot-release/issues/14102) | · |
| A-0435 | 2 | 2 | copilot | ? | Assistant doesn't load; model not accessible |  | [vscode-copilot-release#14088](https://github.com/microsoft/vscode-copilot-release/issues/14088) | · |
| A-0436 | 2 | 2 | copilot | ? | MCP servers don't auto-start despite config |  | [vscode-copilot-release#14166](https://github.com/microsoft/vscode-copilot-release/issues/14166) | · |
| A-0437 | 2 | 3 | copilot | ? | Chat unavailable after an editor upgrade |  | [vscode-copilot-release#14157](https://github.com/microsoft/vscode-copilot-release/issues/14157) | · |
| A-0196 | 1 | 2 | aider | ? | Errors parsing streamed responses from a local/cloud model on Windows |  | [aider#4594](https://github.com/Aider-AI/aider/issues/4594) | · |
| A-0198 | 1 | 2 | aider | ? | Long waits on failed API calls because retries can't be configured |  | [aider#4659](https://github.com/Aider-AI/aider/issues/4659) | · |
| A-0439 | 1 | 2 | copilot | ? | 'Language model unavailable' on launch |  | [vscode-copilot-release#13995](https://github.com/microsoft/vscode-copilot-release/issues/13995) | · |
| A-0440 | 1 | 4 | copilot | ? | Agent stops mid-edit with an internal error and breaks the code |  | [vscode-copilot-release#13973](https://github.com/microsoft/vscode-copilot-release/issues/13973) | · |
| A-0443 | 1 | 2 | copilot | ? | Preview model fails consistently with 400 |  | [vscode-copilot-release#14143](https://github.com/microsoft/vscode-copilot-release/issues/14143) | · |
| A-0444 | 1 | 2 | copilot | ? | Requests fail |  | [vscode-copilot-release#14023](https://github.com/microsoft/vscode-copilot-release/issues/14023) | · |
| A-0445 | 1 | 1 | copilot | ? | Extension error on an editor preview build |  | [vscode-copilot-release#14154](https://github.com/microsoft/vscode-copilot-release/issues/14154) | · |
| A-0446 | 1 | 1 | copilot | ? | Extension error on an editor preview build (duplicate report) |  | [vscode-copilot-release#14155](https://github.com/microsoft/vscode-copilot-release/issues/14155) | · |
| A-0449 | 1 | 1 | copilot | ? | Chat extension incompatible with a preview editor version |  | [vscode-copilot-release#14156](https://github.com/microsoft/vscode-copilot-release/issues/14156) | · |
| A-0458 | 1 | 3 | claude-squad | ? | Creating a new instance fails with a fatal error |  | [claude-squad#231](https://github.com/smtg-ai/claude-squad/issues/231) | · |
| A-0512 | 1 | 4 | crystal | ? | Latest release broken on Mac (database error) |  | [crystal#210](https://github.com/stravu/crystal/issues/210) | · |
| A-0513 | 1 | 3 | crystal | ? | Orchestrator can't start the agent even though it works in the terminal |  | [crystal#228](https://github.com/stravu/crystal/issues/228) | · |
| A-0450 | 0 | 2 | copilot | ? | Network time-outs in agent mode blamed on the user's connection |  | [vscode-copilot-release#13971](https://github.com/microsoft/vscode-copilot-release/issues/13971) | · |
| A-0461 | 0 | 3 | claude-squad | ? | Prompt is sent before the agent CLI is ready, so it's lost |  | [claude-squad#266](https://github.com/smtg-ai/claude-squad/issues/266) | · |
| A-0462 | 0 | 2 | claude-squad | ? | Branch names break on Windows domain usernames |  | [claude-squad#220](https://github.com/smtg-ai/claude-squad/issues/220) | · |
| A-0463 | 0 | 3 | claude-squad | ? | Can't create new instances; terminal capture errors |  | [claude-squad#218](https://github.com/smtg-ai/claude-squad/issues/218) | · |
| A-0465 | 0 | 2 | claude-squad | ? | Creating a new instance fails (duplicate report) |  | [claude-squad#230](https://github.com/smtg-ai/claude-squad/issues/230) | · |
| A-0470 | 0 | 2 | claude-squad | ? | Pausing a session can leave it in a broken state |  | [claude-squad#284](https://github.com/smtg-ai/claude-squad/issues/284) | · |
| A-0476 | 0 | 3 | claude-squad | ? | Can't type prompts when running a different agent inside the orchestrator |  | [claude-squad#232](https://github.com/smtg-ai/claude-squad/issues/232) | · |
| A-0479 | 0 | 4 | claude-squad | ? | Windows build fails on creating any session |  | [claude-squad#275](https://github.com/smtg-ai/claude-squad/issues/275) | · |
| A-0480 | 0 | 2 | claude-squad | ? | Keyboard input silently swallowed while attached |  | [claude-squad#325](https://github.com/smtg-ai/claude-squad/issues/325) | · |
| A-0517 | 0 | 2 | crystal | ? | Bad commit messages; push gets stuck |  | [crystal#222](https://github.com/stravu/crystal/issues/222) | · |
| A-0518 | 0 | 1 | crystal | ? | Error logs leak at the end of every session |  | [crystal#216](https://github.com/stravu/crystal/issues/216) | · |
| A-0521 | 0 | 3 | crystal | ? | Permission mode reverts by itself and tasks hang |  | [crystal#221](https://github.com/stravu/crystal/issues/221) | · |
| A-0525 | 0 | 2 | crystal | ? | New session error |  | [crystal#226](https://github.com/stravu/crystal/issues/226) | · |
| A-0528 | 0 | 3 | crystal | ? | Auto-context feature bleeds prompts into the agent's main workspace |  | [crystal#233](https://github.com/stravu/crystal/issues/233) | · |

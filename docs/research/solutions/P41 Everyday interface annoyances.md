---
type: "solution"
id: "P41"
title: "Everyday interface annoyances"
themes: ["ux", "reliability", "models"]
problems: 38
upvotes: 1454
can_incorporate: "partly"
options: 2
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0019", "A-0095", "A-0098", "A-0104", "A-0059", "A-0063", "A-0367", "A-0370", "A-0381", "A-0080", "A-0388", "A-0301", "A-0158", "A-0157", "A-0279", "A-0162", "A-0283", "A-0172", "A-0147", "A-0218", "A-0179", "A-0425", "A-0308", "A-0313", "A-0237", "A-0321", "A-0254", "A-0351", "A-0322", "A-0359", "A-0329", "A-0407", "A-0197", "A-0515", "A-0472", "A-0466", "A-0516", "A-0529"]
tags: ["research", "solution", "theme/ux", "theme/reliability", "theme/models"]
updated: "2026-10-08"
---
# P41 · Everyday interface annoyances

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/ux|ux]] · [[themes/reliability|reliability]] · [[themes/models|models]]

> [!question] The problem
> Copy/paste adds junk, collapsed pastes, unreadable tables, flicker, scroll problems, missing new-line keys, no task renaming, no voice input, deletion without confirmation.
>
> **38 problems · 1454 👍** · tools: continue (6), omp (5), zed (4), opencode (3), crystal (3)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0019 | 299 | claude-code | Copying text from the terminal UI includes unwanted indentation and spaces |  | [claude-code#18170](https://github.com/anthropics/claude-code/issues/18170) |
| A-0095 | 244 | opencode | Pasted text is collapsed and can't be expanded to check it |  | [opencode#8501](https://github.com/anomalyco/opencode/issues/8501) |
| A-0098 | 175 | opencode | No voice input for prompts |  | [opencode#4695](https://github.com/anomalyco/opencode/issues/4695) |
| A-0104 | 130 | opencode | Copy to clipboard doesn't work |  | [opencode#4283](https://github.com/anomalyco/opencode/issues/4283) |
| A-0059 | 126 | codex | Generated markdown tables are unreadable |  | [codex#8259](https://github.com/openai/codex/issues/8259) |

> [!example]- All 38 problems in this cluster (click to open)
> - **A-0019** · 299 👍 · claude-code: Copying text from the terminal UI includes unwanted indentation and spaces · [claude-code#18170](https://github.com/anthropics/claude-code/issues/18170)
> - **A-0095** · 244 👍 · opencode: Pasted text is collapsed and can't be expanded to check it · [opencode#8501](https://github.com/anomalyco/opencode/issues/8501)
> - **A-0098** · 175 👍 · opencode: No voice input for prompts · [opencode#4695](https://github.com/anomalyco/opencode/issues/4695)
> - **A-0104** · 130 👍 · opencode: Copy to clipboard doesn't work · [opencode#4283](https://github.com/anomalyco/opencode/issues/4283)
> - **A-0059** · 126 👍 · codex: Generated markdown tables are unreadable · [codex#8259](https://github.com/openai/codex/issues/8259)
> - **A-0063** · 114 👍 · codex: Can't rename task/thread titles, so history is hard to navigate · [codex#12564](https://github.com/openai/codex/issues/12564)
> - **A-0367** · 53 👍 · zed: Opening a new project doesn't open a new window · [zed#53528](https://github.com/zed-industries/zed/issues/53528)
> - **A-0370** · 43 👍 · zed: Editor breaks system-wide copy/paste · [zed#58651](https://github.com/zed-industries/zed/issues/58651)
> - **A-0381** · 33 👍 · zed: AI commit-message generation disabled/broken · [zed#49222](https://github.com/zed-industries/zed/issues/49222)
> - **A-0080** · 32 👍 · gemini-cli: Terminal UI flickers constantly · [gemini-cli#14708](https://github.com/google-gemini/gemini-cli/issues/14708)
> - **A-0388** · 29 👍 · zed: Reopening a project opens a new window instead of reusing one · [zed#54657](https://github.com/zed-industries/zed/issues/54657)
> - **A-0301** · 22 👍 · continue: Chat pane sizing hides buttons and text · [continue#12912](https://github.com/continuedev/continue/issues/12912)
> - **A-0158** · 14 👍 · omp: Input box scrolls away while reading the transcript · [oh-my-pi#10232](https://github.com/can1357/oh-my-pi/issues/10232)
> - **A-0157** · 14 👍 · omp: No Vim editing mode in the input · [oh-my-pi#3299](https://github.com/can1357/oh-my-pi/issues/3299)
> - **A-0279** · 14 👍 · kilo: No key combination for a new line in the input · [kilocode#3679](https://github.com/Kilo-Org/kilocode/issues/3679)
> - **A-0162** · 12 👍 · omp: Can't customise or disable the built-in status line · [oh-my-pi#1966](https://github.com/can1357/oh-my-pi/issues/1966)
> - **A-0283** · 12 👍 · kilo: Output window scrolling broken · [kilocode#3310](https://github.com/Kilo-Org/kilocode/issues/3310)
> - **A-0172** · 9 👍 · omp: Wants a fixed bottom bar like the original tool · [oh-my-pi#11600](https://github.com/can1357/oh-my-pi/issues/11600)
> - **A-0147** · 9 👍 · pi: Terminal UI output gets garbled during streaming · [pi#8584](https://github.com/earendil-works/pi/issues/8584)
> - **A-0218** · 9 👍 · cline: Tool nags to switch to a specific model · [cline#10500](https://github.com/cline/cline/issues/10500)
> - **A-0179** · 8 👍 · omp: Terminal rendering/scrollback model is limiting · [oh-my-pi#2040](https://github.com/can1357/oh-my-pi/issues/2040)
> - **A-0425** · 8 👍 · copilot: Delete key removes a whole chat message without confirmation · [vscode-copilot-release#14125](https://github.com/microsoft/vscode-copilot-release/issues/14125)
> - **A-0308** · 7 👍 · continue: Sidebar buttons pushed off-screen · [continue#12910](https://github.com/continuedev/continue/issues/12910)
> - **A-0313** · 6 👍 · continue: Chat view overflows and covers editor line numbers · [continue#12902](https://github.com/continuedev/continue/issues/12902)
> - **A-0237** · 6 👍 · cline: Saving a file sometimes broken (buttons disabled) · [cline#9790](https://github.com/cline/cline/issues/9790)
> - **A-0321** · 5 👍 · continue: Autocomplete doesn't appear automatically like a competitor's · [continue#11568](https://github.com/continuedev/continue/issues/11568)
> - **A-0254** · 4 👍 · roo: Shift+Enter sends the message instead of a new line · [Roo-Code#10386](https://github.com/RooCodeInc/Roo-Code/issues/10386)
> - **A-0351** · 4 👍 · goose: Can't delete a chat from the sidebar · [goose#10068](https://github.com/aaif-goose/goose/issues/10068)
> - **A-0322** · 4 👍 · continue: Autocomplete computed but not shown in the editor · [continue#8661](https://github.com/continuedev/continue/issues/8661)
> - **A-0359** · 3 👍 · goose: Streaming from external agents shows as many separate bubbles · [goose#8748](https://github.com/aaif-goose/goose/issues/8748)
> - **A-0329** · 3 👍 · continue: Editor scroll desyncs under the chat overlay · [continue#9437](https://github.com/continuedev/continue/issues/9437)
> - **A-0407** · 2 👍 · openhands: Delete dialog doesn't show which conversation will be deleted · [OpenHands#11809](https://github.com/OpenHands/OpenHands/issues/11809)
> - **A-0197** · 1 👍 · aider: Output formatting broken with a specific model · [aider#4592](https://github.com/Aider-AI/aider/issues/4592)
> - **A-0515** · 0 👍 · crystal: Terminal text garbled after switching tabs · [crystal#202](https://github.com/stravu/crystal/issues/202)
> - **A-0472** · 0 👍 · claude-squad: Colours unreadable on some terminal themes · [claude-squad#300](https://github.com/smtg-ai/claude-squad/issues/300)
> - **A-0466** · 0 👍 · claude-squad: Non-English characters garbled in session names · [claude-squad#233](https://github.com/smtg-ai/claude-squad/issues/233)
> - **A-0516** · 0 👍 · crystal: Visual glitch in settings · [crystal#205](https://github.com/stravu/crystal/issues/205)
> - **A-0529** · 0 👍 · crystal: Can't find the 'show thinking' setting · [crystal#237](https://github.com/stravu/crystal/issues/237)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Netheron's own UI around the agents

> [!warning] 🟡 Netheron can partly do this
> Netheron controls its board, tabs, diff and Code tab, so it can fix what's outside the terminal: rename tasks, confirm deletes, clean copy, readable markdown.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Low
> **Already in Netheron:** Board, tabs, markdown rendering exist

### S2 · Voice input

> [!success] ✅ Netheron can build this
> Browser speech-to-text in the New task box and key bar.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Low

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Terminal UIs inside each CLI are the vendors'.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

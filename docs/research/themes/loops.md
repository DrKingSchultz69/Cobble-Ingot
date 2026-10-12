---
type: "research-theme"
theme: "loops"
rows: 11
upvotes: 277
avg_severity: 3.2
generated: "2026-10-08"
tags: ["research", "theme", "theme/loops"]
---

# Theme: loops

> [!info] Agent loops, retries, gets stuck, says done when it isn't
> **11** problems · **277** 👍 · average severity **3.2** / 5 · rank **#19** of 24

Back to [[Pain log]] · [[synthesis]] · [[Research Home]]

## Tools most affected
- cline: 4
- gemini-cli: 2
- pi: 1
- vibe-kanban: 1
- kilo: 1
- roo: 1
- copilot: 1

## Netheron ideas noted while labeling (5)
- **A-0065**: Stuck Rescue
- **A-0487**: Verified loop with tests + cross-model retry
- **A-0234**: Hashline-style safe edits
- **A-0233**: Stuck Rescue with cross-model handoff
- **A-0441**: Safe edits + undo

## All problems (sorted by 👍)

Checked: ✅ verified by you · 🔁 rechecked by an agent · · not yet

| ID | 👍 | Sev | Tool | Role | Problem | Workaround | Source | Checked |
|---|---|---|---|---|---|---|---|---|
| A-0065 | 164 | 4 | gemini-cli | ? | Agent loops or stalls for an hour on small edits |  | [gemini-cli#22141](https://github.com/google-gemini/gemini-cli/issues/22141) | · |
| A-0124 | 34 | 3 | pi | ? | Agent stuck on 'Working...' with no output or error |  | [pi#4945](https://github.com/earendil-works/pi/issues/4945) | · |
| A-0086 | 27 | 3 | gemini-cli | ? | CLI hangs indefinitely, possibly in a retry loop |  | [gemini-cli#22415](https://github.com/google-gemini/gemini-cli/issues/22415) | · |
| A-0487 | 14 | 3 | vibe-kanban | ? | Can't let the agent loop: test itself, retry differently and verify until done |  | [vibe-kanban#1946](https://github.com/BloopAI/vibe-kanban/issues/1946) | · |
| A-0292 | 9 | 3 | kilo | ? | Agent stuck 'considering next steps' forever; can't cancel |  | [kilocode#7742](https://github.com/Kilo-Org/kilocode/issues/7742) | · |
| A-0222 | 8 | 3 | cline | ? | Repeated empty/unparsable responses on large file writes |  | [cline#7262](https://github.com/cline/cline/issues/7262) | · |
| A-0234 | 6 | 4 | cline | ? | Edits truncate the last lines, which can cause infinite loops |  | [cline#7703](https://github.com/cline/cline/issues/7703) | · |
| A-0233 | 5 | 3 | cline | ? | A fast model loops on every prompt |  | [cline#7325](https://github.com/cline/cline/issues/7325) | · |
| A-0235 | 5 | 2 | cline | ? | Agent retries file writes with missing content |  | [cline#7998](https://github.com/cline/cline/issues/7998) | · |
| A-0253 | 4 | 3 | roo | ? | Agent loops when a model answers without a tool call |  | [Roo-Code#10322](https://github.com/RooCodeInc/Roo-Code/issues/10322) | · |
| A-0441 | 1 | 4 | copilot | ? | Agent repeatedly empties the file it's modifying |  | [vscode-copilot-release#14021](https://github.com/microsoft/vscode-copilot-release/issues/14021) | · |

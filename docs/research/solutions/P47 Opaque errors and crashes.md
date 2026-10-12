---
type: "solution"
id: "P47"
title: "Opaque errors and crashes"
themes: ["reliability", "review", "control"]
problems: 20
upvotes: 373
can_incorporate: "partly"
options: 2
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0051", "A-0067", "A-0543", "A-0087", "A-0278", "A-0423", "A-0289", "A-0290", "A-0246", "A-0394", "A-0187", "A-0434", "A-0267", "A-0191", "A-0190", "A-0444", "A-0439", "A-0198", "A-0450", "A-0518"]
tags: ["research", "solution", "theme/reliability", "theme/review", "theme/control"]
updated: "2026-10-08"
---
# P47 · Opaque errors and crashes

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/reliability|reliability]] · [[themes/review|review]] · [[themes/control|control]]

> [!question] The problem
> Requests fail silently or with meaningless messages; crashes on specific inputs; tools break after sleep; network errors blamed on the user.
>
> **20 problems · 373 👍** · tools: copilot (5), aider (4), kilo (3), gemini-cli (2), roo (2)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0051 | 170 | codex | Connection drops and falls back to slower transport |  | [codex#13041](https://github.com/openai/codex/issues/13041) |
| A-0067 | 86 | gemini-cli | Every request fails with an API error |  | [gemini-cli#18621](https://github.com/google-gemini/gemini-cli/issues/18621) |
| A-0543 | 26 | litellm | Chat UI page returns 404 |  | [litellm#24037](https://github.com/BerriAI/litellm/issues/24037) |
| A-0087 | 25 | gemini-cli | First run fails with an empty-response API error |  | [gemini-cli#10672](https://github.com/google-gemini/gemini-cli/issues/10672) |
| A-0278 | 14 | kilo | Frequent 'task file not found' errors since a major version |  | [kilocode#5475](https://github.com/Kilo-Org/kilocode/issues/5475) |

> [!example]- All 20 problems in this cluster (click to open)
> - **A-0051** · 170 👍 · codex: Connection drops and falls back to slower transport · [codex#13041](https://github.com/openai/codex/issues/13041)
> - **A-0067** · 86 👍 · gemini-cli: Every request fails with an API error · [gemini-cli#18621](https://github.com/google-gemini/gemini-cli/issues/18621)
> - **A-0543** · 26 👍 · litellm: Chat UI page returns 404 · [litellm#24037](https://github.com/BerriAI/litellm/issues/24037)
> - **A-0087** · 25 👍 · gemini-cli: First run fails with an empty-response API error · [gemini-cli#10672](https://github.com/google-gemini/gemini-cli/issues/10672)
> - **A-0278** · 14 👍 · kilo: Frequent 'task file not found' errors since a major version · [kilocode#5475](https://github.com/Kilo-Org/kilocode/issues/5475)
> - **A-0423** · 10 👍 · copilot: Terminal tool drops commands after a heredoc · [vscode-copilot-release#14124](https://github.com/microsoft/vscode-copilot-release/issues/14124)
> - **A-0289** · 9 👍 · kilo: API requests fail silently with no error shown · [kilocode#4262](https://github.com/Kilo-Org/kilocode/issues/4262)
> - **A-0290** · 9 👍 · kilo: CLI breaks after the computer wakes from sleep · [kilocode#5917](https://github.com/Kilo-Org/kilocode/issues/5917)
> - **A-0246** · 5 👍 · roo: Unknown API errors regardless of provider · [Roo-Code#10106](https://github.com/RooCodeInc/Roo-Code/issues/10106)
> - **A-0394** · 5 👍 · openhands: New conversation fails with a server error · [OpenHands#12083](https://github.com/OpenHands/OpenHands/issues/12083)
> - **A-0187** · 3 👍 · aider: Tool crashes on a specific language · [aider#4867](https://github.com/Aider-AI/aider/issues/4867)
> - **A-0434** · 2 👍 · copilot: Requests fail repeatedly · [vscode-copilot-release#14102](https://github.com/microsoft/vscode-copilot-release/issues/14102)
> - **A-0267** · 2 👍 · roo: Model returns no assistant message · [Roo-Code#10337](https://github.com/RooCodeInc/Roo-Code/issues/10337)
> - **A-0191** · 2 👍 · aider: Crash in the repo-map feature · [aider#4888](https://github.com/Aider-AI/aider/issues/4888)
> - **A-0190** · 2 👍 · aider: Can't read staged files with a newer git index version · [aider#4629](https://github.com/Aider-AI/aider/issues/4629)
> - **A-0444** · 1 👍 · copilot: Requests fail · [vscode-copilot-release#14023](https://github.com/microsoft/vscode-copilot-release/issues/14023)
> - **A-0439** · 1 👍 · copilot: 'Language model unavailable' on launch · [vscode-copilot-release#13995](https://github.com/microsoft/vscode-copilot-release/issues/13995)
> - **A-0198** · 1 👍 · aider: Long waits on failed API calls because retries can't be configured · [aider#4659](https://github.com/Aider-AI/aider/issues/4659)
> - **A-0450** · 0 👍 · copilot: Network time-outs in agent mode blamed on the user's connection · [vscode-copilot-release#13971](https://github.com/microsoft/vscode-copilot-release/issues/13971)
> - **A-0518** · 0 👍 · crystal: Error logs leak at the end of every session · [crystal#216](https://github.com/stravu/crystal/issues/216)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Error log per task with the raw provider response

> [!success] ✅ Netheron can build this
> The proxy already sees every call: show failed calls with status and body in the task's Info.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium
> **Already in Netheron:** Proxy logs every call incl. 429/errors

### S2 · Auto-retry and failover

> [!success] ✅ Netheron can build this
> Retry transient errors, fail over on repeated ones.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium
> **Already in Netheron:** 429 failover exists

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> Crashes inside vendors' tools are theirs.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

---
type: "solution"
id: "P24"
title: "Can't control agents from a phone or another device"
themes: ["remote", "ux", "setup"]
problems: 8
upvotes: 596
can_incorporate: "yes"
options: 3
partly_built: true
status: "wave 3 built"
decision: ""
priority: ""
rows: ["A-0039", "A-0117", "A-0082", "A-0085", "A-0154", "A-0299", "A-0402", "A-0414"]
tags: ["research", "solution", "theme/remote", "theme/ux", "theme/setup"]
updated: "2026-10-08"
---
# P24 · Can't control agents from a phone or another device

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/remote|remote]] · [[themes/ux|ux]] · [[themes/setup|setup]]

> [!question] The problem
> People want to watch and steer desktop agents from their phone or a browser; today they use Tailscale + SSH + tmux. No sound or ping when a task needs them.
>
> **8 problems · 596 👍** · tools: gemini-cli (2), openhands (2), codex (1), opencode (1), omp (1)

> [!success] Built in Wave 3 (2026-10-10)
> S2 web push (works with Netheron closed). See [[BUGS]] B-040.

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0039 | 411 | codex | Can't control the agent on a desktop PC from a phone app | Tailscale VPN + an SSH app + tmux | [codex#9224](https://github.com/openai/codex/issues/9224) |
| A-0117 | 96 | opencode | No mobile or web UI; terminal only |  | [opencode#10288](https://github.com/anomalyco/opencode/issues/10288) |
| A-0082 | 30 | gemini-cli | No remote API to control the CLI from elsewhere | User built their own remote WebSocket API | [gemini-cli#20782](https://github.com/google-gemini/gemini-cli/issues/20782) |
| A-0085 | 27 | gemini-cli | No remote-control mode from phone/browser |  | [gemini-cli#22559](https://github.com/google-gemini/gemini-cli/issues/22559) |
| A-0154 | 19 | omp | Can't control the agent remotely from a browser on another device |  | [oh-my-pi#436](https://github.com/can1357/oh-my-pi/issues/436) |

> [!example]- All 8 problems in this cluster (click to open)
> - **A-0039** · 411 👍 · codex: Can't control the agent on a desktop PC from a phone app · [codex#9224](https://github.com/openai/codex/issues/9224)
> - **A-0117** · 96 👍 · opencode: No mobile or web UI; terminal only · [opencode#10288](https://github.com/anomalyco/opencode/issues/10288)
> - **A-0082** · 30 👍 · gemini-cli: No remote API to control the CLI from elsewhere · [gemini-cli#20782](https://github.com/google-gemini/gemini-cli/issues/20782)
> - **A-0085** · 27 👍 · gemini-cli: No remote-control mode from phone/browser · [gemini-cli#22559](https://github.com/google-gemini/gemini-cli/issues/22559)
> - **A-0154** · 19 👍 · omp: Can't control the agent remotely from a browser on another device · [oh-my-pi#436](https://github.com/can1357/oh-my-pi/issues/436)
> - **A-0299** · 8 👍 · kilo: No sound when a task finishes or a reply arrives · [kilocode#8127](https://github.com/Kilo-Org/kilocode/issues/8127)
> - **A-0402** · 3 👍 · openhands: Web interface can't be used from another machine · [OpenHands#12679](https://github.com/OpenHands/OpenHands/issues/12679)
> - **A-0414** · 2 👍 · openhands: Non-localhost setup stopped working after a major version · [OpenHands#12072](https://github.com/OpenHands/OpenHands/issues/12072)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Netheron phone UI

> [!success] ✅ Netheron can build this
> Same-Wi-Fi link or Cloudflare tunnel; board, terminals, key bar, diff on the phone.
>
> **Effort:** none (already exists) · **Novelty:** High
> **Already in Netheron:** Built: mm serve --lan, mm tunnel, phone layout

### S2 · Push notifications

> [!success] ✅ Netheron can build this
> Browser notifications today; add real mobile push (PWA web push) so alerts arrive when the browser is closed.
>
> **Effort:** M (2–5 days) · **Novelty:** Medium
> **Already in Netheron:** Built: 🔔 notifications (B-034)

### S3 · Secure remote access

> [!success] ✅ Netheron can build this
> Token auth, origin checks, HTTPS via tunnel.
>
> **Effort:** none (already exists) · **Novelty:** Medium
> **Already in Netheron:** Built: B-024

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

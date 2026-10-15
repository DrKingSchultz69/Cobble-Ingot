# Learning Progress

No learning events recorded yet.

## Pending decision
Build checkpoint: task rename (stage: awaiting reasoning). Explained that a task's name lives in 3 places (tasks table, memory graph node, git branch/worktree folder name). Asked: which places should change on rename and why; risk of renaming the branch while an agent works; UI interaction. Waiting on the learner's approach. (On hold: learner switched to the built-in browser.)

## Pending decision: ADHD-friendly UI
Design checkpoint answered 2026-10-11. Learner's goal: represent ALL features, but not in an overwhelming way. Decisions: (1) new Home view opened first, showing a Needs-you list + one New task button; (2) New task becomes a step-by-step wizard (What -> Who -> Extras, skippable); always-relevant controls: prompt+project, agent, browser, budget/model. Feedback given: hiding behind named labels keeps features discoverable. AI additions approved (list derived from live task state, Home count badge, wizard remembers last agent/model, other views unchanged). Implemented and checked in Chrome 2026-10-11 (B-045). Next design candidate: calmer Usage page.

## Pending decision: built-in browser
Step 2 (agent tools): learner chose opt-in per task (🌐 checkbox) and keep the window open after finish (reasons not stated). Implementation checkpoint approved 2026-10-11 with AI additions 1-5 (MCP->server with token, JPEG shots, ask_user -> Needs you + push, Resume types 'Done, continue', auto-approve browser tools; Pi/omp excluded). Implemented and tested 2026-10-11 (B-043). Step 3 (2026-10-11): learner chose a right-side Browser tab, clickable live view while the user has control (lets the phone log in), smooth ~10 fps (reasons not stated). Approved AI additions: frames only while watched, user input only while user has control and skips agent blocks, phone Type box, tab only for browser tasks. Implemented and tested 2026-10-11 (B-044). Browser feature complete; open: learner's live trial (T-BR-11).

## Browser automation
- Introduced: iframe embedding limits (X-Frame-Options), headless Chrome, CDP, MCP tools for agents.
- Learner reasoning: chose screenshot-based coordinate actions with explicit agent→user hand-off conditions (from their pasted spec; source of the spec not stated).
- Demonstrated: argued for enforcement in code over prompt rules because LLM responses can't react in real time (pasted text, but they chose it as their answer).
- Chose an isolated browser profile; reasoning about what an agent could reach is not stated yet.
- Verified step 1 manually (2026-10-11): saw agent's Place order click blocked while their own click went through; asked how it compares to Claude in Chrome (explained).
- Chose windows over tabs: wants multiple agents browsing at once (accepted the cost of several windows).
- Final choices: user drives in a real Chrome window; Take over at any time; hard-block typing into password fields and clicking pay/place order/buy/delete.

## Testing
- 2026-10-11: asked for a detailed check of every feature; chose an automated end-to-end smoke script over a manual checklist, and "keep going" on failure (reason not stated). Built scripts/check-all.ts (49 checks). It exposed a real timing gap (B-042: idle before checkpoint); not yet discussed with the learner whether to fix it in the product.

Context: Waves 1–3 of docs/research/Solutions.md were built by the AI before learning mode started (2026-10-10). Those designs were not learner-reasoned; don't count them as demonstrated understanding.

## Pending decision: UI look + motion (2026-10-12)
Learner asked for research on how the UI should look, animate, and what each page does. AI-researched report (not learner-reasoned): https://claude.ai/artifact/NeNWxWQHyzz4HVDnUcKWyF. Recommendations awaiting the learner's choice: Minecraft theme as optional skin vs base; motion tokens (100/150/200/250 ms, ease-out in, ease-in out) + reduced-motion + Calm switch; status = shape+colour+word, timer instead of spinner, only "needs you" pulses (2x). Suggested first step: add motion tokens to apps/web/style.css.
Follow-up 2026-10-12: AI reviewed the Stitch project "Netheron · Minecraft theme" (11 screens) and wrote a phased plan P0–P11: https://claude.ai/artifact/5pGzHLWMjzpp46ScqQwLHZ. Proposal: build Stitch layouts on tokens with two skins (Calm default, Block = Minecraft). Waiting on P0 answers: default skin, Block main-button colour, desktop-first vs phone-first.

## Built: new UI look, P1+P2 (2026-10-12)
- Took the recommended P0 answers: Calm default, cyan main button in Block, desktop first.
- New: apps/web/tokens.css (colours, motion), skin-block.css (Minecraft look), Look menu (gear icon) in the top bar.
- Status = shape + colour + word. Home rows show agent, status, time; keys 1-3 open a row; one main button per screen.
- Checked with headless Chrome screenshots in Calm/Block x light/dark. Not committed yet.

## Design: Relay redesign canvas (2026-10-15)
- Learner chose the Lattice design system, asked for a T3-like calm structure with more personality, then glass translucency everywhere and a unique (non-T3) look. AI-designed (not learner-reasoned): canvas https://claude.ai/artifact/Y68i22HfjSr74EnvhaSEjG (Home, New task, Task, Code+Terminal, Usage, Research, Memory, Settings, Automations, Board, Issues, Sessions, shared Sidebar + Status bar).
- Learner chose "design first" for the Orca-style features (automations, issues hub, board, session history, resource manager, keep awake). Nothing built in the app yet.

## Pending decision: phone / remote access (2026-10-15)
Build checkpoint (stage: awaiting reasoning). AI researched how T3 Code and Orca connect phones (T3: cloud broker + direct HTTPS/WS via Cloudflare Tunnel/LAN/Tailscale/SSH, scoped sessions, DPoP; Orca: both sides dial out to a relay that splices E2EE frames, X25519 + XSalsa20-Poly1305, QR orca://pair). Explained tunnel vs relay vs end-to-end encryption. Netheron today: --lan, ?token= link, cloudflared quick tunnel (random URL), PWA + VAPID push. Asked: who may sit in the middle, how a new phone gets in, what happens when a phone is lost.
- Learner: avoid a middle man (thinks it is slower and less secure); feedback given that E2EE decides security, a relay mostly adds latency. Explained NAT and options (LAN, port forward, P2P VPN, relay+E2EE).
- Learner chose a peer-to-peer VPN (Tailscale/WireGuard) because it is fast and secure without owning a server. New phone joins by scanning a QR code. Lost phone: access must be revoked.
- Explained the two locks (tailnet + Netheron device token) and listed industry patterns (remove from tailnet, key expiry, per-device token, server-side revoke, close live sockets, short-lived tokens, revoke from any device, app lock). Waiting: which to pick and whether revoke should stop/pause agents.
- 2026-10-15 Design checkpoint CONFIRMED (learner asked for the final design; AI filled the lost-phone details as proposals, learner confirmed without changes): QR = one-time code (5 min) + Tailscale address; per-phone key in secure storage; Settings → Devices list with Revoke (from PC or any paired phone); revoke closes live socket instantly; agents keep working, phone's last-minute actions flagged in Needs you; keep Tailscale key expiry + link to remove device; optional app lock; retire shared ?token= link. Not implemented. Build steps proposed: 1 per-phone keys + Devices list/revoke, 2 QR pairing, 3 Tailscale address in QR, 4 cleanup (retire ?token=, flag last actions, app lock). Learner chose not to build now (2026-10-15); open question for later: which step first and why.
- Mockups of the confirmed design added to the Relay canvas (row "Phone access": PC Devices + 5 phone screens), AI-designed.

## Pending decision: novelty + legal (2026-10-15)
AI research (not learner-reasoned, not legal advice): parallel-agents-in-worktrees is crowded (T3, Orca, Conductor, Vibe Kanban, Superset, Parallel Code, Claude Squad, Nimbalyst, Paseo). Rarer combination: cross-vendor shared memory, router learning from own evals, cross-vendor hand-off, code-level safety, calm UI, Windows-first no-cloud. Risks flagged: (red) subscription traffic via local proxy (ANTHROPIC_BASE_URL) vs Anthropic Feb-Apr 2026 OAuth rule; (red) multi-account profiles if used to rotate around limits; (amber) Codex ChatGPT login via proxy; Minecraft "Block" skin for public release; name trademark search; follow brand guidelines. Asked: which 1-2 angles to lead with and why; whether to stop routing subscription traffic through the proxy. Waiting.

## Built: Relay phases 3-5 + new features (2026-10-15, learning mode paused, learner said "do all the phases")
- Server: automations (repeat kinds, pause/resume/run now, run history), session history + resume (claude --resume / codex resume), keep awake (PowerShell SetThreadExecutionState / caffeinate / systemd-inhibit), resource monitor (CIM / ps process tree), status API with agent limits (from session logs), device pairing (QR one-time code -> per-phone key; revoke closes its WebSockets; its last-minute input flagged), saved Network access setting read by mm serve, issues (gh / Linear). npm dep added: qrcode-generator (MIT).
- UI: Board, Issues, Automations (+ templates, create dialog), Sessions, Devices (+ QR dialog, network switch), status bar (limits, counts, spend, keep-awake menu, resource manager), phone bottom tab bar, Task/Code polish.
- Tests: automations, sessions, status (awake/resources/api), devices (pair/revoke/WS close), issues. Screenshots checked desktop + phone.

## Built: Relay look in the real app, phases 1-2 (2026-10-15, learning mode paused)
- New default skin "relay" (apps/web/skin-relay.css): glass panels, Lattice network canvas (apps/web/lattice.js), embers, N-portal logo + "agents below · you above", desktop sidebar instead of top bar, pill controls. Calm/Block skins unchanged; Look menu gained Relay + Embers.
- New task is its own centred screen in Relay (#view-new); the existing wizard form is moved there (placeNewTask) so all options/router keep working; Extras fold; N key opens it.
- Checked with headless Edge screenshots (dark, light, phone width). Next phases: Task/Code polish, status bar + new features, phone layout.

## Built: subscription logins skip the proxy (2026-10-15, learning mode paused)
- Learner asked for it after the legal research. agents.ts authMode(): Claude/Codex subscription -> no ANTHROPIC_BASE_URL / no model_provider override; API key -> proxy as before. New sessionlogs.ts reads ~/.claude/projects/<cwd>/*.jsonl and ~/.codex/sessions/**/rollout-*.jsonl (per profile config dir) into calls rows (dedupe per reply, 429 + reset time from limit lines, offsets saved). Tests: agents.test.ts, sessionlogs.test.ts; full suite 98/98. Live check on a real Claude log worked. Lost: MM_FALLBACK 429 failover for subscription logins (it needed the proxy).

## Built: v3 look + Netheron.exe (2026-10-14)
- UI matched to Stitch "Netheron v3 · Final": underlined tabs, line icons, bundled Geist + JetBrains Mono (apps/web/fonts, OFL), Home header/rows/Running list/centred empty state, Workspace task rows.
- `npm run build:exe` -> dist/Netheron/ (Netheron.exe tray launcher + runtime/node.exe + app/) and dist/Netheron-win-x64.zip. Launcher source: scripts/launcher/Netheron.cs (compiled with Windows csc). Log: %USERPROFILE%\.mm\netheron.log.

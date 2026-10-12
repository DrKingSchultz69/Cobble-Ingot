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

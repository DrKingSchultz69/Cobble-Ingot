---
type: "solution"
id: "P04"
title: "Vendors remove features or overhaul the UI without notice"
themes: ["ux", "trust", "parallel"]
problems: 14
upvotes: 1402
can_incorporate: "partly"
options: 3
partly_built: true
status: "to review"
decision: ""
priority: ""
rows: ["A-0005", "A-0373", "A-0481", "A-0545", "A-0273", "A-0483", "A-0276", "A-0484", "A-0485", "A-0213", "A-0490", "A-0498", "A-0505", "A-0316"]
tags: ["research", "solution", "theme/ux", "theme/trust", "theme/parallel"]
updated: "2026-10-08"
---
# P04 · Vendors remove features or overhaul the UI without notice

Back to [[Solutions]] · [[Research Home]] · themes: [[themes/ux|ux]] · [[themes/trust|trust]] · [[themes/parallel|parallel]]

> [!question] The problem
> Features users rely on disappear (no changelog), UIs get replaced, old workflows (kanban boards, auto-accept, integrations) vanish, and users can't switch back.
>
> **14 problems · 1402 👍** · tools: vibe-kanban (7), kilo (2), claude-code (1), zed (1), litellm (1)

## Evidence (top 5 by 👍)

| ID | 👍 | Tool | Problem | Workaround they use | Source |
|---|---|---|---|---|---|
| A-0005 | 1186 | claude-code | A loved companion feature was removed with no changelog or notice |  | [claude-code#45596](https://github.com/anthropics/claude-code/issues/45596) |
| A-0373 | 37 | zed | New multi-agent layout can't be reverted |  | [zed#54545](https://github.com/zed-industries/zed/issues/54545) |
| A-0481 | 33 | vibe-kanban | Update replaced a familiar UI and lost old tasks/projects |  | [vibe-kanban#2687](https://github.com/BloopAI/vibe-kanban/issues/2687) |
| A-0545 | 22 | litellm | Accumulated bugs; users ask to stabilise instead of adding features |  | [litellm#24825](https://github.com/BerriAI/litellm/issues/24825) |
| A-0273 | 20 | kilo | An integration users relied on was removed in an update |  | [kilocode#5460](https://github.com/Kilo-Org/kilocode/issues/5460) |

> [!example]- All 14 problems in this cluster (click to open)
> - **A-0005** · 1186 👍 · claude-code: A loved companion feature was removed with no changelog or notice · [claude-code#45596](https://github.com/anthropics/claude-code/issues/45596)
> - **A-0373** · 37 👍 · zed: New multi-agent layout can't be reverted · [zed#54545](https://github.com/zed-industries/zed/issues/54545)
> - **A-0481** · 33 👍 · vibe-kanban: Update replaced a familiar UI and lost old tasks/projects · [vibe-kanban#2687](https://github.com/BloopAI/vibe-kanban/issues/2687)
> - **A-0545** · 22 👍 · litellm: Accumulated bugs; users ask to stabilise instead of adding features · [litellm#24825](https://github.com/BerriAI/litellm/issues/24825)
> - **A-0273** · 20 👍 · kilo: An integration users relied on was removed in an update · [kilocode#5460](https://github.com/Kilo-Org/kilocode/issues/5460)
> - **A-0483** · 17 👍 · vibe-kanban: Worried the task-isolated kanban workflow will be removed · [vibe-kanban#2288](https://github.com/BloopAI/vibe-kanban/issues/2288)
> - **A-0276** · 15 👍 · kilo: Big 'upgrade' broke interfaces and removed features users relied on · [kilocode#8108](https://github.com/Kilo-Org/kilocode/issues/8108)
> - **A-0484** · 15 👍 · vibe-kanban: New UI takes more steps to move tasks between columns · [vibe-kanban#2730](https://github.com/BloopAI/vibe-kanban/issues/2730)
> - **A-0485** · 15 👍 · vibe-kanban: New UI loses the satisfying, clear kanban overview · [vibe-kanban#2509](https://github.com/BloopAI/vibe-kanban/issues/2509)
> - **A-0213** · 11 👍 · cline: Useful UI option removed in an update · [cline#6609](https://github.com/cline/cline/issues/6609)
> - **A-0490** · 10 👍 · vibe-kanban: Confusing cloud migration, repo assignment issues, worse UX · [vibe-kanban#2812](https://github.com/BloopAI/vibe-kanban/issues/2812)
> - **A-0498** · 8 👍 · vibe-kanban: New UI confusing and too complicated · [vibe-kanban#2923](https://github.com/BloopAI/vibe-kanban/issues/2923)
> - **A-0505** · 7 👍 · vibe-kanban: Can't switch back from beta UI · [vibe-kanban#2646](https://github.com/BloopAI/vibe-kanban/issues/2646)
> - **A-0316** · 6 👍 · continue: Full auto-accept mode was removed · [continue#12500](https://github.com/continuedev/continue/issues/12500)

## Solution options

Effort: S = hours to 1 day · M = 2–5 days · L = 1–3 weeks

### S1 · Netheron keeps the workflow, agents are swappable

> [!success] ✅ Netheron can build this
> Because Netheron owns the board, diff, memory and phone UI, a vendor changing its UI doesn't change yours; you swap the agent underneath.
>
> **Effort:** none (already exists) · **Novelty:** High: the core reason to have a layer above vendors
> **Already in Netheron:** Built: board, tabs, diff, memory are Netheron's own

### S2 · Change radar for agent updates

> [!success] ✅ Netheron can build this
> Before an agent CLI updates, show its changelog and run a quick smoke test (start, edit a file, answer a question). Hold the update if it fails.
>
> **Effort:** M (2–5 days) · **Novelty:** High

### S3 · Version pinning per agent

> [!success] ✅ Netheron can build this
> Let the user pin each agent CLI to a version from Netheron's settings.
>
> **Effort:** S (hours to 1 day) · **Novelty:** Medium

## What Netheron can't fix

> [!failure] ❌ Outside Netheron's control
> What vendors ship in their own apps is their decision.

## Your review

Fill these in, and update `status` / `decision` / `priority` in the properties above (they feed [[Solutions]]).

- [ ] The problem is real and worth solving
- [ ] I agree with the 'can / can't incorporate' split
- Option I prefer: 
- My own solution idea: 
- Priority (1 = later, 5 = now): 
- Notes: 

---
type: "home"
project: "Netheron"
status: "day 1 done · labeling done"
evidence_window: "2025-10-01 → 2026-10-08"
tags: ["research", "home"]
updated: "2026-10-08"
---

# Netheron problem research

> [!abstract] One-time snapshot
> Real problems people had with AI coding harnesses, IDEs and multi-model orchestrators between **2025-10-01** and **2026-10-08**, turned into Netheron features with evidence behind each one. 5-day sprint, ends with [[report]].

## Where we are

| Day | Step | Status |
|---|---|---|
| 1 | GitHub collection: 561 problems from 19 tools | ✅ done |
| 1 | Labels (summary, theme, severity) | ✅ 561/561 · top 20 rechecked |
| 1 | Reports skim | ⏳ |
| 2–3 | 12 listening sessions: [[manual-playbook]] | ⏳ |
| 3–4 | Your spot-check (≥ 20%) + optional calls: [[interviews]] | ⏳ 0 verified |
| — | **Solutions drafted:** 49 problem clusters, 141 options in [[Solutions]] | ✅ drafted · ⏳ your review |
| 5 | [[synthesis]] → [[ideas]] → [[report]] | ⏳ |

## Start here
1. **How it works:** [[README]] (method, rules, columns, scripts)
2. **What we're answering:** [[research-plan]]
3. **The evidence:** [[Pain log]], ranked themes and the top 30 problems
4. **The solutions to review:** [[Solutions]]: each cluster has 2–4 options marked ✅ can build / 🟡 partly / ❌ outside Netheron, plus a *Your review* section
5. **Do the manual part:** [[manual-playbook]], using [[sources]] and [[roles-and-tools]]

## Themes so far (GitHub only, before your manual sessions)
Strongest: [[themes/trust|trust]] · [[themes/accounts|accounts]] · [[themes/cost|cost]] · [[themes/platform|platform]] · [[themes/quality|quality]] · [[themes/control|control]] · [[themes/remote|remote]] · [[themes/switching|switching]]
Most reports: [[themes/reliability|reliability]] (162)
Barely covered yet (needs the manual sessions): [[themes/design|design]] · [[themes/data|data]] · [[themes/infra|infra]]

> [!warning] Known gap
> 547 of 561 problems have no known role, because GitHub posts rarely say the person's job. Design, data, infra and AI/ML voices come from the listening sessions.

## All notes
- Method and plan: [[README]] · [[research-plan]]
- Reference: [[roles-and-tools]] · [[sources]]
- Doing: [[manual-playbook]] · [[interviews]]
- Evidence: [[Pain log]] · theme notes in `themes/`
- Solutions: [[Solutions]] · one note per cluster in `solutions/`
- Deciding: [[synthesis]] · [[ideas]] · [[report]]
- Netheron itself: [[BUGS]] · [[TESTS]] (they count as evidence too: `source_type = self`)

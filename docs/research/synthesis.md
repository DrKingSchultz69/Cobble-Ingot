---
type: "synthesis"
status: "day 5"
tags: ["research", "synthesis"]
updated: "2026-10-08"
---

# Synthesis: what the evidence says

Back to [[Research Home]]

Done **once**, on day 5, after collection has closed. Use every row in [[Pain log]] (data: `pain-log.csv`) inside the evidence window.

## Step 1: Group rows into themes
Read the `pain_summary` column and group rows that describe the same underlying problem. Give each group a short **theme ID** and write it into the log's `theme` column.

Starter themes (rename, merge or add as evidence appears). Each links to its generated note with every problem in it:

| Theme ID | Theme |
|---|---|
| [[themes/context\|context]] | Agent forgets or misses context (decisions, files, other repos) |
| [[themes/cost\|cost]] | Surprise cost, credits, usage limits, rate limits |
| [[themes/loops\|loops]] | Agent loops, retries, gets stuck, "done" when it isn't |
| [[themes/trust\|trust]] | Wrong or unsafe edits; has to double-check everything |
| [[themes/review\|review]] | Hard to review what the agent changed |
| [[themes/switching\|switching]] | Switching tools or models loses context, setup or time |
| [[themes/parallel\|parallel]] | Running several agents at once: conflicts, chaos |
| [[themes/setup\|setup]] | Install, config, auth, Windows/WSL, environment trouble |
| [[themes/security\|security]] | Secrets, dangerous commands, permissions |
| [[themes/design\|design]] | Design → code fidelity, visual checks |
| [[themes/data\|data]] | Notebooks, SQL correctness, data privacy |
| [[themes/infra\|infra]] | CI, cloud, Terraform, Kubernetes, production risk |
| [[themes/remote\|remote]] | Can't watch or steer agents away from the desk |
| [[themes/learning\|learning]] | Over-reliance; not learning; outdated docs |
| [[themes/quality\|quality]] | Model/agent output got worse, ignores instructions, edits badly *(added during labeling)* |
| [[themes/reliability\|reliability]] | Errors, hangs, crashes, broken after update *(added)* |
| [[themes/performance\|performance]] | Slow start, CPU/RAM/disk heavy, UI lag *(added)* |
| [[themes/accounts\|accounts]] | Login, verification, multiple accounts/subscriptions *(added)* |
| [[themes/platform\|platform]] | OS / IDE support (Linux, Windows, Intel Mac, JetBrains…) *(added)* |
| [[themes/models\|models]] | Model missing, not supported, provider-format errors *(added)* |
| [[themes/control\|control]] | Undo, interrupt, queue, approvals, asking the user *(added)* |
| [[themes/standards\|standards]] | AGENTS.md, skills, hooks, protocols differ between agents *(added)* |
| [[themes/ux\|ux]] | Interface annoyances *(added)* |
| [[themes/not-a-pain\|not-a-pain]] | Not a real problem (announcements, empty, spam) *(added)* |

## Step 2: Score themes

`Score = Frequency × Severity × Netheron fit` (each 1–5, max 125)

- **Frequency:** number of distinct people in the log for the theme (1 = 1–5 · 2 = 6–15 · 3 = 16–30 · 4 = 31–60 · 5 = 60+), counting 👍 too.
- **Severity:** average `severity_1to5` of the theme's rows.
- **Netheron fit:** how well Netheron's unique strengths can fix it (multi-agent, multi-vendor, shared memory, worktrees, phone, proxy that sees all calls).

| Theme | Rows | People (incl. 👍) | Frequency | Severity | Fit | **Score** | Roles most affected | Example links |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |

**Top 5 themes → [[ideas]].**

## Step 3: Role summaries (one per role you studied)

```
### <role id>: <role name>
- Their job with AI tools: <one line>
- Top 3 pains (theme IDs + strongest quote + link):
  1. ...
- Workarounds they use: ...
- What they would pay for / switch for: ...
- Evidence: <n> log rows, <n> interviews
```

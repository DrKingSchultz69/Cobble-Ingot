---
type: "playbook"
status: "not started"
tags: ["research", "playbook"]
updated: "2026-10-08"
---

# Manual playbook: the parts only you can do

Back to [[Research Home]]

One pass through three jobs during the 5-day sprint. Each step is fixed, so you never have to decide "what now?". Evidence window: **2025-10-01 → 2026-10-08**.

| Job | Session | How often | Fills |
|---|---|---|---|
| **A. Community listening** (Reddit, forums, designer and analyst communities) | 45 min | 12 sessions, days 2–3 | pain-log.csv |
| **B. Confirmation calls** (optional) | 30 min + 10 min debrief | 3–6 calls, days 3–4 | interviews.md + pain-log.csv |
| **C. Make sense, decide, report** | 4–5 h | Once, day 5 | synthesis.md, ideas.md, report.md |

---

## A. Community listening: 12 sessions of 45 minutes

**Before (5 min)**
1. Pick **one role** and **one source** from the rotation below. Write them in the session card.
2. Open `pain-log.csv` (Excel / Google Sheets) and [[sources]].

**Search (10 min)**
3. Run the 3 Google searches for that role (below). Add `after:2025-10-01 before:2026-10-09` to stay inside the evidence window.
4. Open the **10 threads with the most upvotes or comments** in new tabs. Skip anything outside the evidence window.

**Read and log (25 min)**
5. For each thread, read the post **and the top comments**. Most of the pain is in the comments.
6. Add a row for **each distinct pain from each person**:
   - `quote` = their exact words. `link` = the comment's own link (⋯ → Share / Copy link).
   - `agree_count` = the comment's upvotes.
   - Fill `role` if they say their job; otherwise use the session's role, or `?`.
   - Leave `theme` empty (job C fills it).
7. Watch for **workarounds** ("I made a script…", "I just switched to…"). Always fill `workaround_they_use`.

**Close (5 min)**
8. Fill in the session card below (2 minutes).
9. If this source gave **fewer than 3 new pains**, mark it "dry". You don't need to come back to it.

### Session card (append to the Session log at the bottom)
```
S-<nn> · <date> · role: <id> · source: <name> · rows added: P-xxx–P-yyy (<n>)
Biggest surprise: <one line>
Source dry? yes / no
```

### Rotation: 12 sessions cover every role family (≈ 9 hours)

| # | Role(s) | Source | 3 Google searches (copy, then add `after:2025-10-01 before:2026-10-09`) |
|---|---|---|---|
| 1 | `fs` `be` | r/ExperiencedDevs + HN | `site:reddit.com r/ExperiencedDevs "claude code" OR cursor OR codex frustrating` · `site:news.ycombinator.com "Ask HN" coding agent workflow` · `site:reddit.com r/ExperiencedDevs AI agent "code review"` |
| 2 | `fe` | r/webdev, r/Frontend | `site:reddit.com r/webdev cursor OR "claude code" CSS OR UI wrong` · `site:reddit.com r/Frontend AI "design system"` · `site:reddit.com r/reactjs copilot OR cursor frustrating` |
| 3 | `des` `deseng` | r/UXDesign, r/FigmaDesign | `site:reddit.com r/UXDesign "figma make" OR v0 OR lovable` · `site:reddit.com r/FigmaDesign design to code AI` · `site:reddit.com r/UXDesign developers handoff AI code` |
| 4 | `devops` `sre` | r/devops, r/kubernetes | `site:reddit.com r/devops "claude code" OR copilot OR codex` · `site:reddit.com r/kubernetes AI agent kubectl` · `site:reddit.com r/sre AI on-call production` |
| 5 | `cloud` `sec` | r/aws, r/Terraform, r/cybersecurity | `site:reddit.com r/Terraform AI generated` · `site:reddit.com r/aws "amazon q" OR copilot frustrating` · `site:reddit.com r/cybersecurity coding agent secrets` |
| 6 | `aieng` | r/LLMDevs, r/LocalLLaMA | `site:reddit.com r/LLMDevs coding agent cost OR context` · `site:reddit.com r/LocalLLaMA "claude code" OR aider OR opencode local model` · `site:reddit.com r/LLMDevs switching models` |
| 7 | `mleng` `mlops` `ds` | r/MachineLearning, r/mlops, r/datascience | `site:reddit.com r/datascience copilot OR cursor notebook` · `site:reddit.com r/mlops AI agent pipeline` · `site:reddit.com r/MachineLearning "coding agent" research code` |
| 8 | `de` `da` | r/dataengineering, r/dataanalysis, r/PowerBI | `site:reddit.com r/dataanalysis chatgpt OR copilot SQL wrong` · `site:reddit.com r/dataengineering AI dbt OR spark` · `site:reddit.com r/PowerBI copilot` |
| 9 | `pm` `em` | r/ProductManagement, r/EngineeringManagers | `site:reddit.com r/ProductManagement prototype cursor OR lovable OR v0` · `site:reddit.com r/EngineeringManagers AI PRs review` · `site:reddit.com r/EngineeringManagers AI tools cost team` |
| 10 | `indie` `nocode` | r/SideProject, r/vibecoding, r/nocode | `site:reddit.com r/vibecoding stuck OR broke OR "gave up"` · `site:reddit.com r/SideProject cursor OR "claude code" cost` · `site:reddit.com r/nocode lovable OR bolt OR replit problem` |
| 11 | all | forum.cursor.com + VS Code Marketplace reviews | Cursor forum: Bug Reports / Feature Requests sorted by votes · lowest-rated reviews for Copilot, Cline, Roo, Continue |
| 12 | `student` `oss` | r/learnprogramming, r/opensource | `site:reddit.com r/learnprogramming AI "not learning"` · `site:reddit.com r/opensource "AI generated" PRs` · `site:reddit.com r/cscareerquestions copilot OR cursor` |

That's the whole listening phase. Only if a role ended with **fewer than 15 rows**, add one extra session for it on day 3.

---

## B. Confirmation calls (optional): the pipeline

For a snapshot you don't need many: **3–6 short calls** to check that the top problems from the log are real and to hear *why*. Track them in the table at the bottom: contacted → agreed → done → logged.

1. **Recruit (day 2, 15 min):** message about 10 people. You need roughly 1 in 3 to say yes. Good targets: people whose pain you logged in job A (they already care), friends in the role.
2. **Run the call:** use the script in [[interviews]]. Record it only if they say yes. Otherwise take notes.
3. **Debrief within 10 minutes** of hanging up, while it's fresh: fill the notes template in interviews.md, then add their pains to `pain-log.csv` with `source_type = interview`.
4. **Thank them** and ask "who else should I talk to?". That's how you get the next interview.

**Message templates**

Reply to a post or comment:
> Hi! Your comment about <their pain> really stuck with me. I'm researching problems people hit with AI coding tools (not selling anything). Could I ask you a few questions about it, 20 minutes by call or chat? Happy to share what I learn.

Community channel (post once, follow the channel's rules):
> I'm researching real problems <role>s hit with AI coding tools (Cursor, Claude Code, Copilot, v0…). Looking for 5 people for a 20-minute chat about the last time a tool frustrated you. No pitch, no product demo. I'll share the anonymised findings with the channel.

**Target:** 3–6 calls in total, ideally from the roles where the log is thinnest (often designers and analysts). Skip this job if nobody replies in time; the log alone is enough for the snapshot.

---

## C. Day 5: make sense, decide, report (4–5 hours, once)

| Min | Step | Do | Where |
|---|---|---|---|
| 0–60 | **Tag themes** | Give every row a theme ID (or create a new theme). An agent may *suggest* themes first; you accept or change each one. | pain-log.csv |
| 60–90 | **Score** | Fill rows, people, frequency, severity and fit per theme. Sort by score; mark the top 5. | synthesis.md |
| 90–135 | **Role summaries** | One summary per role family (7). | synthesis.md |
| 135–195 | **Brainstorm** | For each top-5 theme: write the "How might we…", then **Crazy 8s**: 8 ideas in 8 minutes, no judging. Circle the best 2. At least one must be "only Netheron could do this". | ideas.md |
| 195–225 | **Decide** | Score the ideas. Write the decision: which 1–3 features to build, and which log rows justify them. | ideas.md |
| 225–270 | **Report** | Fill report.md. The research is now closed. | report.md |

**Rules for day 5**
- No idea goes forward without **5+ linked rows** behind it.
- Ideas that came from your own brainstorm (not from the log) keep `Confidence = 1` until evidence appears.
- If one theme dominates because one source was huge (e.g. 300 GitHub 👍), check that **people from at least 3 different roles** mention it before calling it a top problem.

---

## Session log

| Session | Date | Role | Source | Rows | Surprise | Dry? |
|---|---|---|---|---|---|---|
| | | | | | | |

## Interview pipeline

| Person (handle) | Role | Where found | Contacted | Agreed | Done | Interview ID |
|---|---|---|---|---|---|---|
| | | | | | | |

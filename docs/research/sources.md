---
type: "reference"
tags: ["research", "reference", "sources"]
updated: "2026-10-08"
---

# Where to find real problems

Back to [[Research Home]]

Work top to bottom: GitHub and forums give the strongest evidence (counted, dated, linked); Reddit and HN give context and emotion; reports give the big picture.

## 1. GitHub issues sorted by 👍 (strongest evidence)

Open the link; the **most-upvoted issues are at the top**. 👍 count = `agree_count`.

| Tool | Most-upvoted issues |
|---|---|
| Claude Code | https://github.com/anthropics/claude-code/issues?q=is%3Aissue+sort%3Areactions-%2B1-desc |
| Codex CLI | https://github.com/openai/codex/issues?q=is%3Aissue+sort%3Areactions-%2B1-desc |
| Gemini CLI | https://github.com/google-gemini/gemini-cli/issues?q=is%3Aissue+sort%3Areactions-%2B1-desc |
| OpenCode | https://github.com/anomalyco/opencode/issues?q=is%3Aissue+sort%3Areactions-%2B1-desc |
| Pi | https://github.com/earendil-works/pi/issues?q=is%3Aissue+sort%3Areactions-%2B1-desc |
| Oh My Pi | https://github.com/can1357/oh-my-pi/issues?q=is%3Aissue+sort%3Areactions-%2B1-desc |
| Aider | https://github.com/Aider-AI/aider/issues?q=is%3Aissue+sort%3Areactions-%2B1-desc |
| Cline | https://github.com/cline/cline/issues?q=is%3Aissue+sort%3Areactions-%2B1-desc |
| Roo Code | https://github.com/RooCodeInc/Roo-Code/issues?q=is%3Aissue+sort%3Areactions-%2B1-desc |
| Kilo Code | https://github.com/Kilo-Org/kilocode/issues?q=is%3Aissue+sort%3Areactions-%2B1-desc |
| Continue | https://github.com/continuedev/continue/issues?q=is%3Aissue+sort%3Areactions-%2B1-desc |
| Goose | https://github.com/aaif-goose/goose/issues?q=is%3Aissue+sort%3Areactions-%2B1-desc |
| Zed | https://github.com/zed-industries/zed/issues?q=is%3Aissue+label%3Aai+sort%3Areactions-%2B1-desc |
| OpenHands | https://github.com/OpenHands/OpenHands/issues?q=is%3Aissue+sort%3Areactions-%2B1-desc |
| Copilot (VS Code) | https://github.com/microsoft/vscode-copilot-release/issues?q=is%3Aissue+sort%3Areactions-%2B1-desc |
| Claude Squad | https://github.com/smtg-ai/claude-squad/issues?q=is%3Aissue+sort%3Areactions-%2B1-desc |
| Vibe Kanban | https://github.com/BloopAI/vibe-kanban/issues?q=is%3Aissue+sort%3Areactions-%2B1-desc |
| Crystal | https://github.com/stravu/crystal/issues?q=is%3Aissue+sort%3Areactions-%2B1-desc |
| LiteLLM | https://github.com/BerriAI/litellm/issues?q=is%3Aissue+sort%3Areactions-%2B1-desc |

**Narrow by pain:** add words to the search box, e.g. `context`, `cost`, `rate limit`, `loop`, `windows`, `memory`, `permission`, `lost`, `slow`.

**Pull the top 30 automatically** (needs the GitHub CLI, `gh`):
```
gh issue list -R anthropics/claude-code --state all --search "sort:reactions-+1-desc" --limit 30 --json number,title,url,reactionGroups,createdAt
```

## 2. Product forums (daily users)

| Tool | Where |
|---|---|
| Cursor | https://forum.cursor.com (Bug Reports + Feature Requests, sort by votes) |
| Windsurf, Zed, JetBrains, Replit, Lovable, Bolt | Their community forums or Discord servers. Search "bug", "frustrat", "limit", "credits" |
| VS Code extensions | Marketplace **reviews** for Copilot, Cline, Roo, Continue: sort by lowest rating |

## 3. Communities by role

| Role family | Subreddits | Other places |
|---|---|---|
| **App engineers** (`fe` `be` `fs` `mob` `qa`) | r/webdev · r/Frontend · r/reactjs · r/node · r/golang · r/iOSProgramming · r/androiddev · r/QualityAssurance · r/ExperiencedDevs | Hacker News · Lobsters · Dev.to |
| **Infrastructure** (`devops` `cloud` `sre` `sec`) | r/devops · r/kubernetes · r/aws · r/AZURE · r/googlecloud · r/Terraform · r/sre · r/netsec · r/cybersecurity | CNCF Slack · HashiCorp Discuss |
| **AI and ML** (`aieng` `mleng` `mlops` `ds`) | r/LLMDevs · r/LocalLLaMA · r/MachineLearning · r/mlops · r/datascience | MLOps Community Slack · Hugging Face forums · Latent Space Discord |
| **Data** (`de` `da`) | r/dataengineering · r/dataanalysis · r/BusinessIntelligence · r/PowerBI · r/SQL | dbt Community (Slack / Discourse) |
| **Design and product** (`des` `deseng` `pm` `em`) | r/UXDesign · r/FigmaDesign · r/userexperience · r/ProductManagement · r/EngineeringManagers | Figma community forum · Designer News · Lenny's community |
| **Independent builders** (`indie` `nocode` `oss`) | r/SideProject · r/indiehackers · r/vibecoding · r/nocode · r/opensource | Indie Hackers · Product Hunt comments |
| **Learning** (`student` `devrel`) | r/learnprogramming · r/cscareerquestions · r/technicalwriting | Students' Discord servers |
| **Tool-specific** | r/ClaudeAI · r/ClaudeCode · r/ChatGPTCoding · r/OpenAI · r/cursor · r/PiCodingAgent · r/GithubCopilot | X (Twitter) search |

**Reddit search tip:** use Google, it searches Reddit better than Reddit does:
```
site:reddit.com "claude code" (frustrating OR annoying OR "gave up" OR "switched to")
site:reddit.com cursor (credits OR "rate limit" OR "usage based") complaint
site:reddit.com r/UXDesign (cursor OR v0 OR lovable OR "figma make") code handoff
site:reddit.com r/devops (copilot OR "claude code" OR codex) terraform OR kubernetes
site:reddit.com r/dataanalysis (chatgpt OR copilot) SQL wrong
site:reddit.com r/mlops OR r/MachineLearning "coding agent" notebook
site:news.ycombinator.com "Ask HN" (claude code OR cursor OR codex) workflow
```

**Strong signal words** to add to any search: `"gave up"`, `"switched from"`, `"wasted"`, `"burned"`, `"workaround"`, `"I built a script"`, `"is there a way to"`, `"why does it keep"`.

## 4. Reviews (people who pay)
- G2 / Capterra pages for Cursor, Windsurf, Copilot, Replit, Lovable: read the **"What do you dislike?"** answers.
- Product Hunt comments on launches of agent/orchestrator tools.
- YouTube: comments under "I tried Claude Code / Cursor / Codex for a week" videos.

## 5. Reports (the big picture; tag rows `report`)
- **Stack Overflow Developer Survey**, AI section (trust, usage, frustrations). Use the latest year.
- **JetBrains State of Developer Ecosystem**, AI assistant section.
- **Google DORA report**, AI-assisted software delivery.
- **METR's study** on how early-2025 AI tools affected experienced open-source developers' speed.
- **GitHub Octoverse**: trends in AI-assisted coding.

Find each by name on Google. Quote the specific finding and link the page.

## 6. Your own data (don't skip)
- [[BUGS|../BUGS.md]]: every problem we hit building Netheron is a real data point (e.g. B-004 535K-token context, B-014 trust prompt per worktree, B-013 Codex shell). Log the relevant ones with `source_type = self`.
- The Netheron usage view: real cost and rate-limit numbers per agent.

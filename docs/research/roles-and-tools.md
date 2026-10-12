---
type: "reference"
tags: ["research", "reference", "roles", "tools"]
updated: "2026-10-08"
---

# Roles and tools we study

Back to [[Research Home]]

Use the **Role ID** in the `role` column of [[Pain log]] (data: `pain-log.csv`).

## Roles (24, in 7 families)

| Family | Role ID | Role | What they mostly build or do | Likely AI-tool pains to look for |
|---|---|---|---|---|
| **Build: app engineers** | `fe` | Frontend engineer | UI, components, state, browser bugs | Visual output wrong, can't "see" the page, design drift |
| | `be` | Backend engineer | APIs, databases, services | Wrong schema assumptions, migrations, multi-file changes |
| | `fs` | Full-stack engineer | Both ends | Context across frontend and backend repos |
| | `mob` | Mobile engineer | iOS / Android / React Native | Simulators, build times, platform APIs |
| | `qa` | QA / test engineer | Test suites, E2E, flaky tests | Agent says "done" without tests; flaky test loops |
| **Run: infrastructure** | `devops` | DevOps engineer | CI/CD, pipelines, release | Agent breaks CI, YAML guesswork, secrets |
| | `cloud` | Cloud engineer | AWS / Azure / GCP infrastructure | Terraform plan risk, cost surprises, wrong region/resources |
| | `sre` | SRE / platform engineer | Reliability, Kubernetes, on-call | Running commands against production, log overload |
| | `sec` | Security engineer | AppSec, reviews, compliance | Agents leaking secrets, unsafe commands, supply chain |
| **AI and ML** | `aieng` | AI engineer | LLM apps, RAG, agents, evals | Prompt/eval loops, model switching, token cost |
| | `mleng` | ML engineer | Training, fine-tuning, models in code | GPU environments, long jobs, notebooks vs repos |
| | `mlops` | MLOps engineer | Pipelines, model serving, monitoring | Infra + ML mix, reproducibility |
| | `ds` | Data scientist | Analysis, experiments, notebooks | Notebooks not supported well, data privacy |
| **Data** | `de` | Data engineer | ETL, dbt, warehouses, Spark | SQL correctness, large schemas, cost of queries |
| | `da` | Data / BI analyst | SQL, dashboards, Excel, Power BI | Wrong numbers, can't verify, non-coder friction |
| **Design and product** | `des` | UI/UX / product designer | Figma, prototypes, design systems | Design → code loses fidelity, can't edit code safely |
| | `deseng` | Design engineer | Designs in code, component libraries | Pixel accuracy, tokens, visual review |
| | `pm` | Product manager | Specs, prototypes, priorities | Can't check what agents built; spec drift |
| | `em` | Tech lead / engineering manager | Reviews, team process, budgets | Reviewing AI PRs, team cost, consistency across devs |
| **Independent builders** | `indie` | Solo founder / indie hacker | Whole products alone | Cost, limits, juggling many tools |
| | `nocode` | Non-coder / "vibe coder" | Apps via AI app builders | Stuck when the app breaks, can't debug |
| | `oss` | Open-source maintainer | Libraries, reviewing outside PRs | AI-generated low-quality PRs, review load |
| **Learning and communication** | `student` | Student / learner | Learning to code | Learns less, over-reliance, cost |
| | `devrel` | Technical writer / DevRel | Docs, examples, tutorials | Outdated docs, hallucinated APIs |

**Top 3 to interview first (suggested):** `fs`, `indie`, `des`. They're closest to Netheron's users and cover code, cost and design pain. Change these after phase 2 if the log points elsewhere.

## Tools (use the **Tool ID** in the log)

| Category | Tool ID → tool |
|---|---|
| **Terminal agents (harnesses)** | `claude-code` Claude Code · `codex` Codex CLI · `gemini-cli` Gemini CLI · `opencode` OpenCode · `pi` Pi · `omp` Oh My Pi · `aider` Aider · `goose` Goose · `amp` Amp |
| **IDE agents / extensions** | `cline` Cline · `roo` Roo Code · `kilo` Kilo Code · `continue` Continue · `copilot` GitHub Copilot (chat + agent mode) |
| **AI IDEs** | `cursor` Cursor · `windsurf` Windsurf · `zed` Zed · `jetbrains-ai` JetBrains AI / Junie · `kiro` Kiro · `trae` Trae |
| **Cloud / background agents** | `devin` Devin · `jules` Jules · `codex-cloud` Codex cloud · `copilot-agent` Copilot coding agent · `cursor-bg` Cursor background agents · `openhands` OpenHands |
| **Multi-agent / multi-model orchestrators** | `claude-squad` Claude Squad · `vibe-kanban` Vibe Kanban · `crystal` Crystal · `conductor` Conductor · `openrouter` OpenRouter · `litellm` LiteLLM |
| **AI app builders** | `v0` v0 · `lovable` Lovable · `bolt` Bolt · `replit` Replit Agent · `figma-make` Figma Make |
| **Data / ML assistants** | `jupyter-ai` Jupyter AI · `colab` Colab AI · `databricks` Databricks Assistant · `hex` Hex Magic |
| **Infra / cloud assistants** | `amazon-q` Amazon Q Developer · `gemini-cloud` Gemini Cloud Assist · `pulumi-ai` Pulumi AI · `k8sgpt` K8sGPT |
| **General** | `general` About AI coding tools in general, not one tool |

Tool names change often. If a product is renamed or merged, keep the old ID and note it here.

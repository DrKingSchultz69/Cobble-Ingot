#!/usr/bin/env node
// Turn docs/research/pain-log.csv into Obsidian notes (the CSV stays the source of truth).
//   node scripts/research/export-obsidian.mjs
// Writes:
//   docs/research/Pain log.md           overview: totals, theme ranking, top 30 problems, roles, tools
//   docs/research/themes/<theme>.md     one note per theme with all its rows
// Re-run after every change to the CSV; these files are regenerated, so edit the CSV, not them.
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv } from "./csv.mjs";

const RESEARCH = join(resolve(dirname(fileURLToPath(import.meta.url)), "../.."), "docs", "research");
const THEMES_DIR = join(RESEARCH, "themes");
const rows = parseCsv(readFileSync(join(RESEARCH, "pain-log.csv"), "utf8"));
const today = new Date().toISOString().slice(0, 10);

// Short descriptions, matching synthesis.md.
const ABOUT = {
  context: "Agent forgets or misses context (decisions, files, other repos)",
  cost: "Surprise cost, credits, usage limits, rate limits",
  loops: "Agent loops, retries, gets stuck, says done when it isn't",
  trust: "Wrong or unsafe edits, silent changes; users have to double-check everything",
  review: "Hard to review or see what the agent changed",
  switching: "Switching tools or models loses context, setup or time",
  parallel: "Running several agents at once: conflicts, chaos",
  setup: "Install, config, auth, Windows/WSL, environment trouble",
  security: "Secrets, dangerous commands, permissions, supply chain",
  design: "Design to code fidelity, visual checks",
  data: "Notebooks, SQL correctness, data privacy",
  infra: "CI, cloud, Terraform, Kubernetes, production risk",
  remote: "Can't watch or steer agents away from the desk",
  learning: "Over-reliance, not learning, confusing docs",
  quality: "Model/agent output got worse, ignores instructions, edits badly",
  reliability: "Errors, hangs, crashes, broken after an update",
  performance: "Slow start, CPU/RAM/disk heavy, UI lag",
  accounts: "Login, verification, multiple accounts or subscriptions",
  platform: "OS / IDE support (Linux, Windows, Intel Mac, JetBrains…)",
  models: "Model missing or unsupported, provider-format errors",
  control: "Undo, interrupt, queue, approvals, asking the user",
  standards: "AGENTS.md, skills, hooks, protocols differ between agents",
  ux: "Interface annoyances",
  "not-a-pain": "Not a real problem (announcements, empty, spam)",
};

const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
const num = (s) => Number(s) || 0;
const themesOf = (r) => r.theme.split(/[|,\s]+/).filter(Boolean);
const shortLink = (url) => {
  const m = /github\.com\/([^/]+\/[^/]+)\/issues\/(\d+)/.exec(url);
  return m ? `[${m[1].split("/")[1]}#${m[2]}](${url})` : url ? `[source](${url})` : "";
};
const status = (r) => (r.verified === "yes" ? "✅" : /rechecked_by=/.test(r.notes) ? "🔁" : "·");
const frontmatter = (o) =>
  "---\n" + Object.entries(o).map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.map((x) => JSON.stringify(x)).join(", ")}]` : JSON.stringify(v)}`).join("\n") + "\n---\n";

// ---- per-theme stats
const byTheme = new Map();
for (const r of rows) for (const t of themesOf(r)) (byTheme.get(t) ?? byTheme.set(t, []).get(t)).push(r);
const stats = [...byTheme].map(([t, rs]) => {
  const upvotes = rs.reduce((a, r) => a + num(r.agree_count), 0);
  const sev = rs.reduce((a, r) => a + num(r.severity_1to5), 0) / rs.length;
  return { t, rs, n: rs.length, upvotes, sev, weight: upvotes + rs.length * 5 };
}).sort((a, b) => b.weight - a.weight);

// ---- theme notes
rmSync(THEMES_DIR, { recursive: true, force: true });
mkdirSync(THEMES_DIR, { recursive: true });
const rowTable = (rs) =>
  "| ID | 👍 | Sev | Tool | Role | Problem | Workaround | Source | Checked |\n|---|---|---|---|---|---|---|---|---|\n" +
  rs.map((r) => `| ${r.id} | ${num(r.agree_count)} | ${cell(r.severity_1to5)} | ${cell(r.tool)} | ${cell(r.role)} | ${cell(r.pain_summary)} | ${cell(r.workaround_they_use)} | ${shortLink(r.link)} | ${status(r)} |`).join("\n");

for (const s of stats) {
  const rs = [...s.rs].sort((a, b) => num(b.agree_count) - num(a.agree_count));
  const tools = Object.entries(rs.reduce((m, r) => ((m[r.tool] = (m[r.tool] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
  const workarounds = rs.filter((r) => r.workaround_they_use);
  const ideas = rs.filter((r) => r.netheron_idea);
  const md =
    frontmatter({ type: "research-theme", theme: s.t, rows: s.n, upvotes: s.upvotes, avg_severity: Number(s.sev.toFixed(1)), generated: today, tags: ["research", "theme", `theme/${s.t}`] }) +
    `\n# Theme: ${s.t}\n\n> [!info] ${ABOUT[s.t] ?? "New theme (not yet described in [[synthesis]])"}\n> **${s.n}** problems · **${s.upvotes}** 👍 · average severity **${s.sev.toFixed(1)}** / 5 · rank **#${stats.indexOf(s) + 1}** of ${stats.length}\n\n` +
    `Back to [[Pain log]] · [[synthesis]] · [[Research Home]]\n\n` +
    `## Tools most affected\n${tools.slice(0, 8).map(([t, n]) => `- ${t}: ${n}`).join("\n")}\n\n` +
    (workarounds.length ? `## Workarounds people use (${workarounds.length})\n${workarounds.map((r) => `- **${r.id}** (${num(r.agree_count)} 👍): ${cell(r.workaround_they_use)}`).join("\n")}\n\n` : "") +
    (ideas.length ? `## Netheron ideas noted while labeling (${ideas.length})\n${ideas.map((r) => `- **${r.id}**: ${cell(r.netheron_idea)}`).join("\n")}\n\n` : "") +
    `## All problems (sorted by 👍)\n\nChecked: ✅ verified by you · 🔁 rechecked by an agent · · not yet\n\n${rowTable(rs)}\n`;
  writeFileSync(join(THEMES_DIR, `${s.t}.md`), md);
}

// ---- overview note
const top = [...rows].filter((r) => !themesOf(r).includes("not-a-pain")).sort((a, b) => num(b.agree_count) - num(a.agree_count)).slice(0, 30);
const countBy = (key) => Object.entries(rows.reduce((m, r) => ((m[r[key] || "?"] = (m[r[key] || "?"] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
const verified = rows.filter((r) => r.verified === "yes").length;
const rechecked = rows.filter((r) => /rechecked_by=/.test(r.notes)).length;
const labeled = rows.filter((r) => r.pain_summary && r.theme && r.severity_1to5).length;

const overview =
  frontmatter({ type: "research-log", rows: rows.length, labeled, verified, rechecked, generated: today, tags: ["research", "pain-log"] }) +
  `\n# Pain log\n\n> [!note] Generated from \`pain-log.csv\` on ${today}\n> Don't edit this note; edit the CSV and run \`node scripts/research/export-obsidian.mjs\`.\n\n` +
  `Back to [[Research Home]] · method: [[README]] · themes explained: [[synthesis]]\n\n` +
  `## Totals\n- **${rows.length}** problems · labeled **${labeled}** · verified by you **${verified}** · rechecked by agent **${rechecked}**\n` +
  `- Sources: ${countBy("source_type").map(([k, v]) => `${k} ${v}`).join(" · ")}\n\n` +
  `## Themes ranked (👍 + 5 × problems)\n\n| # | Theme | Problems | 👍 | Avg severity | What it is |\n|---|---|---|---|---|---|\n` +
  stats.map((s, i) => `| ${i + 1} | [[themes/${s.t}\\|${s.t}]] | ${s.n} | ${s.upvotes} | ${s.sev.toFixed(1)} | ${cell(ABOUT[s.t] ?? "")} |`).join("\n") +
  `\n\n## Top 30 problems by 👍\n\n| ID | 👍 | Sev | Tool | Problem | Themes | Workaround | Source | Checked |\n|---|---|---|---|---|---|---|---|---|\n` +
  top.map((r) => `| ${r.id} | ${num(r.agree_count)} | ${cell(r.severity_1to5)} | ${cell(r.tool)} | ${cell(r.pain_summary)} | ${themesOf(r).map((t) => `[[themes/${t}\\|${t}]]`).join(" ")} | ${cell(r.workaround_they_use)} | ${shortLink(r.link)} | ${status(r)} |`).join("\n") +
  `\n\n## By tool\n${countBy("tool").map(([k, v]) => `- ${k}: ${v}`).join("\n")}\n\n## By role\n${countBy("role").map(([k, v]) => `- ${k === "?" ? "unknown (?)" : k}: ${v}`).join("\n")}\n`;
writeFileSync(join(RESEARCH, "Pain log.md"), overview);

console.log(`Wrote "Pain log.md" and ${stats.length} theme notes in docs/research/themes/`);

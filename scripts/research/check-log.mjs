#!/usr/bin/env node
// Checks docs/research/pain-log.csv and shows progress toward the sprint targets.
//   node scripts/research/check-log.mjs
// 1. Auto rows: link, quote and 👍 count must still match the raw GitHub copy (nobody, human or AI, edited the evidence).
// 2. Every row: required columns filled, IDs valid (role, tool, source, theme, severity, verified).
// 3. Progress: rows per role family, spot-check rate of auto rows, labeling progress.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv } from "./csv.mjs";

const RESEARCH = join(resolve(dirname(fileURLToPath(import.meta.url)), "../.."), "docs", "research");
const LOG = join(RESEARCH, "pain-log.csv");
const RAW_DIR = join(RESEARCH, "raw");

// Keep in sync with roles-and-tools.md and synthesis.md.
const FAMILIES = {
  "Build: app engineers": ["fe", "be", "fs", "mob", "qa"],
  "Run: infrastructure": ["devops", "cloud", "sre", "sec"],
  "AI and ML": ["aieng", "mleng", "mlops", "ds"],
  "Data": ["de", "da"],
  "Design and product": ["des", "deseng", "pm", "em"],
  "Independent builders": ["indie", "nocode", "oss"],
  "Learning and communication": ["student", "devrel"],
};
const ROLES = new Set([...Object.values(FAMILIES).flat(), "?"]);
const TOOLS = new Set(("claude-code codex gemini-cli opencode pi omp aider goose amp cline roo kilo continue copilot cursor windsurf zed " +
  "jetbrains-ai kiro trae devin jules codex-cloud copilot-agent cursor-bg openhands claude-squad vibe-kanban crystal conductor openrouter " +
  "litellm v0 lovable bolt replit figma-make jupyter-ai colab databricks hex amazon-q gemini-cloud pulumi-ai k8sgpt general").split(" "));
const SOURCES = new Set(["github", "forum", "reddit", "hn", "review", "x", "youtube", "report", "interview", "self"]);
const STARTER_THEMES = new Set(["context", "cost", "loops", "trust", "review", "switching", "parallel", "setup", "security", "design", "data", "infra", "remote", "learning", "not-a-pain", "quality", "reliability", "performance", "accounts", "platform", "models", "control", "standards", "ux"]);
const WINDOW = { from: "2025-10-01", to: "2026-10-08" };

if (!existsSync(LOG)) {
  console.error(`No log at ${LOG}`);
  process.exit(1);
}
const rows = parseCsv(readFileSync(LOG, "utf8"));

// Latest raw copy per link (later files win).
const raw = new Map();
if (existsSync(RAW_DIR)) {
  for (const f of readdirSync(RAW_DIR).filter((f) => f.endsWith(".json")).sort()) {
    for (const r of JSON.parse(readFileSync(join(RAW_DIR, f), "utf8"))) raw.set(r.link, r);
  }
}

const errors = [];
const warns = [];
const err = (r, m) => errors.push(`${r.id || "(no id)"}: ${m}`);
const ids = new Set();
const links = new Map();
const newThemes = new Map();

for (const r of rows) {
  if (!r.id) err(r, "missing id");
  else if (ids.has(r.id)) err(r, "duplicate id");
  ids.add(r.id);
  if (!r.link) err(r, "missing link (no link, no row)");
  else if (links.has(r.link)) warns.push(`${r.id}: same link as ${links.get(r.link)} (count people once)`);
  else links.set(r.link, r.id);
  if (!r.quote) err(r, "missing quote");
  if (!ROLES.has(r.role)) err(r, `unknown role "${r.role}"`);
  if (!TOOLS.has(r.tool)) err(r, `unknown tool "${r.tool}" (add it to roles-and-tools.md and this script)`);
  if (!SOURCES.has(r.source_type)) err(r, `unknown source_type "${r.source_type}"`);
  if (r.severity_1to5 && !/^[1-5]$/.test(r.severity_1to5)) err(r, `severity must be 1–5, got "${r.severity_1to5}"`);
  if (r.agree_count && !/^\d+$/.test(r.agree_count)) err(r, `agree_count must be a number, got "${r.agree_count}"`);
  if (r.verified && !["yes", "no"].includes(r.verified)) err(r, `verified must be yes/no, got "${r.verified}"`);
  if (r.collected_by && !["auto", "manual"].includes(r.collected_by)) err(r, `collected_by must be auto/manual, got "${r.collected_by}"`);
  for (const t of r.theme.split(/[\s|,]+/).filter(Boolean)) if (!STARTER_THEMES.has(t)) newThemes.set(t, (newThemes.get(t) ?? 0) + 1);
  const created = /created=(\d{4}-\d{2}-\d{2})/.exec(r.notes)?.[1];
  if (created && (created < WINDOW.from || created > WINDOW.to)) warns.push(`${r.id}: created ${created}, outside the evidence window`);

  if (r.collected_by === "auto") {
    const g = raw.get(r.link);
    if (!g) err(r, "auto row has no raw copy (was it typed by hand? set collected_by=manual)");
    else {
      if (g.quote !== r.quote) err(r, "QUOTE CHANGED from the GitHub original. Restore it; put interpretation in pain_summary/notes");
      if (String(g.agree_count) !== String(r.agree_count)) err(r, `👍 changed: raw ${g.agree_count}, log ${r.agree_count}`);
    }
  }
}

// ---- report
const auto = rows.filter((r) => r.collected_by === "auto");
const manual = rows.filter((r) => r.collected_by !== "auto");
const checked = auto.filter((r) => r.verified === "yes").length;
const labeled = rows.filter((r) => r.pain_summary && r.theme && r.severity_1to5).length;
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

console.log(`Pain log: ${rows.length} rows  (auto ${auto.length} · manual ${manual.length})`);
console.log(`Labeled (summary + theme + severity): ${labeled}/${rows.length} (${pct(labeled, rows.length)}%)`);
console.log(`Auto rows spot-checked by you: ${checked}/${auto.length} (${pct(checked, auto.length)}%, target ≥ 20%)`);
console.log("\nRows per role family (target ≥ 15 each):");
for (const [fam, roles] of Object.entries(FAMILIES)) {
  const n = rows.filter((r) => roles.includes(r.role)).length;
  console.log(`  ${n >= 15 ? "✓" : "·"} ${fam.padEnd(28)} ${String(n).padStart(4)}`);
}
console.log(`    role unknown (?)              ${String(rows.filter((r) => r.role === "?").length).padStart(4)}`);
if (newThemes.size) console.log(`\nThemes not in synthesis.md's starter list (add them there if they're real): ${[...newThemes].map(([t, n]) => `${t}(${n})`).join(", ")}`);
if (warns.length) console.log(`\n${warns.length} warning(s):\n  ${warns.slice(0, 15).join("\n  ")}${warns.length > 15 ? "\n  …" : ""}`);
if (errors.length) {
  console.log(`\n✗ ${errors.length} error(s):\n  ${errors.slice(0, 30).join("\n  ")}${errors.length > 30 ? "\n  …" : ""}`);
  process.exit(1);
}
console.log("\n✓ No errors.");

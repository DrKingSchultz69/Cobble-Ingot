#!/usr/bin/env node
// Build docs/research/Solutions.md from the notes in docs/research/solutions/ (+ the pain log).
//   node scripts/research/export-solutions-index.mjs
// The solution notes are hand-maintained (you edit status/decision/priority and add your ideas);
// this index is regenerated, so don't edit Solutions.md by hand. Exits 1 if a pain-log row isn't covered.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv } from "./csv.mjs";

const RESEARCH = join(resolve(dirname(fileURLToPath(import.meta.url)), "../.."), "docs", "research");
const DIR = join(RESEARCH, "solutions");
const today = new Date().toISOString().slice(0, 10);
const log = parseCsv(readFileSync(join(RESEARCH, "pain-log.csv"), "utf8"));
const byId = new Map(log.map((r) => [r.id, r]));
const num = (s) => Number(s) || 0;
const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();

// Minimal frontmatter reader for the flat keys these notes use (strings, numbers, booleans, [lists]).
function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  const o = {};
  if (!m) return o;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([\w-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith("[")) v = [...v.matchAll(/"([^"]*)"/g)].map((x) => x[1]);
    else if (/^".*"$/.test(v)) v = v.slice(1, -1);
    else if (/^\d+$/.test(v)) v = Number(v);
    o[kv[1]] = v;
  }
  return o;
}

// Options: "### S1 · name" followed by "> [!success|warning|failure] label"; effort + built lines.
function options(text) {
  const out = [];
  const re = /^### (S\d+) · (.+)\r?\n\r?\n> \[!(success|warning|failure)\][^\n]*\n((?:>.*\n?)*)/gm;
  for (const m of text.matchAll(re)) {
    const body = m[4];
    out.push({
      key: m[1],
      name: m[2].trim(),
      fit: { success: "✅", warning: "🟡", failure: "❌" }[m[3]],
      effort: /\*\*Effort:\*\* (\w)/.exec(body)?.[1] ?? "",
      built: /\*\*Already in Netheron:\*\* (.+)/.exec(body)?.[1]?.trim() ?? "",
    });
  }
  return out;
}
const cant = (text) => /## What Netheron can't fix\s*\n+> \[!failure\][^\n]*\n> (.+)/.exec(text)?.[1]?.trim() ?? "";

const notes = readdirSync(DIR).filter((f) => f.endsWith(".md")).sort().map((f) => {
  const text = readFileSync(join(DIR, f), "utf8").replaceAll(String.fromCharCode(13), "");
  const fm = frontmatter(text);
  const rows = (fm.rows ?? []).filter((id) => byId.has(id));
  return { file: f.replace(/\.md$/, ""), fm, rows, upvotes: rows.reduce((a, id) => a + num(byId.get(id).agree_count), 0), opts: options(text), cant: cant(text) };
}).sort((a, b) => b.upvotes - a.upvotes);

// Coverage: every pain row is in a solution note, or is marked not-a-pain.
const covered = new Map();
for (const n of notes) for (const id of n.rows) covered.set(id, [...(covered.get(id) ?? []), n.fm.id]);
const notAPain = log.filter((r) => r.theme.split("|").includes("not-a-pain"));
const uncovered = log.filter((r) => !covered.has(r.id) && !notAPain.includes(r));
const twice = [...covered].filter(([, v]) => v.length > 1);

const link = (n) => `[[solutions/${n.file}\\|${n.fm.id}]]`;
const count = (k, v) => notes.filter((n) => n.fm[k] === v).length;
const allOpts = notes.flatMap((n) => n.opts.map((o) => ({ n, o })));

let md = `---
type: "solutions-index"
clusters: ${notes.length}
problems_covered: ${covered.size}
options: ${allOpts.length}
generated: "${today}"
tags: ["research", "solutions"]
---

# Solutions

> [!note] Generated on ${today} from \`solutions/\` and \`pain-log.csv\`
> Don't edit this note. Edit a solution note (its \`status\`, \`decision\`, \`priority\` and **Your review**), then run \`node scripts/research/export-solutions-index.mjs\`.

Back to [[Research Home]] · evidence: [[Pain log]]

## At a glance
- **${notes.length} problem clusters** cover **${covered.size}** of ${log.length} logged problems (${notAPain.length} more are "not a problem").
- **${allOpts.length} solution options**: ✅ ${allOpts.filter((x) => x.o.fit === "✅").length} Netheron can build · 🟡 ${allOpts.filter((x) => x.o.fit === "🟡").length} partly · ${allOpts.filter((x) => x.o.built).length} already partly built.
- Clusters Netheron can address: **${count("can_incorporate", "yes")}** fully · **${count("can_incorporate", "partly")}** partly · **${count("can_incorporate", "no")}** not at all.
- Review status: ${Object.entries(notes.reduce((m, n) => ((m[n.fm.status || "?"] = (m[n.fm.status || "?"] ?? 0) + 1), m), {})).map(([k, v]) => `${k} ${v}`).join(" · ")}

${uncovered.length || twice.length ? `> [!warning] Coverage problems\n> ${uncovered.length ? `Not in any solution: ${uncovered.map((r) => r.id).join(", ")}. ` : ""}${twice.length ? `In more than one: ${twice.map(([id, v]) => `${id} (${v.join(", ")})`).join(", ")}` : ""}\n` : "> [!success] Every logged problem is covered by exactly one solution note.\n"}
## All problem clusters (by 👍)

| ID | Problem | Problems | 👍 | Can Netheron do it? | Options | Partly built | Status | Your decision | Priority |
|---|---|---|---|---|---|---|---|---|---|
${notes.map((n) => `| ${link(n)} | ${cell(n.fm.title)} | ${n.rows.length} | ${n.upvotes} | ${{ yes: "✅ yes", partly: "🟡 partly", no: "❌ no" }[n.fm.can_incorporate] ?? n.fm.can_incorporate} | ${n.opts.length} | ${n.opts.some((o) => o.built) ? "yes" : ""} | ${cell(n.fm.status)} | ${cell(n.fm.decision)} | ${cell(n.fm.priority)} |`).join("\n")}

## ✅ What can be incorporated in Netheron

| Cluster | Option | Fit | Effort | Already in Netheron |
|---|---|---|---|---|
${allOpts.filter((x) => x.o.fit !== "❌").map(({ n, o }) => `| ${link(n)} | ${o.key} · ${cell(o.name)} | ${o.fit} | ${o.effort} | ${cell(o.built)} |`).join("\n")}

## ❌ What can't be (outside Netheron's control)

| Cluster | Problem | Why Netheron can't fix it |
|---|---|---|
${notes.filter((n) => n.cant).map((n) => `| ${link(n)} | ${cell(n.fm.title)} | ${cell(n.cant)} |`).join("\n")}

## Not a problem (excluded)
${notAPain.map((r) => `- ${r.id}: ${cell(r.pain_summary)}`).join("\n")}
`;
writeFileSync(join(RESEARCH, "Solutions.md"), md);
console.log(`Solutions.md: ${notes.length} clusters, ${allOpts.length} options, covered ${covered.size}/${log.length}, uncovered ${uncovered.length}, duplicates ${twice.length}`);
if (uncovered.length || twice.length) process.exit(1);

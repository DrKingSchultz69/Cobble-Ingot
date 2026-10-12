#!/usr/bin/env node
// Merge agent labels into docs/research/pain-log.csv without touching the evidence.
//   node scripts/research/apply-labels.mjs <labels.jsonl> [--by <agent name>]
// Each line: {"id":"A-0001","pain_summary":"…","role":"?","theme":"setup","severity":2,"workaround":"…","idea":"…","note":"…"}
// Only these label columns can change; quote/link/👍/verified etc. are never written here.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv, toCsv } from "./csv.mjs";

const LOG = join(resolve(dirname(fileURLToPath(import.meta.url)), "../.."), "docs", "research", "pain-log.csv");
const [file] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const byIdx = process.argv.indexOf("--by");
const by = byIdx > 0 ? process.argv[byIdx + 1] : "agent";
if (!file) {
  console.error("usage: apply-labels.mjs <labels.jsonl> [--by <agent>]");
  process.exit(1);
}

const rows = parseCsv(readFileSync(LOG, "utf8"));
const byId = new Map(rows.map((r) => [r.id, r]));
const FIELDS = { pain_summary: "pain_summary", role: "role", theme: "theme", severity: "severity_1to5", workaround: "workaround_they_use", idea: "netheron_idea" };

let applied = 0;
const problems = [];
readFileSync(file, "utf8").split(/\r?\n/).forEach((line, i) => {
  if (!line.trim()) return;
  let l;
  try { l = JSON.parse(line); } catch { return problems.push(`line ${i + 1}: not JSON`); }
  const r = byId.get(l.id);
  if (!r) return problems.push(`line ${i + 1}: unknown id ${l.id}`);
  for (const [k, col] of Object.entries(FIELDS)) {
    if (l[k] === undefined || l[k] === null) continue;
    r[col] = String(l[k]).trim();
  }
  if (!r.notes.includes("labeled_by=")) r.notes = `${r.notes}${r.notes ? "; " : ""}labeled_by=${by}`;
  // Optional extra note (e.g. "rechecked_by=claude: read full issue + top comment"). Never touches `verified`.
  if (l.note && !r.notes.includes(String(l.note))) r.notes = `${r.notes}; ${String(l.note).replace(/\s+/g, " ")}`;
  applied++;
});

writeFileSync(LOG, toCsv(rows));
console.log(`Applied labels to ${applied} rows${problems.length ? `; ${problems.length} problem(s):\n  ${problems.join("\n  ")}` : "."}`);
console.log("Now run: node scripts/research/check-log.mjs");

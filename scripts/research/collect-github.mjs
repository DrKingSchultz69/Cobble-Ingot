#!/usr/bin/env node
// Research day 1: pull the most-upvoted GitHub issues for every tool into docs/research/pain-log.csv.
// Plain code, no AI: quotes, links and 👍 counts come straight from the GitHub API.
// A raw copy is saved so `check-log.mjs` can later prove those columns weren't changed.
//
//   node scripts/research/collect-github.mjs            # top 30 per tool
//   node scripts/research/collect-github.mjs --top 50   # more per tool
//   node scripts/research/collect-github.mjs --only claude-code,codex
//
// Safe to re-run: rows whose link is already in the log are skipped (their 👍 count is refreshed).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { COLUMNS, parseCsv, toCsv } from "./csv.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const RESEARCH = join(ROOT, "docs", "research");
const LOG = join(RESEARCH, "pain-log.csv");
const RAW_DIR = join(RESEARCH, "raw");

// Evidence window of the snapshot (see docs/research/research-plan.md).
const WINDOW = { from: "2025-10-01", to: "2026-10-08" };

// Tool ID (roles-and-tools.md) → repo, plus an optional filter for repos that aren't only about AI.
const TOOLS = [
  ["claude-code", "anthropics/claude-code"],
  ["codex", "openai/codex"],
  ["gemini-cli", "google-gemini/gemini-cli"],
  ["opencode", "anomalyco/opencode"],
  ["pi", "earendil-works/pi"],
  ["omp", "can1357/oh-my-pi"],
  ["aider", "Aider-AI/aider"],
  ["cline", "cline/cline"],
  ["roo", "RooCodeInc/Roo-Code"],
  ["kilo", "Kilo-Org/kilocode"],
  ["continue", "continuedev/continue"],
  ["goose", "aaif-goose/goose"],
  ["zed", "zed-industries/zed", 'agent OR AI OR assistant OR LLM OR "edit prediction" OR model'],
  ["openhands", "OpenHands/OpenHands"],
  ["copilot", "microsoft/vscode-copilot-release"],
  ["claude-squad", "smtg-ai/claude-squad"],
  ["vibe-kanban", "BloopAI/vibe-kanban"],
  ["crystal", "stravu/crystal"],
  ["litellm", "BerriAI/litellm"],
];

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const TOP = Math.min(100, Number(opt("top", 30)));
const ONLY = opt("only", "")?.split(",").filter(Boolean);
const QUOTE_CHARS = 400;

function token() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execFileSync("gh", ["auth", "token"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return ""; // unauthenticated works too, but only 10 searches per minute
  }
}
const TOKEN = token();

async function search(repo, extra) {
  const q = `repo:${repo} is:issue created:${WINDOW.from}..${WINDOW.to}${extra ? ` (${extra})` : ""}`;
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&sort=reactions-%2B1&order=desc&per_page=${TOP}`;
  for (let attempt = 1; ; attempt++) {
    const r = await fetch(url, {
      headers: { accept: "application/vnd.github+json", "user-agent": "netheron-research", ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}) },
    });
    if (r.ok) return (await r.json()).items ?? [];
    // Search rate limit: wait for the reset and retry (max 3 tries).
    if ((r.status === 403 || r.status === 429) && attempt < 3) {
      const reset = Number(r.headers.get("x-ratelimit-reset") ?? 0) * 1000;
      const wait = Math.max(5_000, Math.min(65_000, reset - Date.now() + 1_000));
      console.log(`  rate limited, waiting ${Math.round(wait / 1000)} s…`);
      await new Promise((ok) => setTimeout(ok, wait));
      continue;
    }
    throw new Error(`${repo}: GitHub ${r.status} ${await r.text()}`);
  }
}

// Quote = exact words from the issue (title, then the start of the body), whitespace flattened, cut at QUOTE_CHARS.
function quoteOf(issue) {
  const body = String(issue.body ?? "")
    .replace(/<!--[\s\S]*?-->/g, " ") // issue-template comments
    .replace(/```[\s\S]*?```/g, " [code] ")
    // Keep the words, drop the markup: images, HTML tags, link URLs, heading/bold markers.
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " [image] ")
    .replace(/<img[^>]*>/gi, " [image] ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)\]\((?:[^()]|\([^)]*\))*\)/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*|__/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const text = body ? `${issue.title} — ${body}` : issue.title;
  return text.length > QUOTE_CHARS ? text.slice(0, QUOTE_CHARS - 1).trimEnd() + "…" : text;
}

async function main() {
  const existing = existsSync(LOG) ? parseCsv(readFileSync(LOG, "utf8")) : [];
  const byLink = new Map(existing.map((r) => [r.link, r]));
  let next = 1 + Math.max(0, ...existing.map((r) => Number(/^A-(\d+)$/.exec(r.id)?.[1] ?? 0)));
  const today = new Date().toISOString().slice(0, 10);
  const raw = [];
  let added = 0;
  let refreshed = 0;

  for (const [tool, repo, extra] of TOOLS) {
    if (ONLY?.length && !ONLY.includes(tool)) continue;
    process.stdout.write(`${tool.padEnd(13)} ${repo.padEnd(34)} `);
    let items;
    try {
      items = await search(repo, extra);
    } catch (e) {
      console.log(`FAILED: ${e.message.slice(0, 120)}`);
      continue;
    }
    let n = 0;
    for (const it of items) {
      const plus1 = it.reactions?.["+1"] ?? 0;
      const quote = quoteOf(it);
      raw.push({ tool, repo, link: it.html_url, quote, agree_count: plus1, created: it.created_at, state: it.state });
      const old = byLink.get(it.html_url);
      if (old) {
        if (old.collected_by === "auto" && String(old.agree_count) !== String(plus1)) { old.agree_count = String(plus1); refreshed++; }
        continue;
      }
      const row = Object.fromEntries(COLUMNS.map((c) => [c, ""]));
      Object.assign(row, {
        id: `A-${String(next++).padStart(4, "0")}`,
        date_found: today,
        role: "?",
        tool,
        source_type: "github",
        link: it.html_url,
        quote,
        agree_count: String(plus1),
        notes: `state=${it.state}; created=${it.created_at.slice(0, 10)}; comments=${it.comments}; labels=${(it.labels ?? []).map((l) => l.name).join("|")}`,
        collected_by: "auto",
        verified: "no",
      });
      existing.push(row);
      byLink.set(row.link, row);
      added++;
      n++;
    }
    const top = items[0]?.reactions?.["+1"] ?? 0;
    console.log(`${String(items.length).padStart(3)} found · ${String(n).padStart(3)} new · top 👍 ${top}`);
    await new Promise((ok) => setTimeout(ok, TOKEN ? 2_200 : 6_500)); // stay under the search rate limit
  }

  writeFileSync(LOG, toCsv(existing));
  mkdirSync(RAW_DIR, { recursive: true });
  const rawFile = join(RAW_DIR, `github-${today}.json`);
  const prev = existsSync(rawFile) ? JSON.parse(readFileSync(rawFile, "utf8")) : [];
  const merged = new Map([...prev, ...raw].map((r) => [r.link, r]));
  writeFileSync(rawFile, JSON.stringify([...merged.values()], null, 1));
  console.log(`\nDone: ${added} new rows, ${refreshed} 👍 counts refreshed → ${LOG}`);
  console.log(`Raw copy: ${rawFile}`);
  console.log("Next: label the rows (scripts/research/label-prompt.md), then run check-log.mjs.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

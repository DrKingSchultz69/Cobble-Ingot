// Decides which agent + model should take a task.
// Score = strength for the task category + past success − cost − current rate-limit pressure.
// Subscriptions cost 0 here, so they win ties; API-key models are the overflow.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";

export const CATEGORIES = ["plan", "debug", "review", "refactor", "frontend", "test", "docs", "quick", "code"] as const;
export type Category = (typeof CATEGORIES)[number];

const KEYWORDS: Record<Exclude<Category, "code">, string[]> = {
  plan: ["plan", "design", "architecture", "architect", "approach", "strategy", "spec", "roadmap", "how should"],
  debug: ["bug", "fix", "error", "crash", "failing", "fails", "broken", "debug", "exception", "stack trace", "not working"],
  review: ["review", "audit", "security", "vulnerab", "code quality", "pr #", "pull request"],
  refactor: ["refactor", "migrate", "migration", "restructure", "rewrite", "rename across", "whole codebase", "upgrade"],
  frontend: ["ui", "css", "component", "page", "layout", "frontend", "react", "tailwind", "style", "responsive", "animation"],
  test: ["test", "coverage", "unit test", "e2e", "spec file", "jest", "vitest", "pytest"],
  docs: ["readme", "docs", "documentation", "document", "comment", "changelog"],
  quick: ["typo", "small", "quick", "simple", "one line", "rename", "bump", "format"],
};

export type Candidate = {
  id: string;
  agent: "claude" | "codex" | "opencode";
  model?: string;
  label: string;
  auth: "subscription" | "api_key" | "free";
  /** 0..3 per category; missing = 1. */
  strengths: Partial<Record<Category, number>>;
  /** Relative cost of one task, 0 = included in a subscription. */
  cost: number;
};

export const CATALOG: Candidate[] = [
  { id: "claude-opus", agent: "claude", model: "opus", label: "Claude Code · Opus", auth: "subscription", cost: 0,
    strengths: { plan: 3, debug: 3, review: 3, refactor: 3, frontend: 2, test: 2, docs: 2, quick: 0, code: 3 } },
  { id: "claude-sonnet", agent: "claude", model: "sonnet", label: "Claude Code · Sonnet", auth: "subscription", cost: 0,
    strengths: { plan: 2, debug: 2, review: 2, refactor: 2, frontend: 3, test: 3, docs: 3, quick: 2, code: 3 } },
  { id: "claude-haiku", agent: "claude", model: "haiku", label: "Claude Code · Haiku", auth: "subscription", cost: 0,
    strengths: { plan: 0, debug: 1, review: 1, refactor: 0, frontend: 1, test: 1, docs: 2, quick: 3, code: 1 } },
  { id: "codex", agent: "codex", label: "Codex (ChatGPT plan)", auth: "subscription", cost: 0,
    strengths: { plan: 2, debug: 3, review: 3, refactor: 3, frontend: 2, test: 3, docs: 1, quick: 2, code: 3 } },
  { id: "opencode-deepseek", agent: "opencode", model: "openrouter/~deepseek/deepseek-v4-flash-latest", label: "OpenCode · DeepSeek (OpenRouter)",
    auth: "api_key", cost: 1, strengths: { plan: 1, debug: 2, review: 1, refactor: 2, frontend: 2, test: 2, docs: 2, quick: 3, code: 2 } },
  { id: "opencode-free", agent: "opencode", model: "openrouter/google/gemma-4-31b-it:free", label: "OpenCode · Gemma (free)",
    auth: "free", cost: 0.5, strengths: { plan: 0, debug: 1, review: 0, refactor: 0, frontend: 1, test: 1, docs: 2, quick: 2, code: 1 } },
];

// Words that show up in many kinds of tasks count for less.
const WEAK = new Set(["fix", "page", "style", "test", "document", "comment", "format"]);

export function classify(prompt: string): { category: Category; scores: Record<string, number> } {
  const p = prompt.toLowerCase();
  const scores: Record<string, number> = {};
  for (const [cat, words] of Object.entries(KEYWORDS)) {
    scores[cat] = words.reduce((n, w) => n + (p.includes(w) ? (WEAK.has(w) ? 0.5 : w.length > 6 ? 2 : 1) : 0), 0);
  }
  const [best, n] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return { category: n > 0 ? (best as Category) : "code", scores };
}

export type Availability = { claude: boolean; codex: boolean; opencode: boolean; openrouter: boolean };

let availCache: { at: number; v: Availability } | undefined;
export function detectAvailability(): Availability {
  if (availCache && Date.now() - availCache.at < 60_000) return availCache.v;
  const onPath = (cmd: string) => {
    try {
      execFileSync(process.platform === "win32" ? "where" : "which", [cmd], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  };
  let openrouter = !!process.env.OPENROUTER_API_KEY;
  try {
    const auth = JSON.parse(readFileSync(join(homedir(), ".local", "share", "opencode", "auth.json"), "utf8"));
    openrouter ||= !!auth.openrouter;
  } catch { /* no opencode auth */ }
  const v = {
    claude: onPath("claude"),
    codex: onPath("codex") && (existsSync(join(homedir(), ".codex", "auth.json")) || !!process.env.OPENAI_API_KEY),
    opencode: onPath("opencode"),
    openrouter,
  };
  availCache = { at: Date.now(), v };
  return v;
}

export type History = {
  /** Finished tasks per candidate id: successes / total. */
  outcomes: Record<string, { ok: number; total: number }>;
  /** 429s per agent in the last 15 minutes. */
  rateLimited: Record<string, number>;
};

export function loadHistory(db: DatabaseSync | undefined, category: Category): History {
  const h: History = { outcomes: {}, rateLimited: {} };
  if (!db) return h;
  try {
    const rows = db
      .prepare(`SELECT candidate, SUM(status = 'done') ok, COUNT(*) total FROM tasks
                WHERE category = ? AND status IN ('done','failed') GROUP BY candidate`)
      .all(category) as Array<{ candidate: string; ok: number; total: number }>;
    for (const r of rows) h.outcomes[r.candidate] = { ok: Number(r.ok), total: Number(r.total) };
  } catch { /* tasks table not created yet */ }
  try {
    const rows = db
      .prepare("SELECT agent, COUNT(*) n FROM calls WHERE status = 429 AND ts > ? GROUP BY agent")
      .all(Date.now() - 15 * 60_000) as Array<{ agent: string; n: number }>;
    for (const r of rows) h.rateLimited[r.agent] = Number(r.n);
  } catch { /* calls table missing */ }
  return h;
}

export type Decision = {
  candidate: Candidate;
  category: Category;
  reason: string;
  ranked: Array<{ id: string; label: string; score: number }>;
};

export function decide(prompt: string, opts: { db?: DatabaseSync; availability?: Availability; history?: History } = {}): Decision {
  const { category } = classify(prompt);
  const avail = opts.availability ?? detectAvailability();
  const hist = opts.history ?? loadHistory(opts.db, category);
  const longTask = prompt.length > 3000;

  const usable = CATALOG.filter((c) => {
    if (!avail[c.agent]) return false;
    if (c.agent === "opencode") return avail.openrouter;
    return true;
  });
  if (!usable.length) throw new Error("No agents available. Install/sign in to claude, codex or opencode.");

  const ranked = usable
    .map((c) => {
      const strength = c.strengths[category] ?? 1;
      const o = hist.outcomes[c.id];
      const success = o ? (o.ok + 1) / (o.total + 2) : 0.5; // Laplace-smoothed
      const pressure = Math.min(3, (hist.rateLimited[c.agent] ?? 0) * 0.75);
      const score = strength * 2 + (success - 0.5) * 2 - c.cost - pressure + (longTask && c.agent === "claude" ? 0.5 : 0);
      return { c, score: Math.round(score * 100) / 100, strength, success, pressure };
    })
    .sort((a, b) => b.score - a.score);

  const top = ranked[0];
  const bits = [`task looks like "${category}"`, `${top.c.label} strength ${top.strength}/3`];
  if (hist.outcomes[top.c.id]) bits.push(`past success ${Math.round(top.success * 100)}%`);
  if (top.c.cost === 0) bits.push("included in subscription");
  const limited = ranked.filter((r) => r.pressure > 0).map((r) => r.c.agent);
  if (limited.length) bits.push(`rate-limited recently: ${[...new Set(limited)].join(", ")}`);

  return {
    candidate: top.c,
    category,
    reason: bits.join("; "),
    ranked: ranked.map((r) => ({ id: r.c.id, label: r.c.label, score: r.score })),
  };
}

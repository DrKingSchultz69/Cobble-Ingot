// Usage from the agents' own session logs, for subscription logins (Claude Pro/Max, ChatGPT plan).
// Subscription traffic must go straight from the official CLI to its provider, so it never passes Netheron's proxy.
// Claude Code and Codex already write every turn, with token counts, to local JSONL files; this reads those files
// and logs the same rows the proxy would (calls table + callEvents), so meters, budgets, alarms and limit
// hand-offs keep working. API-key logins still go through the proxy.
//   Claude: <config dir>/projects/<cwd with every non-alphanumeric char as "-">/<session>.jsonl
//   Codex:  <CODEX_HOME>/sessions/YYYY/MM/DD/rollout-*.jsonl (first line: session_meta with the cwd)
import { closeSync, existsSync, openSync, readdirSync, readSync, statSync } from "node:fs";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { costFor } from "./config.ts";
import { logCall, type CallRow } from "./db.ts";

export type LogAgent = "claude" | "codex";
/** One task whose usage comes from session logs instead of the proxy. */
export type LogWatch = { task: string; agent: LogAgent; home: string; cwd: string; since: number };

/** Claude Code's folder name for a working directory: every non-alphanumeric character becomes "-". */
export const claudeProjectDir = (cwd: string) => cwd.replace(/[^A-Za-z0-9]/g, "-");
const sameDir = (a: string, b: string) => norm(a) === norm(b);
const norm = (p: string) => p.replace(/[\\/]+/g, "/").replace(/\/$/, "").toLowerCase();
const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const tsOf = (v: unknown) => { const t = Date.parse(String(v ?? "")); return Number.isFinite(t) ? t : 0; };

type FileState = { pos: number; task: string; model: string; seen: Set<string>; lastLimit: number };

export class SessionLogReader {
  private watches = new Map<string, LogWatch>();
  private files = new Map<string, FileState>();
  private db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
    db.exec("CREATE TABLE IF NOT EXISTS session_log_offsets (file TEXT PRIMARY KEY, task TEXT NOT NULL, pos INTEGER NOT NULL)");
    ensureLimitSchema(db);
  }

  add(w: LogWatch) { this.watches.set(w.task, w); }
  /** Stop following a task, after one last read so its final turn is counted. */
  remove(task: string) {
    if (!this.watches.has(task)) return;
    this.poll();
    this.watches.delete(task);
    for (const [f, s] of this.files) if (s.task === task) this.files.delete(f);
  }
  has(task: string) { return this.watches.has(task); }

  /** Read whatever the watched agents wrote since the last poll. Cheap: only new bytes are read. */
  poll() {
    for (const w of this.watches.values()) {
      try {
        for (const file of w.agent === "claude" ? this.claudeFiles(w) : this.codexFiles(w)) this.readFile(file, w);
      } catch { /* a log folder that isn't there yet, or a file mid-rotation: try again next tick */ }
    }
  }

  private claudeFiles(w: LogWatch): string[] {
    const dir = join(w.home, "projects", claudeProjectDir(w.cwd));
    if (!existsSync(dir)) return [];
    return readdirSync(dir).filter((f) => f.endsWith(".jsonl")).map((f) => join(dir, f))
      .filter((f) => this.files.get(f)?.task === w.task || (!this.files.has(f) && statSync(f).mtimeMs >= w.since - 60_000));
  }

  private codexFiles(w: LogWatch): string[] {
    const root = join(w.home, "sessions");
    if (!existsSync(root)) return [];
    const out: string[] = [];
    // Only the day folders the task can have written to (UTC and local dates around its start).
    const days = new Set<string>();
    for (let t = w.since - 86_400_000; t <= Date.now() + 86_400_000; t += 86_400_000) {
      const d = new Date(t);
      days.add([d.getFullYear(), d.getMonth() + 1, d.getDate()].map((x) => String(x).padStart(2, "0")).join("/"));
      days.add([d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()].map((x) => String(x).padStart(2, "0")).join("/"));
    }
    for (const day of days) {
      const dir = join(root, ...day.split("/"));
      if (!existsSync(dir)) continue;
      for (const f of readdirSync(dir)) {
        if (!f.endsWith(".jsonl")) continue;
        const file = join(dir, f);
        const known = this.files.get(file);
        if (known) { if (known.task === w.task) out.push(file); continue; }
        if (statSync(file).mtimeMs < w.since - 60_000) continue;
        const cwd = codexCwd(file);
        if (cwd && sameDir(cwd, w.cwd)) out.push(file);
      }
    }
    return out;
  }

  private state(file: string, task: string): FileState | undefined {
    let s = this.files.get(file);
    if (s) return s.task === task ? s : undefined;
    // A file belongs to the first task that claims it; a restart resumes where the last read stopped.
    const saved = this.db.prepare("SELECT task, pos FROM session_log_offsets WHERE file = ?").get(file) as { task: string; pos: number } | undefined;
    if (saved && saved.task !== task) return undefined;
    s = { pos: saved?.pos ?? 0, task, model: "", seen: new Set(), lastLimit: 0 };
    this.files.set(file, s);
    return s;
  }

  private readFile(file: string, w: LogWatch) {
    const s = this.state(file, w.task);
    if (!s) return;
    const size = statSync(file).size;
    if (size < s.pos) s.pos = 0; // rewritten
    if (size === s.pos) return;
    const fd = openSync(file, "r");
    let text: string;
    try {
      const buf = Buffer.alloc(size - s.pos);
      readSync(fd, buf, 0, buf.length, s.pos);
      text = buf.toString("utf8");
    } finally { closeSync(fd); }
    const end = text.lastIndexOf("\n");
    if (end < 0) return; // half a line: wait for the rest
    for (const line of text.slice(0, end).split("\n")) {
      if (!line.trim()) continue;
      let rec: Record<string, any>;
      try { rec = JSON.parse(line); } catch { continue; }
      const rows = w.agent === "claude" ? this.claudeRow(rec, s, w) : this.codexRow(rec, s, w);
      for (const row of [rows].flat()) if (row) logCall(this.db, row);
    }
    s.pos += Buffer.byteLength(text.slice(0, end + 1), "utf8");
    this.db.prepare("INSERT INTO session_log_offsets (file, task, pos) VALUES (?, ?, ?) ON CONFLICT(file) DO UPDATE SET pos = excluded.pos")
      .run(file, w.task, s.pos);
  }

  private claudeRow(rec: Record<string, any>, s: FileState, w: LogWatch): CallRow | undefined {
    const ts = tsOf(rec.timestamp);
    if (rec.type !== "assistant" || !rec.message || ts < w.since) return undefined;
    const m = rec.message;
    if (rec.isApiErrorMessage) {
      const status = rec.error === "rate_limit" ? 429 : n(rec.apiErrorStatus) || (rec.error === "authentication_failed" ? 401 : 500);
      if (status === 429 && rec.quotaLimits) saveLimit(this.db, "claude", ts, { limited: true, resetAt: n(rec.quotaLimits.resetsAt) * 1000, window: String(rec.quotaLimits.rateLimitType ?? "") });
      const resetAt = n(rec.quotaLimits?.resetsAt) * 1000;
      return { ...base(ts, w, "anthropic", "unknown", status), reset_at: status === 429 ? resetAt : 0,
               limit_info: status === 429 && rec.quotaLimits ? JSON.stringify(rec.quotaLimits) : "" };
    }
    const u = m.usage;
    if (!u || m.model === "<synthetic>") return undefined;
    // Each content block of one reply repeats the same usage object: count a reply once.
    const key = `${m.id ?? ""}:${rec.requestId ?? ""}`;
    if (s.seen.has(key)) return undefined;
    s.seen.add(key);
    const input = n(u.input_tokens), output = n(u.output_tokens), read = n(u.cache_read_input_tokens), write = n(u.cache_creation_input_tokens);
    if (!input && !output && !read && !write) return undefined;
    const model = String(m.model ?? "unknown");
    return { ...base(ts, w, "anthropic", model, 200), input_tokens: input, output_tokens: output, cache_read_tokens: read,
             cache_write_tokens: write, cost_usd: costFor(model, input, output, read, write) };
  }

  private codexRow(rec: Record<string, any>, s: FileState, w: LogWatch): CallRow[] | CallRow | undefined {
    const p = rec.payload ?? {};
    if (rec.type === "turn_context" && p.model) { s.model = String(p.model); return undefined; }
    const ts = tsOf(rec.timestamp);
    if (rec.type !== "event_msg" || ts < w.since) return undefined;
    if (p.type === "token_count") {
      const out: CallRow[] = [];
      if (p.rate_limits) saveLimit(this.db, "codex", ts, codexWindows(p.rate_limits));
      const model = s.model || "unknown";
      const u = p.info?.last_token_usage;
      if (u) {
        const cached = n(u.cached_input_tokens), input = Math.max(0, n(u.input_tokens) - cached), output = n(u.output_tokens);
        if (input || output || cached) out.push({ ...base(ts, w, "chatgpt", model, 200), input_tokens: input, output_tokens: output,
                                                  cache_read_tokens: cached, cost_usd: costFor(model, input, output, cached, 0) });
      }
      const limit = codexLimit(p.rate_limits);
      if (limit && limit !== s.lastLimit) {
        s.lastLimit = limit;
        out.push({ ...base(ts, w, "chatgpt", model, 429), reset_at: limit, limit_info: JSON.stringify(p.rate_limits) });
      }
      return out;
    }
    if (p.type === "error" && /usage limit|rate limit|quota/i.test(String(p.message ?? ""))) {
      if (s.lastLimit) return undefined; // already reported with its reset time
      s.lastLimit = -1;
      return { ...base(ts, w, "chatgpt", s.model || "unknown", 429), limit_info: String(p.message).slice(0, 500) };
    }
    return undefined;
  }
}

function base(ts: number, w: LogWatch, provider: string, model: string, status: number): CallRow {
  return { ts, agent: w.agent, task: w.task, provider, auth: "subscription", model, path: "/session-log", status,
           input_tokens: 0, output_tokens: 0, cache_read_tokens: 0, cache_write_tokens: 0, cost_usd: 0, latency_ms: 0 };
}

/** Epoch ms when Codex's limit resets, if the latest token_count says a limit was reached. */
function codexLimit(rl: Record<string, any> | undefined): number {
  if (!rl) return 0;
  type Win = { used_percent?: number; resets_at?: number };
  const windows = [rl.primary, rl.secondary].filter(Boolean) as Win[];
  const named = rl[String(rl.rate_limit_reached_type ?? "")] as Win | undefined; // "primary" | "secondary"
  const full = windows.filter((x) => n(x.used_percent) >= 100);
  const hit = named ? [named] : full.length ? full : rl.rate_limit_reached_type ? windows : [];
  if (!hit.length) return 0;
  return Math.max(...hit.map((x) => n(x.resets_at) * 1000));
}

/** The working folder in a Codex rollout's session_meta line. That line also carries the full base instructions
 *  (can be large), so the cwd is read from its start instead of parsing the whole line. */
function codexCwd(file: string): string | undefined {
  const fd = openSync(file, "r");
  try {
    const buf = Buffer.alloc(16 * 1024);
    const text = buf.subarray(0, readSync(fd, buf, 0, buf.length, 0)).toString("utf8");
    if (!text.includes('"type":"session_meta"')) return undefined;
    const m = /"cwd":"((?:[^"\\]|\\.)*)"/.exec(text);
    return m ? JSON.parse(`"${m[1]}"`) : undefined;
  } catch { return undefined; } finally { closeSync(fd); }
}

/** Latest usage-limit state per agent, for the status bar: Codex reports % used on every turn, Claude only when a
 *  limit is hit (then with its reset time). */
export function ensureLimitSchema(db: DatabaseSync) {
  db.exec("CREATE TABLE IF NOT EXISTS agent_limits (agent TEXT PRIMARY KEY, ts INTEGER NOT NULL, info TEXT NOT NULL)");
}
function saveLimit(db: DatabaseSync, agent: string, ts: number, info: unknown) {
  db.prepare("INSERT INTO agent_limits (agent, ts, info) VALUES (?, ?, ?) ON CONFLICT(agent) DO UPDATE SET ts = excluded.ts, info = excluded.info WHERE excluded.ts >= agent_limits.ts")
    .run(agent, ts, JSON.stringify(info));
}
function codexWindows(rl: Record<string, any>) {
  const w = (x: any, label: string) => (x ? { label, usedPct: n(x.used_percent), resetAt: n(x.resets_at) * 1000, minutes: n(x.window_minutes) } : undefined);
  return { limited: !!codexLimit(rl), plan: String(rl.plan_type ?? ""), windows: [w(rl.primary, "session"), w(rl.secondary, "weekly")].filter(Boolean) };
}
export function agentLimits(db: DatabaseSync): Array<{ agent: string; ts: number; info: any }> {
  ensureLimitSchema(db);
  return (db.prepare("SELECT agent, ts, info FROM agent_limits").all() as Array<{ agent: string; ts: number; info: string }>)
    .map((r) => ({ agent: r.agent, ts: r.ts, info: JSON.parse(r.info) }));
}

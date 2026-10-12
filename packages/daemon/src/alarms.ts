// Cost and limit alarms, computed from the proxy's call log (P07, P08, P09 in docs/research/solutions).
// Each check runs after every logged call and stores at most one alert per kind/subject per cool-down window.
import type { DatabaseSync } from "node:sqlite";

export type Alert = { id?: number; ts: number; kind: AlertKind; task: string; agent: string; message: string };
export type AlertKind = "drain" | "cache" | "billing" | "limit" | "budget" | "stuck" | "guard" | "resumed" | "handoff" | "verify" | "pipeline" | "race" | "quality" | "browser";
export type CallEvent = {
  id: number; ts: number; agent: string; task: string; auth: string; model: string; status: number;
  input_tokens: number; output_tokens: number; cache_read_tokens: number; cache_write_tokens: number;
  cost_usd: number; reset_at: number; failover: number;
};

const num = (v: unknown) => Number(v) || 0;
export const LIMITS = {
  drainWindowMs: 5 * 60_000,
  drainTokens: num(process.env.MM_DRAIN_TOKENS) || 3_000_000,
  drainUsd: num(process.env.MM_DRAIN_USD) || 2,
  cooldown: { drain: 15 * 60_000, cache: 6 * 3600_000, billing: 6 * 3600_000, limit: 10 * 60_000, budget: 0, stuck: 0, guard: 0, resumed: 0, handoff: 0, verify: 0, pipeline: 0, race: 0, quality: 0 } as Record<AlertKind, number>,
};

const time = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function recent(db: DatabaseSync, kind: AlertKind, subject: { task?: string; agent?: string }, now: number): boolean {
  const since = now - LIMITS.cooldown[kind];
  const row = subject.task
    ? db.prepare("SELECT 1 FROM alerts WHERE kind = ? AND task = ? AND ts >= ? LIMIT 1").get(kind, subject.task, since)
    : db.prepare("SELECT 1 FROM alerts WHERE kind = ? AND agent = ? AND ts >= ? LIMIT 1").get(kind, subject.agent ?? "", since);
  return !!row;
}

export function saveAlert(db: DatabaseSync, a: Alert): Alert {
  db.prepare("INSERT INTO alerts (ts, kind, task, agent, message) VALUES (?, ?, ?, ?, ?)").run(a.ts, a.kind, a.task, a.agent, a.message);
  return { ...a, id: Number((db.prepare("SELECT last_insert_rowid() AS id").get() as { id: number }).id) };
}

/** Run every alarm for one new call; returns the alerts that fired (already stored). */
export function checkCall(db: DatabaseSync, c: CallEvent, now = Date.now()): Alert[] {
  const out: Alert[] = [];
  const fire = (kind: AlertKind, message: string, subject: { task?: string; agent?: string }) => {
    if (recent(db, kind, subject, now)) return;
    out.push(saveAlert(db, { ts: now, kind, task: subject.task ?? c.task, agent: c.agent, message }));
  };

  // Limit hit: tell the user when it resets.
  if (c.status === 429 && !c.failover) {
    const when = c.reset_at ? `resets at ${time(c.reset_at)}` : "reset time unknown";
    fire("limit", `${c.agent} hit a rate limit (${c.model || "model unknown"}), ${when}.`, c.task ? { task: c.task } : { agent: c.agent });
  }

  // Drain: one task burning tokens or money much faster than normal.
  if (c.task) {
    const w = db.prepare(
      `SELECT SUM(input_tokens + output_tokens + cache_read_tokens + cache_write_tokens) AS tokens, SUM(cost_usd) AS cost
       FROM calls WHERE task = ? AND ts >= ?`,
    ).get(c.task, now - LIMITS.drainWindowMs) as { tokens: number | null; cost: number | null };
    const tokens = num(w.tokens);
    const cost = num(w.cost);
    if (tokens > LIMITS.drainTokens || cost > LIMITS.drainUsd) {
      fire("drain", `This task used ${(tokens / 1e6).toFixed(1)}M tokens ($${cost.toFixed(2)}) in the last 5 minutes. Check for loops or a huge context.`, { task: c.task });
    }
  }

  // Cache: hit rate of the agent's last calls dropped far below its usual level (silent cache changes, P08).
  if (c.status < 400 && c.input_tokens + c.cache_read_tokens + c.cache_write_tokens > 0) {
    const rows = db.prepare(
      `SELECT input_tokens AS i, cache_read_tokens AS r, cache_write_tokens AS w FROM calls
       WHERE agent = ? AND status < 400 AND (input_tokens + cache_read_tokens + cache_write_tokens) > 0
       ORDER BY ts DESC, id DESC LIMIT 210`,
    ).all(c.agent) as Array<{ i: number; r: number; w: number }>;
    const rate = (xs: typeof rows) => {
      const all = xs.reduce((a, x) => a + x.i + x.r + x.w, 0);
      return all ? xs.reduce((a, x) => a + x.r, 0) / all : 0;
    };
    const latest = rows.slice(0, 10);
    const before = rows.slice(10);
    if (latest.length >= 10 && before.length >= 50 && rate(before) >= 0.5 && rate(latest) < 0.2) {
      fire("cache", `${c.agent}'s prompt-cache hit rate fell from ${Math.round(rate(before) * 100)}% to ${Math.round(rate(latest) * 100)}%. Costs and limits will drain faster.`, { agent: c.agent });
    }
  }

  // Billing: an agent that normally uses a subscription is now paying per token (not a planned failover).
  if (c.auth === "api_key" && !c.failover) {
    const sub = db.prepare("SELECT COUNT(*) AS n FROM calls WHERE agent = ? AND auth = 'subscription' AND ts >= ?").get(c.agent, now - 24 * 3600_000) as { n: number };
    if (num(sub.n) >= 5) fire("billing", `${c.agent} is being billed to an API key instead of its subscription.`, { agent: c.agent });
  }
  return out;
}

export function listAlerts(db: DatabaseSync, opts: { since?: number; task?: string } = {}): Alert[] {
  return (opts.task
    ? db.prepare("SELECT * FROM alerts WHERE task = ? ORDER BY ts DESC LIMIT 100").all(opts.task)
    : db.prepare("SELECT * FROM alerts WHERE ts >= ? ORDER BY ts DESC LIMIT 200").all(opts.since ?? 0)) as Alert[];
}

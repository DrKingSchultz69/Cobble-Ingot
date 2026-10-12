import { EventEmitter } from "node:events";
import { mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { DATA_DIR, DB_PATH } from "./config.ts";

export type CallRow = {
  ts: number;
  agent: string;
  task: string;
  provider: string;
  auth: string;
  model: string;
  path: string;
  status: number;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  cost_usd: number;
  latency_ms: number;
  /** Epoch ms when a rate limit resets (429 responses), 0 if unknown. */
  reset_at?: number;
  /** 1 when this call was a 429 failover retry on an API key. */
  failover?: number;
  /** Rate-limit headers of a 429 response (JSON), for diagnosing reset times (B-037). */
  limit_info?: string;
};

/** Every logged model call, as it happens (same process). The workspace uses it for live meters and alarms. */
export const callEvents = new EventEmitter();
callEvents.setMaxListeners(50);

export function openDb(path = DB_PATH): DatabaseSync {
  if (path === DB_PATH) mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(path);
  // The proxy, workspace server and each agent's MCP memory server share this file.
  db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS calls (
      id INTEGER PRIMARY KEY,
      ts INTEGER NOT NULL,
      agent TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      path TEXT NOT NULL,
      status INTEGER NOT NULL,
      input_tokens INTEGER NOT NULL,
      output_tokens INTEGER NOT NULL,
      cost_usd REAL NOT NULL,
      latency_ms INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS calls_ts ON calls(ts);
  `);
  // Added after v1; ignore "duplicate column" on existing DBs.
  for (const col of ["cache_read_tokens INTEGER NOT NULL DEFAULT 0", "cache_write_tokens INTEGER NOT NULL DEFAULT 0",
                     "auth TEXT NOT NULL DEFAULT 'unknown'", "task TEXT NOT NULL DEFAULT ''",
                     "reset_at INTEGER NOT NULL DEFAULT 0", "failover INTEGER NOT NULL DEFAULT 0", "limit_info TEXT NOT NULL DEFAULT ''"]) {
    try { db.exec(`ALTER TABLE calls ADD COLUMN ${col}`); } catch { /* exists */ }
  }
  db.exec(`
    CREATE INDEX IF NOT EXISTS calls_task ON calls(task, ts);
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, kind TEXT NOT NULL, task TEXT NOT NULL DEFAULT '',
      agent TEXT NOT NULL DEFAULT '', message TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS alerts_ts ON alerts(ts);
  `);
  return db;
}

export function logCall(db: DatabaseSync, r: CallRow): void {
  db.prepare(
    `INSERT INTO calls (ts, agent, task, provider, auth, model, path, status, input_tokens, output_tokens,
                        cache_read_tokens, cache_write_tokens, cost_usd, latency_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(r.ts, r.agent, r.task, r.provider, r.auth, r.model, r.path, r.status, r.input_tokens, r.output_tokens,
        r.cache_read_tokens, r.cache_write_tokens, r.cost_usd, r.latency_ms);
  const id = Number((db.prepare("SELECT last_insert_rowid() AS id").get() as { id: number }).id);
  if (r.reset_at || r.failover || r.limit_info) {
    db.prepare("UPDATE calls SET reset_at = ?, failover = ?, limit_info = ? WHERE id = ?").run(r.reset_at ?? 0, r.failover ?? 0, r.limit_info ?? "", id);
  }
  callEvents.emit("call", { id, ...r, reset_at: r.reset_at ?? 0, failover: r.failover ?? 0 });
}

export function usageSummary(db: DatabaseSync, sinceMs: number) {
  return db
    .prepare(
      // cost_usd is real spend only for api_key rows; for subscription rows it is the API-price equivalent.
      `SELECT agent, auth, model, status, COUNT(*) AS calls,
              SUM(input_tokens) AS input, SUM(cache_read_tokens) AS cache_read,
              SUM(cache_write_tokens) AS cache_write, SUM(output_tokens) AS output,
              ROUND(SUM(cost_usd), 4) AS cost_usd
       FROM calls WHERE ts >= ? GROUP BY agent, auth, model, status ORDER BY cost_usd DESC`,
    )
    .all(sinceMs);
}

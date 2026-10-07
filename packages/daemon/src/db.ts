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
};

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
                     "auth TEXT NOT NULL DEFAULT 'unknown'", "task TEXT NOT NULL DEFAULT ''"]) {
    try { db.exec(`ALTER TABLE calls ADD COLUMN ${col}`); } catch { /* exists */ }
  }
  return db;
}

export function logCall(db: DatabaseSync, r: CallRow): void {
  db.prepare(
    `INSERT INTO calls (ts, agent, task, provider, auth, model, path, status, input_tokens, output_tokens,
                        cache_read_tokens, cache_write_tokens, cost_usd, latency_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(r.ts, r.agent, r.task, r.provider, r.auth, r.model, r.path, r.status, r.input_tokens, r.output_tokens,
        r.cache_read_tokens, r.cache_write_tokens, r.cost_usd, r.latency_ms);
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

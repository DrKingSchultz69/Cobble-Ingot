// Shared knowledge graph: every agent reads from and writes to this.
// Nodes are typed (project, file, symbol, task, decision, note, bug, outcome, doc, chunk, paper...).
// Edges are typed relations. Full-text search over title + body via FTS5.
import type { DatabaseSync } from "node:sqlite";

export type Node = {
  id: number;
  kind: string;
  key: string;
  title: string;
  body: string;
  project: string;
  data: Record<string, unknown>;
  created: number;
  updated: number;
};

export function ensureGraphSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS nodes (
      id INTEGER PRIMARY KEY,
      kind TEXT NOT NULL,
      key TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      project TEXT NOT NULL DEFAULT '',
      data TEXT NOT NULL DEFAULT '{}',
      created INTEGER NOT NULL,
      updated INTEGER NOT NULL,
      UNIQUE(kind, key)
    );
    CREATE INDEX IF NOT EXISTS nodes_project ON nodes(project, kind, updated);
    CREATE TABLE IF NOT EXISTS edges (
      src INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
      dst INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
      rel TEXT NOT NULL,
      PRIMARY KEY (src, dst, rel)
    );
    CREATE INDEX IF NOT EXISTS edges_dst ON edges(dst, rel);
    CREATE VIRTUAL TABLE IF NOT EXISTS nodes_fts USING fts5(title, body, content='nodes', content_rowid='id');
    CREATE TRIGGER IF NOT EXISTS nodes_ai AFTER INSERT ON nodes BEGIN
      INSERT INTO nodes_fts(rowid, title, body) VALUES (new.id, new.title, new.body);
    END;
    CREATE TRIGGER IF NOT EXISTS nodes_ad AFTER DELETE ON nodes BEGIN
      INSERT INTO nodes_fts(nodes_fts, rowid, title, body) VALUES ('delete', old.id, old.title, old.body);
    END;
    CREATE TRIGGER IF NOT EXISTS nodes_au AFTER UPDATE ON nodes BEGIN
      INSERT INTO nodes_fts(nodes_fts, rowid, title, body) VALUES ('delete', old.id, old.title, old.body);
      INSERT INTO nodes_fts(rowid, title, body) VALUES (new.id, new.title, new.body);
    END;
  `);
  db.exec("PRAGMA foreign_keys = ON;");
}

type NodeInput = { kind: string; key: string; title?: string; body?: string; project?: string; data?: Record<string, unknown> };

export function upsertNode(db: DatabaseSync, n: NodeInput): number {
  const now = Date.now();
  const row = db
    .prepare(
      `INSERT INTO nodes (kind, key, title, body, project, data, created, updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(kind, key) DO UPDATE SET
         title = excluded.title, body = excluded.body, project = excluded.project,
         data = excluded.data, updated = excluded.updated
       RETURNING id`,
    )
    .get(n.kind, n.key, n.title ?? "", n.body ?? "", n.project ?? "", JSON.stringify(n.data ?? {}), now, now) as { id: number };
  return row.id;
}

export function link(db: DatabaseSync, src: number, dst: number, rel: string): void {
  db.prepare("INSERT OR IGNORE INTO edges (src, dst, rel) VALUES (?, ?, ?)").run(src, dst, rel);
}

export function getNode(db: DatabaseSync, id: number): Node | undefined {
  const r = db.prepare("SELECT * FROM nodes WHERE id = ?").get(id);
  return r ? toNode(r) : undefined;
}

export function findNode(db: DatabaseSync, kind: string, key: string): Node | undefined {
  const r = db.prepare("SELECT * FROM nodes WHERE kind = ? AND key = ?").get(kind, key);
  return r ? toNode(r) : undefined;
}

export function deleteNodes(db: DatabaseSync, where: { kind: string; project?: string; keyPrefix?: string }): number {
  const r = db
    .prepare("DELETE FROM nodes WHERE kind = ? AND (? IS NULL OR project = ?) AND (? IS NULL OR key LIKE ? || '%')")
    .run(where.kind, where.project ?? null, where.project ?? null, where.keyPrefix ?? null, where.keyPrefix ?? null);
  return Number(r.changes);
}

// FTS query from free text: quote each word so punctuation can't break the MATCH syntax.
export function ftsQuery(text: string): string {
  const words = text.toLowerCase().match(/[\p{L}\p{N}_]{2,}/gu) ?? [];
  return [...new Set(words)].slice(0, 12).map((w) => `"${w}"`).join(" OR ");
}

export function search(
  db: DatabaseSync,
  text: string,
  opts: { project?: string; kinds?: string[]; limit?: number } = {},
): Array<Node & { score: number; snippet: string }> {
  const q = ftsQuery(text);
  if (!q) return [];
  const kinds = opts.kinds?.length ? opts.kinds : null;
  const rows = db
    .prepare(
      `SELECT n.*, bm25(nodes_fts) AS score, snippet(nodes_fts, 1, '[', ']', '…', 24) AS snippet
       FROM nodes_fts JOIN nodes n ON n.id = nodes_fts.rowid
       WHERE nodes_fts MATCH ? AND (? IS NULL OR n.project = ?)
       ${kinds ? `AND n.kind IN (${kinds.map(() => "?").join(",")})` : ""}
       ORDER BY score LIMIT ?`,
    )
    .all(q, opts.project ?? null, opts.project ?? null, ...(kinds ?? []), opts.limit ?? 10);
  return rows.map((r) => ({ ...toNode(r), score: Number((r as { score: number }).score), snippet: String((r as { snippet: string }).snippet) }));
}

export function recent(db: DatabaseSync, opts: { project?: string; kinds: string[]; limit?: number }): Node[] {
  return db
    .prepare(
      `SELECT * FROM nodes WHERE kind IN (${opts.kinds.map(() => "?").join(",")})
       AND (? IS NULL OR project = ?) ORDER BY updated DESC LIMIT ?`,
    )
    .all(...opts.kinds, opts.project ?? null, opts.project ?? null, opts.limit ?? 10)
    .map(toNode);
}

export function neighbors(db: DatabaseSync, id: number): Array<{ rel: string; dir: "out" | "in"; node: Node }> {
  const out = db.prepare("SELECT e.rel, n.* FROM edges e JOIN nodes n ON n.id = e.dst WHERE e.src = ?").all(id);
  const inn = db.prepare("SELECT e.rel, n.* FROM edges e JOIN nodes n ON n.id = e.src WHERE e.dst = ?").all(id);
  return [
    ...out.map((r) => ({ rel: String((r as { rel: string }).rel), dir: "out" as const, node: toNode(r) })),
    ...inn.map((r) => ({ rel: String((r as { rel: string }).rel), dir: "in" as const, node: toNode(r) })),
  ];
}

export function stats(db: DatabaseSync, project?: string): Array<{ kind: string; n: number }> {
  return db
    .prepare("SELECT kind, COUNT(*) AS n FROM nodes WHERE (? IS NULL OR project = ?) GROUP BY kind ORDER BY n DESC")
    .all(project ?? null, project ?? null) as Array<{ kind: string; n: number }>;
}

function toNode(r: unknown): Node {
  const x = r as Record<string, unknown>;
  return {
    id: Number(x.id),
    kind: String(x.kind),
    key: String(x.key),
    title: String(x.title),
    body: String(x.body),
    project: String(x.project),
    data: JSON.parse(String(x.data || "{}")),
    created: Number(x.created),
    updated: Number(x.updated),
  };
}

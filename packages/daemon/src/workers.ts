// Remote workers (P25 S2, first slice): another Netheron running on a server / second PC / dev box.
// This Netheron shows its tasks on your board and starts tasks there, over its normal API with its token.
// Reach it directly, through `mm tunnel` (https), or an SSH forward: ssh -L 5142:localhost:4142 host.
import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";

export type Worker = { id: string; name: string; url: string; folder: string; added: number };
type Row = Worker & { token: string };

export function ensureWorkerSchema(db: DatabaseSync): void {
  db.exec(`CREATE TABLE IF NOT EXISTS workers (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT NOT NULL, token TEXT NOT NULL, folder TEXT NOT NULL DEFAULT '', added INTEGER NOT NULL
  )`);
}

/** "http://host:4142/?token=abc" (the link Netheron prints) → base URL + token. */
export function parseLink(link: string): { url: string; token: string } {
  let u: URL;
  try { u = new URL(link.trim()); } catch { throw new Error("paste the worker's full link, e.g. http://host:4142/?token=…"); }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("the link must start with http:// or https://");
  const token = u.searchParams.get("token") ?? "";
  if (!token) throw new Error("the link has no ?token=… part (copy it from the worker's start-netheron output)");
  return { url: u.origin, token };
}

const row = (db: DatabaseSync, id: string) => {
  const r = db.prepare("SELECT * FROM workers WHERE id = ?").get(id) as Row | undefined;
  if (!r) throw new Error("worker not found");
  return r;
};
const pub = ({ token: _t, ...w }: Row): Worker => w;

async function call<T>(w: Row, path: string, init: { method?: string; body?: unknown } = {}, send: typeof fetch = fetch): Promise<T> {
  let r: Response;
  try {
    r = await send(w.url + path, {
      method: init.method ?? "GET",
      headers: { authorization: `Bearer ${w.token}`, ...(init.body ? { "content-type": "application/json" } : {}) },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(15_000),
    });
  } catch (e) {
    throw new Error(`can't reach ${w.name} at ${w.url} (${(e as Error).message})`);
  }
  const data = await r.json().catch(() => ({}));
  if (r.status === 401) throw new Error(`${w.name} refused the token (it changed, or the link is wrong)`);
  if (!r.ok) throw new Error(`${w.name}: ${(data as { error?: string }).error ?? r.statusText}`);
  return data as T;
}

/** Checks the worker answers with that token before saving it. */
export async function addWorker(db: DatabaseSync, o: { name?: string; link: string; folder?: string }, send: typeof fetch = fetch): Promise<Worker> {
  const { url, token } = parseLink(o.link);
  const w: Row = { id: randomUUID().slice(0, 8), name: (o.name || new URL(url).hostname).slice(0, 60), url, token, folder: (o.folder ?? "").trim(), added: Date.now() };
  const st = await call<{ projects?: Array<string | { path: string }> }>(w, "/api/state", {}, send);
  const first = st.projects?.[0];
  if (!w.folder && first) w.folder = typeof first === "string" ? first : first.path;
  db.prepare("INSERT INTO workers (id, name, url, token, folder, added) VALUES (?, ?, ?, ?, ?, ?)").run(w.id, w.name, w.url, w.token, w.folder, w.added);
  return pub(w);
}

export function listWorkers(db: DatabaseSync): Worker[] {
  return (db.prepare("SELECT * FROM workers ORDER BY added").all() as Row[]).map(pub);
}

export function removeWorker(db: DatabaseSync, id: string): void {
  db.prepare("DELETE FROM workers WHERE id = ?").run(id);
}

/** The worker's tasks (or an error string when it's offline: the board shows that instead). */
export async function workerTasks(db: DatabaseSync, id: string, send: typeof fetch = fetch) {
  const w = row(db, id);
  try {
    const st = await call<{ tasks: Array<Record<string, unknown>>; availability: Record<string, boolean> }>(w, "/api/state", {}, send);
    return { worker: pub(w), online: true, tasks: st.tasks, availability: st.availability, error: "" };
  } catch (e) {
    return { worker: pub(w), online: false, tasks: [], availability: {}, error: (e as Error).message };
  }
}

/** Start a task on the worker, in its folder (the worker's own path, not this PC's). */
export async function workerCreate(db: DatabaseSync, id: string, body: Record<string, unknown>, send: typeof fetch = fetch) {
  const w = row(db, id);
  const repo = String(body.workerFolder || w.folder || "");
  if (!repo) throw new Error(`set a folder on ${w.name} first (a path on that machine)`);
  const { workerFolder: _f, repo: _r, profile: _p, ...rest } = body; // local paths/accounts don't exist there
  return call<Record<string, unknown>>(w, "/api/tasks", { method: "POST", body: { ...rest, repo } }, send);
}

/** Link that opens the worker's own UI (terminal, diff, code) in a new tab. */
export function workerOpenUrl(db: DatabaseSync, id: string, taskId?: string): string {
  const w = row(db, id);
  return `${w.url}/?token=${encodeURIComponent(w.token)}${taskId ? `#task=${encodeURIComponent(taskId)}` : ""}`;
}

export function setWorkerFolder(db: DatabaseSync, id: string, folder: string): void {
  row(db, id);
  db.prepare("UPDATE workers SET folder = ? WHERE id = ?").run(folder.trim(), id);
}

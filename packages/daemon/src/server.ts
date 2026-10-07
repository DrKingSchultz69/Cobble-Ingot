// Workspace server: one window (desktop or phone) for every agent, terminal, diff, memory and research.
import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { createServer, request as httpRequest, type IncomingMessage, type Server } from "node:http";
import { connect } from "node:net";
import { homedir } from "node:os";
import { dirname, extname, join, normalize, resolve } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { WebSocketServer, type WebSocket } from "ws";
import { buildContext, projectFiles, record, RECORD_KINDS, type RecordKind } from "../../memory/src/context.ts";
import { ensureGraphSchema, neighbors, recent, search, stats } from "../../memory/src/graph.ts";
import { indexProject, projectKey, renderTree } from "../../memory/src/indexer.ts";
import { CATALOG, detectAvailability } from "../../router/src/router.ts";
import { cookies, isAuthorized, sameOrigin, tokenCookie } from "./auth.ts";
import { PORT } from "./config.ts";
import { usageSummary } from "./db.ts";
import { httpError, json, Router } from "./http.ts";
import { TaskManager } from "./tasks.ts";
import { cloneRepo, defaultCloneDir, remoteInfo } from "./worktree.ts";

const ROOT = resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const WEB = join(ROOT, "apps", "web");
const NM = join(ROOT, "node_modules");
const VENDOR: Record<string, string> = {
  "xterm.js": join(NM, "@xterm/xterm/lib/xterm.js"),
  "xterm.css": join(NM, "@xterm/xterm/css/xterm.css"),
  "addon-fit.js": join(NM, "@xterm/addon-fit/lib/addon-fit.js"),
  "marked.js": join(NM, "marked/lib/marked.umd.js"),
  "purify.js": join(NM, "dompurify/dist/purify.min.js"),
};
const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json",
};

export type ServerOpts = {
  db: DatabaseSync;
  token: string;
  tasks?: TaskManager;
  previewPort?: number;
  /** Extra API routes (research, learn…), mounted behind auth. */
  extend?: (r: Router, ctx: { db: DatabaseSync; broadcast: (m: unknown) => void }) => void;
};

export function createWorkspaceServer(o: ServerOpts): { server: Server; tasks: TaskManager; broadcast: (m: unknown) => void } {
  const { db, token } = o;
  ensureGraphSchema(db);
  const tasks = o.tasks ?? new TaskManager(db);
  const clients = new Set<WebSocket>();
  const broadcast = (m: unknown) => {
    const s = JSON.stringify(m);
    for (const c of clients) if (c.readyState === 1) c.send(s);
  };
  tasks.on("task", (t) => t && broadcast({ t: "task", task: t }));
  tasks.on("removed", (id) => broadcast({ t: "removed", id }));
  tasks.on("notify", (n) => broadcast({ t: "notify", ...n }));

  const api = new Router();

  // --- state / tasks -------------------------------------------------------
  api.get("/api/state", () => ({
    tasks: tasks.list(),
    availability: detectAvailability(),
    catalog: CATALOG.map(({ id, agent, model, label, auth }) => ({ id, agent, model, label, auth })),
    projects: projects(db),
    previewPort: o.previewPort,
    platform: process.platform,
  }));
  api.post("/api/route", ({ body }) => tasks.route(String(body.prompt ?? "")));
  api.post("/api/tasks", ({ body }) =>
    tasks.create({
      prompt: String(body.prompt ?? ""),
      title: body.title,
      agent: body.agent,
      model: body.model,
      repo: String(body.repo ?? ""),
      isolate: body.isolate !== false,
      lean: !!body.lean,
      parentId: body.parentId,
    }),
  );
  api.post("/api/tasks/:id/input", ({ params, body }) => {
    tasks.write(params.id, String(body.data ?? ""));
    return { ok: true };
  });
  api.post("/api/tasks/:id/stop", ({ params }) => {
    tasks.stop(params.id);
    return { ok: true };
  });
  api.delete("/api/tasks/:id", async ({ params, query }) => {
    await tasks.remove(params.id, { removeWorktree: query.get("worktree") === "1" });
    return { ok: true };
  });
  // Plain-text tail of a terminal (no ANSI) — for quick looks from a phone and for tests.
  api.get("/api/tasks/:id/output", ({ params, query }) => {
    const s = tasks.session(params.id);
    const text = stripAnsi(s?.buffer() ?? "");
    const n = Number(query.get("tail") ?? 4000);
    return { alive: !!s?.alive, text: text.slice(-n) };
  });
  api.get("/api/tasks/:id/diff", ({ params }) => tasks.diff(params.id));
  api.get("/api/preview-link", ({ query }) => {
    const port = Number(query.get("port"));
    if (!(port > 0 && port < 65536)) throw httpError(400, "bad port");
    const host = (query.get("host") ?? "localhost").replace(/[^a-zA-Z0-9.\-:\[\]]/g, "");
    return { url: `http://${host}:${o.previewPort}/__mm/target?port=${port}&token=${encodeURIComponent(token)}` };
  });
  // Folder picker for the project selector. Lists sub-folders only, never file contents.
  api.get("/api/fs/dirs", ({ query }) => listDirs(query.get("path") ?? ""));
  api.get("/api/projects/info", ({ query }) => {
    const p = query.get("path") ?? "";
    if (!p || !existsSync(p)) throw httpError(400, "folder not found");
    return { path: resolve(p), git: existsSync(join(p, ".git")), remote: remoteInfo(p) };
  });
  api.get("/api/projects/clone-dir", () => ({ dir: defaultCloneDir() }));
  api.post("/api/projects/clone", async ({ body }) => {
    try {
      return await cloneRepo(String(body.url ?? ""), body.parent ? String(body.parent) : undefined);
    } catch (e) {
      throw httpError(400, (e as Error).message);
    }
  });
  api.get("/api/usage", ({ query }) => {
    const hours = Number(query.get("hours") ?? 24);
    const since = Date.now() - hours * 3600_000;
    return {
      summary: usageSummary(db, since),
      byTask: db.prepare(
        `SELECT task, agent, COUNT(*) calls, SUM(input_tokens + cache_read_tokens + cache_write_tokens) tokens_in,
                SUM(output_tokens) tokens_out, ROUND(SUM(cost_usd), 4) cost_usd, SUM(status = 429) rate_limited
         FROM calls WHERE ts >= ? AND task != '' GROUP BY task, agent ORDER BY MAX(ts) DESC LIMIT 50`,
      ).all(since),
    };
  });

  // --- memory --------------------------------------------------------------
  const proj = (q: URLSearchParams | Record<string, unknown>) => {
    const p = q instanceof URLSearchParams ? q.get("project") : (q.project as string);
    if (!p) throw httpError(400, "project is required");
    return projectKey(p);
  };
  api.get("/api/memory/stats", ({ query }) => ({ stats: stats(db, proj(query)) }));
  api.get("/api/memory/search", ({ query }) =>
    search(db, query.get("q") ?? "", { project: proj(query), limit: Number(query.get("limit") ?? 20) }),
  );
  api.get("/api/memory/recent", ({ query }) =>
    recent(db, { project: proj(query), kinds: ["decision", "bug", "todo", "note", "outcome"], limit: 30 }),
  );
  api.get("/api/memory/context", ({ query }) => ({ text: buildContext(db, proj(query), query.get("q") ?? "") }));
  api.get("/api/memory/tree", ({ query }) => ({ text: renderTree(projectFiles(db, proj(query)), { maxDepth: 4, maxLines: 400 }) }));
  api.get("/api/memory/node/:id", ({ params }) => ({
    node: db.prepare("SELECT * FROM nodes WHERE id = ?").get(Number(params.id)),
    links: neighbors(db, Number(params.id)).slice(0, 50),
  }));
  api.post("/api/memory/index", ({ body }) => {
    if (!body.project || !existsSync(body.project)) throw httpError(400, "project folder not found");
    return indexProject(db, body.project);
  });
  api.post("/api/memory/record", ({ body }) => {
    const kind = String(body.kind) as RecordKind;
    if (!RECORD_KINDS.includes(kind)) throw httpError(400, `kind must be one of ${RECORD_KINDS.join(", ")}`);
    return { id: record(db, { kind, title: String(body.title ?? ""), body: String(body.body ?? ""), project: proj(body), agent: "you" }) };
  });

  o.extend?.(api, { db, broadcast });

  // --- HTTP ------------------------------------------------------------------
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    // First visit from the printed link: ?token=... -> cookie, then clean URL.
    const qt = url.searchParams.get("token");
    if (qt && qt === token) {
      url.searchParams.delete("token");
      res.writeHead(302, { "set-cookie": tokenCookie(token), location: url.pathname + url.search });
      res.end();
      return;
    }
    if (url.pathname === "/manifest.webmanifest" || url.pathname === "/icon.svg") return serveFile(res, join(WEB, url.pathname.slice(1)));
    if (!isAuthorized(req, token)) {
      if (url.pathname.startsWith("/api/")) return json(res, 401, { error: "unauthorized" });
      res.writeHead(401, { "content-type": "text/html; charset=utf-8" });
      res.end(`<!doctype html><meta name=viewport content="width=device-width"><body style="font:16px system-ui;padding:24px;background:#0b0d10;color:#e6e6e6">
        <h2>mm workspace</h2><p>Open the link printed by <code>mm serve</code> (it contains your access token).</p></body>`);
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      if (req.method !== "GET" && !sameOrigin(req)) return json(res, 403, { error: "cross-origin request blocked" });
      if (!(await api.handle(req, res))) json(res, 404, { error: "not found" });
      return;
    }
    if (url.pathname.startsWith("/vendor/")) {
      const f = VENDOR[url.pathname.slice(8)];
      return f ? serveFile(res, f) : json(res, 404, { error: "not found" });
    }
    const file = url.pathname === "/" ? "index.html" : normalize(url.pathname.slice(1));
    const abs = join(WEB, file);
    if (!abs.startsWith(WEB)) return json(res, 403, { error: "forbidden" });
    return serveFile(res, existsSync(abs) ? abs : join(WEB, "index.html"));
  });

  // --- WebSocket: terminals + live events ------------------------------------
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 * 1024 });
  server.on("upgrade", (req, socket, head) => {
    if (new URL(req.url ?? "/", "http://x").pathname !== "/ws" || !isAuthorized(req, token) || !sameOrigin(req)) {
      socket.end("HTTP/1.1 401 Unauthorized\r\n\r\n");
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  });
  wss.on("connection", (ws) => {
    clients.add(ws);
    const subs = new Map<string, () => void>();
    ws.on("message", (raw) => {
      let m: { t: string; id?: string; data?: string; cols?: number; rows?: number };
      try { m = JSON.parse(String(raw)); } catch { return; }
      const id = m.id ?? "";
      if (m.t === "attach") {
        subs.get(id)?.();
        const s = tasks.session(id);
        ws.send(JSON.stringify({ t: "buffer", id, data: s?.buffer() ?? "\r\n[session not running — the daemon was restarted or the task ended]\r\n" }));
        if (s) subs.set(id, s.subscribe((data) => ws.readyState === 1 && ws.send(JSON.stringify({ t: "data", id, data }))));
      } else if (m.t === "detach") {
        subs.get(id)?.();
        subs.delete(id);
      } else if (m.t === "input" && typeof m.data === "string") {
        tasks.write(id, m.data);
      } else if (m.t === "resize") {
        tasks.resize(id, Number(m.cols), Number(m.rows));
      }
    });
    ws.on("close", () => {
      clients.delete(ws);
      for (const u of subs.values()) u();
    });
  });

  return { server, tasks, broadcast };
}

export function stripAnsi(s: string): string {
  return s
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, "") // OSC
    .replace(/\x1b\[[0-9;?]*[ -\/]*[@-~]/g, "") // CSI
    .replace(/\x1b[@-Z\\\-_]/g, "")
    .replace(/\r(?!\n)/g, "\n");
}

function serveFile(res: import("node:http").ServerResponse, abs: string) {
  if (!existsSync(abs) || !statSync(abs).isFile()) return json(res, 404, { error: "not found" });
  res.writeHead(200, { "content-type": MIME[extname(abs)] ?? "application/octet-stream", "cache-control": "no-cache" });
  createReadStream(abs).pipe(res);
}

export function listDirs(path: string) {
  if (!path.trim()) {
    const roots = process.platform === "win32"
      ? "CDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((d) => `${d}:\\`).filter((d) => existsSync(d))
      : ["/"];
    return { path: "", parent: null, home: homedir(), dirs: [homedir(), ...roots].map((p) => ({ name: p, path: p, git: existsSync(join(p, ".git")) })) };
  }
  const abs = resolve(path.trim());
  if (!existsSync(abs) || !statSync(abs).isDirectory()) throw httpError(400, `folder not found: ${abs}`);
  let entries: import("node:fs").Dirent[] = [];
  try { entries = readdirSync(abs, { withFileTypes: true }); } catch { throw httpError(400, `can't open ${abs} (no permission)`); }
  const dirs = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith(".") && !e.name.startsWith("$") && e.name !== "node_modules")
    .map((e) => ({ name: e.name, path: join(abs, e.name), git: existsSync(join(abs, e.name, ".git")) }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
    .slice(0, 500);
  const parent = dirname(abs);
  const git = existsSync(join(abs, ".git"));
  return { path: abs, parent: parent === abs ? "" : parent, home: homedir(), git, remote: git ? remoteInfo(abs) : null, dirs };
}

function projects(db: DatabaseSync) {
  const fromTasks = db.prepare("SELECT repo AS path, MAX(created) AS last FROM tasks GROUP BY repo").all() as Array<{ path: string; last: number }>;
  const fromMemory = db.prepare("SELECT json_extract(data, '$.path') AS path, updated AS last FROM nodes WHERE kind = 'project'").all() as Array<{ path: string; last: number }>;
  const m = new Map<string, number>();
  for (const p of [...fromTasks, ...fromMemory]) if (p.path) m.set(p.path, Math.max(m.get(p.path) ?? 0, p.last));
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([path]) => path).slice(0, 20);
}

// --- Build preview: lets the phone open a dev server running on this machine ----
// Visit /__mm/target?port=5173&token=... once; after that every path is proxied to localhost:5173.
export function createPreviewServer(token: string, blockedPorts: number[] = [PORT]): Server {
  const target = (req: IncomingMessage) => Number(cookies(req).mm_target || 0);
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    if (url.pathname === "/__mm/target") {
      const port = Number(url.searchParams.get("port"));
      const t = url.searchParams.get("token") ?? cookies(req).mm_token;
      if (t !== token || !(port > 0 && port < 65536)) {
        res.writeHead(401).end("bad token or port");
        return;
      }
      // Never expose the model proxy (it forwards credentials) through the preview.
      if (blockedPorts.includes(port)) {
        res.writeHead(403).end("that port belongs to mm itself");
        return;
      }
      const next = url.searchParams.get("path") || "/";
      res.writeHead(302, {
        "set-cookie": [tokenCookie(token), `mm_target=${port}; Path=/; HttpOnly; SameSite=Lax`],
        location: next.startsWith("/") && !next.startsWith("//") ? next : "/", // no open redirect
      });
      res.end();
      return;
    }
    if (!isAuthorized(req, token) || !target(req)) {
      res.writeHead(401, { "content-type": "text/plain" }).end("Open the preview from the mm workspace (Preview tab).");
      return;
    }
    const up = httpRequest(
      { host: "127.0.0.1", port: target(req), path: req.url, method: req.method, headers: { ...req.headers, host: `localhost:${target(req)}` } },
      (r) => {
        res.writeHead(r.statusCode ?? 502, r.headers);
        r.pipe(res);
      },
    );
    up.on("error", (e) => {
      if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain" });
      res.end(`Nothing is answering on localhost:${target(req)} (${e.message}). Start your dev server first.`);
    });
    req.pipe(up);
  });
  // Pass websocket upgrades through too (dev-server hot reload).
  server.on("upgrade", (req, socket, head) => {
    if (!isAuthorized(req, token) || !target(req)) return socket.end("HTTP/1.1 401 Unauthorized\r\n\r\n");
    const up = connect(target(req), "127.0.0.1", () => {
      up.write(`${req.method} ${req.url} HTTP/1.1\r\n` + Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join("\r\n") + "\r\n\r\n");
      up.write(head);
      socket.pipe(up).pipe(socket);
    });
    up.on("error", () => socket.destroy());
  });
  return server;
}

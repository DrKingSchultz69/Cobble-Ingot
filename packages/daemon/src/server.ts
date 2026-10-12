// Workspace server: one window (desktop or phone) for every agent, terminal, diff, memory and research.
import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { createServer, request as httpRequest, type IncomingMessage, type Server } from "node:http";
import { connect } from "node:net";
import { homedir } from "node:os";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { WebSocketServer, type WebSocket } from "ws";
import { buildContext, projectFiles, record, RECORD_KINDS, type RecordKind } from "../../memory/src/context.ts";
import { ensureGraphSchema, neighbors, recent, search, stats } from "../../memory/src/graph.ts";
import { indexProject, projectKey, renderTree } from "../../memory/src/indexer.ts";
import { CATALOG, detectAvailability } from "../../router/src/router.ts";
import { cookies, isAuthorized, sameOrigin, tokenCookie } from "./auth.ts";
import { BrowserBlocked, SharedBrowser, type BrowserAction, type UserInput } from "./browser.ts";
import { PORT } from "./config.ts";
import { usageSummary } from "./db.ts";
import { httpError, json, Router } from "./http.ts";
import { DiffWatcher } from "./diffwatch.ts";
import { listDir, readText, writeText } from "./files.ts";
import { getRecipe, saveRecipe } from "./setup.ts";
import { runDiagnostics } from "./diagnostics.ts";
import { addWorker, ensureWorkerSchema, listWorkers, removeWorker, setWorkerFolder, workerCreate, workerOpenUrl, workerTasks } from "./workers.ts";
import { ensurePushSchema, lastNotification, pushAll, subscribe, unsubscribe, vapidKeys } from "./push.ts";
import { createProfile, listProfiles, projectProfiles, setProjectProfile } from "./profiles.ts";
import { presetPipeline, TaskManager, type NewTask } from "./tasks.ts";
import { cloneRepo, defaultCloneDir, remoteInfo } from "./worktree.ts";

const ROOT = resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const WEB = join(ROOT, "apps", "web");
const NM = join(ROOT, "node_modules");
const MONACO = join(NM, "monaco-editor", "min");
const VENDOR: Record<string, string> = {
  "xterm.js": join(NM, "@xterm/xterm/lib/xterm.js"),
  "xterm.css": join(NM, "@xterm/xterm/css/xterm.css"),
  "addon-fit.js": join(NM, "@xterm/addon-fit/lib/addon-fit.js"),
  "marked.js": join(NM, "marked/lib/marked.umd.js"),
  "purify.js": join(NM, "dompurify/dist/purify.min.js"),
};
const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".ttf": "font/ttf", ".png": "image/png", ".webmanifest": "application/manifest+json",
};

export type ServerOpts = {
  db: DatabaseSync;
  token: string;
  tasks?: TaskManager;
  previewPort?: number;
  /** Shared browser for agents (tests pass a headless one). Default: real Chrome, started on first use. */
  browser?: SharedBrowser;
  /** Extra API routes (research, learn…), mounted behind auth. */
  extend?: (r: Router, ctx: { db: DatabaseSync; broadcast: (m: unknown) => void }) => void;
};

export function createWorkspaceServer(o: ServerOpts): { server: Server; tasks: TaskManager; broadcast: (m: unknown) => void } {
  const { db, token } = o;
  ensureGraphSchema(db);
  ensurePushSchema(db);
  ensureWorkerSchema(db);
  const tasks = o.tasks ?? new TaskManager(db);
  const clients = new Set<WebSocket>();
  const broadcast = (m: unknown) => {
    const s = JSON.stringify(m);
    for (const c of clients) if (c.readyState === 1) c.send(s);
  };
  const diffs = new DiffWatcher((id) => tasks.diff(id), (id) => tasks.get(id)?.cwd);
  tasks.on("task", (t) => t && broadcast({ t: "task", task: t }));
  tasks.on("removed", (id) => broadcast({ t: "removed", id }));
  tasks.on("notify", (n) => {
    broadcast({ t: "notify", ...n });
    // Web push (P24 S2): reaches browsers/phones even with no Netheron tab open.
    pushAll(db, { title: n.title, body: n.body, task: n.taskId }).catch(() => {});
  });
  // Wave 1 live updates: per-task meter, edit guard, checkpoints, queue, alerts.
  for (const ev of ["meter", "guard", "checkpoint", "queue", "verify", "schedule", "race", "quality"]) tasks.on(ev, (x) => broadcast({ t: ev, ...x }));
  tasks.on("alert", (a) => broadcast({ t: "alert", alert: a }));

  const api = new Router();

  // --- state / tasks -------------------------------------------------------
  api.get("/api/state", () => ({
    tasks: tasks.list(),
    availability: detectAvailability(),
    catalog: CATALOG.map(({ id, agent, model, label, auth }) => ({ id, agent, model, label, auth })),
    projects: projects(db),
    previewPort: o.previewPort,
    platform: process.platform,
    stale: codeChangedSinceStart(),
  }));
  api.get("/api/version", () => ({ stale: codeChangedSinceStart() }));
  // Remote workers (P25 S2)
  const bad = (e: unknown) => httpError(400, (e as Error).message);
  api.get("/api/workers", () => listWorkers(db));
  api.post("/api/workers", async ({ body }) => {
    try { return await addWorker(db, { name: String(body.name ?? ""), link: String(body.link ?? ""), folder: String(body.folder ?? "") }); } catch (e) { throw bad(e); }
  });
  api.delete("/api/workers/:wid", ({ params }) => { removeWorker(db, params.wid); return { ok: true }; });
  api.post("/api/workers/:wid/folder", ({ params, body }) => {
    try { setWorkerFolder(db, params.wid, String(body.folder ?? "")); return { ok: true }; } catch (e) { throw bad(e); }
  });
  api.get("/api/workers/:wid/tasks", ({ params }) => workerTasks(db, params.wid).catch((e) => { throw bad(e); }));
  api.post("/api/workers/:wid/tasks", async ({ params, body }) => {
    try { return await workerCreate(db, params.wid, body); } catch (e) { throw bad(e); }
  });
  api.get("/api/workers/:wid/open", ({ params, query }) => {
    try { return { url: workerOpenUrl(db, params.wid, query.get("task") ?? undefined) }; } catch (e) { throw bad(e); }
  });
  api.get("/api/push/key", () => ({ key: vapidKeys().publicKey }));
  api.get("/api/push/last", () => lastNotification(db));
  api.post("/api/push/subscribe", ({ body }) => {
    try { subscribe(db, String(body.endpoint ?? ""), String(body.agent ?? "")); } catch (e) { throw httpError(400, (e as Error).message); }
    return { ok: true };
  });
  api.post("/api/push/unsubscribe", ({ body }) => { unsubscribe(db, String(body.endpoint ?? "")); return { ok: true }; });
  api.post("/api/push/test", async () => pushAll(db, { title: "Netheron: test push", body: "Push works. You'll get these even with Netheron closed." }));
  api.post("/api/route", ({ body }) => tasks.route(String(body.prompt ?? "")));
  api.post("/api/tasks", async ({ body }) => {
    const input: NewTask = {
      prompt: String(body.prompt ?? ""),
      title: body.title,
      agent: body.agent,
      model: body.model,
      repo: String(body.repo ?? ""),
      isolate: body.isolate !== false,
      lean: !!body.lean,
      parentId: body.parentId,
      budgetUsd: Number(body.budgetUsd) || 0,
      budgetMin: Number(body.budgetMin) || 0,
      autoHandoff: !!body.autoHandoff,
      checks: ["run", "dial"].includes(body.checks) ? body.checks : "",
      verifyCmd: body.verifyCmd ? String(body.verifyCmd) : undefined,
      profile: body.profile === undefined || body.profile === "default" ? undefined : String(body.profile),
      browser: !!body.browser,
    };
    if (body.pipeline) input.pipeline = { steps: presetPipeline(String(body.pipeline), detectAvailability()), index: 0 };
    // Race & Judge: same task on several agents.
    if (body.race) return { race: await tasks.race(input) };
    // Night Shift: schedule instead of starting now.
    if (body.when && body.when !== "now") {
      const at = body.at ? Date.parse(String(body.at)) : 0;
      return { scheduled: tasks.schedule(input, { at: Number.isNaN(at) ? 0 : at, afterReset: body.when === "reset", daily: !!body.daily }) };
    }
    return tasks.create(input);
  });
  api.get("/api/schedule", () => ({ schedule: tasks.scheduled() }));
  api.get("/api/races/:rid", ({ params }) => {
    const r = tasks.getRace(params.rid);
    if (!r) throw httpError(404, "no such race");
    return { race: r, tasks: tasks.raceTasks(params.rid) };
  });
  // Quality watch (P01)
  api.get("/api/quality", ({ query }) => {
    const p = query.get("project") ?? "";
    if (!p || !existsSync(p)) throw httpError(400, "folder not found");
    return { evals: tasks.evals(p), scores: tasks.quality(p) };
  });
  api.post("/api/quality/evals", ({ body }) => {
    try { return tasks.addEval(String(body.project ?? ""), String(body.title ?? ""), String(body.prompt ?? ""), String(body.verify ?? "")); }
    catch (e) { throw httpError(400, (e as Error).message); }
  });
  api.delete("/api/quality/evals/:eid", ({ params }) => { tasks.deleteEval(Number(params.eid)); return { ok: true }; });
  api.post("/api/quality/run", async ({ body }) => {
    try { return { races: await tasks.runQuality(String(body.project ?? "")) }; } catch (e) { throw httpError(400, (e as Error).message); }
  });
  api.post("/api/races/:rid/judge", ({ params }) => tasks.judge(params.rid));
  api.post("/api/races/:rid/keep", ({ params, body }) => tasks.keepWinner(params.rid, body.task ? String(body.task) : undefined));
  api.delete("/api/schedule/:sid", ({ params }) => { tasks.unschedule(Number(params.sid)); return { schedule: tasks.scheduled() }; });
  api.get("/api/brief", ({ query }) => ({ since: Date.now() - Number(query.get("hours") ?? 16) * 3600_000, tasks: tasks.brief(Date.now() - Number(query.get("hours") ?? 16) * 3600_000) }));
  // Account profiles (P13)
  api.get("/api/profiles", ({ query }) => ({ profiles: listProfiles(db), projectDefaults: query.get("project") && existsSync(query.get("project")!) ? projectProfiles(db, query.get("project")!) : {} }));
  api.post("/api/profiles", ({ body }) => {
    try { return createProfile(db, String(body.agent ?? ""), String(body.name ?? "")); } catch (e) { throw httpError(400, (e as Error).message); }
  });
  api.delete("/api/profiles/:id", async ({ params }) => {
    try { await tasks.deleteProfile(params.id); } catch (e) { throw httpError(409, (e as Error).message); }
    return { ok: true };
  });
  api.post("/api/profiles/:id/login", ({ params }) => tasks.loginTask(params.id));
  api.post("/api/profiles/default", ({ body }) => {
    const p = String(body.project ?? "");
    if (!p || !existsSync(p)) throw httpError(400, "folder not found");
    setProjectProfile(db, p, String(body.agent ?? ""), String(body.profile ?? ""));
    return { projectDefaults: projectProfiles(db, p) };
  });
  api.post("/api/tasks/:id/checks", ({ params }) => tasks.runChecks(needTask(params.id)));
  api.post("/api/tasks/:id/handoff", ({ params, body }) =>
    tasks.handoff(needTask(params.id), body.reason ? String(body.reason) : "was handed off by you", body.agent ? String(body.agent) : undefined));
  // Wave 1: meter, checkpoints + edit guard, queue, diff comments, receipt, limit wait, alerts, worktree setup.
  const needTask = (id: string) => {
    if (!tasks.get(id)) throw httpError(404, "no such task");
    return id;
  };
  api.get("/api/tasks/:id/meter", ({ params }) => tasks.meter(needTask(params.id)));
  api.get("/api/tasks/:id/checkpoints", async ({ params }) => ({ checkpoints: await tasks.checkpoints(needTask(params.id)), guard: tasks.guard(params.id) }));
  api.post("/api/tasks/:id/restore", ({ params, body }) => tasks.restore(needTask(params.id), Number(body.n), body.path ? String(body.path) : undefined));
  api.get("/api/tasks/:id/queue", ({ params }) => ({ queue: tasks.queue(needTask(params.id)) }));
  api.post("/api/tasks/:id/queue", ({ params, body }) => ({ queue: tasks.enqueue(needTask(params.id), String(body.text ?? "")) }));
  api.delete("/api/tasks/:id/queue/:qid", ({ params }) => ({ queue: tasks.unqueue(needTask(params.id), Number(params.qid)) }));
  api.post("/api/tasks/:id/comment", ({ params, body }) =>
    ({ queue: tasks.comment(needTask(params.id), String(body.file ?? ""), Number(body.line) || 0, String(body.text ?? "")) }));
  api.get("/api/tasks/:id/receipt", ({ params }) => tasks.receipt(needTask(params.id)));
  api.post("/api/tasks/:id/cancel-wait", ({ params }) => {
    tasks.cancelWait(needTask(params.id));
    return { ok: true };
  });
  api.get("/api/alerts", ({ query }) => ({ alerts: tasks.alerts({ since: Date.now() - Number(query.get("hours") ?? 24) * 3600_000 }) }));
  api.get("/api/projects/setup", ({ query }) => {
    const p = query.get("path") ?? "";
    if (!p || !existsSync(p)) throw httpError(400, "folder not found");
    return getRecipe(db, p);
  });
  api.post("/api/projects/setup", ({ body }) => {
    const p = String(body.path ?? "");
    if (!p || !existsSync(p)) throw httpError(400, "folder not found");
    try { return saveRecipe(db, p, body); } catch (e) { throw httpError(400, (e as Error).message); }
  });
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
  // Code tab: browse, open and save files in the task's folder (same root as the diff).
  const taskRoot = (id: string) => {
    const t = tasks.get(id);
    if (!t) throw httpError(404, "no such task");
    if (!existsSync(t.cwd)) throw httpError(410, "the task's folder no longer exists");
    return t.cwd;
  };
  api.post("/api/tasks/:id/diagnostics", ({ params, body }) => runDiagnostics(taskRoot(params.id), body.command ? String(body.command) : undefined));
  api.get("/api/tasks/:id/files", ({ params, query }) => listDir(taskRoot(params.id), query.get("dir") ?? ""));
  api.get("/api/tasks/:id/file", ({ params, query }) => readText(taskRoot(params.id), query.get("path") ?? ""));
  api.post("/api/tasks/:id/file", ({ params, body }) => {
    if (typeof body.content !== "string") throw httpError(400, "content must be text");
    return writeText(taskRoot(params.id), String(body.path ?? ""), body.content, body.baseHash ?? null, body.force === true);
  });
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

  // --- shared browser (agents' browser_* tools + Take over / Resume) ----------------------------------------
  // The agent's MCP server calls these with the token. Every action goes through SharedBrowser's hard blocks.
  let sharedBrowser = o.browser;
  const browser = () => (sharedBrowser ??= new SharedBrowser({ imageFormat: "jpeg" }));
  tasks.on("removed", (id) => { if (sharedBrowser?.has(id)) void sharedBrowser.closeTab(id); }); // window closes with the task
  const browserTask = (id: string) => {
    const t = tasks.get(id);
    if (!t) throw httpError(404, "no such task");
    if (!t.browser) throw httpError(403, "This task doesn't have the browser. Tick 🌐 Browser when you start a task.");
    return t;
  };
  const blocked = (e: unknown) => (e instanceof BrowserBlocked ? httpError(409, e.message) : httpError(400, (e as Error).message));
  api.get("/api/tasks/:id/browser", ({ params }) => {
    const t = browserTask(params.id);
    return { control: t.browser_wait ? "user" : "agent", reason: t.browser_wait, window: !!sharedBrowser?.has(params.id) };
  });
  api.post("/api/tasks/:id/browser", async ({ params, body }) => {
    browserTask(params.id);
    try {
      if (body.action === "screenshot") {
        // Read-only, but still the agent's: no peeking while the user types a code or password.
        if (browser().control(params.id) === "user") throw new BrowserBlocked("The user has control of the browser right now. Wait: you'll get a message when they hand it back.");
        return await browser().screenshot(params.id);
      }
      return await browser().act(params.id, body as BrowserAction);
    } catch (e) { throw blocked(e); }
  });
  api.post("/api/tasks/:id/browser/ask", async ({ params, body }) => {
    browserTask(params.id);
    try { await browser().handToUser(params.id); } catch (e) { throw blocked(e); }
    tasks.browserToUser(params.id, String(body.reason ?? ""));
    return { message: "The user now has the browser and was notified. Stop here and wait: you'll get \"Done, continue\" when they hand it back." };
  });
  api.post("/api/tasks/:id/browser/takeover", async ({ params }) => {
    browserTask(params.id);
    try { await browser().handToUser(params.id); } catch (e) { throw blocked(e); }
    tasks.browserToUser(params.id, "", true);
    return { ok: true };
  });
  api.post("/api/tasks/:id/browser/resume", async ({ params }) => {
    browserTask(params.id);
    let url = "";
    try { url = (await browser().resume(params.id)).url; } catch (e) { throw blocked(e); }
    return { ok: true, url, queue: tasks.browserToAgent(params.id) };
  });
  api.post("/api/tasks/:id/browser/show", async ({ params }) => {
    browserTask(params.id);
    try { await browser().show(params.id); } catch (e) { throw blocked(e); }
    return { ok: true };
  });
  api.post("/api/tasks/:id/browser/finish", ({ params, body }) => {
    browserTask(params.id);
    tasks.browserFinished(params.id, String(body.summary ?? ""));
    return { message: "Noted. The window stays open so the user can look; it closes when they remove the task." };
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
        <h2>Netheron</h2><p>Open the link printed by <code>mm serve</code> or <code>start-netheron.cmd</code> (it contains your access token).</p></body>`);
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      if (req.method !== "GET" && !sameOrigin(req)) return json(res, 403, { error: "cross-origin request blocked" });
      if (!(await api.handle(req, res))) json(res, 404, { error: "not found" });
      return;
    }
    if (url.pathname.startsWith("/vendor/monaco/")) {
      // Whole Monaco AMD bundle (loader, editor, workers, languages); must stay inside that folder.
      let rel: string;
      try { rel = decodeURIComponent(url.pathname.slice("/vendor/monaco/".length)); } catch { return json(res, 400, { error: "bad path" }); }
      const abs = join(MONACO, normalize(rel));
      if (!abs.startsWith(MONACO + sep)) return json(res, 403, { error: "forbidden" });
      return serveFile(res, abs, "public, max-age=86400");
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
    let unwatchDiff: (() => void) | undefined;
    let unwatchBrowser: (() => void) | undefined;
    let watchGen = 0;
    ws.on("message", (raw) => {
      let m: { t: string; id?: string; data?: string; cols?: number; rows?: number; input?: UserInput };
      try { m = JSON.parse(String(raw)); } catch { return; }
      const id = m.id ?? "";
      if (m.t === "attach") {
        subs.get(id)?.();
        const attach = (s: NonNullable<ReturnType<TaskManager["session"]>>) => {
          ws.send(JSON.stringify({ t: "buffer", id, data: s.buffer() }));
          subs.set(id, s.subscribe((data) => ws.readyState === 1 && ws.send(JSON.stringify({ t: "data", id, data }))));
        };
        const s = tasks.session(id);
        if (s) attach(s);
        else if (tasks.get(id)?.status === "starting") {
          // Setup recipe still running: attach as soon as the agent starts.
          ws.send(JSON.stringify({ t: "buffer", id, data: "\r\n[preparing the worktree…]\r\n" }));
          const later = (sid: string) => {
            if (sid !== id) return;
            tasks.off("session", later);
            const ss = tasks.session(id);
            if (ss && ws.readyState === 1) attach(ss);
          };
          tasks.on("session", later);
          subs.set(id, () => tasks.off("session", later));
        } else ws.send(JSON.stringify({ t: "buffer", id, data: "\r\n[session not running — the daemon was restarted or the task ended]\r\n" }));
      } else if (m.t === "detach") {
        subs.get(id)?.();
        subs.delete(id);
      } else if (m.t === "input" && typeof m.data === "string") {
        tasks.write(id, m.data);
      } else if (m.t === "watch-diff") {
        // One live diff per connection: the task shown in the Diff tab.
        unwatchDiff?.();
        unwatchDiff = tasks.get(id) ? diffs.subscribe(id, (d) => ws.readyState === 1 && ws.send(JSON.stringify({ t: "diff", id, ...d }))) : undefined;
      } else if (m.t === "unwatch-diff") {
        unwatchDiff?.();
        unwatchDiff = undefined;
      } else if (m.t === "watch-browser") {
        // Browser tab: one live view per connection. Frames are dropped while this client is still behind.
        unwatchBrowser?.();
        unwatchBrowser = undefined;
        const gen = ++watchGen;
        if (!tasks.get(id)?.browser) return;
        void browser().watch(id, (f) => {
          if (ws.readyState === 1 && ws.bufferedAmount < 2_000_000) ws.send(JSON.stringify({ t: "browser-frame", id, ...f }));
        }).then((stop) => { if (gen === watchGen && ws.readyState === 1) unwatchBrowser = stop; else stop(); });
      } else if (m.t === "unwatch-browser") {
        watchGen++;
        unwatchBrowser?.();
        unwatchBrowser = undefined;
      } else if (m.t === "browser-input" && m.input) {
        if (!tasks.get(id)?.browser) return;
        browser().userInput(id, m.input).catch((e) => ws.readyState === 1 && ws.send(JSON.stringify({ t: "browser-error", id, error: (e as Error).message })));
      } else if (m.t === "resize") {
        tasks.resize(id, Number(m.cols), Number(m.rows));
      }
    });
    ws.on("close", () => {
      clients.delete(ws);
      for (const u of subs.values()) u();
      unwatchDiff?.();
      watchGen++;
      unwatchBrowser?.();
    });
  });

  return { server, tasks, broadcast };
}

// The browser always loads the newest UI files, but server code only changes on restart.
// Fingerprint the server's own source at startup so the UI can say "restart mm" instead of failing oddly.
const SRC_DIRS = ["daemon", "memory", "router", "research"].map((p) => join(ROOT, "packages", p, "src"));
function sourceFingerprint(): string {
  const parts: string[] = [];
  for (const dir of SRC_DIRS) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir, { recursive: true }) as string[]) {
      if (!/\.ts$/.test(f)) continue;
      try { parts.push(`${f}:${statSync(join(dir, f)).mtimeMs}`); } catch { /* removed */ }
    }
  }
  return parts.sort().join("|");
}
const STARTED_WITH = sourceFingerprint();
export function codeChangedSinceStart(): boolean {
  return sourceFingerprint() !== STARTED_WITH;
}

export function stripAnsi(s: string): string {
  return s
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, "") // OSC
    .replace(/\x1b\[[0-9;?]*[ -\/]*[@-~]/g, "") // CSI
    .replace(/\x1b[@-Z\\\-_]/g, "")
    .replace(/\r(?!\n)/g, "\n");
}

function serveFile(res: import("node:http").ServerResponse, abs: string, cache = "no-cache") {
  if (!existsSync(abs) || !statSync(abs).isFile()) return json(res, 404, { error: "not found" });
  res.writeHead(200, { "content-type": MIME[extname(abs)] ?? "application/octet-stream", "cache-control": cache });
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
        res.writeHead(403).end("that port belongs to Netheron itself");
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
      res.writeHead(401, { "content-type": "text/plain" }).end("Open the preview from Netheron (Preview tab).");
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

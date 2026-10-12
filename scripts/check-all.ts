// Full functionality check (smoke test) for Netheron, end to end through the real HTTP API and WebSocket.
// Starts a throwaway Netheron in a temp folder: real proxy + workspace server + MCP server, a fake model API
// instead of Anthropic and a fake agent instead of Claude/Codex. No quota is used and ~/.mm is never touched.
// Every check runs even if an earlier one fails; failures are listed again at the end.
// Run: node scripts/check-all.ts
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { WebSocket } from "ws";

const ROOT = mkdtempSync(join(tmpdir(), "netheron-check-"));
const DATA = join(ROOT, "data");
mkdirSync(DATA);
process.env.MM_DATA_DIR = DATA; // before any Netheron module loads
const src = (p: string) => new URL(`../packages/${p}`, import.meta.url).href;
const { openDb } = await import(src("daemon/src/db.ts"));
const { createProxy } = await import(src("daemon/src/proxy.ts"));
const { UPSTREAMS } = await import(src("daemon/src/config.ts"));
const { createWorkspaceServer, createPreviewServer } = await import(src("daemon/src/server.ts"));
const { TaskManager, WATCH } = await import(src("daemon/src/tasks.ts"));
const { SharedBrowser, BrowserBlocked, findChrome } = await import(src("daemon/src/browser.ts"));
const MCP_BIN = fileURLToPath(new URL("../packages/memory/bin/mcp.ts", import.meta.url));

// ---------------------------------------------------------------------------------------------------------
// Check runner: keep going, report everything.
type Result = { group: string; name: string; ok: boolean; skipped?: string; ms: number; err?: string };
const results: Result[] = [];
let group = "";
const section = (g: string) => { group = g; console.log(`\n${g}`); };
async function check(name: string, fn: () => Promise<unknown> | unknown, ms = 30_000) {
  const t0 = Date.now();
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([fn(), new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(`took longer than ${ms / 1000} s`)), ms); })]);
    results.push({ group, name, ok: true, ms: Date.now() - t0 });
    console.log(`  ✔ ${name}  (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  } catch (e) {
    const err = String((e as Error).message ?? e).split("\n")[0].slice(0, 300);
    results.push({ group, name, ok: false, ms: Date.now() - t0, err });
    console.log(`  ✖ ${name}\n      ${err}`);
  } finally {
    clearTimeout(timer);
  }
}
const skip = (name: string, why: string) => { results.push({ group, name, ok: true, skipped: why, ms: 0 }); console.log(`  – ${name}  (skipped: ${why})`); };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function until(fn: () => unknown, what: string, ms = 20_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { if (await fn()) return; } catch { /* not yet */ }
    await sleep(150);
  }
  throw new Error(`timed out waiting for ${what}`);
}

// ---------------------------------------------------------------------------------------------------------
// Test project: a git repo with a few files.
const REPO = join(ROOT, "project");
mkdirSync(REPO);
writeFileSync(join(REPO, "README.md"), "# smoke project\n");
writeFileSync(join(REPO, "app.ts"), Array.from({ length: 40 }, (_, i) => `export const v${i} = ${i};`).join("\n") + "\n");
writeFileSync(join(REPO, "small.ts"), "a\nb\nc\nd\n");
writeFileSync(join(REPO, ".env"), "SECRET=1\n");
writeFileSync(join(REPO, ".gitignore"), ".env\n");
const git = (...a: string[]) => execFileSync("git", ["-C", REPO, ...a], { stdio: "ignore" });
git("init", "-q");
git("add", ".");
git("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "init");
const HOME = join(ROOT, "home");
mkdirSync(HOME);
writeFileSync(join(HOME, ".claude.json"), JSON.stringify({ projects: {} }));

// Fake model API: answers like Anthropic with fixed token counts; "LIMIT" in the request -> 429.
let modelCalls = 0;
const upstream = createServer(async (req, res) => {
  let body = "";
  for await (const c of req) body += c;
  modelCalls++;
  if (body.includes("LIMIT")) {
    res.writeHead(429, { "content-type": "application/json", "retry-after": "3" }).end(JSON.stringify({ type: "error", error: { type: "rate_limit_error" } }));
    return;
  }
  res.writeHead(200, { "content-type": "application/json" })
    .end(JSON.stringify({ id: "msg_smoke", type: "message", model: "claude-sonnet-5-5", content: [{ type: "text", text: "ok" }], usage: { input_tokens: 1000, output_tokens: 200 } }));
});

// Fake agent: commands start with "!" so normal messages (queue, comments, resume nudges) are just echoed.
const AGENT = join(DATA, "fake-agent.js");
writeFileSync(AGENT, `const fs = require("fs");
const model = process.env.SMOKE_MODEL || "";
const prompt = process.env.SMOKE_PROMPT || "";
if (/fix the answer/.test(prompt)) fs.writeFileSync("answer.txt", model === "haiku" ? "41" : "42");
process.stdout.write("fake agent ready (" + (model || "default") + ")\\n");
if (prompt.includes("STEP DONE")) process.stdout.write("did my step|STEP DONE|\\n");
async function call(limit) {
  try {
    const r = await fetch(process.env.SMOKE_API + "/v1/messages", { method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer sk-ant-oat01-smoke", "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 10, messages: [{ role: "user", content: limit ? "LIMIT" : "hi" }] }) });
    await r.text();
    process.stdout.write("called " + r.status + "\\n");
  } catch (e) { process.stdout.write("call failed " + e.message + "\\n"); }
}
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => {
  if (d.includes("!edit")) { fs.writeFileSync("new-file.txt", "hello\\n"); process.stdout.write("edited\\n"); }
  else if (d.includes("!empty")) { fs.writeFileSync("small.ts", ""); process.stdout.write("emptied\\n"); }
  else if (d.includes("!limit")) call(true);
  else if (d.includes("!call")) call(false);
  else if (d.includes("!quit")) process.exit(0);
  else if (d.trim()) process.stdout.write("got:" + d.trim() + "\\n");
});
`);

const TOKEN = "smoke-token";
const listen = (s: Server) => new Promise<string>((r) => s.listen(0, "127.0.0.1", () => r(`http://127.0.0.1:${(s.address() as AddressInfo).port}`)));
const upstreamBase = await listen(upstream);
const db = openDb(join(DATA, "mm.db")); // same file the MCP server opens
const proxy = createProxy(db, { ...UPSTREAMS, anthropic: upstreamBase }, {});
const proxyBase = await listen(proxy);
const launches: Array<{ id: string; agent: string; model: string; prompt: string }> = [];
const AVAIL = { claude: true, codex: true, opencode: false, openrouter: false };
const tasks = new TaskManager(db, {
  launcher: (agent: string, o: { taskId?: string; model?: string; prompt?: string }) => {
    launches.push({ id: o?.taskId ?? "", agent, model: o?.model ?? "", prompt: o?.prompt ?? "" });
    return { cmd: process.execPath, args: [AGENT], env: { SMOKE_API: `${proxyBase}/a/${agent}~${o?.taskId ?? ""}/anthropic`, SMOKE_MODEL: o?.model ?? "", SMOKE_PROMPT: o?.prompt ?? "" } };
  },
  home: HOME, idleMs: 700, tickMs: 150, availability: AVAIL,
});
const { server } = createWorkspaceServer({ db, token: TOKEN, tasks, previewPort: 0 });
const base = await listen(server);
const wsUrl = base.replace("http", "ws") + "/ws";

const api = (path: string, init: RequestInit = {}) =>
  fetch(base + path, { ...init, headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json", ...(init.headers ?? {}) } });
async function j(path: string, init: RequestInit = {}) {
  const r = await api(path, init);
  const text = await r.text();
  let body: any = text;
  try { body = JSON.parse(text); } catch { /* not JSON */ }
  return { status: r.status, body };
}
const post = (path: string, body: unknown = {}) => j(path, { method: "POST", body: JSON.stringify(body) });
const del = (path: string) => j(path, { method: "DELETE" });
const state = async () => (await j("/api/state")).body;
const task = async (id: string) => (await state()).tasks.find((t: any) => t.id === id);
const output = async (id: string) => (await j(`/api/tasks/${id}/output?tail=20000`)).body.text as string;
const sees = (id: string, re: RegExp) => until(async () => re.test(await output(id)), `${re} in the terminal`);
async function newTask(body: Record<string, unknown>) {
  const r = await post("/api/tasks", { agent: "claude", repo: REPO, isolate: true, ...body });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return r.body;
}
const enc = encodeURIComponent;
const PROJ = enc(REPO);
const CHECK_CMD = `node -e "process.exit(require('fs').readFileSync('answer.txt','utf8').trim()==='42'?0:1)"`;
const wsOpen = (headers: Record<string, string>) => new Promise<number | string>((r) => {
  const ws = new WebSocket(wsUrl, { headers });
  ws.on("open", () => { ws.close(); r("open"); });
  ws.on("unexpected-response", (_q, res) => r(res.statusCode ?? 0));
  ws.on("error", () => r("error"));
});

console.log(`Netheron functionality check — temp folder ${ROOT}`);
const started = Date.now();

// One live WebSocket for the whole run: collects broadcast events (task, notify, alert, meter, …).
const events: any[] = [];
const live = new WebSocket(wsUrl, { headers: { cookie: `mm_token=${TOKEN}` } });
live.on("message", (raw) => events.push(JSON.parse(String(raw))));
await new Promise((r, rej) => { live.once("open", r); live.once("error", rej); });

// =========================================================================================================
section("1. Access and safety");
await check("API refuses no token and a wrong token (401)", async () => {
  assert.equal((await fetch(`${base}/api/state`)).status, 401);
  assert.equal((await fetch(`${base}/api/state`, { headers: { authorization: "Bearer wrong" } })).status, 401);
  assert.equal((await fetch(`${base}/`)).status, 401, "the app page itself needs the token");
});
await check("login link ?token= sets an HttpOnly cookie, cookie works", async () => {
  const r = await fetch(`${base}/?token=${TOKEN}`, { redirect: "manual" });
  assert.equal(r.status, 302);
  assert.match(r.headers.get("set-cookie") ?? "", /mm_token=smoke-token; Path=\/; HttpOnly/);
  assert.equal((await fetch(`${base}/api/state`, { headers: { cookie: `mm_token=${TOKEN}` } })).status, 200);
});
await check("phone install files stay public (manifest, icon)", async () => {
  assert.equal((await fetch(`${base}/manifest.webmanifest`)).status, 200);
  assert.equal((await fetch(`${base}/icon.svg`)).status, 200);
});
await check("cross-site POST blocked (403), same-site POST allowed", async () => {
  assert.equal((await api("/api/route", { method: "POST", body: "{}", headers: { origin: "https://evil.example" } })).status, 403);
  assert.equal((await api("/api/route", { method: "POST", body: JSON.stringify({ prompt: "x" }), headers: { origin: base } })).status, 200);
});
await check("WebSocket refuses no token and a foreign origin", async () => {
  assert.notEqual(await wsOpen({}), "open");
  assert.notEqual(await wsOpen({ cookie: `mm_token=${TOKEN}`, origin: "https://evil.example" }), "open");
  assert.equal(await wsOpen({ cookie: `mm_token=${TOKEN}` }), "open");
});
await check("../ tricks can't read files outside the web folder or Monaco folder", async () => {
  assert.doesNotMatch((await j("/%2e%2e/package.json")).body, /"workspaces"/);
  for (const p of ["/vendor/monaco/..%2F..%2Fpackage.json", "/vendor/monaco/%2e%2e/%2e%2e/%2e%2e/package.json"]) {
    assert.doesNotMatch(String((await j(p)).body), /"multimodel-management"|"monaco-editor"/, p);
  }
});
await check("UI, service worker, xterm, Monaco served", async () => {
  assert.match((await j("/")).body, /<title>Netheron<\/title>/);
  for (const p of ["/sw.js", "/app.js", "/vendor/xterm.js", "/vendor/addon-fit.js", "/vendor/marked.js", "/vendor/purify.js", "/vendor/monaco/vs/loader.js"]) {
    assert.equal((await api(p)).status, 200, p);
  }
});
await check("version endpoint: server code not stale", async () => assert.equal((await j("/api/version")).body.stale, false));

// =========================================================================================================
section("2. Tasks, terminals and files");
let A: any;
await check("create task: own git worktree + branch, Claude trusts the folder, .env copied", async () => {
  A = await newTask({ prompt: "smoke task A" });
  assert.match(A.branch, /^mm\//);
  assert.notEqual(A.cwd, REPO);
  assert.ok(existsSync(join(A.cwd, "app.ts")), "worktree has the project files");
  assert.equal(readFileSync(join(A.cwd, ".env"), "utf8"), "SECRET=1\n");
  const t = await task(A.id);
  assert.equal(t.trusted, 1);
  assert.ok(JSON.parse(readFileSync(join(HOME, ".claude.json"), "utf8")).projects[A.cwd]?.hasTrustDialogAccepted);
});
await check("bad input refused: missing folder, empty prompt", async () => {
  const bad = await post("/api/tasks", { prompt: "x", repo: join(REPO, "nope") });
  assert.equal(bad.status, 400);
  assert.match(bad.body.error, /project folder not found/);
  assert.equal((await post("/api/tasks", { prompt: "  ", agent: "codex", repo: REPO })).status, 400);
});
await check("terminal over WebSocket: attach sees output, typing reaches the agent", async () => {
  const ws = new WebSocket(wsUrl, { headers: { cookie: `mm_token=${TOKEN}` } });
  let out = "";
  ws.on("message", (raw) => { const m = JSON.parse(String(raw)); if (m.id === A.id && (m.t === "data" || m.t === "buffer")) out += m.data; });
  await new Promise((r) => ws.once("open", r));
  ws.send(JSON.stringify({ t: "attach", id: A.id }));
  await until(() => out.includes("fake agent ready"), "agent greeting");
  ws.send(JSON.stringify({ t: "input", id: A.id, data: "hello over ws\r" }));
  await until(() => out.includes("got:hello over ws"), "echo of typed text");
  ws.send(JSON.stringify({ t: "resize", id: A.id, cols: 100, rows: 30 }));
  ws.close();
});
await check("phone key bar: REST input + plain-text output", async () => {
  await post(`/api/tasks/${A.id}/input`, { data: "!edit\r" });
  await sees(A.id, /edited/);
  const o = (await j(`/api/tasks/${A.id}/output?tail=500`)).body;
  assert.equal(o.alive, true);
  assert.doesNotMatch(o.text, /\x1b\[/, "no colour codes");
});
await check("diff shows the agent's new file", async () => {
  const d = (await j(`/api/tasks/${A.id}/diff`)).body;
  assert.ok(d.files.some((f: any) => f.path === "new-file.txt" && f.status === "??"), JSON.stringify(d.files));
  assert.match(d.diff, /\+hello/);
});
await check("live diff: changes pushed over WebSocket, stop after unwatch", async () => {
  const ws = new WebSocket(wsUrl, { headers: { cookie: `mm_token=${TOKEN}` } });
  const diffs: any[] = [];
  ws.on("message", (raw) => { const m = JSON.parse(String(raw)); if (m.t === "diff" && m.id === A.id) diffs.push(m); });
  await new Promise((r) => ws.once("open", r));
  ws.send(JSON.stringify({ t: "watch-diff", id: A.id }));
  await until(() => diffs.length >= 1, "first diff");
  writeFileSync(join(A.cwd, "live.txt"), "streamed\n");
  await until(() => diffs.at(-1).files.some((f: any) => f.path === "live.txt"), "pushed diff with live.txt");
  ws.send(JSON.stringify({ t: "unwatch-diff" }));
  await sleep(300);
  const n = diffs.length;
  writeFileSync(join(A.cwd, "live2.txt"), "x\n");
  await sleep(1200);
  assert.equal(diffs.length, n, "no pushes after unwatch");
  ws.close();
});
await check("Code tab: list, open, save, 409 on a stale save, force, new file", async () => {
  const top = (await j(`/api/tasks/${A.id}/files`)).body;
  assert.ok(top.files.some((f: any) => f.name === "app.ts"));
  assert.ok(!top.dirs.some((d: any) => d.name === ".git"), ".git hidden");
  const f = (await j(`/api/tasks/${A.id}/file?path=small.ts`)).body;
  assert.match(f.content, /^a\r?\nb/);
  const save = (b: object) => post(`/api/tasks/${A.id}/file`, b);
  assert.equal((await save({ path: "notes.md", content: "v1\n", baseHash: null })).status, 200);
  const n1 = (await j(`/api/tasks/${A.id}/file?path=notes.md`)).body;
  assert.equal((await save({ path: "notes.md", content: "v2\n", baseHash: n1.hash })).status, 200);
  const stale = await save({ path: "notes.md", content: "mine\n", baseHash: n1.hash });
  assert.equal(stale.status, 409);
  assert.match(stale.body.error, /changed on disk/);
  assert.equal(readFileSync(join(A.cwd, "notes.md"), "utf8"), "v2\n", "file untouched by the stale save");
  assert.equal((await save({ path: "notes.md", content: "mine\n", baseHash: n1.hash, force: true })).status, 200);
  assert.equal(readFileSync(join(A.cwd, "notes.md"), "utf8"), "mine\n");
});
await check("Code tab: ../, absolute paths and other drives refused; binary 415, >2 MB 413", async () => {
  for (const bad of ["../outside.txt", "src/../../outside.txt", join(A.cwd, "README.md"), "C:/Windows/win.ini"]) {
    assert.equal((await j(`/api/tasks/${A.id}/file?path=${enc(bad)}`)).status, 400, bad);
    assert.equal((await post(`/api/tasks/${A.id}/file`, { path: bad, content: "x", baseHash: null })).status, 400, bad);
  }
  writeFileSync(join(A.cwd, "bin.dat"), Buffer.from([1, 0, 2]));
  writeFileSync(join(A.cwd, "big.txt"), "x".repeat(2 * 1024 * 1024 + 1));
  assert.equal((await j(`/api/tasks/${A.id}/file?path=bin.dat`)).status, 415);
  assert.equal((await j(`/api/tasks/${A.id}/file?path=big.txt`)).status, 413);
  rmSync(join(A.cwd, "big.txt"));
});
await check("message queue: delivered when the agent goes idle, marked sent", async () => {
  await until(async () => (await task(A.id)).status === "idle", "task idle");
  const q = await post(`/api/tasks/${A.id}/queue`, { text: "hello from the queue" });
  assert.equal(q.status, 200);
  await sees(A.id, /got:hello from the queue/);
  await until(async () => (await j(`/api/tasks/${A.id}/queue`)).body.queue.some((x: any) => x.sent > 0), "queue item marked sent");
});
await check("diff comment reaches the agent as a review note", async () => {
  await post(`/api/tasks/${A.id}/comment`, { file: "app.ts", line: 3, text: "use a constant here" });
  await sees(A.id, /got:Review comment on app\.ts:3: use a constant here/);
});
await check("checkpoints are taken automatically", async () => {
  await until(async () => (await j(`/api/tasks/${A.id}/checkpoints`)).body.checkpoints.length >= 1, "a checkpoint");
});
await check("edit guard: emptied file flagged + alert; restore brings it back byte-exact", async () => {
  await until(async () => (await task(A.id)).status === "idle", "task idle");
  // The "after turn" checkpoint lands just after the task turns idle; wait for it so it can't capture the damage (B-042).
  let n = -1;
  await until(async () => {
    const now = (await j(`/api/tasks/${A.id}/checkpoints`)).body.checkpoints.length;
    const stable = now === n;
    n = now;
    if (!stable) await sleep(600);
    return stable;
  }, "checkpoints settled");
  const before = readFileSync(join(A.cwd, "small.ts"), "utf8");
  await post(`/api/tasks/${A.id}/input`, { data: "!empty\r" });
  let guard: any;
  await until(async () => {
    guard = (await j(`/api/tasks/${A.id}/checkpoints`)).body.guard;
    return guard.warnings.some((w: any) => w.path === "small.ts" && w.kind === "emptied");
  }, "guard warning");
  assert.ok((await j("/api/alerts?hours=1")).body.alerts.some((a: any) => a.kind === "guard"), "guard alert");
  const r = await post(`/api/tasks/${A.id}/restore`, { n: guard.checkpoint, path: "small.ts" });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(readFileSync(join(A.cwd, "small.ts"), "utf8"), before);
});
await check("Check code (diagnostics): compiler output parsed into file:line items", async () => {
  const r = await post(`/api/tasks/${A.id}/diagnostics`, { command: `node -e "console.log('src/a.ts(1,2): error TS1: boom'); process.exit(2)"` });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.ok, false);
  assert.equal(r.body.items[0].file, "src/a.ts");
  assert.equal(r.body.items[0].line, 1);
});
await check("receipt: checkpoints, messages sent, alerts", async () => {
  const r = (await j(`/api/tasks/${A.id}/receipt`)).body;
  assert.ok(r.checkpoints >= 1, `checkpoints ${r.checkpoints}`);
  assert.ok(r.sent >= 2, `sent ${r.sent}`);
  assert.ok(r.alerts.length >= 1);
});
await check("agent exits → task done, notify event, outcome saved to shared memory", async () => {
  const B = await newTask({ prompt: "smoke task B" });
  await sees(B.id, /fake agent ready/);
  await post(`/api/tasks/${B.id}/input`, { data: "!edit\r" });
  await sees(B.id, /edited/);
  await post(`/api/tasks/${B.id}/input`, { data: "!quit\r" });
  await until(async () => (await task(B.id)).status === "done", "status done");
  await until(() => events.some((e) => e.t === "notify" && e.taskId === B.id), "notify event");
  await until(async () => (await j(`/api/memory/recent?project=${PROJ}`)).body.some((n: any) => n.kind === "outcome"), "outcome in memory");
});
await check("stop: agent process ends, task marked stopped", async () => {
  const C = await newTask({ prompt: "smoke task C" });
  await sees(C.id, /fake agent ready/);
  await post(`/api/tasks/${C.id}/stop`);
  await until(async () => (await j(`/api/tasks/${C.id}/output`)).body.alive === false, "process gone");
  await until(async () => ["stopped", "done"].includes((await task(C.id)).status), "status stopped");
});
await check("hand-off: other agent, same folder, briefing, first agent stopped", async () => {
  const D = await newTask({ prompt: "Add input validation to the signup form" });
  await sees(D.id, /fake agent ready/);
  const r = await post(`/api/tasks/${D.id}/handoff`, { reason: "smoke test hand-off" });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const child = r.body;
  assert.equal(child.agent, "codex");
  assert.equal(child.cwd, D.cwd);
  assert.equal((await task(D.id)).status, "stopped");
  const brief = launches.find((l) => l.id === child.id)!.prompt;
  for (const part of ["taking over a task from claude", "smoke test hand-off", "Add input validation"]) assert.ok(brief.includes(part), `briefing mentions: ${part}`);
});
await check("remove with worktree: task gone, folder deleted, main checkout untouched", async () => {
  const E = await newTask({ prompt: "smoke task to remove" });
  await sees(E.id, /fake agent ready/);
  assert.equal((await del(`/api/tasks/${E.id}?worktree=1`)).status, 200);
  assert.equal(await task(E.id), undefined);
  await until(() => !existsSync(E.cwd), "worktree folder removed");
  assert.equal(readFileSync(join(REPO, ".env"), "utf8"), "SECRET=1\n");
  assert.equal(JSON.parse(readFileSync(join(HOME, ".claude.json"), "utf8")).projects[E.cwd], undefined, "trust entry removed");
});

// =========================================================================================================
section("3. Cost, limits and live meters");
let F: any;
await check("proxy logs every model call per task: tokens, cost, agent", async () => {
  F = await newTask({ prompt: "smoke cost task", budgetUsd: 0.0001 });
  await sees(F.id, /fake agent ready/);
  await post(`/api/tasks/${F.id}/input`, { data: "!call\r" });
  await sees(F.id, /called 200/);
  await until(async () => (await j("/api/usage?hours=1")).body.byTask.some((r: any) => r.task === F.id), "usage row");
  const row = (await j("/api/usage?hours=1")).body.byTask.find((r: any) => r.task === F.id);
  assert.equal(row.agent, "claude");
  assert.equal(row.tokens_in, 1000);
  assert.equal(row.tokens_out, 200);
  assert.ok(row.cost_usd > 0, `cost ${row.cost_usd}`);
});
await check("task meter: tokens in/out and cost", async () => {
  const m = (await j(`/api/tasks/${F.id}/meter`)).body;
  assert.equal(m.tokensIn, 1000);
  assert.ok(m.costUsd > 0 || m.cost > 0, JSON.stringify(m));
});
await check("budget: over the limit → agent interrupted once + budget alert", async () => {
  await until(async () => (await task(F.id)).budget_hit === 1, "budget_hit");
  assert.ok((await j("/api/alerts?hours=1")).body.alerts.some((a: any) => a.kind === "budget" && a.task === F.id));
});
await check("live events over WebSocket: meter + alert + task updates", async () => {
  await until(() => events.some((e) => e.t === "meter" && e.id === F.id), "meter event");
  assert.ok(events.some((e) => e.t === "alert"), "alert event");
  assert.ok(events.some((e) => e.t === "task"), "task event");
});
await check("usage limit (429): alert, task waits, resumes by itself after the reset", async () => {
  const G = await newTask({ prompt: "smoke limit task" });
  await sees(G.id, /fake agent ready/);
  await post(`/api/tasks/${G.id}/input`, { data: "!limit\r" });
  await sees(G.id, /called 429/);
  await until(async () => (await j("/api/alerts?hours=1")).body.alerts.some((a: any) => a.kind === "limit" && a.task === G.id), "limit alert");
  await until(async () => new RegExp(`got:${WATCH.resumeText.slice(0, 20)}`).test(await output(G.id)), "resume nudge typed", 20_000);
  assert.equal((await task(G.id)).wait_until, 0);
  assert.ok((await j("/api/alerts?hours=1")).body.alerts.some((a: any) => a.kind === "resumed" && a.task === G.id));
});
await check("usage summary counts the calls", async () => {
  const s = (await j("/api/usage?hours=1")).body.summary;
  assert.ok(JSON.stringify(s).length > 2);
  assert.ok(modelCalls >= 2, `fake model got ${modelCalls} calls`);
});

// =========================================================================================================
section("4. Multi-agent: route, rules, race, dial, pipeline, schedule, quality, profiles");
await check("router explains its pick (debug → category debug)", async () => {
  const d = (await post("/api/route", { prompt: "Fix the crash on login" })).body;
  assert.equal(d.category, "debug");
  assert.ok(d.reason.length > 10);
});
await check("shared rules: written once, given to every new agent", async () => {
  assert.equal((await post("/api/memory/record", { project: REPO, kind: "rule", title: "Use tabs, not spaces" })).status, 200);
  const t = await newTask({ prompt: "rules check", agent: "codex" });
  const p = launches.find((l) => l.id === t.id)!.prompt;
  assert.match(p, /^Project rules[\s\S]*Use tabs, not spaces/);
  assert.ok(JSON.parse((await task(t.id)).rules_given).includes("Use tabs, not spaces"));
});
await check("Race & Judge: 2 agents in separate worktrees, judged by the check, keep the winner", async () => {
  const r = await post("/api/tasks", { race: true, prompt: "fix the answer (race)", repo: REPO, verifyCmd: CHECK_CMD });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const rid = r.body.race.id;
  const first = (await j(`/api/races/${rid}`)).body;
  assert.equal(first.tasks.length, 2);
  assert.equal(new Set(first.tasks.map((t: any) => t.cwd)).size, 2, "separate worktrees");
  await until(async () => (await j(`/api/races/${rid}`)).body.race.status === "judged", "race judged", 40_000);
  const judged = (await j(`/api/races/${rid}`)).body.race;
  assert.ok(judged.winner);
  assert.ok(judged.results.every((x: any) => x.checks === "pass"), JSON.stringify(judged.results));
  const loser = first.tasks.find((t: any) => t.id !== judged.winner);
  assert.equal((await post(`/api/races/${rid}/keep`, {})).status, 200);
  await until(async () => (await task(loser.id)) === undefined, "loser removed");
  assert.equal(existsSync(loser.cwd), false, "loser's worktree deleted");
  assert.ok(await task(judged.winner), "winner kept");
}, 60_000);
await check("Budget Dial: starts on the smallest model, failing check climbs a step, passing stops", async () => {
  const t = await newTask({ prompt: "fix the answer (dial)", agent: "auto", checks: "dial", verifyCmd: CHECK_CMD });
  assert.equal(t.model, "haiku");
  await until(async () => (await task(t.id)).handoff_to, "dial step up", 30_000);
  const next = await task((await task(t.id)).handoff_to);
  assert.equal(next.dial_step, 1);
  assert.ok(launches.find((l) => l.id === next.id)!.prompt.includes("didn't pass the checks"));
  await until(async () => JSON.parse((await task(next.id)).verify_last || "null")?.ok === true, "checks pass on step 2", 30_000);
  assert.equal((await task(next.id)).handoff_to, "");
}, 70_000);
await check("pipeline Plan → Build → Review: 3 agents, one folder, moves on at STEP DONE", async () => {
  const first = await newTask({ prompt: "Add CSV export", agent: "auto", pipeline: "plan-build-review" });
  assert.equal(`${first.agent}:${first.model}`, "claude:opus");
  await until(async () => (await j("/api/alerts?hours=1")).body.alerts.some((a: any) => a.kind === "pipeline" && /all 3 steps done/.test(a.message)), "pipeline finished", 40_000);
  const chain = (await state()).tasks.filter((t: any) => t.pipeline && t.cwd === first.cwd);
  assert.equal(chain.length, 3);
  assert.deepEqual(launches.filter((l) => chain.some((t: any) => t.id === l.id)).map((l) => `${l.agent}${l.model ? ":" + l.model : ""}`), ["claude:opus", "codex", "claude:sonnet"]);
}, 60_000);
await check("Night Shift: scheduled task starts on time exactly once; cancel works", async () => {
  const r = await post("/api/tasks", { prompt: "nightly smoke", agent: "claude", repo: REPO, isolate: true, when: "at", at: new Date(Date.now() + 1500).toISOString() });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.ok((await j("/api/schedule")).body.schedule.some((s: any) => s.id === r.body.scheduled.id));
  await until(async () => (await state()).tasks.some((t: any) => t.title === "nightly smoke"), "scheduled task started");
  await sleep(800);
  assert.equal((await state()).tasks.filter((t: any) => t.title === "nightly smoke").length, 1, "started once");
  const later = await post("/api/tasks", { prompt: "later smoke", agent: "claude", repo: REPO, when: "at", at: new Date(Date.now() + 3600_000).toISOString() });
  const after = (await del(`/api/schedule/${later.body.scheduled.id}`)).body.schedule;
  assert.ok(!after.some((s: any) => s.id === later.body.scheduled.id), "cancelled");
});
await check("quality watch: eval runs on every model, scores saved, workers cleaned up", async () => {
  const ev = await post("/api/quality/evals", { project: REPO, title: "answer", prompt: "fix the answer (quality)", verify: CHECK_CMD });
  assert.equal(ev.status, 200, JSON.stringify(ev.body));
  assert.equal((await post("/api/quality/evals", { project: REPO, title: "x", prompt: "", verify: "" })).status, 400);
  const run = await post("/api/quality/run", { project: REPO });
  assert.equal(run.status, 200, JSON.stringify(run.body));
  const rid = run.body.races[0].id;
  assert.equal((await j(`/api/races/${rid}`)).body.tasks.length, 4, "haiku, codex, sonnet, opus");
  await until(async () => (await j(`/api/quality?project=${PROJ}`)).body.scores.length >= 4, "scores for 4 models", 50_000);
  const scores = (await j(`/api/quality?project=${PROJ}`)).body.scores;
  assert.equal(scores.find((s: any) => s.candidate === "claude-haiku").passRate, 0);
  assert.equal(scores.find((s: any) => s.candidate === "codex").passRate, 1);
  await until(async () => (await j(`/api/races/${rid}`)).body.tasks.length === 0, "eval tasks removed", 20_000);
}, 80_000);
await check("account profiles: create, duplicate refused, project default, delete", async () => {
  const p = await post("/api/profiles", { agent: "claude", name: "work" });
  assert.equal(p.status, 200, JSON.stringify(p.body));
  assert.ok(existsSync(p.body.env.CLAUDE_CONFIG_DIR), "own config folder");
  assert.equal((await post("/api/profiles", { agent: "claude", name: "work" })).status, 400);
  assert.equal((await post("/api/profiles", { agent: "shell", name: "x" })).status, 400);
  const d = await post("/api/profiles/default", { project: REPO, agent: "claude", profile: p.body.id });
  assert.equal(d.body.projectDefaults.claude, p.body.id);
  await post("/api/profiles/default", { project: REPO, agent: "claude", profile: "" });
  assert.equal((await del(`/api/profiles/${p.body.id}`)).status, 200);
  assert.ok(!(await j("/api/profiles")).body.profiles.some((x: any) => x.id === p.body.id));
});
await check("worktree setup recipe: default copies .env, ../ refused, saved", async () => {
  const r = (await j(`/api/projects/setup?path=${PROJ}`)).body;
  assert.ok(r.copy.includes(".env"), JSON.stringify(r));
  assert.equal((await post("/api/projects/setup", { path: REPO, copy: ["../outside"] })).status, 400);
  assert.equal((await post("/api/projects/setup", { path: REPO, copy: [".env"], link: [], run: "" })).status, 200);
});
await check("morning brief + alerts list", async () => {
  const b = (await j("/api/brief?hours=1")).body;
  assert.ok(b.tasks.length > 0);
  assert.ok(b.tasks.every((x: any) => "costUsd" in x && "alerts" in x));
  const kinds = new Set((await j("/api/alerts?hours=1")).body.alerts.map((a: any) => a.kind));
  for (const k of ["guard", "budget", "limit", "race", "pipeline"]) assert.ok(kinds.has(k), `alert kind ${k}`);
});

// =========================================================================================================
section("5. Shared memory, MCP, push, remote workers, browser, preview");
let decisionId = 0;
await check("memory: index files + symbols, record, search, context, tree, node", async () => {
  const idx = (await post("/api/memory/index", { project: REPO })).body;
  assert.ok(idx.files >= 3, JSON.stringify(idx));
  decisionId = (await post("/api/memory/record", { project: REPO, kind: "decision", title: "Use SQLite for memory", body: "zero infra" })).body.id;
  assert.equal((await j(`/api/memory/search?project=${PROJ}&q=sqlite`)).body[0].title, "Use SQLite for memory");
  assert.match((await j(`/api/memory/context?project=${PROJ}`)).body.text, /\[decision\] Use SQLite for memory/);
  assert.match((await j(`/api/memory/tree?project=${PROJ}`)).body.text, /app\.ts/);
  assert.equal((await j(`/api/memory/node/${decisionId}`)).body.node.title, "Use SQLite for memory");
  assert.ok((await j(`/api/memory/stats?project=${PROJ}`)).body.stats);
  assert.equal((await post("/api/memory/record", { project: REPO, kind: "nope", title: "x" })).status, 400);
});
await check("MCP server (what agents use): sees memory from the UI, records back, line edits with anchors", async () => {
  const work = join(ROOT, "mcp-work");
  mkdirSync(work);
  writeFileSync(join(work, "x.py"), "def f():\n    return 1\n");
  const p = spawn(process.execPath, [MCP_BIN], {
    env: { ...process.env, MM_DATA_DIR: DATA, MM_PROJECT: REPO, MM_WORKDIR: work, MM_AGENT: "codex" }, stdio: ["pipe", "pipe", "inherit"],
  });
  const replies = new Map<number, any>();
  createInterface({ input: p.stdout! }).on("line", (l) => { try { const m = JSON.parse(l); replies.set(m.id, m); } catch { /* log line */ } });
  let next = 1;
  const rpc = async (method: string, params?: object) => {
    const id = next++;
    p.stdin!.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    await until(() => replies.has(id), `MCP reply to ${method}`, 15_000);
    return replies.get(id).result;
  };
  const tool = async (name: string, args: object) => rpc("tools/call", { name, arguments: args });
  try {
    assert.ok((await rpc("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "smoke", version: "1" } })).serverInfo);
    const names = (await rpc("tools/list")).tools.map((t: any) => t.name);
    for (const n of ["mm_get_context", "mm_search", "mm_record", "mm_read_lines", "mm_edit_lines", "mm_diagnostics"]) assert.ok(names.includes(n), n);
    assert.match((await tool("mm_search", { query: "sqlite" })).content[0].text, /Use SQLite for memory/, "decision recorded in the UI is visible to the agent");
    await tool("mm_record", { kind: "note", title: "Codex found the cache bug", body: "in app.ts" });
    assert.equal((await j(`/api/memory/search?project=${PROJ}&q=cache`)).body[0]?.title, "Codex found the cache bug", "agent's note visible in the UI");
    const read = (await tool("mm_read_lines", { path: "x.py" })).content[0].text as string;
    const anchor = read.split("\n").find((l) => l.includes("return 1"))!.split("|")[0];
    assert.ok(!(await tool("mm_edit_lines", { path: "x.py", start: anchor, text: "    return 2" })).isError);
    assert.equal(readFileSync(join(work, "x.py"), "utf8"), "def f():\n    return 2\n");
    const stale = await tool("mm_edit_lines", { path: "x.py", start: anchor, text: "    return 3" });
    assert.equal(stale.isError, true, "stale anchor refused");
    assert.match((await tool("mm_read_lines", { path: "../escape.txt" })).content[0].text, /outside/);
  } finally {
    p.kill();
  }
});
await check("web push: VAPID key, https-only subscribe, last notification kept for the phone", async () => {
  const key = (await j("/api/push/key")).body.key;
  assert.equal(Buffer.from(key, "base64url").length, 65);
  assert.equal((await post("/api/push/subscribe", { endpoint: "http://insecure.example/x" })).status, 400);
  assert.equal((await post("/api/push/subscribe", { endpoint: "https://push.invalid/smoke" })).status, 200);
  assert.equal((await post("/api/push/unsubscribe", { endpoint: "https://push.invalid/smoke" })).status, 200);
  const last = (await j("/api/push/last")).body;
  assert.ok(last?.title, "a finished task left a notification");
});
await check("remote workers: add another Netheron by link, start + list tasks there, bad token refused", async () => {
  const rRepo = join(ROOT, "remote-project");
  mkdirSync(rRepo);
  writeFileSync(join(rRepo, "a.txt"), "x\n");
  const g = (...a: string[]) => execFileSync("git", ["-C", rRepo, ...a], { stdio: "ignore" });
  g("init", "-q"); g("add", "."); g("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "i");
  const rdb = openDb(join(DATA, "remote.db"));
  const rtasks = new TaskManager(rdb, { launcher: () => ({ cmd: process.execPath, args: [AGENT], env: {} }), home: HOME, idleMs: 60_000 });
  const remote = createWorkspaceServer({ db: rdb, token: "remote-tok", tasks: rtasks, previewPort: 0 }).server;
  const rBase = await listen(remote);
  try {
    assert.equal((await post("/api/workers", { name: "box", link: `${rBase}/?token=wrong` })).status, 400);
    const w = await post("/api/workers", { name: "box", link: `${rBase}/?token=remote-tok` });
    assert.equal(w.status, 200, JSON.stringify(w.body));
    const list = (await j("/api/workers")).body;
    assert.ok(!JSON.stringify(list).includes("remote-tok"), "token never sent to the browser");
    assert.equal((await post(`/api/workers/${w.body.id}/folder`, { folder: rRepo })).status, 200);
    const t = await post(`/api/workers/${w.body.id}/tasks`, { prompt: "build it remotely", agent: "shell" });
    assert.equal(t.status, 200, JSON.stringify(t.body));
    assert.equal(rtasks.list()[0].id, t.body.id, "task runs on the other Netheron");
    const rt = (await j(`/api/workers/${w.body.id}/tasks`)).body;
    assert.equal(rt.online, true);
    assert.equal(rt.tasks.length, 1);
    assert.match((await j(`/api/workers/${w.body.id}/open?task=${t.body.id}`)).body.url, /\?token=remote-tok#task=/);
    assert.equal((await del(`/api/workers/${w.body.id}`)).status, 200);
  } finally {
    await rtasks.dispose();
    remote.closeAllConnections();
    remote.close();
  }
});
const chrome = findChrome();
if (!chrome) skip("shared browser: actions, hard blocks, hand to user, resume", "no Chrome/Edge found");
else await check("shared browser: actions work, password/pay/delete blocked, hand to user blocks, resume", async () => {
  const PAGE = `<!doctype html><title>t</title><body style="margin:0;font:16px sans-serif">
<input id="pw" type="password" style="position:absolute;left:20px;top:20px;width:200px;height:30px">
<button style="position:absolute;left:20px;top:80px;width:150px;height:40px" onclick="document.title='next'">Next</button>
<button style="position:absolute;left:200px;top:80px;width:150px;height:40px" onclick="document.title='ordered'">Place order</button></body>`;
  const site = createServer((_q, res) => res.writeHead(200, { "content-type": "text/html" }).end(PAGE));
  const siteBase = await listen(site);
  const br = new SharedBrowser({ profileDir: join(ROOT, "browser-profile"), headless: true });
  try {
    const s = await br.act("bt", { action: "navigate", url: siteBase + "/" });
    assert.equal(Buffer.from(s.image, "base64").subarray(1, 4).toString(), "PNG");
    await br.act("bt", { action: "click", x: 90, y: 100 });
    await assert.rejects(br.act("bt", { action: "click", x: 270, y: 100 }), (e: Error) => e instanceof BrowserBlocked && /Place order/.test(e.message));
    await br.act("bt", { action: "click", x: 100, y: 35 });
    await assert.rejects(br.act("bt", { action: "type_text", text: "secret" }), /password/);
    await assert.rejects(br.act("bt", { action: "navigate", url: "file:///C:/Windows/win.ini" }), /http/);
    await br.handToUser("bt");
    await assert.rejects(br.act("bt", { action: "click", x: 90, y: 100 }), /user has control/);
    await br.resume("bt");
    await br.act("bt", { action: "wait", seconds: 0 });
  } finally {
    await br.dispose();
    site.closeAllConnections();
    site.close();
  }
}, 60_000);
await check("preview proxy: needs the token, forwards to your dev server, model proxy port off limits", async () => {
  const dev = createServer((req, res) => res.end(`dev server saw ${req.url}`));
  const devBase = await listen(dev);
  const devPort = Number(new URL(devBase).port);
  const pv = createPreviewServer(TOKEN, [Number(new URL(proxyBase).port)]);
  const pvBase = await listen(pv);
  try {
    assert.equal((await fetch(`${pvBase}/`)).status, 401);
    const set = await fetch(`${pvBase}/__mm/target?port=${devPort}&token=${TOKEN}`, { redirect: "manual" });
    assert.equal(set.status, 302);
    const cookie = (set.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
    assert.equal(await (await fetch(`${pvBase}/assets/app.js`, { headers: { cookie } })).text(), "dev server saw /assets/app.js");
    assert.equal((await fetch(`${pvBase}/__mm/target?port=${new URL(proxyBase).port}&token=${TOKEN}`, { redirect: "manual" })).status, 403);
    assert.match((await j(`/api/preview-link?port=${devPort}`)).body.url, /__mm\/target\?port=/);
  } finally {
    pv.closeAllConnections(); pv.close(); dev.closeAllConnections(); dev.close();
  }
});
await check("project picker: folders listed, git + remote detected, bad path 400", async () => {
  const d = (await j(`/api/fs/dirs?path=${PROJ}`)).body;
  assert.equal(d.git, true);
  assert.equal((await j(`/api/projects/info?path=${PROJ}`)).body.git, true);
  assert.equal((await j(`/api/fs/dirs?path=${enc(join(REPO, "nope"))}`)).status, 400);
  assert.equal((await post("/api/projects/clone", { url: "file:///etc" })).status, 400);
});

// =========================================================================================================
live.close();
await tasks.dispose();
for (const s of [server, proxy, upstream]) { s.closeAllConnections(); s.close(); }
const failed = results.filter((r) => !r.ok);
const skipped = results.filter((r) => r.skipped);
const passed = results.length - failed.length - skipped.length;
console.log(`\n${"=".repeat(60)}`);
for (const g of [...new Set(results.map((r) => r.group))]) {
  const rs = results.filter((r) => r.group === g);
  console.log(`${rs.every((r) => r.ok) ? "✔" : "✖"} ${g}: ${rs.filter((r) => r.ok && !r.skipped).length}/${rs.length - rs.filter((r) => r.skipped).length} passed`);
}
console.log(`\n${passed} passed, ${failed.length} failed, ${skipped.length} skipped in ${((Date.now() - started) / 1000).toFixed(0)} s`);
if (failed.length) {
  console.log("\nFailed:");
  failed.forEach((f, i) => console.log(`  ${i + 1}. [${f.group.split(".")[0]}] ${f.name}\n     ${f.err}`));
  console.log(`\nTemp folder kept for a look: ${ROOT}`);
} else {
  try { rmSync(ROOT, { recursive: true, force: true }); } catch { /* Windows may still hold a file */ }
}
process.exit(failed.length ? 1 : 0);

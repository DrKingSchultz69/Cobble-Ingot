// Integration: workspace server + task manager + worktrees + PTY + WebSocket + preview proxy.
// Uses a tiny Node "agent" script instead of a real CLI so it runs offline and fast.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createServer, type Server } from "node:http";
import { mkdtempSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { WebSocket } from "ws";

const dataDir = mkdtempSync(join(tmpdir(), "mm-srv-data-"));
process.env.MM_DATA_DIR = dataDir; // must be set before config.ts loads
const { openDb } = await import("../src/db.ts");
const { createPreviewServer, createWorkspaceServer, stripAnsi } = await import("../src/server.ts");
const { TaskManager } = await import("../src/tasks.ts");

const TOKEN = "test-token-123";
const agentScript = join(dataDir, "fake-agent.js");
writeFileSync(
  agentScript,
  `process.stdout.write("fake agent ready\\n");
   const fs = require("fs");
   process.stdin.setEncoding("utf8");
   process.stdin.on("data", (d) => {
     if (d.includes("edit")) { fs.writeFileSync("new-file.txt", "hello\\n"); process.stdout.write("edited\\n"); }
     else if (d.includes("quit")) process.exit(0);
     else process.stdout.write("got:" + d.trim() + "\\n");
   });`,
);

let repo: string;
let server: Server;
let base: string;
let tasks: InstanceType<typeof TaskManager>;

before(async () => {
  repo = mkdtempSync(join(tmpdir(), "mm-srv-repo-"));
  writeFileSync(join(repo, "README.md"), "# demo\n");
  const g = (...a: string[]) => execFileSync("git", ["-C", repo, ...a], { stdio: "ignore" });
  g("init", "-q");
  g("add", ".");
  g("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "init");

  const db = openDb(join(dataDir, "test.db"));
  tasks = new TaskManager(db, { launcher: () => ({ cmd: process.execPath, args: [agentScript], env: {} }), home: dataDir });
  ({ server } = createWorkspaceServer({ db, token: TOKEN, tasks, previewPort: 0 }));
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await tasks.dispose();
  server.closeAllConnections();
  server.close();
});

const api = (path: string, init: RequestInit = {}) =>
  fetch(base + path, { ...init, headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json", ...(init.headers ?? {}) } });

const until = async (fn: () => Promise<boolean> | boolean, ms = 20_000) => { // generous: a cold first run (antivirus scanning new temp files) is slow
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("timed out waiting");
};

test("auth: API needs the token; ?token= sets a cookie and redirects", async () => {
  assert.equal((await fetch(`${base}/api/state`)).status, 401);
  assert.equal((await fetch(`${base}/api/state`, { headers: { authorization: "Bearer wrong" } })).status, 401);
  const r = await fetch(`${base}/?token=${TOKEN}`, { redirect: "manual" });
  assert.equal(r.status, 302);
  assert.match(r.headers.get("set-cookie") ?? "", /mm_token=test-token-123; Path=\/; HttpOnly/);
  assert.equal((await fetch(`${base}/api/state`, { headers: { cookie: `mm_token=${TOKEN}` } })).status, 200);
  // Static assets the PWA needs before login stay public; the app itself does not.
  assert.equal((await fetch(`${base}/manifest.webmanifest`)).status, 200);
  assert.equal((await fetch(`${base}/`)).status, 401);
});

test("serves the UI and vendored libraries", async () => {
  const html = await (await api("/")).text();
  assert.match(html, /<title>Netheron<\/title>/);
  for (const f of ["xterm.js", "xterm.css", "addon-fit.js", "marked.js", "purify.js"]) assert.equal((await api(`/vendor/${f}`)).status, 200, f);
  // Paths outside apps/web never leak files: unknown paths fall back to the app shell.
  assert.doesNotMatch(await (await api("/%2e%2e/package.json")).text(), /"workspaces"/);
});

test("router preview endpoint explains its choice", async () => {
  const d = await (await api("/api/route", { method: "POST", body: JSON.stringify({ prompt: "Fix the crash on login" }) })).json();
  assert.equal(d.category, "debug");
  assert.ok(d.reason.length > 10);
});

test("task lifecycle: worktree, terminal over WebSocket, diff, idle->done, outcome in memory", async () => {
  const res = await api("/api/tasks", { method: "POST", body: JSON.stringify({ prompt: "make an edit", agent: "claude", repo, isolate: true }) });
  const task = await res.json();
  assert.equal(res.status, 200, JSON.stringify(task));
  assert.match(task.branch, /^mm\/make-an-edit-/);
  assert.notEqual(task.cwd, repo);

  // WebSocket: attach, see output, send input.
  const ws = new WebSocket(`${base.replace("http", "ws")}/ws`, { headers: { cookie: `mm_token=${TOKEN}` } });
  let out = "";
  const events: any[] = [];
  ws.on("message", (raw) => {
    const m = JSON.parse(String(raw));
    if (m.id === task.id && (m.t === "data" || m.t === "buffer")) out += m.data;
    else events.push(m);
  });
  await new Promise((r) => ws.on("open", r));
  ws.send(JSON.stringify({ t: "attach", id: task.id }));
  await until(() => out.includes("fake agent ready"));
  ws.send(JSON.stringify({ t: "input", id: task.id, data: "hello\r" }));
  await until(() => out.includes("got:hello"));

  // REST input (used by the phone key bar) and plain-text output.
  await api(`/api/tasks/${task.id}/input`, { method: "POST", body: JSON.stringify({ data: "edit\r" }) });
  await until(() => out.includes("edited"));
  const o = await (await api(`/api/tasks/${task.id}/output?tail=200`)).json();
  assert.equal(o.alive, true);
  assert.match(o.text, /edited/);

  const diff = await (await api(`/api/tasks/${task.id}/diff`)).json();
  assert.deepEqual(diff.files, [{ status: "??", path: "new-file.txt" }]);
  assert.match(diff.diff, /\+hello/);
  assert.match(diff.stat, /1 untracked file/);

  // Agent exits -> done + notify event, outcome written to shared memory.
  ws.send(JSON.stringify({ t: "input", id: task.id, data: "quit\r" }));
  await until(async () => (await (await api("/api/state")).json()).tasks.find((t: any) => t.id === task.id)?.status === "done");
  await until(() => events.some((e) => e.t === "notify" && e.taskId === task.id && e.status === "done"));
  const project = encodeURIComponent(repo);
  await until(async () => (await (await api(`/api/memory/recent?project=${project}`)).json()).some((n: any) => n.kind === "outcome"));
  const recent = await (await api(`/api/memory/recent?project=${project}`)).json();
  assert.match(recent.find((n: any) => n.kind === "outcome").body, /1 untracked file/);
  ws.close();

  // Remove with worktree deletion.
  assert.equal((await api(`/api/tasks/${task.id}?worktree=1`, { method: "DELETE" })).status, 200);
  assert.equal((await (await api("/api/state")).json()).tasks.some((t: any) => t.id === task.id), false);
});

test("cross-site requests are blocked even with the cookie", async () => {
  const r = await api("/api/tasks/x/stop", { method: "POST", body: "{}", headers: { origin: "https://evil.example" } });
  assert.equal(r.status, 403);
  const ok = await api("/api/route", { method: "POST", body: JSON.stringify({ prompt: "x" }), headers: { origin: base } });
  assert.equal(ok.status, 200);
  const ws = new WebSocket(`${base.replace("http", "ws")}/ws`, { headers: { cookie: `mm_token=${TOKEN}`, origin: "https://evil.example" } });
  const code = await new Promise((r) => {
    ws.on("error", () => r("error"));
    ws.on("unexpected-response", (_q, res) => r(res.statusCode));
    ws.on("open", () => r("open"));
  });
  assert.notEqual(code, "open");
});

test("websocket rejects connections without the token", async () => {
  const ws = new WebSocket(`${base.replace("http", "ws")}/ws`);
  const err = await new Promise((r) => {
    ws.on("error", r);
    ws.on("unexpected-response", (_q, res) => r(res.statusCode));
  });
  assert.ok(err === 401 || err instanceof Error);
});

test("task creation validates input", async () => {
  const bad = await api("/api/tasks", { method: "POST", body: JSON.stringify({ prompt: "x", repo: join(repo, "nope") }) });
  assert.equal(bad.status, 400);
  assert.match((await bad.json()).error, /project folder not found/);
  const empty = await api("/api/tasks", { method: "POST", body: JSON.stringify({ prompt: "  ", agent: "codex", repo }) });
  assert.equal(empty.status, 400);
});

test("memory API: index, record, search, context", async () => {
  const project = encodeURIComponent(repo);
  const idx = await (await api("/api/memory/index", { method: "POST", body: JSON.stringify({ project: repo }) })).json();
  assert.equal(idx.files, 1);
  await api("/api/memory/record", { method: "POST", body: JSON.stringify({ project: repo, kind: "decision", title: "Use SQLite for memory", body: "zero infra" }) });
  const hits = await (await api(`/api/memory/search?project=${project}&q=sqlite`)).json();
  assert.equal(hits[0].title, "Use SQLite for memory");
  const ctx = await (await api(`/api/memory/context?project=${project}`)).json();
  assert.match(ctx.text, /\[decision\] Use SQLite for memory/);
  assert.equal((await api("/api/memory/record", { method: "POST", body: JSON.stringify({ project: repo, kind: "nope", title: "x" }) })).status, 400);
});

test("stripAnsi removes colour/OSC codes and keeps text", () => {
  assert.equal(stripAnsi("\x1b[31mred\x1b[0m\x1b]0;title\x07 ok\rnext"), "red ok\nnext");
});

test("preview proxy: needs token, then forwards to the chosen local port", async () => {
  const dev = createServer((req, res) => res.end(`dev server saw ${req.url}`)).listen(0);
  const devPort = (dev.address() as AddressInfo).port;
  const pv = createPreviewServer(TOKEN).listen(0);
  const pvBase = `http://127.0.0.1:${(pv.address() as AddressInfo).port}`;
  assert.equal((await fetch(`${pvBase}/`)).status, 401);
  assert.equal((await fetch(`${pvBase}/__mm/target?port=${devPort}&token=wrong`)).status, 401);
  const set = await fetch(`${pvBase}/__mm/target?port=${devPort}&token=${TOKEN}`, { redirect: "manual" });
  assert.equal(set.status, 302);
  const cookie = (set.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  const page = await fetch(`${pvBase}/assets/app.js`, { headers: { cookie } });
  assert.equal(await page.text(), "dev server saw /assets/app.js");
  // No open redirect, and the model proxy port is off limits.
  const evil = await fetch(`${pvBase}/__mm/target?port=${devPort}&token=${TOKEN}&path=//evil.example`, { redirect: "manual" });
  assert.equal(evil.headers.get("location"), "/");
  const pv2 = createPreviewServer(TOKEN, [devPort]).listen(0);
  assert.equal((await fetch(`http://127.0.0.1:${(pv2.address() as AddressInfo).port}/__mm/target?port=${devPort}&token=${TOKEN}`, { redirect: "manual" })).status, 403);
  pv2.closeAllConnections();
  pv2.close();
  pv.closeAllConnections();
  pv.close();
  dev.closeAllConnections();
  dev.close();
});


test("folder picker lists sub-folders, flags git repos, rejects bad paths (B-025)", async () => {
  const { mkdirSync } = await import("node:fs");
  mkdirSync(join(repo, "src"), { recursive: true });
  mkdirSync(join(repo, "node_modules"), { recursive: true });
  const r = await (await api(`/api/fs/dirs?path=${encodeURIComponent(repo)}`)).json();
  assert.equal(r.git, true);
  assert.deepEqual(r.dirs.map((d: { name: string }) => d.name), ["src"]); // .git and node_modules hidden
  assert.equal(r.dirs[0].path, join(repo, "src"));
  assert.ok(r.parent);
  const roots = await (await api("/api/fs/dirs")).json();
  assert.equal(roots.path, "");
  assert.ok(roots.dirs.length >= 2); // home + at least one drive/root
  assert.equal((await api(`/api/fs/dirs?path=${encodeURIComponent(join(repo, "nope"))}`)).status, 400);
  assert.equal((await fetch(`${base}/api/fs/dirs`)).status, 401);
});

test("clone: URL parsing, bad URLs refused, existing clone reused (B-027)", async () => {
  const { parseRepoUrl } = await import("../src/worktree.ts");
  assert.deepEqual(parseRepoUrl("https://github.com/owner/my-app.git"), { url: "https://github.com/owner/my-app.git", name: "my-app" });
  assert.equal(parseRepoUrl("https://github.com/owner/my-app/").name, "my-app");
  assert.equal(parseRepoUrl("git@github.com:owner/my.app.git").name, "my.app");
  assert.equal(parseRepoUrl("ssh://git@github.com/owner/repo.git").name, "repo");
  for (const bad of ["file:///etc", "ext::sh -c touch% /tmp/x", "-oProxyCommand=x@h:r", "git@-oProxy:r", "http://github.com/o/r", "C:\code\repo", "owner/repo", ""]) {
    assert.throws(() => parseRepoUrl(bad), /HTTPS or SSH/, bad);
  }
  const bad = await api("/api/projects/clone", { method: "POST", body: JSON.stringify({ url: "file:///etc" }) });
  assert.equal(bad.status, 400);
  assert.match((await bad.json()).error, /HTTPS or SSH/);

  // A folder that is already a clone of the same URL is reused, no network needed.
  const parent = mkdtempSync(join(tmpdir(), "mm-clone-"));
  const dest = join(parent, "demo");
  execFileSync("git", ["init", "-q", dest]);
  execFileSync("git", ["-C", dest, "remote", "add", "origin", "https://github.com/owner/demo.git"]);
  const r = await (await api("/api/projects/clone", { method: "POST", body: JSON.stringify({ url: "https://github.com/owner/demo", parent }) })).json();
  assert.deepEqual(r, { path: dest, reused: true });
  // Same folder name, different repo: refused instead of overwriting.
  const clash = await api("/api/projects/clone", { method: "POST", body: JSON.stringify({ url: "https://github.com/other/demo.git", parent }) });
  assert.equal(clash.status, 400);
  assert.match((await clash.json()).error, /already exists/);
});

test("connected repo auto-detected: GitHub owner/repo, branch, web link (B-028)", async () => {
  const { remoteInfo } = await import("../src/worktree.ts");
  const dir = mkdtempSync(join(tmpdir(), "mm-remote-"));
  const g = (...a: string[]) => execFileSync("git", ["-C", dir, ...a], { stdio: "ignore" });
  g("init", "-q", "-b", "main");
  assert.equal(remoteInfo(dir), null); // repo without a remote
  const cases: Array<[string, string, string, string]> = [
    ["git@github.com:owner/my-app.git", "github.com", "owner", "my-app"],
    ["https://github.com/owner/my-app.git", "github.com", "owner", "my-app"],
    ["https://user:tok@github.com/owner/my-app", "github.com", "owner", "my-app"],
    ["ssh://git@ssh.github.com:443/owner/my-app.git", "github.com", "owner", "my-app"],
    ["git@gitlab.com:group/sub/proj.git", "gitlab.com", "group/sub", "proj"],
  ];
  for (const [url, host, owner, repo] of cases) {
    try { g("remote", "remove", "origin"); } catch {}
    g("remote", "add", "origin", url);
    const r = remoteInfo(dir)!;
    assert.deepEqual([r.host, r.owner, r.repo, r.github, r.branch], [host, owner, repo, host === "github.com", "main"], url);
    assert.equal(r.web, `https://${host}/${owner}/${repo}`);
    assert.ok(!r.remote.includes("tok@"), "credentials stripped");
  }
  const info = await (await api(`/api/projects/info?path=${encodeURIComponent(dir)}`)).json();
  assert.equal(info.remote.repo, "proj");
  const dirs = await (await api(`/api/fs/dirs?path=${encodeURIComponent(dir)}`)).json();
  assert.equal(dirs.remote.owner, "group/sub");
});

test("live diff: file changes are pushed to the Diff tab without asking (B-029)", async () => {
  const res = await api("/api/tasks", { method: "POST", body: JSON.stringify({ prompt: "live diff check", agent: "claude", repo, isolate: true }) });
  const task = await res.json();
  const ws = new WebSocket(`${base.replace("http", "ws")}/ws`, { headers: { cookie: `mm_token=${TOKEN}` } });
  const diffs: Array<{ files: Array<{ path: string }>; diff: string }> = [];
  ws.on("message", (raw) => {
    const m = JSON.parse(String(raw));
    if (m.t === "diff" && m.id === task.id) diffs.push(m);
  });
  await new Promise((r) => ws.once("open", r));
  ws.send(JSON.stringify({ t: "watch-diff", id: task.id }));
  await until(() => diffs.length >= 1); // current state right away
  const before = diffs.length;
  writeFileSync(join(task.cwd, "live.txt"), "streamed\n");
  await until(() => diffs.length > before && diffs.at(-1)!.files.some((f) => f.path === "live.txt"));
  assert.match(diffs.at(-1)!.diff, /\+streamed/);
  writeFileSync(join(task.cwd, "live.txt"), "streamed\nagain\n");
  await until(() => /\+again/.test(diffs.at(-1)!.diff));
  // After unwatch, no more pushes.
  ws.send(JSON.stringify({ t: "unwatch-diff" }));
  await new Promise((r) => setTimeout(r, 200));
  const n = diffs.length;
  writeFileSync(join(task.cwd, "live2.txt"), "x\n");
  await new Promise((r) => setTimeout(r, 1000));
  assert.equal(diffs.length, n);
  ws.close();
  await api(`/api/tasks/${task.id}?worktree=1`, { method: "DELETE" });
});

test("code tab: list, read, save with conflict check; paths can't escape the task folder (B-031)", async () => {
  const { mkdirSync, symlinkSync, readFileSync } = await import("node:fs");
  const res = await api("/api/tasks", { method: "POST", body: JSON.stringify({ prompt: "code tab check", agent: "claude", repo, isolate: true }) });
  const task = await res.json();
  const root = task.cwd;
  const j = async (r: Response) => ({ status: r.status, body: await r.json() });
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(join(root, "src", "a.ts"), "export const a = 1;\n");
  writeFileSync(join(root, "bin.dat"), Buffer.from([1, 0, 2]));
  writeFileSync(join(root, "big.txt"), "x".repeat(2 * 1024 * 1024 + 1));

  const top = (await j(await api(`/api/tasks/${task.id}/files`))).body;
  assert.ok(top.dirs.some((d: { name: string }) => d.name === "src"));
  assert.ok(!top.dirs.some((d: { name: string }) => d.name === ".git"));
  assert.ok(top.files.some((f: { name: string }) => f.name === "README.md"));
  assert.deepEqual((await j(await api(`/api/tasks/${task.id}/files?dir=src`))).body.files.map((f: { path: string }) => f.path), ["src/a.ts"]);

  const f = (await j(await api(`/api/tasks/${task.id}/file?path=src/a.ts`))).body;
  assert.equal(f.content, "export const a = 1;\n");
  const save = (body: object) => api(`/api/tasks/${task.id}/file`, { method: "POST", body: JSON.stringify(body) });
  const ok = await j(await save({ path: "src/a.ts", content: "export const a = 2;\n", baseHash: f.hash }));
  assert.equal(ok.status, 200);
  assert.equal(readFileSync(join(root, "src", "a.ts"), "utf8"), "export const a = 2;\n");
  // Stale hash (the agent edited after you opened it) -> 409, file untouched; force overrides.
  const stale = await j(await save({ path: "src/a.ts", content: "mine\n", baseHash: f.hash }));
  assert.equal(stale.status, 409);
  assert.match(stale.body.error, /changed on disk/);
  assert.equal(readFileSync(join(root, "src", "a.ts"), "utf8"), "export const a = 2;\n");
  assert.equal((await save({ path: "src/a.ts", content: "mine\n", baseHash: f.hash, force: true })).status, 200);
  // New file: baseHash null.
  assert.equal((await save({ path: "src/new/b.ts", content: "b\n", baseHash: null })).status, 200);
  assert.equal(readFileSync(join(root, "src", "new", "b.ts"), "utf8"), "b\n");

  assert.equal((await api(`/api/tasks/${task.id}/file?path=bin.dat`)).status, 415);
  assert.equal((await api(`/api/tasks/${task.id}/file?path=big.txt`)).status, 413);
  for (const bad of ["../outside.txt", "src/../../outside.txt", join(root, "README.md"), "C:/Windows/win.ini"]) {
    assert.equal((await api(`/api/tasks/${task.id}/file?path=${encodeURIComponent(bad)}`)).status, 400, bad);
    assert.equal((await save({ path: bad, content: "x", baseHash: null })).status, 400, bad);
  }
  // A symlink inside the folder that points outside it is refused.
  const outside = mkdtempSync(join(tmpdir(), "mm-outside-"));
  writeFileSync(join(outside, "secret.txt"), "s");
  let linked = false;
  try { symlinkSync(outside, join(root, "link"), "junction"); linked = true; } catch { /* no symlink rights */ }
  if (linked) {
    assert.equal((await api(`/api/tasks/${task.id}/file?path=link/secret.txt`)).status, 400);
    assert.equal((await save({ path: "link/new.txt", content: "x", baseHash: null })).status, 400);
  }
  assert.equal((await fetch(`${base}/api/tasks/${task.id}/files`)).status, 401);
  assert.equal((await api(`/api/tasks/${task.id}/file`, { method: "POST", body: "{}", headers: { origin: "https://evil.example" } })).status, 403);

  // Monaco is served, and its folder can't be escaped.
  const loader = await api("/vendor/monaco/vs/loader.js");
  assert.equal(loader.status, 200);
  assert.match(await loader.text(), /define|require/);
  assert.equal((await api("/vendor/monaco/vs/editor/editor.main.js")).status, 200);
  for (const esc of ["/vendor/monaco/..%2F..%2Fpackage.json", "/vendor/monaco/%2e%2e/%2e%2e/%2e%2e/package.json"]) {
    const r = await api(esc);
    assert.doesNotMatch(await r.text(), /"multimodel-management"|"monaco-editor"/, esc); // never a real package.json
  }
  await api(`/api/tasks/${task.id}?worktree=1`, { method: "DELETE" });
});

test("version endpoint tells the page whether mm's code changed since start (B-032)", async () => {
  const r = await (await api("/api/version")).json();
  assert.equal(r.stale, false);
  const { codeChangedSinceStart } = await import("../src/server.ts");
  assert.equal(codeChangedSinceStart(), false);
});

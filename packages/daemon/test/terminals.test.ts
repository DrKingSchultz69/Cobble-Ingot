// "+" terminals: plain terminals in a task's folder, separate from tasks. A tiny Node script stands in for
// cmd / PowerShell / agent CLIs so this runs offline and fast.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import type { Server } from "node:http";
import { mkdtempSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { WebSocket } from "ws";

const dataDir = mkdtempSync(join(tmpdir(), "mm-term-data-"));
process.env.MM_DATA_DIR = dataDir; // must be set before config.ts loads
const { openDb } = await import("../src/db.ts");
const { createWorkspaceServer } = await import("../src/server.ts");
const { TaskManager } = await import("../src/tasks.ts");
const { Terminals, terminalLaunch } = await import("../src/terminals.ts");

const TOKEN = "test-token-term";
const script = join(dataDir, "fake-shell.js");
writeFileSync(
  script,
  `process.stdout.write("shell in " + process.cwd() + " as " + process.argv[2] + "\\n");
   process.stdin.setEncoding("utf8");
   process.stdin.on("data", (d) => { if (d.includes("exit")) process.exit(3); else process.stdout.write("ran:" + d.trim() + "\\n"); });`,
);

let repo: string;
let server: Server;
let base: string;
let tasks: InstanceType<typeof TaskManager>;
let terms: InstanceType<typeof Terminals>;

before(async () => {
  repo = mkdtempSync(join(tmpdir(), "mm-term-repo-"));
  writeFileSync(join(repo, "README.md"), "# demo\n");
  const g = (...a: string[]) => execFileSync("git", ["-C", repo, ...a], { stdio: "ignore" });
  g("init", "-q");
  g("add", ".");
  g("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "init");
  const db = openDb(join(dataDir, "test.db"));
  tasks = new TaskManager(db, { launcher: () => ({ cmd: process.execPath, args: [script, "task"], env: {} }), home: dataDir });
  terms = new Terminals((kind) => ({ cmd: process.execPath, args: [script, kind], env: {} }));
  ({ server } = createWorkspaceServer({ db, token: TOKEN, tasks, terminals: terms, previewPort: 0 }));
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await terms.dispose();
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

test("launch commands: cmd and PowerShell on Windows, agent CLIs bare", () => {
  assert.equal(terminalLaunch("cmd", "win32").cmd, "cmd.exe");
  assert.deepEqual(terminalLaunch("powershell", "win32"), { cmd: "powershell.exe", args: ["-NoLogo"], env: {} });
  assert.equal(terminalLaunch("powershell", "linux").cmd, "pwsh");
  for (const k of ["claude", "codex", "opencode"] as const) assert.deepEqual(terminalLaunch(k, "win32"), { cmd: k, args: [], env: {} });
});

test("+ terminal opens in the task's folder, works over the WebSocket, and is not a task", async () => {
  const task = await (await api("/api/tasks", { method: "POST", body: JSON.stringify({ prompt: "x", agent: "claude", repo, isolate: true }) })).json();
  assert.notEqual(task.cwd, repo);

  const res = await api("/api/terminals", { method: "POST", body: JSON.stringify({ kind: "powershell", task: task.id }) });
  const t = await res.json();
  assert.equal(res.status, 200, JSON.stringify(t));
  assert.match(t.id, /^x/);
  assert.equal(t.cwd, task.cwd);
  assert.equal(t.title, "PowerShell");

  const ws = new WebSocket(`${base.replace("http", "ws")}/ws`, { headers: { cookie: `mm_token=${TOKEN}` } });
  let out = "";
  const events: any[] = [];
  ws.on("message", (raw) => {
    const m = JSON.parse(String(raw));
    if (m.id === t.id && (m.t === "data" || m.t === "buffer")) out += m.data;
    else events.push(m);
  });
  await new Promise((r) => ws.on("open", r));
  ws.send(JSON.stringify({ t: "attach", id: t.id }));
  await until(() => out.includes("as powershell"));
  assert.ok(out.replace(/\s+/g, "").includes(task.cwd.replace(/\s+/g, "")), "runs in the task's worktree");
  ws.send(JSON.stringify({ t: "input", id: t.id, data: "dir\r" }));
  await until(() => out.includes("ran:dir"));

  // Not a task: listed under terminals only.
  const st = await (await api("/api/state")).json();
  assert.ok(st.terminals.some((x: any) => x.id === t.id));
  assert.ok(!st.tasks.some((x: any) => x.id === t.id));

  // The program ending keeps the tab (alive: false, exit code); closing it removes it.
  ws.send(JSON.stringify({ t: "input", id: t.id, data: "exit\r" }));
  await until(() => events.some((m) => m.t === "terminal" && m.terminal.id === t.id && !m.terminal.alive));
  assert.equal(terms.list().find((x) => x.id === t.id)?.exit_code, 3);
  assert.equal((await api(`/api/terminals/${t.id}`, { method: "DELETE" })).status, 200);
  await until(() => events.some((m) => m.t === "terminal-closed" && m.id === t.id));
  assert.equal(terms.has(t.id), false);
  ws.close();
});

test("+ terminal without a task: only a known project folder, only known kinds", async () => {
  const ok = await api("/api/terminals", { method: "POST", body: JSON.stringify({ kind: "cmd", folder: repo }) });
  assert.equal(ok.status, 200);
  const t = await ok.json();
  assert.equal(t.cwd, repo);
  assert.equal(t.task, "");
  await terms.close(t.id);

  const elsewhere = await api("/api/terminals", { method: "POST", body: JSON.stringify({ kind: "cmd", folder: tmpdir() }) });
  assert.equal(elsewhere.status, 400);
  const badKind = await api("/api/terminals", { method: "POST", body: JSON.stringify({ kind: "bash; rm", folder: repo }) });
  assert.equal(badKind.status, 400);
  assert.equal((await api("/api/terminals", { method: "POST", body: JSON.stringify({ kind: "cmd", task: "nope" }) })).status, 404);
});

test("Make it a task: the same running program becomes a task and keeps its output", async () => {
  const t = await (await api("/api/terminals", { method: "POST", body: JSON.stringify({ kind: "claude", folder: repo }) })).json();
  terms.write(t.id, "before\r");
  await until(() => (terms.session(t.id)?.buffer() ?? "").includes("ran:before"));
  const pid = terms.session(t.id)!.pid;

  const res = await api(`/api/terminals/${t.id}/task`, { method: "POST", body: JSON.stringify({ title: "my claude" }) });
  const task = await res.json();
  assert.equal(res.status, 200, JSON.stringify(task));
  assert.equal(task.title, "my claude");
  assert.equal(task.agent, "claude");
  assert.equal(task.cwd, repo);
  assert.equal(task.worktree, 0);
  assert.equal(terms.has(t.id), false, "no longer a terminal");
  assert.equal(tasks.session(task.id)?.pid, pid, "same process, nothing restarted");

  // Output from before is kept; input now goes through the task.
  await api(`/api/tasks/${task.id}/input`, { method: "POST", body: JSON.stringify({ data: "after\r" }) });
  await until(async () => (await (await api(`/api/tasks/${task.id}/output`)).json()).text.includes("ran:after"));
  const out = (await (await api(`/api/tasks/${task.id}/output`)).json()).text;
  assert.ok(out.includes("ran:before"));
  const st = await (await api("/api/state")).json();
  assert.ok(st.tasks.some((x: any) => x.id === task.id));
  assert.ok(!st.terminals.some((x: any) => x.id === t.id));

  // Its ending is the task's ending now (not reported as a terminal).
  await api(`/api/tasks/${task.id}/input`, { method: "POST", body: JSON.stringify({ data: "exit\r" }) });
  await until(() => ["done", "failed"].includes(tasks.get(task.id)?.status ?? ""));
  assert.equal(tasks.get(task.id)?.exit_code, 3);
  assert.equal((await api(`/api/terminals/${t.id}/task`, { method: "POST", body: "{}" })).status, 404);
});

// Shared browser step 2: agents drive it through browser_* MCP tools -> Netheron server -> SharedBrowser.
// Real server, real headless Chrome, fake agent process.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";

const dataDir = mkdtempSync(join(tmpdir(), "mm-bra-data-"));
process.env.MM_DATA_DIR = dataDir;
const { openDb } = await import("../src/db.ts");
const { createWorkspaceServer } = await import("../src/server.ts");
const { TaskManager, BROWSER_GUIDE, BROWSER_RESUME } = await import("../src/tasks.ts");
const { SharedBrowser, findChrome } = await import("../src/browser.ts");
const { launchFor } = await import("../src/agents.ts");
const mcp = await import("../../memory/src/mcp.ts");
const { ensureGraphSchema } = await import("../../memory/src/graph.ts");

const TOKEN = "bra-token";
const chrome = findChrome();
const PAGE = `<!doctype html><title>t</title><body style="margin:0;font:16px sans-serif">
<input id="pw" type="password" style="position:absolute;left:20px;top:20px;width:200px;height:30px">
<button style="position:absolute;left:20px;top:80px;width:150px;height:40px" onclick="location='/next'">Next</button>
<button style="position:absolute;left:200px;top:80px;width:150px;height:40px" onclick="location='/ordered'">Place order</button></body>`;

let site: Server, server: Server, base = "", siteBase = "", repo = "";
let tasks: InstanceType<typeof TaskManager>;
let br: InstanceType<typeof SharedBrowser>;
const launches: Array<{ agent: string; o: any }> = [];
const events: any[] = [];

before(async () => {
  site = createServer((req, res) => res.writeHead(200, { "content-type": "text/html" }).end(req.url === "/" ? PAGE : `<title>x</title><p>${req.url}</p>`));
  await new Promise<void>((r) => site.listen(0, "127.0.0.1", () => r()));
  siteBase = `http://127.0.0.1:${(site.address() as AddressInfo).port}`;
  repo = mkdtempSync(join(tmpdir(), "mm-bra-repo-"));
  const g = (...a: string[]) => execFileSync("git", ["-C", repo, ...a], { stdio: "ignore" });
  g("init", "-q"); writeFileSync(join(repo, "a.txt"), "x\n"); g("add", "."); g("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "i");
  const agentJs = join(dataDir, "agent.js");
  writeFileSync(agentJs, `process.stdout.write("ready\\n"); process.stdin.setEncoding("utf8"); process.stdin.on("data", (d) => d.trim() && process.stdout.write("got:" + d.trim() + "\\n"));`);
  const db = openDb(join(dataDir, "mm.db"));
  tasks = new TaskManager(db, {
    launcher: (agent, o) => { launches.push({ agent, o }); return { cmd: process.execPath, args: [agentJs], env: {} }; },
    home: dataDir, idleMs: 500, tickMs: 150, availability: { claude: true, codex: true, opencode: false, openrouter: false, pi: true },
  });
  for (const ev of ["notify", "alert"]) tasks.on(ev, (x) => events.push({ ev, ...x }));
  br = new SharedBrowser({ profileDir: mkdtempSync(join(tmpdir(), "mm-bra-profile-")), headless: true, imageFormat: "jpeg" });
  ({ server } = createWorkspaceServer({ db, token: TOKEN, tasks, previewPort: 0, browser: br }));
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(async () => {
  await tasks?.dispose();
  await br?.dispose();
  server?.closeAllConnections(); server?.close();
  site?.closeAllConnections(); site?.close();
});

const api = (path: string, body?: unknown) => fetch(base + path, {
  method: body === undefined ? "GET" : "POST", headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body),
});
const until = async (fn: () => unknown, ms = 10_000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await fn()) return; await new Promise((r) => setTimeout(r, 100)); }
  throw new Error("timed out waiting");
};

test("launch: browser tools + MM_BROWSER/MM_API only for opted-in tasks; Claude pre-approves them", () => {
  const withB = launchFor("claude", [], { taskId: "tb1", project: dataDir, cwd: dataDir, browser: true });
  const allow: string[] = JSON.parse(readFileSync(withB.args[withB.args.indexOf("--settings") + 1], "utf8")).permissions.allow;
  assert.ok(allow.includes("mcp__mm__browser_click") && allow.includes("mcp__mm__browser_ask_user"));
  const env = JSON.parse(readFileSync(withB.args[withB.args.indexOf("--mcp-config") + 1], "utf8")).mcpServers.mm.env;
  assert.equal(env.MM_BROWSER, "1");
  assert.match(env.MM_API, /^http:\/\/127\.0\.0\.1:\d+$/);
  const without = launchFor("claude", [], { taskId: "tb2", project: dataDir, cwd: dataDir });
  const allow2: string[] = JSON.parse(readFileSync(without.args[without.args.indexOf("--settings") + 1], "utf8")).permissions.allow;
  assert.ok(!allow2.some((a) => a.includes("browser_")));
  assert.equal(JSON.parse(readFileSync(without.args[without.args.indexOf("--mcp-config") + 1], "utf8")).mcpServers.mm.env.MM_BROWSER, undefined);
  // the MCP server lists the browser tools only when it was given Netheron's address
  const db = openDb(join(dataDir, "tl.db")); ensureGraphSchema(db);
  const names = (e: object) => (mcp.handle(db, { project: "p", dir: dataDir, ...e }, { id: 1, method: "tools/list" }) as { tools: Array<{ name: string }> }).tools.map((t) => t.name);
  assert.ok(!names({}).some((n) => n.startsWith("browser_")));
  assert.equal(names({ browser: { api: "http://x", token: "t" } }).filter((n) => n.startsWith("browser_")).length, 10);
});

test("opt-in: browser task gets the guide + flag; Pi/Shell refused; tasks without it get 403", async () => {
  const r = await api("/api/tasks", { prompt: "look something up", agent: "claude", repo, isolate: true, browser: true });
  const t = await r.json();
  assert.equal(r.status, 200, JSON.stringify(t));
  assert.equal(t.browser, 1);
  const l = launches.find((x) => x.o.taskId === t.id)!;
  assert.equal(l.o.browser, true);
  assert.ok(l.o.prompt.includes(BROWSER_GUIDE));
  for (const agent of ["pi", "shell"]) {
    const bad = await api("/api/tasks", { prompt: "x", agent, repo, browser: true });
    assert.equal(bad.status, 400, agent);
    assert.match((await bad.json()).error, /can't use the browser/);
  }
  const plain = await (await api("/api/tasks", { prompt: "no browser", agent: "claude", repo, isolate: true })).json();
  assert.equal(plain.browser, 0);
  assert.ok(!launches.find((x) => x.o.taskId === plain.id)!.o.prompt.includes("browser_"));
  const denied = await api(`/api/tasks/${plain.id}/browser`, { action: "screenshot" });
  assert.equal(denied.status, 403);
});

test("MCP browser tools end to end: JPEG screenshots, blocks come back as tool errors", { skip: !chrome && "no Chrome/Edge" }, async () => {
  const t = await (await api("/api/tasks", { prompt: "browse", agent: "codex", repo, isolate: true, browser: true })).json();
  const db = openDb(join(dataDir, "m1.db")); ensureGraphSchema(db);
  const env = { project: "p", dir: repo, taskId: t.id, browser: { api: base, token: TOKEN } };
  const call = (name: string, args: object = {}) => mcp.handle(db, env, { id: 1, method: "tools/call", params: { name, arguments: args } }) as Promise<{ content: any[]; isError?: boolean }>;
  let r = await call("browser_navigate", { url: siteBase + "/" });
  assert.ok(!r.isError, JSON.stringify(r).slice(0, 300));
  assert.equal(r.content[0].type, "image");
  assert.equal(r.content[0].mimeType, "image/jpeg");
  assert.equal(Buffer.from(r.content[0].data, "base64").subarray(0, 2).toString("hex"), "ffd8", "JPEG bytes");
  assert.match(r.content[1].text, new RegExp(`Page: ${siteBase}/ \\(\\d+×\\d+\\)`));
  r = await call("browser_click", { x: 270, y: 100 }); // Place order
  assert.equal(r.isError, true);
  assert.match(r.content[0].text, /Blocked: "Place order"/);
  await call("browser_click", { x: 100, y: 35 });
  r = await call("browser_type_text", { text: "hunter2" });
  assert.equal(r.isError, true);
  assert.match(r.content[0].text, /password/);
  r = await call("browser_click", { x: 90, y: 100 }); // Next
  assert.match(r.content[1].text, /\/next/);
  r = await call("browser_screenshot");
  assert.equal(r.content[0].type, "image");
  // Netheron down -> clear tool error, no crash
  const down = await (mcp.handle(db, { ...env, browser: { api: "http://127.0.0.1:1", token: "x" } }, { id: 1, method: "tools/call", params: { name: "browser_screenshot", arguments: {} } }) as Promise<{ content: any[]; isError?: boolean }>);
  assert.equal(down.isError, true);
  assert.match(down.content[0].text, /Can't reach Netheron/);
});

test("ask_user → Needs you + notification, every agent action (even screenshots) blocked; Resume → \"Done, continue\" typed in; Take over; finish; remove closes the window", { skip: !chrome && "no Chrome/Edge" }, async () => {
  const t = await (await api("/api/tasks", { prompt: "log in somewhere", agent: "claude", repo, isolate: true, browser: true })).json();
  const db = openDb(join(dataDir, "m2.db")); ensureGraphSchema(db);
  const env = { project: "p", dir: repo, taskId: t.id, browser: { api: base, token: TOKEN } };
  const call = (name: string, args: object = {}) => mcp.handle(db, env, { id: 1, method: "tools/call", params: { name, arguments: args } }) as Promise<{ content: any[]; isError?: boolean }>;
  await call("browser_navigate", { url: siteBase + "/" });
  await until(async () => tasks.get(t.id)!.status === "idle");

  const asked = await call("browser_ask_user", { reason: "a login page appeared" });
  assert.ok(!asked.isError);
  assert.match(asked.content[0].text, /Stop here and wait/);
  assert.equal(tasks.get(t.id)!.browser_wait, "a login page appeared");
  assert.ok(events.some((e) => e.ev === "notify" && e.taskId === t.id && /Needs you in the browser: a login page appeared/.test(e.body)), "🔔 / push");
  assert.ok(events.some((e) => e.ev === "alert" && e.kind === "browser" && e.task === t.id));
  for (const [name, args] of [["browser_click", { x: 90, y: 100 }], ["browser_screenshot", {}], ["browser_wait", { seconds: 0 }]] as const) {
    const r = await call(name, args);
    assert.equal(r.isError, true, name);
    assert.match(r.content[0].text, /user has control/, name);
  }
  const st = await (await api(`/api/tasks/${t.id}/browser`)).json();
  assert.deepEqual([st.control, st.window], ["user", true]);

  // Resume: control back + "Done, continue" delivered to the waiting agent
  const res = await (await api(`/api/tasks/${t.id}/browser/resume`, {})).json();
  assert.equal(res.url, siteBase + "/");
  assert.equal(tasks.get(t.id)!.browser_wait, "");
  await until(() => (tasks.session(t.id)?.buffer() ?? "").includes(`got:${BROWSER_RESUME.slice(0, 30)}`));
  assert.ok(!(await call("browser_screenshot")).isError);

  // Take over at any time: blocked again, no notification needed (you did it)
  const before = events.length;
  assert.equal((await api(`/api/tasks/${t.id}/browser/takeover`, {})).status, 200);
  assert.equal(tasks.get(t.id)!.browser_wait, "You took over");
  assert.match((await call("browser_click", { x: 90, y: 100 })).content[0].text, /user has control/);
  assert.ok(!events.slice(before).some((e) => e.ev === "notify"));
  await api(`/api/tasks/${t.id}/browser/resume`, {});

  // finish keeps the window; removing the task closes it
  const fin = await call("browser_finish", { summary: "found the pricing page" });
  assert.match(fin.content[0].text, /window stays open/);
  assert.ok(tasks.alerts({ task: t.id }).some((a) => a.kind === "browser" && /found the pricing page/.test(a.message)));
  assert.equal(br.has(t.id), true);
  await fetch(`${base}/api/tasks/${t.id}?worktree=1`, { method: "DELETE", headers: { authorization: `Bearer ${TOKEN}` } });
  await until(() => !br.has(t.id));
});

test("hand-off keeps the browser and never goes to an agent without MCP", { skip: !chrome && "no Chrome/Edge" }, async () => {
  const t = await (await api("/api/tasks", { prompt: "browse the docs", agent: "claude", repo, isolate: true, browser: true })).json();
  const child = await (await api(`/api/tasks/${t.id}/handoff`, { reason: "test" })).json();
  assert.equal(child.agent, "codex", "not pi, even though pi is available");
  assert.equal(child.browser, 1);
  assert.ok(launches.find((x) => x.o.taskId === child.id)!.o.browser);
});

test("Browser tab over WebSocket: live frames for 🌐 tasks only; your clicks refused until Take over, then they drive Chrome", { skip: !chrome && "no Chrome/Edge" }, async () => {
  const { WebSocket } = await import("ws");
  const t = await (await api("/api/tasks", { prompt: "watch me", agent: "claude", repo, isolate: true, browser: true })).json();
  const plain = await (await api("/api/tasks", { prompt: "no browser here", agent: "claude", repo, isolate: true })).json();
  const ws = new WebSocket(`${base.replace("http", "ws")}/ws`, { headers: { cookie: `mm_token=${TOKEN}` } });
  const got: any[] = [];
  ws.on("message", (raw) => { const m = JSON.parse(String(raw)); if (m.t === "browser-frame" || m.t === "browser-error") got.push(m); });
  await new Promise((r) => ws.once("open", r));
  ws.send(JSON.stringify({ t: "watch-browser", id: plain.id }));
  ws.send(JSON.stringify({ t: "watch-browser", id: t.id })); // the Browser tab is open before the agent browses
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(br.has(t.id), false, "watching doesn't open a window");
  const db = openDb(join(dataDir, "m3.db")); ensureGraphSchema(db);
  await mcp.handle(db, { project: "p", dir: repo, taskId: t.id, browser: { api: base, token: TOKEN } }, { id: 1, method: "tools/call", params: { name: "browser_navigate", arguments: { url: siteBase + "/" } } });
  await until(() => got.some((m) => m.t === "browser-frame" && m.id === t.id && m.url === siteBase + "/"));
  assert.ok(!got.some((m) => m.id === plain.id), "nothing for a task without the browser");
  const f = got.find((m) => m.t === "browser-frame");
  assert.ok(f.width > 300 && f.data.length > 100);

  // agent drives: your click is refused (and nothing happens)
  ws.send(JSON.stringify({ t: "browser-input", id: t.id, input: { kind: "click", x: 90, y: 100 } }));
  await until(() => got.some((m) => m.t === "browser-error" && /Take over first/.test(m.error)));
  // Take over: your click on "Next" goes through
  await api(`/api/tasks/${t.id}/browser/takeover`, {});
  ws.send(JSON.stringify({ t: "browser-input", id: t.id, input: { kind: "click", x: 90, y: 100 } }));
  await until(() => got.some((m) => m.t === "browser-frame" && m.url === siteBase + "/next"));
  // closing the Browser tab stops the frames
  ws.send(JSON.stringify({ t: "unwatch-browser" }));
  await new Promise((r) => setTimeout(r, 300));
  const n = got.length;
  ws.send(JSON.stringify({ t: "browser-input", id: t.id, input: { kind: "scroll", dy: 200 } }));
  await new Promise((r) => setTimeout(r, 600));
  assert.equal(got.filter((m) => m.t === "browser-frame").length, got.slice(0, n).filter((m) => m.t === "browser-frame").length);
  ws.close();
});

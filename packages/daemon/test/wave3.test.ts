// Wave 3 (docs/research/solutions): hash-anchored edits (P02 S1) and the rest of the Oh My Pi-inspired features.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const dataDir = mkdtempSync(join(tmpdir(), "mm-w3-data-"));
process.env.MM_DATA_DIR = dataDir;
const { hashLine, readLines, editLines } = await import("../../memory/src/hashline.ts");
const mcp = await import("../../memory/src/mcp.ts");
const { openDb } = await import("../src/db.ts");
const { ensureGraphSchema } = await import("../../memory/src/graph.ts");

test("hash-anchored edits: read with anchors, edit by anchors, stale anchors refused, EOL kept, no escape (P02 S1)", () => {
  const dir = mkdtempSync(join(tmpdir(), "mm-w3-hl-"));
  writeFileSync(join(dir, "a.ts"), "const a = 1;\r\nconst b = 2;\r\nconst c = 3;\r\n");
  const out = readLines(dir, "a.ts");
  assert.match(out, /a\.ts lines 1-3 of 3/);
  const h2 = hashLine("const b = 2;");
  assert.ok(out.includes(`2:${h2}|const b = 2;`));
  // replace line 2
  const r = editLines(dir, "a.ts", { start: `2:${h2}`, text: "const b = 20;\nconst bb = 21;" });
  assert.match(r, /Edited a\.ts/);
  assert.equal(readFileSync(join(dir, "a.ts"), "utf8"), "const a = 1;\r\nconst b = 20;\r\nconst bb = 21;\r\nconst c = 3;\r\n", "CRLF kept");
  // the old anchor is now stale -> refused, file untouched
  assert.throws(() => editLines(dir, "a.ts", { start: `2:${h2}`, text: "x" }), /stale start: line 2 changed/);
  // range replace with both anchors, then delete, then insert at top
  const h3 = hashLine("const bb = 21;");
  const h4 = hashLine("const c = 3;");
  editLines(dir, "a.ts", { start: `3:${h3}`, end: `4:${h4}`, text: "" });
  assert.equal(readFileSync(join(dir, "a.ts"), "utf8"), "const a = 1;\r\nconst b = 20;\r\n");
  editLines(dir, "a.ts", { after: "0:0000", text: "// header" });
  assert.equal(readFileSync(join(dir, "a.ts"), "utf8").split("\r\n")[0], "// header");
  assert.throws(() => editLines(dir, "a.ts", { start: "99:abcd", text: "x" }), /doesn't exist/);
  assert.throws(() => editLines(dir, "a.ts", { start: "2", text: "x" }), /must look like/);
  assert.throws(() => readLines(dir, "../outside.ts"), /outside the task folder/);
  assert.throws(() => readLines(dir, join(dir, "a.ts")), /relative/);
});

test("MCP: mm_read_lines / mm_edit_lines work in the agent's folder, errors come back as tool errors", () => {
  const dir = mkdtempSync(join(tmpdir(), "mm-w3-mcp-"));
  writeFileSync(join(dir, "x.py"), "def f():\n    return 1\n");
  const db = openDb(join(dataDir, "mcp.db"));
  ensureGraphSchema(db);
  const env = { project: "p", dir: "/somewhere/else", workdir: dir };
  const call = (name: string, args: Record<string, unknown>) => mcp.handle(db, env, { id: 1, method: "tools/call", params: { name, arguments: args } }) as { content: Array<{ text: string }>; isError?: boolean };
  const listed = (mcp.handle(db, env, { id: 1, method: "tools/list" }) as { tools: Array<{ name: string }> }).tools.map((t) => t.name);
  assert.ok(listed.includes("mm_read_lines") && listed.includes("mm_edit_lines"));
  const read = call("mm_read_lines", { path: "x.py" }).content[0].text;
  const anchor = read.split("\n").find((l) => l.includes("return 1"))!.split("|")[0];
  const ok = call("mm_edit_lines", { path: "x.py", start: anchor, text: "    return 2" });
  assert.ok(!ok.isError);
  assert.equal(readFileSync(join(dir, "x.py"), "utf8"), "def f():\n    return 2\n");
  const stale = call("mm_edit_lines", { path: "x.py", start: anchor, text: "    return 3" });
  assert.equal(stale.isError, true);
  assert.match(stale.content[0].text, /stale/);
});

test("Claude auto-approves only the read/memory tools, not mm_edit_lines", async () => {
  const { launchFor } = await import("../src/agents.ts");
  const l = launchFor("claude", [], { taskId: "tX", project: dataDir, cwd: dataDir });
  const settingsPath = l.args[l.args.indexOf("--settings") + 1];
  const allow: string[] = JSON.parse(readFileSync(settingsPath, "utf8")).permissions.allow;
  assert.ok(allow.includes("mcp__mm__mm_read_lines"));
  assert.ok(!allow.includes("mcp__mm__mm_edit_lines") && !allow.includes("mcp__mm"));
  const mcpPath = l.args[l.args.indexOf("--mcp-config") + 1];
  assert.ok(JSON.parse(readFileSync(mcpPath, "utf8")).mcpServers.mm.env.MM_WORKDIR, "server knows the agent's folder");
});

test("LSP-lite diagnostics: parse tsc / pyflakes / rust / generic output; MCP mm_diagnostics answers asynchronously (P32)", async () => {
  const { parseDiagnostics, runDiagnostics, detectDiagnostics } = await import("../src/diagnostics.ts");
  const dir = mkdtempSync(join(tmpdir(), "mm-w3-diag-"));
  const out = [
    "src/app.ts(12,5): error TS2322: Type 'string' is not assignable to type 'number'.",
    "app.py:3:1: 'os' imported but unused",
    "src/lib.rs:4:9: warning: unused variable: `x`",
    "src/util.c:20:3: note: declared here",
    "    at Object.<anonymous> (/x/y.js:1:1)",
    "Found 1 error.",
  ].join("\n");
  const d = parseDiagnostics(out, dir);
  assert.deepEqual(d.map((x) => `${x.file}:${x.line}:${x.col}:${x.severity}`), ["src/app.ts:12:5:error", "app.py:3:1:error", "src/lib.rs:4:9:warning", "src/util.c:20:3:warning"]);
  assert.match(d[0].message, /not assignable/);
  writeFileSync(join(dir, "tsconfig.json"), "{}");
  assert.match(detectDiagnostics(dir), /tsc --noEmit/);
  const r = await runDiagnostics(dir, `node -e "console.log('src/a.ts(1,2): error TS1: boom'); process.exit(2)"`);
  assert.equal(r.ok, false);
  assert.equal(r.items[0].file, "src/a.ts");
  const db = openDb(join(dataDir, "diag.db"));
  ensureGraphSchema(db);
  const res = mcp.handle(db, { project: "p", dir, workdir: dir }, { id: 1, method: "tools/call", params: { name: "mm_diagnostics", arguments: { command: `node -e "console.log('x.ts:3:4: error: bad')"` } } });
  assert.ok(res instanceof Promise, "answered when the check finishes");
  const text = ((await res) as { content: Array<{ text: string }> }).content[0].text;
  assert.match(text, /1 problem\(s\)[\s\S]*x\.ts:3:4 error: bad/);
});

test("Pi / Oh My Pi adapters: launch line, shared memory + rules in the prompt (no MCP), routed only when installed (P28)", async () => {
  const { launchFor } = await import("../src/agents.ts");
  const { decide } = await import("../../router/src/router.ts");
  const { TaskManager } = await import("../src/tasks.ts");
  const { record } = await import("../../memory/src/context.ts");
  const { projectKey } = await import("../../memory/src/indexer.ts");
  const { execFileSync } = await import("node:child_process");
  const l = launchFor("pi", [], { model: "sonnet", prompt: "fix it" });
  assert.deepEqual([l.cmd, ...l.args], ["pi", "--model", "sonnet", "fix it"]);
  assert.equal(launchFor("omp", [], { prompt: "x" }).cmd, "omp");
  // routing: only when installed
  const without = { claude: false, codex: false, opencode: false, openrouter: false };
  assert.throws(() => decide("fix the bug", { availability: without }), /No agents available/);
  assert.equal(decide("refactor the parser", { availability: { ...without, omp: true } }).candidate.agent, "omp");
  // shared memory goes into the prompt for agents without MCP
  const dir = mkdtempSync(join(tmpdir(), "mm-w3-pi-"));
  const g = (...a: string[]) => execFileSync("git", ["-C", dir, ...a], { stdio: "ignore" });
  g("init", "-q"); writeFileSync(join(dir, "a.ts"), "x\n"); g("add", "."); g("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "i");
  const db = openDb(join(dataDir, "pi.db"));
  const prompts: Record<string, string> = {};
  const agentJs = join(dataDir, "idle.js");
  writeFileSync(agentJs, "setInterval(() => {}, 1000);");
  const tm = new TaskManager(db, { launcher: (agent, o) => { prompts[agent] = o?.prompt ?? ""; return { cmd: process.execPath, args: [agentJs], env: {} }; }, home: dataDir, idleMs: 60_000, tickMs: 500 });
  try {
    record(db, { kind: "decision", title: "Dates are stored in UTC", project: projectKey(dir) });
    record(db, { kind: "rule", title: "Tabs, not spaces", project: projectKey(dir) });
    await tm.create({ prompt: "Add a date column", agent: "pi", repo: dir, isolate: true });
    assert.match(prompts.pi, /^Project rules[\s\S]*Tabs, not spaces/);
    assert.match(prompts.pi, /Shared project memory from Netheron[\s\S]*Dates are stored in UTC/);
    assert.ok(!prompts.pi.includes("mm_* tools"), "no MCP hint for Pi");
    await tm.create({ prompt: "Add a date column", agent: "claude", repo: dir, isolate: true });
    assert.ok(prompts.claude.includes("mm_* tools") && !prompts.claude.includes("Shared project memory from Netheron"));
  } finally {
    await tm.dispose();
  }
});

test("web push: VAPID JWT verifies with the public key; push wakes every device, drops dead ones, keeps the last message (P24 S2)", async () => {
  const push = await import("../src/push.ts");
  const { createPublicKey, verify } = await import("node:crypto");
  const v = push.vapidKeys(join(dataDir, "vapid.json"));
  assert.deepEqual(push.vapidKeys(join(dataDir, "vapid.json")), v, "created once, then reused");
  const jwt = push.vapidJwt(v, "https://fcm.googleapis.com/fcm/send/abc");
  const [h, p, s] = jwt.split(".");
  const claims = JSON.parse(Buffer.from(p, "base64url").toString());
  assert.equal(claims.aud, "https://fcm.googleapis.com");
  assert.ok(claims.exp > Date.now() / 1000 && claims.exp <= Date.now() / 1000 + 24 * 3600);
  const raw = Buffer.from(v.publicKey, "base64url");
  assert.equal(raw.length, 65);
  const pub = createPublicKey({ key: { kty: "EC", crv: "P-256", x: raw.subarray(1, 33).toString("base64url"), y: raw.subarray(33).toString("base64url") }, format: "jwk" });
  assert.ok(verify("sha256", Buffer.from(`${h}.${p}`), { key: pub, dsaEncoding: "ieee-p1363" }, Buffer.from(s, "base64url")));

  const db = openDb(join(dataDir, "push.db"));
  push.ensurePushSchema(db);
  assert.throws(() => push.subscribe(db, "http://evil.example/x"), /https/);
  push.subscribe(db, "https://push.example/alive");
  push.subscribe(db, "https://push.example/dead");
  push.subscribe(db, "https://push.example/alive"); // twice = once
  const calls: Array<{ url: string; auth: string }> = [];
  const fake = (async (url: string, init: { headers: Record<string, string> }) => {
    calls.push({ url, auth: init.headers.Authorization });
    return new Response(null, { status: url.endsWith("dead") ? 410 : 201 });
  }) as unknown as typeof fetch;
  const r = await push.pushAll(db, { title: "claude: fix", body: "done", task: "t1" }, v, fake);
  assert.deepEqual(r, { sent: 1, removed: 1 });
  assert.equal(calls.length, 2);
  assert.match(calls[0].auth, new RegExp(`^vapid t=[\\w-]+\\.[\\w-]+\\.[\\w-]+, k=${v.publicKey}$`));
  assert.equal(push.lastNotification(db)!.task, "t1");
  const again = await push.pushAll(db, { title: "x", body: "y" }, v, fake);
  assert.deepEqual(again, { sent: 1, removed: 0 }, "dead endpoint was removed");
});

test("remote workers: this Netheron lists and starts tasks on another Netheron with its token; bad token / offline / no folder handled (P25 S2)", async () => {
  const { createWorkspaceServer } = await import("../src/server.ts");
  const { TaskManager } = await import("../src/tasks.ts");
  const w = await import("../src/workers.ts");
  const { execFileSync } = await import("node:child_process");
  // the "remote" machine: a second Netheron with its own data, token and repo
  const remoteRepo = mkdtempSync(join(tmpdir(), "mm-w3-remote-"));
  const g = (...a: string[]) => execFileSync("git", ["-C", remoteRepo, ...a], { stdio: "ignore" });
  g("init", "-q"); writeFileSync(join(remoteRepo, "a.txt"), "x\n"); g("add", "."); g("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "i");
  const rdb = openDb(join(dataDir, "remote.db"));
  const idle = join(dataDir, "remote-idle.js");
  writeFileSync(idle, "setInterval(() => {}, 1000);");
  const rtasks = new TaskManager(rdb, { launcher: () => ({ cmd: process.execPath, args: [idle], env: {} }), home: dataDir, idleMs: 60_000 });
  const { server } = createWorkspaceServer({ db: rdb, token: "remote-tok", tasks: rtasks, previewPort: 0 });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  const port = (server.address() as import("node:net").AddressInfo).port;
  const db = openDb(join(dataDir, "local-workers.db"));
  w.ensureWorkerSchema(db);
  try {
    assert.throws(() => w.parseLink("http://host:4142/"), /no \?token/);
    assert.throws(() => w.parseLink("not a link"), /full link/);
    await assert.rejects(w.addWorker(db, { link: `http://127.0.0.1:${port}/?token=wrong` }), /refused the token/);
    await assert.rejects(w.addWorker(db, { link: `http://127.0.0.1:1/?token=x` }), /can't reach/);
    const wk = await w.addWorker(db, { name: "box", link: `http://127.0.0.1:${port}/?token=remote-tok` });
    assert.equal(wk.folder, "", "remote has no projects yet");
    assert.ok(!("token" in w.listWorkers(db)[0]), "token never sent to the UI list");
    await assert.rejects(w.workerCreate(db, wk.id, { prompt: "hi", agent: "shell" }), /set a folder/);
    w.setWorkerFolder(db, wk.id, remoteRepo);
    const t = await w.workerCreate(db, wk.id, { prompt: "build it", agent: "shell", repo: "C:/local/only", profile: "p1", isolate: true });
    assert.ok(String(t.cwd).includes(".mm-worktrees") || String(t.repo).length, "created on the remote");
    const r = await w.workerTasks(db, wk.id);
    assert.equal(r.online, true);
    assert.equal(r.tasks.length, 1);
    assert.equal(rtasks.list()[0].id, t.id, "the remote Netheron owns the task");
    assert.match(w.workerOpenUrl(db, wk.id, String(t.id)), new RegExp(`^http://127\\.0\\.0\\.1:${port}/\\?token=remote-tok#task=`));
  } finally {
    await rtasks.dispose();
    await new Promise((r) => server.close(r));
  }
  const off = await w.workerTasks(db, w.listWorkers(db)[0].id);
  assert.equal(off.online, false);
  assert.match(off.error, /can't reach box/);
});

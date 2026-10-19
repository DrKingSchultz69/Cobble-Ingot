// Forecast, first slice: test copy env, echo agent, sandbox guard, and a full explore -> step file -> replay
// round trip through the real server and a real headless Chrome (fake test copy, fake tester agent).
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";

const dataDir = mkdtempSync(join(tmpdir(), "mm-fc-data-"));
process.env.MM_DATA_DIR = dataDir;
const { openDb } = await import("../src/db.ts");
const { createWorkspaceServer } = await import("../src/server.ts");
const { TaskManager } = await import("../src/tasks.ts");
const { SharedBrowser, findChrome } = await import("../src/browser.ts");
const { launchFor } = await import("../src/agents.ts");
const { copyEnv, makeSample, analyse, pageIssues } = await import("../src/forecast.ts");

const TOKEN = "fc-token";
const chrome = findChrome();
// The "app under test". Its Save button moves between runs: replay must find it by its text.
let left = 20;
const page = () => `<!doctype html><title>app</title><body style="margin:0;font:16px sans-serif">
<input id="who" placeholder="Your name" style="position:absolute;left:${left}px;top:100px;width:200px;height:30px">
<button style="position:absolute;left:${left}px;top:40px;width:120px;height:40px" onclick="document.getElementById('out').textContent='Saved ' + document.getElementById('who').value">Save</button>
<button style="position:absolute;left:${left + 200}px;top:40px;width:120px;height:40px" onclick="nope()">Broken</button>
<p id="out" style="position:absolute;top:160px;left:20px"></p></body>`;

let app: Server, server: Server, base = "", appOrigin = "", repo = "";
let tasks: InstanceType<typeof TaskManager>;
let br: InstanceType<typeof SharedBrowser>;
let copies = 0, stopped = 0;

const git = (dir: string, ...a: string[]) => execFileSync("git", ["-C", dir, "-c", "user.email=t@t", "-c", "user.name=t", ...a], { stdio: "ignore" });

before(async () => {
  app = createServer((req, res) => res.writeHead(200, { "content-type": "text/html" }).end(page()));
  await new Promise<void>((r) => app.listen(0, "127.0.0.1", () => r()));
  appOrigin = `http://127.0.0.1:${(app.address() as AddressInfo).port}`;
  repo = mkdtempSync(join(tmpdir(), "mm-fc-repo-"));
  git(repo, "init", "-q"); writeFileSync(join(repo, "a.txt"), "x\n"); git(repo, "add", "."); git(repo, "commit", "-qm", "i");
  const agentJs = join(dataDir, "agent.js");
  writeFileSync(agentJs, `process.stdout.write("ready\\n"); process.stdin.on("data", () => {});`);
  const db = openDb(join(dataDir, "mm.db"));
  tasks = new TaskManager(db, {
    launcher: () => ({ cmd: process.execPath, args: [agentJs], env: {} }),
    home: dataDir, idleMs: 500, tickMs: 150, availability: { claude: true, codex: true, opencode: false, openrouter: false, pi: false },
  });
  br = new SharedBrowser({ profileDir: mkdtempSync(join(tmpdir(), "mm-fc-profile-")), headless: true, imageFormat: "jpeg" });
  ({ server } = createWorkspaceServer({
    db, token: TOKEN, tasks, previewPort: 0, browser: br, forecastRoot: repo,
    forecastCopy: async () => { copies++; return { origin: appOrigin, token: "copytok", sample: repo, stop: async () => { stopped++; } }; },
  }));
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(async () => {
  await tasks?.dispose();
  await br?.dispose();
  server?.closeAllConnections(); server?.close();
  app?.closeAllConnections(); app?.close();
});

const api = async (path: string, body?: unknown) => {
  const r = await fetch(base + path, {
    method: body === undefined ? "GET" : "POST", headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: r.status, j: (await r.json()) as any };
};
const until = async (fn: () => unknown, ms = 20_000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await fn()) return; await new Promise((r) => setTimeout(r, 150)); }
  throw new Error("timed out waiting");
};

test("test copy env: own ports, data and home; no secrets; echo agents; sandboxed projects", () => {
  const env = copyEnv("/x/copy", 5141, { PATH: "/bin", ANTHROPIC_API_KEY: "k", GH_TOKEN: "t", MM_DATA_DIR: "/real", MY_PASSWORD: "p" });
  assert.equal(env.PATH, "/bin");
  for (const k of ["ANTHROPIC_API_KEY", "GH_TOKEN", "MY_PASSWORD"]) assert.equal(env[k], undefined);
  assert.equal(env.MM_PORT, "5141"); assert.equal(env.MM_UI_PORT, "5142"); assert.equal(env.MM_PREVIEW_PORT, "5143");
  assert.equal(env.MM_FAKE_AGENTS, "echo");
  assert.match(env.MM_DATA_DIR, /copy[\\/]data$/);
  assert.match(env.USERPROFILE, /copy[\\/]home$/);
  assert.equal(env.HOME, env.USERPROFILE);
  assert.match(env.MM_FORECAST_SANDBOX, /copy[\\/]projects$/);
});

test("echo agent: every agent becomes the echo agent, which repeats the prompt", () => {
  process.env.MM_FAKE_AGENTS = "echo";
  try {
    for (const a of ["claude", "codex", "shell"]) {
      const l = launchFor(a, [], { prompt: "hello there" });
      assert.equal(l.cmd.replace(/\\/g, "/"), process.execPath.replace(/\\/g, "/"));
      assert.match(l.args[0], /echo-agent\.ts$/);
    }
    assert.throws(() => launchFor("nope", []), /unknown agent/);
    const l = launchFor("claude", [], { prompt: "hello there" });
    const out = spawnSync(l.cmd, l.args, { input: "second line\n", encoding: "utf8" }).stdout;
    assert.match(out, /echo: hello there/);
    assert.match(out, /echo: second line/);
  } finally { delete process.env.MM_FAKE_AGENTS; }
});

test("sandbox: in the test copy, tasks refuse projects outside its own folder", async () => {
  const sandbox = mkdtempSync(join(tmpdir(), "mm-fc-sb-"));
  const sample = makeSample(sandbox);
  assert.ok(existsSync(join(sample, ".git")));
  process.env.MM_FORECAST_SANDBOX = join(sandbox, "projects");
  try {
    await assert.rejects(tasks.create({ prompt: "x", agent: "claude", repo }), /only projects inside/);
  } finally { delete process.env.MM_FORECAST_SANDBOX; }
});

test("analytics: features, checks, slowest steps, grouped page errors", () => {
  const run: any = {
    created: 0, ended: 5000, issues: [{ severity: "high", feature: "A" }],
    results: [
      { i: 0, step: { do: "feature", name: "A" }, feature: "A", ok: true, ms: 0, problems: [] },
      { i: 1, step: { do: "click", target: { tag: "button", text: "Go", nth: 0 } }, feature: "A", ok: true, ms: 300, problems: [{ kind: "js", message: "boom", url: "/", ts: 1 }] },
      { i: 2, step: { do: "expect", text: "Done" }, feature: "A", ok: false, ms: 5, problems: [{ kind: "js", message: "boom", url: "/", ts: 2 }] },
    ],
  };
  const a = analyse(run);
  assert.equal(a.steps, 2); assert.equal(a.failed, 1);
  assert.deepEqual(a.checks, { passed: 0, failed: 1 });
  assert.equal(a.issues.high, 1); assert.equal(a.problems, 2);
  assert.deepEqual(a.features, [{ name: "A", steps: 2, failed: 1, ms: 305, issues: 1 }]);
  assert.equal(a.slowest[0].label, 'click "Go"');
  const p = pageIssues(run.results, 2);
  assert.equal(p.length, 1);
  assert.match(p[0].actual, /2 times/);
});

test("explore -> step file -> replay finds the moved button by its text", { skip: !chrome && "no Chrome or Edge" }, async () => {
  const ex = await api("/api/forecast/explore", { agent: "claude" });
  assert.equal(ex.status, 200, JSON.stringify(ex.j));
  assert.equal(ex.j.status, "running", ex.j.error);
  const id = ex.j.id, task = ex.j.taskId;
  const t = tasks.get(task)!;
  assert.equal(t.browser, 1);
  assert.match(t.prompt, /forecast_feature/);

  // What the tester agent's tools do: feature, click (by position), type, check, report, finish.
  const act = (body: unknown) => api(`/api/tasks/${task}/browser`, body);
  assert.equal((await api(`/api/tasks/${task}/forecast/feature`, { name: "Save form" })).status, 200);
  assert.equal((await act({ action: "click", x: left + 100, y: 115 })).status, 200); // the name field
  assert.equal((await act({ action: "type_text", text: "Ada" })).status, 200);
  assert.equal((await act({ action: "click", x: left + 60, y: 60 })).status, 200); // Save
  assert.match((await api(`/api/tasks/${task}/forecast/expect`, { text: "Saved Ada" })).j.message, /^Pass/);
  assert.match((await api(`/api/tasks/${task}/forecast/expect`, { text: "Nope" })).j.message, /^Fail/);
  assert.equal((await act({ action: "click", x: left + 260, y: 60 })).status, 200); // Broken -> JS error
  assert.equal((await api(`/api/tasks/${task}/forecast/issue`, { title: "Broken does nothing", severity: "high", actual: "nothing happens", fix: "define nope()" })).status, 200);
  // Not a Forecast task -> refused.
  assert.equal((await api(`/api/tasks/nope/forecast/feature`, { name: "x" })).status, 404);
  assert.match((await api(`/api/tasks/${task}/browser/finish`, { summary: "covered the form" })).j.message, /Forecast run saved/);

  const run = (await api(`/api/forecast/runs/${id}`)).j;
  assert.equal(run.status, "done");
  assert.equal(stopped, 1, "test copy stopped");
  assert.equal(run.stats.checks.passed, 1);
  assert.equal(run.stats.checks.failed, 1);
  const agentIssue = run.issues.find((i: any) => i.source === "agent");
  assert.ok(agentIssue.shot, "issue has a screenshot");
  assert.equal((await fetch(`${base}/api/forecast/runs/${id}/shot/${agentIssue.shot}`, { headers: { authorization: `Bearer ${TOKEN}` } })).headers.get("content-type"), "image/jpeg");
  assert.ok(run.issues.some((i: any) => i.source === "page" && /nope/.test(i.title)), "JS error became an issue");

  // The step file: plain JSON, buttons by text, the app's URL without the copy's token.
  const script = JSON.parse(readFileSync(run.script, "utf8"));
  assert.ok(run.script.replace(/\\/g, "/").includes("/.netheron/forecast/"));
  assert.deepEqual(script.steps[0], { do: "navigate", path: "/" });
  const save = script.steps.find((s: any) => s.do === "click" && s.target?.text === "Save");
  assert.ok(save, JSON.stringify(script.steps));
  assert.equal(script.steps.find((s: any) => s.do === "click" && s.target?.tag === "input").target.placeholder, "Your name");
  assert.ok(!JSON.stringify(script).includes("copytok"));

  // Replay after the layout moved: same checks, no agent.
  left = 400;
  const rp = await api(`/api/forecast/runs/${id}/replay`, {});
  assert.equal(rp.status, 200, JSON.stringify(rp.j));
  await until(async () => (await api(`/api/forecast/runs/${rp.j.id}`)).j.status === "done");
  const rr = (await api(`/api/forecast/runs/${rp.j.id}`)).j;
  assert.equal(rr.kind, "replay");
  assert.equal(rr.from, id);
  assert.equal(rr.stats.checks.passed, 1, JSON.stringify(rr.results.map((x: any) => [rr.labels[x.i], x.ok, x.error])));
  assert.equal(rr.stats.checks.failed, 1); // "Nope" still isn't there
  assert.equal(rr.stats.failed, 1, "only the failing check failed: every click found its button");
  assert.equal(copies, 2);
  const list = (await api("/api/forecast/runs")).j.runs;
  assert.deepEqual(list.map((r: any) => r.id), [rp.j.id, id]);
});

test("only one run at a time; stop ends it", { skip: !chrome && "no Chrome or Edge" }, async () => {
  const a = await api("/api/forecast/explore", {});
  assert.equal(a.j.status, "running");
  assert.equal((await api("/api/forecast/explore", {})).status, 400);
  assert.equal((await api(`/api/forecast/runs/${a.j.id}/stop`, {})).status, 200);
  assert.equal((await api(`/api/forecast/runs/${a.j.id}`)).j.status, "stopped");
});

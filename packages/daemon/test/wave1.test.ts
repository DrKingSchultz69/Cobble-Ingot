// Wave 1 (docs/research/solutions): rate-limit resets, alarms, checkpoints + edit guard.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const dataDir = mkdtempSync(join(tmpdir(), "mm-w1-data-"));
process.env.MM_DATA_DIR = dataDir;
const { openDb, logCall, callEvents } = await import("../src/db.ts");
const { parseReset, parseDuration } = await import("../src/ratelimit.ts");
const { checkCall, listAlerts } = await import("../src/alarms.ts");
const cp = await import("../src/checkpoints.ts");

test("rate-limit reset parsing (P09)", () => {
  const now = Date.parse("2026-10-09T10:00:00Z");
  assert.equal(parseDuration("6m0s"), 360_000);
  assert.equal(parseDuration("1h2m3.5s"), 3_723_500);
  assert.equal(parseDuration("20ms"), 20);
  assert.equal(parseReset({ "retry-after": "120" }, now), now + 120_000);
  assert.equal(parseReset({ "anthropic-ratelimit-unified-reset": String(now / 1000 + 3600) }, now), now + 3_600_000);
  assert.equal(parseReset({ "x-ratelimit-reset-requests": "6m0s", "x-ratelimit-reset-tokens": "1s" }, now), now + 360_000);
  assert.equal(parseReset({ "x-ratelimit-reset": "2026-10-09T10:30:00Z" }, now), now + 1_800_000);
  assert.equal(parseReset({ "content-type": "json" }, now), 0);
  assert.equal(parseReset({ "retry-after": "99999999" }, now), 0); // > 7 days ahead: ignored
});

const call = (o: Record<string, unknown>) => ({
  ts: Date.now(), agent: "claude", task: "", provider: "anthropic", auth: "subscription", model: "m", path: "/v1/messages",
  status: 200, input_tokens: 0, output_tokens: 0, cache_read_tokens: 0, cache_write_tokens: 0, cost_usd: 0, latency_ms: 1, ...o,
});

test("alarms: limit, drain, cache drop, billing; each fires once per cool-down (P07/P08)", () => {
  const db = openDb(join(dataDir, "alarms.db"));
  const seen: unknown[] = [];
  const on = (c: unknown) => seen.push(c);
  callEvents.on("call", on);
  const now = Date.now();
  const fire = (o: Record<string, unknown>) => {
    logCall(db, call(o) as never);
    return checkCall(db, seen.at(-1) as never, now);
  };
  // limit
  const lim = fire({ task: "t1", status: 429, reset_at: now + 3_600_000 });
  assert.equal(lim[0]?.kind, "limit");
  assert.match(lim[0].message, /resets at/);
  assert.equal(fire({ task: "t1", status: 429 }).length, 0); // cool-down
  // drain: 4M tokens in 5 min on one task
  const d = fire({ task: "t2", input_tokens: 4_000_000, cost_usd: 1 });
  assert.equal(d[0]?.kind, "drain");
  // cache: 60 calls with ~90% cache hits, then 12 with none
  for (let i = 0; i < 60; i++) fire({ agent: "codex", input_tokens: 100, cache_read_tokens: 900 });
  let cache: { kind: string }[] = [];
  for (let i = 0; i < 12; i++) cache = cache.concat(fire({ agent: "codex", input_tokens: 1000 }));
  assert.ok(cache.some((a) => a.kind === "cache"), "cache-drop alert");
  // billing: subscription agent suddenly on an API key; a failover retry does not count
  for (let i = 0; i < 5; i++) fire({ agent: "opencode", auth: "subscription", input_tokens: 10 });
  assert.equal(fire({ agent: "opencode", auth: "api_key", failover: 1, input_tokens: 10 }).filter((a) => a.kind === "billing").length, 0);
  assert.equal(fire({ agent: "opencode", auth: "api_key", input_tokens: 10 })[0]?.kind, "billing");
  assert.equal(listAlerts(db, { task: "t1" }).length, 1);
  callEvents.off("call", on);
});

function repo() {
  const dir = mkdtempSync(join(tmpdir(), "mm-w1-repo-"));
  const g = (...a: string[]) => execFileSync("git", ["-C", dir, ...a], { stdio: "ignore" });
  g("init", "-q");
  writeFileSync(join(dir, "app.ts"), Array.from({ length: 40 }, (_, i) => `export const v${i} = ${i};`).join("\n") + "\n");
  writeFileSync(join(dir, "small.ts"), "a\nb\nc\nd\n");
  writeFileSync(join(dir, ".gitignore"), "ignored.log\n");
  g("add", ".");
  g("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "init");
  return { dir, git: (...a: string[]) => execFileSync("git", ["-C", dir, ...a], { encoding: "utf8" }) };
}

test("checkpoints: snapshot without touching the index, skip no-op, restore file and folder (P03)", async () => {
  const { dir, git } = repo();
  writeFileSync(join(dir, "new.ts"), "untracked\n");
  writeFileSync(join(dir, "ignored.log"), "x\n");
  const c1 = await cp.createCheckpoint(dir, "tA", "start");
  assert.equal(c1?.n, 1);
  assert.equal(git("status", "--porcelain").includes("?? new.ts"), true, "real index untouched (new.ts still untracked)");
  assert.equal((await cp.createCheckpoint(dir, "tA", "same"))?.n, 1, "no-op snapshot reuses the last one");
  writeFileSync(join(dir, "app.ts"), "broken\n");
  writeFileSync(join(dir, "later.ts"), "created after\n");
  const c2 = await cp.createCheckpoint(dir, "tA", "turn 1");
  assert.equal(c2?.n, 2);
  assert.equal((await cp.listCheckpoints(dir, "tA")).length, 2);
  // single file
  await cp.restoreCheckpoint(dir, c1!.commit, "app.ts");
  assert.match(readFileSync(join(dir, "app.ts"), "utf8"), /v39/);
  // whole folder: later.ts removed, untracked new.ts back, ignored file kept
  writeFileSync(join(dir, "app.ts"), "broken again\n");
  const r = await cp.restoreCheckpoint(dir, c1!.commit);
  assert.match(readFileSync(join(dir, "app.ts"), "utf8"), /v39/);
  assert.equal(existsSync(join(dir, "later.ts")), false);
  assert.equal(readFileSync(join(dir, "new.ts"), "utf8"), "untracked\n");
  assert.equal(existsSync(join(dir, "ignored.log")), true);
  assert.ok(r.deleted >= 1);
  await cp.deleteCheckpoints(dir, "tA");
  assert.equal((await cp.listCheckpoints(dir, "tA")).length, 0);
});

test("edit guard flags emptied, truncated, reasoning-in-code and a renamed .git (P02)", async () => {
  const { dir } = repo();
  const base = await cp.createCheckpoint(dir, "tB", "start");
  writeFileSync(join(dir, "small.ts"), "");
  writeFileSync(join(dir, "app.ts"), "export const v0 = 0;\n");
  writeFileSync(join(dir, "logic.ts"), "const x = 1;\nLet me check the tests first.\n");
  writeFileSync(join(dir, "notes.md"), "Let me check this later.\n"); // prose: not flagged
  const w = await cp.guardCheck(dir, base!.commit);
  const kinds = Object.fromEntries(w.map((x) => [x.path, x.kind]));
  assert.equal(kinds["small.ts"], "emptied");
  assert.equal(kinds["app.ts"], "truncated");
  assert.equal(kinds["logic.ts"], "reasoning");
  assert.equal(kinds["notes.md"], undefined);
  // a normal edit is not flagged
  const base2 = await cp.createCheckpoint(dir, "tB", "after");
  writeFileSync(join(dir, "logic.ts"), "const x = 2;\nconst y = 3;\n");
  assert.deepEqual(await cp.guardCheck(dir, base2!.commit), []);
  renameSync(join(dir, ".git"), join(dir, ".git_disabled"));
  assert.equal((await cp.guardCheck(dir, base2!.commit))[0].kind, "git");
  renameSync(join(dir, ".git_disabled"), join(dir, ".git"));
});

// ---- task-level features with a fake agent ------------------------------------------------------------
const { TaskManager, WATCH } = await import("../src/tasks.ts");
const setup = await import("../src/setup.ts");
const trust = await import("../src/trust.ts");
const { lstatSync, mkdirSync, readdirSync } = await import("node:fs");

const until = async (fn: () => unknown, ms = 15000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("timed out waiting");
};

test("setup recipe: default copies .env and links node_modules; run command; links removed safely (P35)", async () => {
  const { dir } = repo();
  writeFileSync(join(dir, ".env"), "SECRET=1\n");
  writeFileSync(join(dir, ".env.example"), "SECRET=\n");
  mkdirSync(join(dir, "node_modules", "pkg"), { recursive: true });
  writeFileSync(join(dir, "node_modules", "pkg", "index.js"), "x");
  const r = setup.defaultRecipe(dir);
  assert.deepEqual(r.copy, [".env"]);
  assert.deepEqual(r.link, ["node_modules"]);
  const wt = mkdtempSync(join(tmpdir(), "mm-w1-wt-"));
  const res = await setup.applyRecipe(dir, wt, { ...r, run: `node -e "require('fs').writeFileSync('ran.txt','1')"` });
  assert.ok(res.ok, res.notes.join("; "));
  assert.equal(readFileSync(join(wt, ".env"), "utf8"), "SECRET=1\n");
  assert.equal(existsSync(join(wt, ".env.example")), false);
  assert.equal(lstatSync(join(wt, "node_modules")).isSymbolicLink(), true);
  assert.equal(readFileSync(join(wt, "node_modules", "pkg", "index.js"), "utf8"), "x");
  assert.equal(readFileSync(join(wt, "ran.txt"), "utf8"), "1");
  setup.removeLinks(wt, res.links);
  assert.equal(existsSync(join(wt, "node_modules")), false);
  assert.equal(readFileSync(join(dir, "node_modules", "pkg", "index.js"), "utf8"), "x", "main checkout untouched");
  assert.throws(() => setup.saveRecipe(openDb(join(dataDir, "s.db")), dir, { copy: ["../outside"] }), /inside the project/);
});

test("Claude pre-trust edits only the given folder, keeps other settings, backs up once, never writes bad JSON (P44)", () => {
  const home = mkdtempSync(join(tmpdir(), "mm-w1-home-"));
  const cfg = join(home, ".claude.json");
  writeFileSync(cfg, JSON.stringify({ userID: "u", projects: { "C:/other": { hasTrustDialogAccepted: false, x: 1 } } }));
  const folder = join(home, "wt", "task-1");
  assert.equal(trust.trustClaudeFolder(folder, home).note, "trusted");
  const j = JSON.parse(readFileSync(cfg, "utf8"));
  assert.equal(j.userID, "u");
  assert.deepEqual(j.projects["C:/other"], { hasTrustDialogAccepted: false, x: 1 });
  assert.equal(j.projects[folder].hasTrustDialogAccepted, true);
  assert.ok(existsSync(cfg + ".netheron-backup"));
  assert.equal(trust.trustClaudeFolder(folder, home).note, "already set");
  trust.untrustClaudeFolder(folder, home);
  assert.equal(JSON.parse(readFileSync(cfg, "utf8")).projects[folder], undefined);
  writeFileSync(cfg, "{not json");
  assert.equal(trust.trustClaudeFolder(folder, home).ok, false);
  assert.equal(readFileSync(cfg, "utf8"), "{not json", "broken config left untouched");
});

test("task flow: trust + setup, checkpoints, edit guard + restore, queue, budget, stuck, limit wait/resume, meter, receipt", async () => {
  const { dir } = repo();
  writeFileSync(join(dir, ".env"), "K=1\n");
  const home = mkdtempSync(join(tmpdir(), "mm-w1-home2-"));
  writeFileSync(join(home, ".claude.json"), JSON.stringify({ projects: {} }));
  const agent = join(dataDir, "agent.js");
  writeFileSync(agent, `const fs = require("fs");
process.stdout.write("ready\\n");
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => {
  if (d.includes("empty")) { fs.writeFileSync("small.ts", ""); process.stdout.write("emptied\\n"); }
  else if (d.includes("quit")) process.exit(0);
  else if (d.trim()) process.stdout.write("got:" + d.trim() + "\\n");
});`);
  const db = openDb(join(dataDir, "flow.db"));
  const tm = new TaskManager(db, { launcher: () => ({ cmd: process.execPath, args: [agent], env: {} }), home, idleMs: 700, tickMs: 150 });
  const events: Array<{ type: string; x: any }> = [];
  for (const ev of ["guard", "checkpoint", "queue", "alert", "meter"]) tm.on(ev, (x) => events.push({ type: ev, x }));
  try {
    const t = await tm.create({ prompt: "wave 1 flow", agent: "claude", repo: dir, isolate: true, budgetUsd: 0.5 });
    // trust + setup
    assert.equal(tm.get(t.id)!.trusted, 1);
    assert.match(tm.get(t.id)!.setup_note, /copied \.env/);
    assert.ok(JSON.parse(readFileSync(join(home, ".claude.json"), "utf8")).projects[t.cwd]?.hasTrustDialogAccepted);
    // baseline checkpoint, then idle after the first output
    await until(() => tm.get(t.id)!.status === "idle");
    await until(async () => (await tm.checkpoints(t.id)).length >= 1);
    // queue: delivered when the agent is idle
    const out = () => tm.session(t.id)!.buffer();
    tm.enqueue(t.id, "hello from the queue");
    await until(() => /got:hello from the queue/.test(out()));
    assert.ok(tm.queue(t.id)[0].sent > 0);
    // edit guard: agent empties a file -> warning at end of turn -> restore
    await until(() => tm.get(t.id)!.status === "idle");
    const before = readFileSync(join(t.cwd, "small.ts"), "utf8"); // worktree may use CRLF (core.autocrlf)
    tm.write(t.id, "empty it\r");
    await until(() => tm.guard(t.id).warnings.some((w) => w.path === "small.ts" && w.kind === "emptied"));
    assert.ok(events.some((e) => e.type === "alert" && e.x.kind === "guard"));
    await tm.restore(t.id, tm.guard(t.id).checkpoint, "small.ts");
    assert.equal(readFileSync(join(t.cwd, "small.ts"), "utf8"), before, "byte-exact restore");
    // diff comment goes through the queue
    tm.comment(t.id, "app.ts", 3, "use a constant here");
    await until(() => /got:Review comment on app\.ts:3: use a constant here/.test(out()));
    // budget: $0.6 spent > $0.5 -> interrupted once + alert
    const writes: string[] = [];
    const s = tm.session(t.id)!;
    const orig = s.write.bind(s);
    s.write = (d: string) => { writes.push(d); orig(d); };
    logCall(db, call({ task: t.id, cost_usd: 0.6, input_tokens: 1000, output_tokens: 500, latency_ms: 1000 }) as never);
    await until(() => tm.get(t.id)!.budget_hit === 1);
    assert.ok(writes.includes("\x1b"), "agent interrupted with Esc");
    assert.ok(tm.alerts({ task: t.id }).some((a) => a.kind === "budget"));
    // meter
    const m = tm.meter(t.id);
    assert.equal(m.tokensIn, 1000);
    assert.equal(m.tokensPerSec, 500);
    assert.ok(events.some((e) => e.type === "meter" && e.x.id === t.id));
    // limit hit -> waits -> resumes at reset with a nudge
    logCall(db, call({ task: t.id, status: 429, reset_at: Date.now() + 1200 }) as never);
    await until(() => tm.get(t.id)!.wait_until > 0);
    await until(() => writes.some((w) => w.includes(WATCH.resumeText)), 8000);
    assert.equal(tm.get(t.id)!.wait_until, 0);
    assert.ok(tm.alerts({ task: t.id }).some((a) => a.kind === "resumed"));
    // stuck: 5 failed calls while running
    tm.write(t.id, "keep busy\r");
    await until(() => tm.get(t.id)!.status === "running");
    for (let i = 0; i < 5; i++) logCall(db, call({ task: t.id, status: 500 }) as never);
    await until(() => tm.get(t.id)!.stuck_at > 0);
    assert.ok(tm.alerts({ task: t.id }).some((a) => a.kind === "stuck"));
    // receipt
    const rc = await tm.receipt(t.id);
    assert.ok(rc.checkpoints >= 2);
    assert.ok(rc.models.length >= 1);
    assert.equal(rc.sent, 2);
    assert.ok(rc.alerts.length >= 3);
    // remove: links gone, Claude trust entry gone, checkpoints deleted, main checkout intact
    await tm.remove(t.id, { removeWorktree: true });
    assert.equal(JSON.parse(readFileSync(join(home, ".claude.json"), "utf8")).projects[t.cwd], undefined);
    assert.equal(execFileSync("git", ["-C", dir, "for-each-ref", `refs/netheron/${t.id}/`], { encoding: "utf8" }).trim(), "");
    assert.equal(readFileSync(join(dir, ".env"), "utf8"), "K=1\n");
  } finally {
    await tm.dispose();
  }
});

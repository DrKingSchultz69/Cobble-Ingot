// Status bar pieces: keep awake, resource manager, agent limits, and the /api/status, /api/awake routes.
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtempSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const dataDir = mkdtempSync(join(tmpdir(), "mm-status-data-"));
process.env.MM_DATA_DIR = dataDir;
const { KeepAwake } = await import("../src/awake.ts");
const { ResourceMonitor, subtree } = await import("../src/resources.ts");
const { openDb } = await import("../src/db.ts");
const { createWorkspaceServer } = await import("../src/server.ts");
const { TaskManager } = await import("../src/tasks.ts");

function fakeProc() {
  const p = new EventEmitter() as EventEmitter & { killed: boolean; kill: () => void };
  p.killed = false;
  p.kill = () => { p.killed = true; p.emit("exit"); };
  return p;
}

test("keep awake: Agent mode holds sleep only while an agent works; On always; Off never; mode is saved", () => {
  const started: ReturnType<typeof fakeProc>[] = [];
  const spawner = () => { const p = fakeProc(); started.push(p); return p as never; };
  const dir = mkdtempSync(join(tmpdir(), "mm-awake-"));
  const a = new KeepAwake({ dir, spawner });
  assert.equal(a.mode, "agent", "default");
  assert.equal(a.active, false);
  a.setWorking(true);
  assert.equal(a.active, true);
  a.setWorking(false);
  assert.equal(a.active, false);
  assert.equal(started[0].killed, true, "sleep is given back when the agent stops");
  a.setMode("on");
  assert.equal(a.active, true, "On holds sleep even with no agent");
  a.setMode("off");
  a.setWorking(true);
  assert.equal(a.active, false, "Off never holds sleep");
  assert.throws(() => a.setMode("sometimes" as never), /mode must be/);
  const again = new KeepAwake({ dir, spawner });
  assert.equal(again.mode, "off", "the mode survives a restart");
  a.dispose(); again.dispose();
});

test("resources: a task counts every process under its terminal; CPU % from the change in CPU time", async () => {
  let cpu = 1000;
  const table = async () => [
    { pid: 10, ppid: 1, name: "cmd.exe", mem: 5_000_000, cpuMs: 100 },
    { pid: 11, ppid: 10, name: "claude.exe", mem: 300_000_000, cpuMs: cpu },
    { pid: 12, ppid: 11, name: "node.exe", mem: 50_000_000, cpuMs: 0 },
    { pid: 20, ppid: 1, name: "other.exe", mem: 999_000_000, cpuMs: 0 },
  ];
  assert.deepEqual(subtree(await table(), 10).map((p) => p.pid).sort(), [10, 11, 12]);
  const m = new ResourceMonitor(table);
  const live = [{ id: "t1", pid: 10, lastOutputAt: 0, status: "running", title: "Fix login", agent: "claude", repo: "C:/r" }];
  const first = await m.snapshot(live, 10_000, 0);
  assert.equal(first.tasks[0].memBytes, 355_000_000);
  assert.equal(first.tasks[0].processes, 3);
  cpu += 1000; // one CPU-second in one wall-second
  const second = await m.snapshot(live, 11_000, 0);
  assert.ok(second.tasks[0].cpuPct > 0);
  assert.equal(second.tasks[0].history.length, 2);
  assert.equal(second.totalMem, 355_000_000);
});

test("/api/status and /api/awake: counts, spend, limits from session logs, and switching the mode", async () => {
  const db = openDb(join(dataDir, "status.db"));
  const tasks = new TaskManager(db, { home: dataDir });
  const awake = new KeepAwake({ dir: mkdtempSync(join(tmpdir(), "mm-awake2-")), spawner: () => fakeProc() as never });
  const { server } = createWorkspaceServer({ db, token: "tok", tasks, previewPort: 0, awake, resources: new ResourceMonitor(async () => []) });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const api = (p: string, body?: unknown) => fetch(base + p, { method: body ? "POST" : "GET", headers: { authorization: "Bearer tok", "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined }).then((r) => r.json());
  try {
    db.exec("CREATE TABLE IF NOT EXISTS agent_limits (agent TEXT PRIMARY KEY, ts INTEGER NOT NULL, info TEXT NOT NULL)");
    db.prepare("INSERT INTO agent_limits VALUES ('codex', ?, ?)").run(Date.now(), JSON.stringify({ limited: false, windows: [{ label: "weekly", usedPct: 55, resetAt: Date.now() + 86_400_000 }] }));
    db.prepare(`INSERT INTO calls (ts, agent, task, provider, auth, model, path, status, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, cost_usd, latency_ms)
                VALUES (?, 'claude', '', 'anthropic', 'subscription', 'm', '/session-log', 200, 1, 1, 0, 0, 0.5, 0)`).run(Date.now());
    const s = await api("/api/status");
    assert.equal(s.terminals, 0);
    assert.equal(s.spend.subscriptionValue, 0.5);
    assert.equal(s.limits.find((l: { agent: string }) => l.agent === "codex").windows[0].usedPct, 55);
    assert.equal(s.awake.mode, "agent");
    const on = await api("/api/awake", { mode: "on" });
    assert.deepEqual([on.mode, on.active], ["on", true]);
    const r = await api("/api/resources");
    assert.deepEqual(r.tasks, []);
  } finally {
    await tasks.dispose();
    server.closeAllConnections();
    server.close();
  }
});

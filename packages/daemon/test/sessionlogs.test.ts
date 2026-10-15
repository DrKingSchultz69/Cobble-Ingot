import assert from "node:assert/strict";
import { appendFileSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

process.env.MM_DATA_DIR = mkdtempSync(join(tmpdir(), "mm-slog-data-"));
const { openDb, callEvents } = await import("../src/db.ts");
const { SessionLogReader, claudeProjectDir } = await import("../src/sessionlogs.ts");

type Row = { task: string; agent: string; auth: string; provider: string; model: string; status: number; input_tokens: number;
             output_tokens: number; cache_read_tokens: number; cache_write_tokens: number; reset_at: number; path: string };
const rows = (db: ReturnType<typeof openDb>, task: string) => db.prepare("SELECT * FROM calls WHERE task = ? ORDER BY id").all(task) as Row[];
const iso = (ms: number) => new Date(ms).toISOString();
const line = (o: unknown) => JSON.stringify(o) + "\n";

test("claudeProjectDir matches Claude Code's folder naming", () => {
  assert.equal(claudeProjectDir("C:\\Workspace\\Netheron"), "C--Workspace-Netheron");
  assert.equal(claudeProjectDir("C:\\Users\\Shai\\orca\\workspaces\\ARANGAM_Plugin\\seal"), "C--Users-Shai-orca-workspaces-ARANGAM-Plugin-seal");
});

test("Claude session logs become usage rows: one per reply, limits as 429 with the reset time", () => {
  const root = mkdtempSync(join(tmpdir(), "mm-slog-"));
  const db = openDb(join(root, "mm.db"));
  const home = join(root, "claude-home");
  const cwd = join(root, "wt", "fix-login");
  const dir = join(home, "projects", claudeProjectDir(cwd));
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "s1.jsonl");
  const now = Date.now();
  const usage = { input_tokens: 10, output_tokens: 200, cache_read_input_tokens: 5000, cache_creation_input_tokens: 300 };
  const reply = (id: string, ts: number, text: string) =>
    line({ type: "assistant", timestamp: iso(ts), requestId: `req_${id}`, message: { id, model: "claude-sonnet-5-5", content: [{ type: "text", text }], usage } });
  writeFileSync(file,
    reply("old", now - 3_600_000, "before this task: ignored") +
    reply("m1", now + 1, "first block") +
    reply("m1", now + 2, "second block of the same reply: not counted twice") +
    line({ type: "assistant", timestamp: iso(now + 3), message: { id: "x", model: "<synthetic>", content: [], usage: { input_tokens: 0, output_tokens: 0 } } }));

  const seen: number[] = [];
  const onCall = (c: { task: string; status: number }) => { if (c.task === "t1") seen.push(c.status); };
  callEvents.on("call", onCall);
  const r = new SessionLogReader(db);
  r.add({ task: "t1", agent: "claude", home, cwd, since: now - 5_000 });
  r.poll();
  let got = rows(db, "t1");
  assert.equal(got.length, 1, "one reply, counted once; older and synthetic lines skipped");
  assert.deepEqual([got[0].agent, got[0].auth, got[0].provider, got[0].model, got[0].status], ["claude", "subscription", "anthropic", "claude-sonnet-5-5", 200]);
  assert.deepEqual([got[0].input_tokens, got[0].output_tokens, got[0].cache_read_tokens, got[0].cache_write_tokens], [10, 200, 5000, 300]);
  assert.equal(got[0].path, "/session-log");

  // A usage limit, then a half-written line that must wait for its end.
  const resetsAt = Math.floor(now / 1000) + 3600;
  appendFileSync(file, line({ type: "assistant", timestamp: iso(now + 10), isApiErrorMessage: true, error: "rate_limit", apiErrorStatus: 429,
    quotaLimits: { status: "rejected", resetsAt, rateLimitType: "five_hour" },
    message: { id: "e1", model: "<synthetic>", content: [{ type: "text", text: "You've hit your session limit" }], usage: { input_tokens: 0, output_tokens: 0 } } }));
  appendFileSync(file, reply("m2", now + 20, "half").slice(0, 40));
  r.poll();
  got = rows(db, "t1");
  assert.equal(got.length, 2);
  assert.equal(got[1].status, 429);
  assert.equal(got[1].reset_at, resetsAt * 1000);

  appendFileSync(file, reply("m2", now + 20, "half").slice(40));
  r.remove("t1"); // final read
  assert.equal(rows(db, "t1").length, 3, "the completed line is counted on the last read");
  assert.deepEqual(seen, [200, 429, 200], "the task manager hears every row (meters, budgets, limit hand-off)");
  callEvents.off("call", onCall);

  // A restart resumes from the saved offset: nothing is counted twice.
  const again = new SessionLogReader(db);
  again.add({ task: "t1", agent: "claude", home, cwd, since: now - 5_000 });
  again.poll();
  assert.equal(rows(db, "t1").length, 3);
  db.close();
});

test("Codex rollouts are matched by working folder; token_count and limits become rows", () => {
  const root = mkdtempSync(join(tmpdir(), "mm-slog-cx-"));
  const db = openDb(join(root, "mm.db"));
  const home = join(root, "codex-home");
  const cwd = "C:\\Work\\repo-wt";
  const d = new Date();
  const day = join(home, "sessions", String(d.getFullYear()), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0"));
  mkdirSync(day, { recursive: true });
  const now = Date.now();
  const meta = (c: string) => line({ timestamp: iso(now), type: "session_meta", payload: { id: "x", cwd: c, base_instructions: { text: "x".repeat(20_000) } } });
  const tokens = (ts: number, inp: number, cached: number, out: number, rl: unknown = null) =>
    line({ timestamp: iso(ts), type: "event_msg", payload: { type: "token_count", info: { last_token_usage: { input_tokens: inp, cached_input_tokens: cached, output_tokens: out } }, rate_limits: rl } });
  writeFileSync(join(day, "rollout-other.jsonl"), meta("C:\\Elsewhere") + tokens(now + 1, 999, 0, 999));
  const file = join(day, "rollout-mine.jsonl");
  writeFileSync(file, meta("c:/work/repo-wt/") +
    line({ timestamp: iso(now + 1), type: "turn_context", payload: { model: "gpt-6-sol" } }) +
    tokens(now + 2, 34_317, 21_760, 201) +
    line({ timestamp: iso(now + 3), type: "event_msg", payload: { type: "token_count", info: null, rate_limits: null } }));

  const r = new SessionLogReader(db);
  r.add({ task: "c1", agent: "codex", home, cwd, since: now - 5_000 });
  r.poll();
  let got = rows(db, "c1");
  assert.equal(got.length, 1, "the other folder's rollout is not this task's");
  assert.deepEqual([got[0].provider, got[0].auth, got[0].model], ["chatgpt", "subscription", "gpt-6-sol"]);
  assert.deepEqual([got[0].input_tokens, got[0].cache_read_tokens, got[0].output_tokens], [34_317 - 21_760, 21_760, 201]);

  const resetsAt = Math.floor(now / 1000) + 7200;
  const hit = { primary: { used_percent: 100, resets_at: resetsAt }, secondary: { used_percent: 40, resets_at: resetsAt + 99999 }, rate_limit_reached_type: "primary" };
  appendFileSync(file, tokens(now + 4, 100, 0, 10, hit) + tokens(now + 5, 100, 0, 10, hit));
  r.poll();
  got = rows(db, "c1");
  assert.equal(got.filter((x) => x.status === 429).length, 1, "one limit row per reset, not one per event");
  assert.equal(got.find((x) => x.status === 429)!.reset_at, resetsAt * 1000);
  db.close();
});

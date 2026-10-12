// Wave 2 (docs/research/solutions): #1 hand-off to another agent with a briefing (P10 S1, P46).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const dataDir = mkdtempSync(join(tmpdir(), "mm-w2-data-"));
process.env.MM_DATA_DIR = dataDir;
const { openDb, logCall } = await import("../src/db.ts");
const { TaskManager } = await import("../src/tasks.ts");
const { decide } = await import("../../router/src/router.ts");
const { record } = await import("../../memory/src/context.ts");
const { projectKey } = await import("../../memory/src/indexer.ts");

const until = async (fn: () => unknown, ms = 15000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("timed out waiting");
};

function repo() {
  const dir = mkdtempSync(join(tmpdir(), "mm-w2-repo-"));
  const g = (...a: string[]) => execFileSync("git", ["-C", dir, ...a], { stdio: "ignore" });
  g("init", "-q");
  writeFileSync(join(dir, "app.ts"), "export const a = 1;\n");
  g("add", ".");
  g("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "init");
  return dir;
}

const call = (o: Record<string, unknown>) => ({
  ts: Date.now(), agent: "claude", task: "", provider: "anthropic", auth: "subscription", model: "m", path: "/v1/messages",
  status: 200, input_tokens: 0, output_tokens: 0, cache_read_tokens: 0, cache_write_tokens: 0, cost_usd: 0, latency_ms: 1, ...o,
});

test("router can exclude agents that already failed", () => {
  const availability = { claude: true, codex: true, opencode: false, openrouter: false };
  assert.equal(decide("fix the login bug", { availability, exclude: ["claude"] }).candidate.agent, "codex");
  assert.throws(() => decide("fix the login bug", { availability, exclude: ["claude", "codex"] }), /No other agent available \(already tried: claude, codex\)/);
});

test("hand-off: same folder, briefing with original task + changes + decisions + last output; old agent stopped", async () => {
  const dir = repo();
  const agentJs = join(dataDir, "agent.js");
  writeFileSync(agentJs, `process.stdout.write("working on it: step 3 failed with ENOENT\\n"); setInterval(() => {}, 1000);`);
  const launches: Array<{ agent: string; prompt?: string }> = [];
  const db = openDb(join(dataDir, "h1.db"));
  const tm = new TaskManager(db, {
    launcher: (agent, o) => { launches.push({ agent, prompt: o?.prompt }); return { cmd: process.execPath, args: [agentJs], env: {} }; },
    home: dataDir, idleMs: 600, tickMs: 150, availability: { claude: true, codex: true, opencode: false, openrouter: false },
  });
  try {
    const t = await tm.create({ prompt: "Add input validation to the signup form", agent: "claude", repo: dir, isolate: true });
    await until(() => /step 3 failed/.test(tm.session(t.id)?.buffer() ?? ""));
    writeFileSync(join(t.cwd, "app.ts"), "export const a = 2;\n");
    record(db, { kind: "decision", title: "Use zod for validation", project: projectKey(dir), taskId: t.id, agent: "claude" });

    const child = await tm.handoff(t.id, "looked stuck (no progress for 12 minutes)");
    assert.equal(child.agent, "codex", "never back to claude");
    assert.equal(child.cwd, t.cwd, "same folder");
    assert.equal(child.branch, t.branch);
    assert.equal(child.worktree, 0, "folder stays owned by the first task");
    assert.equal(child.handoff_from, t.id);
    assert.equal(tm.get(t.id)!.handoff_to, child.id);
    assert.equal(tm.get(t.id)!.status, "stopped");
    const brief = launches.at(-1)!.prompt!;
    for (const part of ["taking over a task from claude", "looked stuck", "Add input validation to the signup form", "app.ts", "Use zod for validation", "step 3 failed with ENOENT", "Don't start over"]) {
      assert.ok(brief.includes(part), `briefing mentions: ${part}`);
    }
    assert.deepEqual(tm.chainAgents(child.id), ["codex", "claude"]);
    await assert.rejects(tm.handoff(t.id), /already handed off/);
    assert.ok(tm.alerts({ task: t.id }).some((a) => a.kind === "handoff" && /Handed off to codex/.test(a.message)));

    // Removing the first task with its worktree keeps the folder: the hand-off task still uses it, and now owns it.
    await tm.remove(t.id, { removeWorktree: true });
    assert.ok(existsSync(child.cwd));
    assert.equal(tm.get(child.id)!.worktree, 1);
  } finally {
    await tm.dispose();
  }
});

test("auto hand-off: stuck → next agent; limit with nobody left → alert instead of a loop", async () => {
  const dir = repo();
  const agentJs = join(dataDir, "busy.js");
  writeFileSync(agentJs, `setInterval(() => process.stdout.write("."), 200);`); // keeps 'running'
  const db = openDb(join(dataDir, "h2.db"));
  const tm = new TaskManager(db, {
    launcher: () => ({ cmd: process.execPath, args: [agentJs], env: {} }),
    home: dataDir, idleMs: 60_000, tickMs: 150, availability: { claude: true, codex: true, opencode: false, openrouter: false },
  });
  try {
    const t = await tm.create({ prompt: "Refactor the payment module", agent: "claude", repo: dir, isolate: true, autoHandoff: true });
    await until(() => tm.get(t.id)!.status === "running");
    for (let i = 0; i < 5; i++) logCall(db, call({ task: t.id, status: 500 }) as never);
    await until(() => tm.get(t.id)!.handoff_to);
    const child = tm.get(tm.get(t.id)!.handoff_to)!;
    assert.equal(child.agent, "codex");
    assert.equal(child.auto_handoff, 1, "setting carries over");
    // codex hits a usage limit: claude and codex both tried, nobody left
    await until(() => tm.get(child.id)!.status === "running");
    logCall(db, call({ task: child.id, agent: "codex", status: 429 }) as never);
    await until(() => tm.alerts({ task: child.id }).some((a) => /Couldn't hand off automatically/.test(a.message)));
    assert.equal(tm.get(child.id)!.handoff_to, "");
  } finally {
    await tm.dispose();
  }
});

test("Budget Dial: ladder is smallest first; failing checks climb one step with the failure in the briefing; passing stops (P07 S1)", async () => {
  const { ladder } = await import("../../router/src/router.ts");
  const availability = { claude: true, codex: true, opencode: false, openrouter: false };
  assert.deepEqual(ladder("fix the login bug", { availability }).map((c) => c.id), ["claude-haiku", "codex", "claude-sonnet", "claude-opus"]); // debugging: codex is stronger
  assert.deepEqual(ladder("fix the login bug", { availability, startAt: { agent: "codex" } }).map((c) => c.id), ["codex", "claude-sonnet", "claude-opus"]);

  const dir = repo();
  const { detectVerify } = await import("../src/verify.ts");
  assert.equal(detectVerify(dir), "");
  // The fake agent writes the right answer only when it's not the small model.
  const agentJs = join(dataDir, "dial-agent.js");
  writeFileSync(agentJs, `const fs = require("fs"); const model = process.argv[2] || "";
fs.writeFileSync("answer.txt", model === "haiku" ? "41" : "42");
process.stdout.write("wrote answer with " + (model || "default") + "\\n");`);
  const launches: Array<{ agent: string; model?: string; prompt?: string }> = [];
  const db = openDb(join(dataDir, "dial.db"));
  const tm = new TaskManager(db, {
    launcher: (agent, o) => { launches.push({ agent, model: o?.model, prompt: o?.prompt }); return { cmd: process.execPath, args: [agentJs, o?.model ?? ""], env: {} }; },
    home: dataDir, idleMs: 600, tickMs: 150, availability,
  });
  try {
    const check = `node -e "process.exit(require('fs').readFileSync('answer.txt','utf8').trim()==='42'?0:1)"`;
    const t = await tm.create({ prompt: "fix the answer", agent: "auto", repo: dir, isolate: true, checks: "dial", verifyCmd: check });
    assert.equal(t.model, "haiku", "starts at the smallest model");
    assert.match(t.reason, /Budget Dial/);
    // haiku writes 41 → checks fail → hand-off to the next step (sonnet) with the failure
    await until(() => tm.get(t.id)!.handoff_to, 20000);
    const next = tm.get(tm.get(t.id)!.handoff_to)!;
    const expected = ladder("fix the answer", { availability })[1];
    assert.equal(next.agent, expected.agent);
    assert.equal(next.model, expected.model ?? "");
    assert.equal(next.dial_step, 1);
    assert.equal(next.checks, "dial");
    assert.ok(launches.at(-1)!.prompt!.includes("didn't pass the checks"), "briefing explains why");
    assert.ok(launches.at(-1)!.prompt!.includes("checks failed with this output"));
    // the bigger model writes 42 → checks pass → stays put
    await until(() => JSON.parse(tm.get(next.id)!.verify_last || "null")?.ok === true, 20000);
    assert.equal(tm.get(next.id)!.handoff_to, "");
    assert.ok(tm.alerts({ task: next.id }).some((a) => a.kind === "verify" && /Checks pass/.test(a.message)));
    // manual "run checks"
    const r = await tm.runChecks(next.id);
    assert.equal(r.ok, true);
  } finally {
    await tm.dispose();
  }
});

test("shared rules: written once, given to every agent in its prompt, listed per task, in mm_get_context (P26)", async () => {
  const { buildContext } = await import("../../memory/src/context.ts");
  const dir = repo();
  const agentJs = join(dataDir, "quiet.js");
  writeFileSync(agentJs, "setInterval(() => {}, 1000);");
  const prompts: Record<string, string> = {};
  const db = openDb(join(dataDir, "rules.db"));
  const tm = new TaskManager(db, {
    launcher: (agent, o) => { prompts[agent] = o?.prompt ?? ""; return { cmd: process.execPath, args: [agentJs], env: {} }; },
    home: dataDir, idleMs: 60_000, tickMs: 500, availability: { claude: true, codex: true, opencode: false, openrouter: false },
  });
  try {
    const project = projectKey(dir);
    record(db, { kind: "rule", title: "Use pnpm, never npm", body: "The lockfile is pnpm-lock.yaml.", project });
    record(db, { kind: "rule", title: "Never edit files in /legacy", project });
    const a = await tm.create({ prompt: "Add a date picker", agent: "claude", repo: dir, isolate: true });
    const b = await tm.create({ prompt: "Add a date picker", agent: "codex", repo: dir, isolate: true });
    for (const agent of ["claude", "codex"]) {
      assert.match(prompts[agent], /^Project rules \(from Netheron shared memory; follow them\):/);
      assert.ok(prompts[agent].includes("Use pnpm, never npm: The lockfile is pnpm-lock.yaml."));
      assert.ok(prompts[agent].includes("Never edit files in /legacy"));
    }
    assert.deepEqual(JSON.parse(tm.get(a.id)!.rules_given).sort(), ["Never edit files in /legacy", "Use pnpm, never npm"]);
    assert.equal(tm.get(b.id)!.rules_given, tm.get(a.id)!.rules_given);
    assert.match(buildContext(db, project), /## Project rules[\s\S]*Use pnpm, never npm/);
  } finally {
    await tm.dispose();
  }
});

test("account profiles: own config folder per login, project default, wrong-agent refused early, sign-in task (P13)", async () => {
  const prof = await import("../src/profiles.ts");
  const dir = repo();
  const agentJs = join(dataDir, "env-agent.js");
  writeFileSync(agentJs, "process.stdout.write('CFG=' + (process.env.CLAUDE_CONFIG_DIR || 'none') + '|END|'); setInterval(() => {}, 1000);");
  const db = openDb(join(dataDir, "prof.db"));
  const tm = new TaskManager(db, { launcher: () => ({ cmd: process.execPath, args: [agentJs], env: {} }), home: dataDir, idleMs: 60_000, tickMs: 500,
    availability: { claude: true, codex: true, opencode: false, openrouter: false } });
  try {
    const work = prof.createProfile(db, "claude", "work");
    assert.ok(work.env.CLAUDE_CONFIG_DIR.includes(work.id));
    assert.ok(existsSync(work.env.CLAUDE_CONFIG_DIR));
    assert.throws(() => prof.createProfile(db, "claude", "work"), /already exists/);
    assert.throws(() => prof.createProfile(db, "shell", "x"), /profiles are for/);
    // explicit profile
    const t1 = await tm.create({ prompt: "hi", agent: "claude", repo: dir, isolate: true, profile: work.id });
    await until(() => (tm.session(t1.id)?.buffer() ?? "").includes("|END|"));
    assert.ok(tm.session(t1.id)!.buffer().replace(/\s+/g, "").includes(work.env.CLAUDE_CONFIG_DIR.replace(/\s+/g, "")), "agent runs with the profile's config folder");
    assert.equal(tm.get(t1.id)!.profile, work.id);
    // project default applies when nothing is chosen; "" = normal login
    prof.setProjectProfile(db, dir, "claude", work.id);
    assert.equal((await tm.create({ prompt: "hi", agent: "claude", repo: dir, isolate: true })).profile, work.id);
    assert.equal((await tm.create({ prompt: "hi", agent: "claude", repo: dir, isolate: true, profile: "" })).profile, "");
    // a claude profile on a codex task is refused before any worktree is made
    const before = tm.list().length;
    await assert.rejects(tm.create({ prompt: "hi", agent: "codex", repo: dir, isolate: true, profile: work.id }), /is for claude, not codex/);
    assert.equal(tm.list().length, before);
    // sign-in: a shell in the profile folder that types the login command
    const typed: string[] = [];
    const origWrite = tm.write.bind(tm);
    tm.write = (id: string, d: string) => { typed.push(d); origWrite(id, d); };
    const login = await tm.loginTask(work.id);
    assert.equal(login.agent, "shell");
    assert.equal(login.profile, work.id);
    await until(() => typed.some((d) => d.startsWith("claude")), 5000);
    await assert.rejects(tm.deleteProfile(work.id), /still in use by \d running task/);
    for (const t of tm.list().filter((x) => x.profile === work.id && x.agent !== "shell")) await tm.remove(t.id, { removeWorktree: true });
    await tm.deleteProfile(work.id); // also closes the sign-in terminal that sits in the profile folder
    assert.equal(existsSync(work.env.CLAUDE_CONFIG_DIR), false);
    assert.deepEqual(prof.projectProfiles(db, dir), {});
  } finally {
    await tm.dispose();
  }
});

test("Night Shift: run at a time, daily repeat, after a limit reset, cancel, brief (P23 S1)", async () => {
  const dir = repo();
  const agentJs = join(dataDir, "night-agent.js");
  writeFileSync(agentJs, "process.stdout.write('night run|'); setInterval(() => {}, 1000);");
  const db = openDb(join(dataDir, "night.db"));
  const tm = new TaskManager(db, { launcher: () => ({ cmd: process.execPath, args: [agentJs], env: {} }), home: dataDir, idleMs: 60_000, tickMs: 150,
    availability: { claude: true, codex: true, opencode: false, openrouter: false } });
  try {
    const soon = Date.now() + 600;
    const once = tm.schedule({ prompt: "nightly cleanup", agent: "claude", repo: dir, isolate: true }, { at: soon });
    const daily = tm.schedule({ prompt: "daily report", agent: "codex", repo: dir, isolate: true }, { at: soon, daily: true });
    assert.equal(tm.scheduled().length, 2);
    await until(() => tm.list().some((t) => t.title === "nightly cleanup") && tm.list().some((t) => t.title === "daily report"));
    await new Promise((r) => setTimeout(r, 800)); // a few more ticks: nothing may start twice
    assert.equal(tm.list().filter((t) => t.title === "nightly cleanup").length, 1, "started exactly once");
    assert.equal(tm.list().filter((t) => t.title === "daily report").length, 1, "started exactly once");
    const rows = db.prepare("SELECT id, status, run_at, last_task FROM schedule").all() as Array<{ id: number; status: string; run_at: number; last_task: string }>;
    assert.equal(rows.find((r) => r.id === once.id)!.status, "done");
    const d = rows.find((r) => r.id === daily.id)!;
    assert.equal(d.status, "waiting");
    assert.equal(d.run_at, soon + 24 * 3600_000, "daily moves on by a day");
    assert.ok(d.last_task);
    // after the limit resets: uses the last known reset time of that agent (+1 min)
    const reset = Date.now() + 3_600_000;
    logCall(db, call({ agent: "claude", status: 429, reset_at: reset }) as never);
    const r = tm.schedule({ prompt: "big refactor", agent: "claude", repo: dir }, { afterReset: true });
    assert.equal(r.run_at, reset + 60_000);
    tm.unschedule(r.id);
    assert.equal(tm.scheduled().some((s) => s.id === r.id), false);
    // brief
    const b = tm.brief(Date.now() - 60_000);
    assert.ok(b.some((x) => x.title === "nightly cleanup"));
    assert.ok(b.every((x) => "costUsd" in x && "alerts" in x));
    assert.throws(() => tm.schedule({ prompt: "x", agent: "claude", repo: dir }, {}), /give a time/);
  } finally {
    await tm.dispose();
  }
});

test("pipeline: Plan → Build → Review across agents in one folder, moving on at STEP DONE (P23 S2)", async () => {
  const { presetPipeline } = await import("../src/tasks.ts");
  const steps = presetPipeline("plan-build-review", { claude: true, codex: true });
  assert.deepEqual(steps.map((s) => `${s.agent}${s.model ? ":" + s.model : ""}`), ["claude:opus", "codex", "claude:sonnet"]);
  assert.deepEqual(presetPipeline("plan-build-review", { claude: false, codex: true }).map((s) => s.agent), ["codex", "codex", "codex"]);
  const dir = repo();
  const agentJs = join(dataDir, "step-agent.js");
  writeFileSync(agentJs, "process.stdout.write('did my step|STEP DONE|'); setInterval(() => {}, 1000);");
  const launches: Array<{ agent: string; model?: string; prompt?: string }> = [];
  const db = openDb(join(dataDir, "pipe.db"));
  const tm = new TaskManager(db, {
    launcher: (agent, o) => { launches.push({ agent, model: o?.model, prompt: o?.prompt }); return { cmd: process.execPath, args: [agentJs], env: {} }; },
    home: dataDir, idleMs: 500, tickMs: 150, availability: { claude: true, codex: true, opencode: false, openrouter: false },
  });
  try {
    const first = await tm.create({ prompt: "Add CSV export", agent: "auto", repo: dir, isolate: true, pipeline: { steps, index: 0 } });
    assert.equal(first.agent, "claude");
    assert.equal(first.model, "opus");
    assert.match(launches[0].prompt!, /PLAN ONLY[\s\S]*Task: Add CSV export[\s\S]*say exactly: STEP DONE/);
    await until(() => tm.alerts({}).some((a) => a.kind === "pipeline" && /all 3 steps done/.test(a.message)), 25000);
    assert.deepEqual(launches.map((l) => `${l.agent}${l.model ? ":" + l.model : ""}`), ["claude:opus", "codex", "claude:sonnet"]);
    assert.match(launches[1].prompt!, /finished step 1 \(Plan\)[\s\S]*BUILD/);
    assert.match(launches[2].prompt!, /REVIEW/);
    const chain = tm.list().filter((t) => t.pipeline);
    assert.equal(new Set(chain.map((t) => t.cwd)).size, 1, "all steps in the same folder");
  } finally {
    await tm.dispose();
  }
});

test("Race & Judge: same task on 2 agents in separate worktrees; passing checks + smaller change wins; keep winner (P34)", async () => {
  const dir = repo();
  const agentJs = join(dataDir, "race-agent.js");
  // opus writes the right answer plus 50 noisy lines; codex writes just the answer
  writeFileSync(agentJs, `const fs = require("fs"); const model = process.argv[2] || "";
fs.writeFileSync("answer.txt", "42");
if (model === "opus") fs.writeFileSync("noise.txt", Array.from({ length: 50 }, (_, i) => "line " + i).join(String.fromCharCode(10)));
process.stdout.write("done|"); setInterval(() => {}, 1000);`);
  const db = openDb(join(dataDir, "race.db"));
  const tm = new TaskManager(db, {
    launcher: (agent, o) => ({ cmd: process.execPath, args: [agentJs, o?.model ?? ""], env: {} }),
    home: dataDir, idleMs: 500, tickMs: 150, availability: { claude: true, codex: true, opencode: false, openrouter: false },
  });
  try {
    const check = `node -e "process.exit(require('fs').readFileSync('answer.txt','utf8').trim()==='42'?0:1)"`;
    const r = await tm.race({ prompt: "fix the answer", repo: dir, verifyCmd: check });
    const contenders = tm.raceTasks(r.id);
    assert.deepEqual(contenders.map((t) => `${t.agent}${t.model ? ":" + t.model : ""}`).sort(), ["claude:opus", "codex"]);
    assert.equal(new Set(contenders.map((t) => t.cwd)).size, 2, "separate worktrees");
    await until(() => tm.getRace(r.id)?.status === "judged", 25000);
    const judged = tm.getRace(r.id)!;
    const winner = judged.results.find((x) => x.task === judged.winner)!;
    assert.equal(winner.agent, "codex", "both pass; the smaller change wins");
    assert.ok(judged.results.every((x) => x.checks === "pass"));
    assert.ok(tm.alerts({}).some((a) => a.kind === "race" && /codex wins/.test(a.message)));
    const loser = contenders.find((t) => t.id !== judged.winner)!;
    await tm.keepWinner(r.id);
    assert.equal(tm.get(loser.id), undefined);
    assert.equal(existsSync(loser.cwd), false, "loser's worktree removed");
    assert.ok(tm.get(judged.winner));
    assert.equal(tm.getRace(r.id)!.status, "kept");
    await assert.rejects(tm.race({ prompt: "x", repo: mkdtempSync(join(tmpdir(), "mm-w2-nogit-")) }), /needs a git project/);
  } finally {
    await tm.dispose();
  }
});

test("quality watch: evals on every model, results + cleanup, regression alert, router prefers the model that passes (P01)", async () => {
  const dir = repo();
  const agentJs = join(dataDir, "q-agent.js");
  // only codex (no model) writes the right answer
  writeFileSync(agentJs, `require("fs").writeFileSync("answer.txt", (process.argv[2] || "") === "" ? "42" : "41"); process.stdout.write("done|"); setInterval(() => {}, 1000);`);
  const availability = { claude: true, codex: true, opencode: false, openrouter: false };
  const db = openDb(join(dataDir, "quality.db"));
  const tm = new TaskManager(db, { launcher: (agent, o) => ({ cmd: process.execPath, args: [agentJs, o?.model ?? ""], env: {} }), home: dataDir, idleMs: 500, tickMs: 150, availability });
  try {
    assert.throws(() => tm.addEval(dir, "x", "", "npm test"), /needs a task prompt and a check/);
    const ev = tm.addEval(dir, "answer", "fix the answer", `node -e "process.exit(require('fs').readFileSync('answer.txt','utf8').trim()==='42'?0:1)"`);
    // history: opus used to pass, and failed the last 4 times
    const ins = db.prepare("INSERT INTO eval_runs (eval_id, candidate, agent, model, ok, ts) VALUES (?, ?, ?, ?, ?, ?)");
    for (let i = 0; i < 10; i++) ins.run(ev.id, "claude-opus", "claude", "opus", 1, Date.now() - 10 * 24 * 3600_000 + i);
    for (let i = 0; i < 4; i++) ins.run(ev.id, "claude-opus", "claude", "opus", 0, Date.now() - 3600_000 + i);
    const races = await tm.runQuality(dir);
    assert.equal(races.length, 1);
    const contenders = tm.raceTasks(races[0].id).length;
    assert.equal(contenders, 4, "every available model: haiku, codex, sonnet, opus");
    await until(() => tm.raceTasks(races[0].id).length === 0, 30000); // judged, recorded, cleaned up
    const scores = tm.quality(dir);
    assert.equal(scores.find((s) => s.candidate === "codex")!.passRate, 1);
    assert.equal(scores.find((s) => s.candidate === "claude-haiku")!.passRate, 0);
    const opus = scores.find((s) => s.candidate === "claude-opus")!;
    assert.equal(opus.recent, 0);
    assert.equal(opus.previous, 1);
    assert.ok(tm.alerts({}).some((a) => a.kind === "quality" && /claude opus got worse/.test(a.message)));
    // the router now prefers codex for this kind of work
    assert.equal(decide("fix the answer", { db, availability }).candidate.agent, "codex");
    assert.throws(() => tm.addEval(join(dir, "nope"), "x", "y", "z"), /project folder not found/);
  } finally {
    await tm.dispose();
  }
});

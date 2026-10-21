// Automations: repeating scheduled runs you can pause, resume, run now, with a run history.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const dataDir = mkdtempSync(join(tmpdir(), "mm-auto-data-"));
process.env.MM_DATA_DIR = dataDir;
const { openDb } = await import("../src/db.ts");
const { TaskManager, nextRun } = await import("../src/tasks.ts");

const until = async (fn: () => unknown, ms = 20_000) => { // generous: a cold first run (antivirus scanning new temp files) is slow
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await fn()) return; await new Promise((r) => setTimeout(r, 100)); }
  throw new Error("timed out waiting");
};
function repo() {
  const dir = mkdtempSync(join(tmpdir(), "mm-auto-repo-"));
  const g = (...a: string[]) => execFileSync("git", ["-C", dir, ...a], { stdio: "ignore" });
  g("init", "-q");
  writeFileSync(join(dir, "a.ts"), "export const a = 1;\n");
  g("add", ".");
  g("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "init");
  return dir;
}

test("nextRun: steps by the repeat, skips weekends for weekdays, never catches up missed slots", () => {
  const fri = new Date(2026, 9, 16, 9, 0).getTime(); // Friday 16 Oct 2026, 09:00 local
  assert.equal(new Date(nextRun("weekdays", fri, fri)).getDay(), 1, "Friday -> Monday");
  assert.equal(nextRun("daily", fri, fri), fri + 86_400_000);
  assert.equal(nextRun("hourly", fri, fri), fri + 3_600_000);
  assert.equal(nextRun("weekly", fri, fri), fri + 7 * 86_400_000);
  // Netheron was off for three days: the next run is the next slot after now, not three runs in a row.
  const now = fri + 3 * 86_400_000 + 60_000;
  const next = nextRun("daily", fri, now);
  assert.ok(next > now && next - now <= 86_400_000);
});

test("automations: list, run on schedule with history, pause, resume, run now, delete", async () => {
  const dir = repo();
  const agentJs = join(dataDir, "auto-agent.js");
  writeFileSync(agentJs, "process.stdout.write('ran|'); setInterval(() => {}, 1000);");
  const db = openDb(join(dataDir, "auto.db"));
  const tm = new TaskManager(db, { launcher: () => ({ cmd: process.execPath, args: [agentJs], env: {} }), home: dataDir, idleMs: 60_000, tickMs: 150,
    availability: { claude: true, codex: true, opencode: false, openrouter: false } });
  try {
    const soon = Date.now() + 500;
    const a = tm.schedule({ prompt: "weekday repo audit", agent: "claude", repo: dir, isolate: true }, { at: soon, repeat: "hourly", title: "Repo audit" });
    assert.equal(a.title, "Repo audit");
    assert.equal(a.repeat, "hourly");
    await until(() => tm.list().some((t) => t.title === "weekday repo audit"));
    await until(() => tm.automationRuns().length === 1);
    const listed = tm.automations().find((x) => x.id === a.id)!;
    assert.equal(listed.status, "waiting", "a repeating automation keeps waiting for its next slot");
    assert.ok(listed.run_at > Date.now(), "moved to the next hour");
    assert.equal(listed.runs, 1);
    assert.equal(listed.prompt, "weekday repo audit");

    tm.pauseAutomation(a.id);
    assert.equal(tm.automations().find((x) => x.id === a.id)!.status, "paused");
    assert.equal(tm.scheduled().some((x) => x.id === a.id), false, "paused automations don't run");
    tm.resumeAutomation(a.id);
    assert.equal(tm.automations().find((x) => x.id === a.id)!.status, "waiting");

    const t = await tm.runAutomation(a.id);
    assert.equal(t.title, "weekday repo audit");
    assert.equal(tm.automationRuns().length, 2);
    assert.equal(tm.automations().find((x) => x.id === a.id)!.runs, 2);

    tm.unschedule(a.id);
    assert.equal(tm.automations().some((x) => x.id === a.id), false, "deleted automations leave the list");
  } finally {
    for (const t of tm.list()) await tm.remove(t.id, { removeWorktree: true });
    await tm.dispose();
  }
});

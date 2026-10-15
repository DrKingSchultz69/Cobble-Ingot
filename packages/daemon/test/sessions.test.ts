// Session history: past Claude / Codex sessions read from their log folders, and resuming one as a task.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

process.env.MM_DATA_DIR = mkdtempSync(join(tmpdir(), "mm-sess-data-"));
const { readClaudeSession, readCodexSession, listSessions } = await import("../src/sessions.ts");
const { launchFor } = await import("../src/agents.ts");
const line = (o: unknown) => JSON.stringify(o) + "\n";

test("Claude and Codex session files give folder, id and the first real prompt", () => {
  const root = mkdtempSync(join(tmpdir(), "mm-sess-"));
  const cwd = join(root, "work", "app");
  const cdir = join(root, "claude", "projects", "C--work-app");
  mkdirSync(cdir, { recursive: true });
  const cfile = join(cdir, "0c6fb240-6587-4a5d-b04b-3242d351df55.jsonl");
  writeFileSync(cfile,
    line({ type: "user", cwd, isMeta: true, message: { role: "user", content: "<system-reminder>ignore</system-reminder>" } }) +
    line({ type: "user", cwd, message: { role: "user", content: "<command-name>/clear</command-name>" } }) +
    line({ type: "user", cwd, message: { role: "user", content: [{ type: "text", text: "Fix the login crash on refresh" }] } }) +
    line({ type: "assistant", cwd, message: { role: "assistant", content: [] } }));
  const c = readClaudeSession(cfile)!;
  assert.deepEqual([c.agent, c.id, c.cwd, c.title], ["claude", "0c6fb240-6587-4a5d-b04b-3242d351df55", cwd, "Fix the login crash on refresh"]);

  const xdir = join(root, "codex", "sessions", "2026", "10", "15");
  mkdirSync(xdir, { recursive: true });
  const xfile = join(xdir, "rollout-2026-10-15T10-00-00-01a0f674.jsonl");
  writeFileSync(xfile,
    line({ type: "session_meta", payload: { id: "01a0f674-a5b7-7a42-9c79-08f0d441d27f", cwd, base_instructions: { text: "x".repeat(5000) } } }) +
    line({ type: "response_item", payload: { type: "message", role: "user", content: [{ type: "input_text", text: "<environment_context>…</environment_context>" }] } }) +
    line({ type: "event_msg", payload: { type: "user_message", message: "Rebuild the usage page as a bento grid" } }));
  const x = readCodexSession(xfile)!;
  assert.deepEqual([x.agent, x.id, x.cwd, x.title], ["codex", "01a0f674-a5b7-7a42-9c79-08f0d441d27f", cwd, "Rebuild the usage page as a bento grid"]);

  const all = listSessions({ claudeHomes: [join(root, "claude")], codexHomes: [join(root, "codex")], limit: 500 })
    .filter((s) => s.cwd === cwd);
  assert.deepEqual(all.map((s) => s.agent).sort(), ["claude", "codex"]);
});

test("resume adds the CLI's resume argument and no new prompt", () => {
  const c = launchFor("claude", [], { taskId: "r1", project: "C:/repo", resume: "0c6fb240-6587-4a5d-b04b-3242d351df55", env: { MM_CLAUDE_AUTH: "sub" } });
  const i = c.args.indexOf("--resume");
  assert.ok(i >= 0 && c.args[i + 1] === "0c6fb240-6587-4a5d-b04b-3242d351df55");
  const x = launchFor("codex", [], { taskId: "r2", project: "C:/repo", resume: "01a0f674-a5b7", env: { MM_CODEX_AUTH: "sub" } });
  const j = x.args.indexOf("resume");
  assert.ok(j >= 0 && x.args[j + 1] === "01a0f674-a5b7");
});

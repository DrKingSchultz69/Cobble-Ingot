// Issues hub: GitHub through the gh CLI, Linear through its GraphQL API (both faked here), and the task prompt.
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

process.env.MM_DATA_DIR = mkdtempSync(join(tmpdir(), "mm-iss-data-"));
const { githubList, githubStatus, linearList, issuePrompt, setLinearKey, linearKey } = await import("../src/issues.ts");

test("GitHub: issues and PRs from gh, friendly errors when gh is missing or logged out", async () => {
  const repo = mkdtempSync(join(tmpdir(), "mm-iss-repo-"));
  const calls: string[][] = [];
  const run = async (cmd: string, args: string[]) => {
    calls.push([cmd, ...args]);
    if (args[0] === "issue") return JSON.stringify([{ number: 58, title: "Login loops after a 401", url: "https://github.com/o/r/issues/58", state: "OPEN", labels: [{ name: "bug" }], assignees: [{ login: "shai" }], updatedAt: "2026-10-15T10:00:00Z" }]);
    return JSON.stringify([{ number: 61, title: "Add a Monaco code tab", url: "https://github.com/o/r/pull/61", state: "OPEN", labels: [], author: { login: "claude" }, updatedAt: "2026-10-15T11:00:00Z", headRefName: "wt/monaco" }]);
  };
  const issues = await githubList(repo, "issues", run);
  assert.deepEqual([issues[0].key, issues[0].labels, issues[0].who, issues[0].state], ["#58", ["bug"], "shai", "open"]);
  const prs = await githubList(repo, "prs", run);
  assert.deepEqual([prs[0].key, prs[0].who, prs[0].branch], ["#61", "claude", "wt/monaco"]);
  assert.ok(calls.every((c) => c.includes("--json")));

  const missing = async () => { throw Object.assign(new Error("spawn gh ENOENT"), { stderr: "" }); };
  await assert.rejects(githubList(repo, "issues", missing), /isn't installed/);
  const out = async () => { throw Object.assign(new Error("x"), { stderr: "To get started with GitHub CLI, please run:  gh auth login" }); };
  await assert.rejects(githubList(repo, "issues", out), /gh auth login/);
  assert.equal((await githubStatus(async () => "shai\n")).user, "shai");
  assert.match((await githubStatus(missing)).error!, /isn't installed/);
});

test("Linear: open issues from GraphQL with the stored key; errors are passed on", async () => {
  assert.equal(linearKey(), "");
  await assert.rejects(linearList(""), /isn't connected/);
  setLinearKey("lin_api_abcdefghijklmnop");
  assert.equal(linearKey(), "lin_api_abcdefghijklmnop");
  let auth = "";
  const ok = async (_u: string, init: RequestInit) => {
    auth = String((init.headers as Record<string, string>).authorization);
    return new Response(JSON.stringify({ data: { issues: { nodes: [{ identifier: "AUR-52", title: "Mask machine ID", url: "https://linear.app/x/AUR-52", updatedAt: "2026-09-10T00:00:00Z", state: { name: "Backlog" }, assignee: null, labels: { nodes: [{ name: "privacy" }] } }] } } }));
  };
  const list = await linearList(linearKey(), ok);
  assert.equal(auth, "lin_api_abcdefghijklmnop");
  assert.deepEqual([list[0].key, list[0].state, list[0].labels], ["AUR-52", "Backlog", ["privacy"]]);
  const bad = async () => new Response(JSON.stringify({ errors: [{ message: "Authentication required" }] }), { status: 400 });
  await assert.rejects(linearList("lin_api_x", bad), /Authentication required/);
});

test("a task started from an issue says what to do and where to read it", () => {
  assert.match(issuePrompt("github", { key: "#58", title: "Login loops", url: "u" }), /gh issue view 58/);
  assert.match(issuePrompt("linear", { key: "AUR-52", title: "Mask ID", url: "https://linear.app/x" }), /Linear AUR-52: Mask ID/);
});

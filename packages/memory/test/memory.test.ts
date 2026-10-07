import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { buildContext, record } from "../src/context.ts";
import { ensureGraphSchema, ftsQuery, link, neighbors, search, upsertNode } from "../src/graph.ts";
import { extractSymbols, indexProject, projectKey, renderTree } from "../src/indexer.ts";
import { callTool, handle } from "../src/mcp.ts";

function memDb() {
  const db = new DatabaseSync(":memory:");
  ensureGraphSchema(db);
  return db;
}

function fixtureRepo() {
  const dir = mkdtempSync(join(tmpdir(), "mm-mem-"));
  mkdirSync(join(dir, "src"));
  writeFileSync(join(dir, "src", "auth.ts"), "export function verifyToken(t: string) {}\nexport class SessionStore {}\n");
  writeFileSync(join(dir, "src", "app.py"), "def handle_login():\n    pass\n");
  writeFileSync(join(dir, "README.md"), "# Demo\nPayments service with login.\n");
  return dir;
}

test("upsert is idempotent by (kind,key) and FTS stays in sync", () => {
  const db = memDb();
  const a = upsertNode(db, { kind: "note", key: "k1", title: "alpha", body: "first" });
  const b = upsertNode(db, { kind: "note", key: "k1", title: "beta", body: "second" });
  assert.equal(a, b);
  assert.equal(search(db, "alpha").length, 0);
  assert.equal(search(db, "beta")[0].id, a);
});

test("ftsQuery strips punctuation that would break MATCH", () => {
  assert.equal(ftsQuery('fix "auth"; drop -- table*'), '"fix" OR "auth" OR "drop" OR "table"');
  assert.equal(ftsQuery("!!"), "");
});

test("edges and neighbors both directions", () => {
  const db = memDb();
  const x = upsertNode(db, { kind: "task", key: "t1", title: "task" });
  const y = upsertNode(db, { kind: "decision", key: "d1", title: "use sqlite" });
  link(db, x, y, "recorded");
  assert.equal(neighbors(db, x)[0].node.title, "use sqlite");
  assert.equal(neighbors(db, y)[0].dir, "in");
});

test("extractSymbols finds TS, Python symbols with lines", () => {
  const s = extractSymbols("export function a() {}\nclass B {}\ndef c():\n");
  assert.deepEqual(s.map((x) => [x.name, x.line]), [["a", 1], ["B", 2], ["c", 3]]);
});

test("indexProject builds project/file/symbol nodes and a tree", () => {
  const db = memDb();
  const dir = fixtureRepo();
  const r = indexProject(db, dir);
  assert.equal(r.files, 3);
  assert.equal(r.symbols, 3);
  const hits = search(db, "verifyToken", { project: projectKey(dir) });
  assert.ok(hits.some((h) => h.kind === "symbol" && h.title === "verifyToken"));
  // Re-index does not duplicate.
  indexProject(db, dir);
  assert.equal((db.prepare("SELECT COUNT(*) n FROM nodes WHERE kind='file'").get() as { n: number }).n, 3);
});

test("renderTree nests and caps depth", () => {
  const t = renderTree(["a/b/c.ts", "a/d.ts", "e.md"], { maxDepth: 2 });
  assert.equal(t, "a/\n  b/ (1 files)\n  d.ts\ne.md");
});

test("record + buildContext share knowledge between agents", () => {
  const db = memDb();
  const dir = fixtureRepo();
  indexProject(db, dir);
  const project = projectKey(dir);
  record(db, { kind: "decision", title: "Use JWT for sessions", body: "stateless, works on mobile", project, agent: "codex", files: ["src/auth.ts"] });
  const ctx = buildContext(db, project, "login token");
  assert.match(ctx, /\[decision\] Use JWT for sessions/);
  assert.match(ctx, /File tree \(3 files\)/);
  assert.match(ctx, /Relevant to "login token"/);
});

test("MCP handler: initialize, tools/list, tools/call record+search", () => {
  const db = memDb();
  const dir = fixtureRepo();
  const env = { dir, project: projectKey(dir), agent: "claude" };
  assert.equal((handle(db, env, { id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } }) as { protocolVersion: string }).protocolVersion, "2025-06-18");
  assert.ok((handle(db, env, { id: 2, method: "tools/list" }) as { tools: unknown[] }).tools.length >= 5);
  assert.match(callTool(db, env, "mm_record", { kind: "bug", title: "Login loops on refresh" }), /Saved bug #\d+/);
  assert.match(callTool(db, env, "mm_search", { query: "login refresh" }), /Login loops on refresh/);
  const bad = handle(db, env, { id: 3, method: "tools/call", params: { name: "mm_record", arguments: { kind: "nope", title: "x" } } }) as { isError: boolean };
  assert.equal(bad.isError, true);
});

test("MCP server process speaks JSON-RPC over stdio", async () => {
  const dir = fixtureRepo();
  const dataDir = mkdtempSync(join(tmpdir(), "mm-data-"));
  const bin = fileURLToPath(new URL("../bin/mcp.ts", import.meta.url));
  const p = spawn(process.execPath, [bin], { env: { ...process.env, MM_PROJECT: dir, MM_DATA_DIR: dataDir }, stdio: ["pipe", "pipe", "inherit"] });
  const lines: string[] = [];
  let buf = "";
  const got = new Promise<void>((res) => {
    p.stdout.on("data", (d) => {
      buf += d;
      const parts = buf.split("\n");
      buf = parts.pop()!;
      lines.push(...parts.filter(Boolean));
      if (lines.length >= 2) res();
    });
  });
  p.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }) + "\n");
  p.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  p.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "mm_tree", arguments: {} } }) + "\n");
  await got;
  p.kill();
  const tree = JSON.parse(lines[1]);
  assert.match(tree.result.content[0].text, /src\//); // auto-indexed on first start
});

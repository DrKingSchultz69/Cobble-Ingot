import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

// launchFor writes per-task MCP/settings files into the data dir: keep tests out of the real ~/.mm.
process.env.MM_DATA_DIR = mkdtempSync(join(tmpdir(), "mm-agents-data-"));
const { argvQuote, authMode, commandLine, launchFor } = await import("../src/agents.ts");

// Arguments that break naive quoting through cmd.exe.
const NASTY = [
  'fix "a & b" | c > d',
  "100% done ^ (really) !important",
  "line one\nline two",
  "path C:\\dir\\ \"quoted\\\" trailing\\",
  "",
  `model_providers.mm={name="mm",base_url="http://127.0.0.1:4141/a/codex~t1/chatgpt",requires_openai_auth=true}`,
  "%PATH%",
];
const expected = NASTY.map((a) => a.replace(/\r?\n/g, " "));

const dir = mkdtempSync(join(tmpdir(), "mm-argv-"));
const script = join(dir, "echo-args.js");
writeFileSync(script, "process.stdout.write(JSON.stringify(process.argv.slice(2)))");

const run = (line: string) => {
  const r = spawnSync(line, { shell: true, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
};

test("argvQuote doubles backslashes before quotes and at the end", () => {
  assert.equal(argvQuote('a\\"b'), '"a\\\\\\"b"');
  assert.equal(argvQuote("C:\dir\\"), '"C:\dir\\\\"');
});

test("commandLine round-trips nasty arguments to an .exe (B-017)", () => {
  assert.deepEqual(run(commandLine({ cmd: process.execPath, args: [script, ...NASTY], env: {} })), expected);
});

test("commandLine round-trips nasty arguments through a .cmd shim like codex.cmd (B-017)", { skip: process.platform !== "win32" }, () => {
  const shim = join(dir, "echoargs.cmd");
  writeFileSync(shim, `@"${process.execPath}" "%~dp0echo-args.js" %*\r\n`);
  assert.deepEqual(run(commandLine({ cmd: shim, args: NASTY, env: {} })), expected);
});

test("launchFor wires proxy, memory MCP and prompt for each agent", () => {
  const c = launchFor("claude", [], { taskId: "t1", project: "C:/repo", model: "haiku", prompt: "hi", lean: true, env: { MM_CLAUDE_AUTH: "key" } });
  assert.match(c.env.ANTHROPIC_BASE_URL, /\/a\/claude~t1\/anthropic$/);
  assert.equal(c.logs, undefined);
  assert.ok(c.args.includes("--strict-mcp-config") && c.args.includes("--settings"));
  assert.equal(c.args.at(-1), "hi");
  const x = launchFor("codex", [], { taskId: "t2", project: "C:/Repo Dir", prompt: "go" });
  assert.ok(x.args.some((a) => a.includes("default_tools_approval_mode=\"approve\"")));
  assert.ok(x.args.includes(String.raw`projects.'c:\repo dir'.trust_level="trusted"`), x.args.join("\n"));
  const o = launchFor("opencode", [], { taskId: "t3", project: "/r", model: "openrouter/x", prompt: "p" });
  assert.equal(JSON.parse(o.env.OPENCODE_CONFIG_CONTENT).mcp.mm.type, "local");
  assert.deepEqual(o.args, ["-m", "openrouter/x", "--prompt", "p"]);
  assert.throws(() => launchFor("nope", []));
});

test("subscription logins skip the proxy and are read from session logs instead", () => {
  assert.equal(authMode("claude", {}), "sub");
  assert.equal(authMode("claude", { ANTHROPIC_API_KEY: "sk-ant-x" }), "key");
  assert.equal(authMode("claude", { ANTHROPIC_API_KEY: "sk-ant-x", MM_CLAUDE_AUTH: "sub" }), "sub");
  assert.equal(authMode("codex", { OPENAI_API_KEY: "sk-x" }), "key");
  assert.equal(authMode("codex", {}), "sub");

  const c = launchFor("claude", [], { taskId: "s1", project: "C:/repo", env: { MM_CLAUDE_AUTH: "sub", CLAUDE_CONFIG_DIR: "C:/profiles/p1/claude" } });
  assert.equal(c.env.ANTHROPIC_BASE_URL, undefined, "no proxy for a Pro/Max login");
  assert.deepEqual(c.logs, { agent: "claude", home: "C:/profiles/p1/claude" });

  const x = launchFor("codex", [], { taskId: "s2", project: "C:/repo", env: { MM_CODEX_AUTH: "sub", CODEX_HOME: "C:/profiles/p2/codex" } });
  assert.ok(!x.args.some((a) => a.includes("model_provider")), "Codex talks to OpenAI itself on a ChatGPT login");
  assert.deepEqual(x.logs, { agent: "codex", home: "C:/profiles/p2/codex" });

  const k = launchFor("codex", [], { taskId: "s3", project: "C:/repo", env: { MM_CODEX_AUTH: "key" } });
  assert.ok(k.args.some((a) => a.includes("/a/codex~s3/openai/v1")), "API keys still go through the proxy");
  assert.equal(k.logs, undefined);
});

test("agents don't inherit a parent Claude Code session's markers (they would stop transcript saving)", async () => {
  const { agentEnv } = await import("../src/pty.ts");
  const env = agentEnv({ cmd: "claude", args: [], env: { MM_X: "1" } }, {}, { PATH: "p", CLAUDE_CODE_CHILD_SESSION: "1", CLAUDECODE: "1", CLAUDE_CONFIG_DIR: "C:/cfg" });
  assert.equal(env.CLAUDE_CODE_CHILD_SESSION, undefined);
  assert.equal(env.CLAUDECODE, undefined);
  assert.equal(env.CLAUDE_CONFIG_DIR, "C:/cfg", "the user's own Claude settings are kept");
  assert.equal(env.MM_X, "1");
  assert.equal(env.PATH, "p");
});

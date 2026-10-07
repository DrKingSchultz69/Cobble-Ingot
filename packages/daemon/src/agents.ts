import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { DATA_DIR, HOST, PORT } from "./config.ts";

export type Launch = { cmd: string; args: string[]; env: Record<string, string> };

export const AGENTS = ["claude", "codex", "opencode", "shell"] as const;
export type AgentName = (typeof AGENTS)[number];

export type LaunchOpts = {
  /** Task id: tags proxy usage and memory records. */
  taskId?: string;
  /** Project folder the agent works in; memory is scoped to it. */
  project?: string;
  model?: string;
  /** Initial prompt typed into the agent. */
  prompt?: string;
  /** Claude only: load just our memory MCP server instead of every globally configured one (B-004). */
  lean?: boolean;
  /** Attach the shared-memory MCP server (default true). */
  memory?: boolean;
};

const base = (tag: string, provider: string) => `http://${HOST}:${PORT}/a/${tag}/${provider}`;
const fwd = (p: string) => p.replace(/\\/g, "/");
const MCP_BIN = fwd(fileURLToPath(new URL("../../memory/bin/mcp.ts", import.meta.url)));
const NODE = fwd(process.execPath);

function mcpEnv(agent: string, o: LaunchOpts): Record<string, string> {
  const env: Record<string, string> = { MM_AGENT: agent, MM_DATA_DIR: fwd(DATA_DIR) };
  if (o.project) env.MM_PROJECT = fwd(o.project);
  if (o.taskId) env.MM_TASK_ID = o.taskId;
  return env;
}

// How each CLI is pointed at the proxy and the shared memory. The proxy tag is the agent name
// (plus task id when there is one) so usage can be split per agent and per task.
export function launchFor(agent: string, userArgs: string[], o: LaunchOpts = {}): Launch {
  const tag = o.taskId ? `${agent}~${o.taskId}` : agent;
  const memory = o.memory !== false && agent !== "shell";
  const menv = mcpEnv(agent, o);

  switch (agent) {
    case "claude": {
      const args: string[] = [];
      if (memory) {
        const dir = join(DATA_DIR, "mcp");
        mkdirSync(dir, { recursive: true });
        const file = join(dir, `${o.taskId ?? "claude"}.json`);
        writeFileSync(file, JSON.stringify({ mcpServers: { mm: { command: NODE, args: [MCP_BIN], env: menv } } }, null, 2));
        // Our memory tools are safe to call without a prompt; file edits and shell still ask as usual.
        const settings = join(dir, `${o.taskId ?? "claude"}.settings.json`);
        writeFileSync(settings, JSON.stringify({ permissions: { allow: ["mcp__mm"] } }));
        args.push("--mcp-config", fwd(file), "--settings", fwd(settings));
        if (o.lean) args.push("--strict-mcp-config");
      }
      if (o.model) args.push("--model", o.model);
      args.push(...userArgs);
      if (o.prompt) args.push(o.prompt);
      return { cmd: "claude", args, env: { ANTHROPIC_BASE_URL: base(tag, "anthropic") } };
    }

    case "codex": {
      // ChatGPT plan login -> chatgpt backend; API key -> api.openai.com. Override with MM_CODEX_AUTH=sub|key.
      const mode = process.env.MM_CODEX_AUTH ?? (process.env.OPENAI_API_KEY ? "key" : "sub");
      const provider =
        mode === "key"
          ? `model_providers.mm={name="mm",base_url="${base(tag, "openai")}/v1",env_key="OPENAI_API_KEY",wire_api="responses"}`
          : `model_providers.mm={name="mm",base_url="${base(tag, "chatgpt")}",requires_openai_auth=true,wire_api="responses"}`;
      const args = ["-c", provider, "-c", "model_provider=mm"];
      // Pre-trust the project so every new worktree doesn't stop at Codex's "Trust this folder?" screen (B-010).
      // Codex keys trust by the lower-cased repo root, which it also resolves for linked worktrees.
      if (o.project) args.push("-c", `projects.'${o.project.replace(/\//g, "\\").toLowerCase()}'.trust_level="trusted"`);
      if (memory) {
        const envToml = Object.entries(menv).map(([k, v]) => `${k}="${v}"`).join(",");
        // Our own memory server is trusted: auto-approve its tools (otherwise `codex exec` refuses them).
        args.push("-c", `mcp_servers.mm={command="${NODE}",args=["${MCP_BIN}"],env={${envToml}},default_tools_approval_mode="approve"}`);
      }
      if (o.model) args.push("-m", o.model);
      args.push(...userArgs);
      if (o.prompt) args.push(o.prompt);
      return { cmd: "codex", args, env: {} };
    }

    case "opencode": {
      const config: Record<string, unknown> = {
        provider: {
          anthropic: { options: { baseURL: `${base(tag, "anthropic")}/v1` } },
          openai: { options: { baseURL: `${base(tag, "openai")}/v1` } },
          openrouter: { options: { baseURL: `${base(tag, "openrouter")}/v1` } },
        },
      };
      if (memory) config.mcp = { mm: { type: "local", command: [NODE, MCP_BIN], environment: menv, enabled: true } };
      const args: string[] = [];
      if (o.model) args.push("-m", o.model);
      args.push(...userArgs);
      if (o.prompt) args.push("--prompt", o.prompt);
      return { cmd: "opencode", args, env: { OPENCODE_CONFIG_CONTENT: JSON.stringify(config) } };
    }

    case "shell":
      return process.platform === "win32"
        ? { cmd: "powershell.exe", args: ["-NoLogo", ...userArgs], env: {} }
        : { cmd: process.env.SHELL ?? "bash", args: userArgs, env: {} };

    default:
      throw new Error(`unknown agent "${agent}". Use: ${AGENTS.join(" | ")}`);
  }
}

// --- Command lines (B-017) ---------------------------------------------------
// Agents are started through cmd.exe on Windows (so .cmd shims like codex.cmd resolve). Arguments go through
// two parsers: cmd.exe (metacharacters, quotes, %VAR%) and the program's argv parser. So each argument is
// argv-quoted, then every cmd metacharacter is ^-escaped — twice for .cmd/.bat targets, which re-parse %*.
// cmd.exe cannot carry a newline inside a command line, so newlines in prompts become spaces.
const CMD_META = /([()\][%!^"`<>&|;, *?])/g;
const batchCache = new Map<string, boolean>();

export function argvQuote(a: string): string {
  const s = a.replace(/\r?\n/g, " ");
  return `"${s.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\*)$/, "$1$1")}"`;
}

export function isBatchTarget(cmd: string): boolean {
  if (process.platform !== "win32") return false;
  if (/\.(cmd|bat)$/i.test(cmd)) return true;
  if (/\.(exe|com)$/i.test(cmd)) return false;
  if (!batchCache.has(cmd)) {
    let batch = false;
    try {
      const exts = (process.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD").toLowerCase().split(";");
      const hit = execFileSync("where", [cmd], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
        .split(/\r?\n/)
        .find((p) => exts.some((e) => e && p.toLowerCase().endsWith(e)));
      batch = !!hit && /\.(cmd|bat)$/i.test(hit);
    } catch { /* not found: cmd.exe will report it */ }
    batchCache.set(cmd, batch);
  }
  return batchCache.get(cmd)!;
}

export function commandLine(l: Launch): string {
  if (process.platform !== "win32") return [l.cmd, ...l.args].map((a) => `'${a.replace(/'/g, `'\\''`)}'`).join(" ");
  const esc = (s: string) => (isBatchTarget(l.cmd) ? s.replace(CMD_META, "^$1").replace(CMD_META, "^$1") : s.replace(CMD_META, "^$1"));
  return [esc(l.cmd), ...l.args.map((a) => esc(argvQuote(a)))].join(" ");
}

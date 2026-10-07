// One "complete this prompt" function for research/learn features, picked from what this machine has.
// Order: explicit MM_LLM -> OpenRouter key -> Anthropic key -> Claude Code headless (subscription) -> Codex exec (subscription).
// HTTP engines go through the mm proxy so their cost shows up in usage.
import { spawn } from "node:child_process";
import { HOST, PORT } from "../../daemon/src/config.ts";

export type LlmOpts = { system?: string; maxTokens?: number; timeoutMs?: number };
export type Llm = ((prompt: string, opts?: LlmOpts) => Promise<string>) & { engine: string };

const proxy = (provider: string) => `http://${HOST}:${PORT}/a/research/${provider}`;

export function pickEngine(env = process.env): string {
  if (env.MM_LLM) return env.MM_LLM;
  if (env.OPENROUTER_API_KEY) return "openrouter";
  if (env.ANTHROPIC_API_KEY || env.MM_FALLBACK_ANTHROPIC_KEY) return "anthropic";
  return "claude-cli";
}

export function createLlm(env = process.env): Llm {
  const engine = pickEngine(env);
  const fn = async (prompt: string, o: LlmOpts = {}) => {
    switch (engine) {
      case "openrouter":
        return openaiChat(`${proxy("openrouter")}/v1/chat/completions`, env.OPENROUTER_API_KEY!, env.MM_RESEARCH_MODEL ?? "openrouter/auto", prompt, o);
      case "anthropic":
        return anthropic(env.ANTHROPIC_API_KEY ?? env.MM_FALLBACK_ANTHROPIC_KEY!, env.MM_RESEARCH_MODEL ?? "claude-haiku-4-5", prompt, o);
      case "codex-cli":
        return codexCli(prompt, o);
      case "claude-cli":
      default:
        return claudeCli(env.MM_RESEARCH_MODEL ?? "haiku", prompt, o);
    }
  };
  return Object.assign(fn, { engine });
}

async function openaiChat(url: string, key: string, model: string, prompt: string, o: LlmOpts): Promise<string> {
  const messages = [...(o.system ? [{ role: "system", content: o.system }] : []), { role: "user", content: prompt }];
  const r = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ model, messages, max_tokens: o.maxTokens ?? 2000 }),
    signal: AbortSignal.timeout(o.timeoutMs ?? 120_000),
  });
  const j = (await r.json()) as { choices?: Array<{ message: { content: string } }>; error?: { message: string } };
  if (!r.ok) throw new Error(`LLM error ${r.status}: ${j.error?.message ?? ""}`);
  return j.choices?.[0]?.message?.content ?? "";
}

async function anthropic(key: string, model: string, prompt: string, o: LlmOpts): Promise<string> {
  const r = await fetch(`${proxy("anthropic")}/v1/messages`, {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model, max_tokens: o.maxTokens ?? 2000, system: o.system, messages: [{ role: "user", content: prompt }] }),
    signal: AbortSignal.timeout(o.timeoutMs ?? 120_000),
  });
  const j = (await r.json()) as { content?: Array<{ type: string; text: string }>; error?: { message: string } };
  if (!r.ok) throw new Error(`LLM error ${r.status}: ${j.error?.message ?? ""}`);
  return (j.content ?? []).filter((c) => c.type === "text").map((c) => c.text).join("");
}

// Claude Code in headless mode with no tools, no MCP servers and no skills: ~5K tokens per call
// instead of the ~535K a full session sends (B-004). Uses the subscription login.
function claudeCli(model: string, prompt: string, o: LlmOpts): Promise<string> {
  const args = [
    "-p", "--model", model, "--output-format", "text", "--no-session-persistence",
    "--strict-mcp-config", "--mcp-config", '"{\\"mcpServers\\":{}}"', "--disable-slash-commands", "--tools", '""',
    "--setting-sources", '""', "--system-prompt", `"${(o.system ?? "You are a precise research assistant.").replace(/"/g, '\\"')}"`,
  ];
  return runCli(`claude ${args.join(" ")}`, prompt, { ANTHROPIC_BASE_URL: proxy("anthropic") }, o.timeoutMs);
}

function codexCli(prompt: string, o: LlmOpts): Promise<string> {
  const full = o.system ? `${o.system}\n\n${prompt}` : prompt;
  return runCli("codex exec --skip-git-repo-check --sandbox read-only -", full, {}, o.timeoutMs);
}

export function runCli(cmd: string, stdin: string, env: Record<string, string>, timeoutMs = 180_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, { shell: true, env: { ...process.env, ...env }, windowsHide: true });
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      p.kill();
      reject(new Error(`LLM timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    p.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out.trim());
      else reject(new Error(`LLM CLI exited ${code}: ${(err || out).slice(-400)}`));
    });
    p.stdin.end(stdin);
  });
}

// Pull the first JSON value out of model output (models wrap JSON in prose or code fences).
export function extractJson<T = unknown>(text: string): T {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const src = fence ? fence[1] : text;
  const start = src.search(/[[{]/);
  if (start < 0) throw new Error("no JSON in model output");
  const open = src[start];
  const close = open === "[" ? "]" : "}";
  let depth = 0;
  let inStr = false;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (c === "\\") i++;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close && --depth === 0) return JSON.parse(src.slice(start, i + 1));
  }
  throw new Error("unterminated JSON in model output");
}

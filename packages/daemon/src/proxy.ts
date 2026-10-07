import { createServer, type IncomingMessage, type Server } from "node:http";
import type { DatabaseSync } from "node:sqlite";
import { costFor, UPSTREAMS } from "./config.ts";
import { logCall } from "./db.ts";
import { parseUsage } from "./usage.ts";

const MAX_CAPTURE = 8 * 1024 * 1024;
const HOP_HEADERS = new Set(["host", "connection", "content-length", "accept-encoding", "transfer-encoding", "keep-alive"]);

// URL shape: /a/<agent>/<provider>/<upstream path...>   or   /<provider>/<upstream path...>
// The agent tag may carry a task id: /a/claude~t12/anthropic/...
export function route(url: string): { agent: string; task: string; provider: string; upstream: string } | null {
  let parts = url.split("/").filter((_, i) => i > 0);
  let agent = "direct";
  let task = "";
  if (parts[0] === "a" && parts.length >= 3) {
    [agent, task = ""] = decodeURIComponent(parts[1]).split("~");
    parts = parts.slice(2);
  }
  const base = UPSTREAMS[parts[0]];
  if (!base) return null;
  return { agent, task, provider: parts[0], upstream: base + "/" + parts.slice(1).join("/") };
}

export type AuthKind = "subscription" | "api_key" | "none";

// Subscription = OAuth login (Claude Pro/Max, ChatGPT plan). API key = pay-per-token.
export function authKind(provider: string, headers: IncomingMessage["headers"]): AuthKind {
  if (provider === "chatgpt") return "subscription";
  if (provider === "openrouter") return "api_key";
  if (headers["x-api-key"]) return "api_key";
  const bearer = String(headers.authorization ?? "").replace(/^Bearer\s+/i, "");
  if (!bearer) return "none";
  if (bearer.startsWith("sk-ant-oat")) return "subscription";
  if (bearer.startsWith("sk-")) return "api_key";
  return "subscription"; // OAuth JWTs (eyJ...)
}

export type Fallback = { provider: string; upstreamPath: (path: string) => string; headers: Record<string, string> };

// Subscription hit a 429 -> retry the same request once with a pay-per-token key, if one is configured.
// Uses MM_FALLBACK_* names on purpose: setting ANTHROPIC_API_KEY would make Claude Code skip the subscription entirely.
export function fallbackFor(provider: string, env = process.env): Fallback | undefined {
  if (provider === "anthropic" && env.MM_FALLBACK_ANTHROPIC_KEY) {
    return { provider: "anthropic", upstreamPath: (p) => p, headers: { "x-api-key": env.MM_FALLBACK_ANTHROPIC_KEY } };
  }
  if ((provider === "chatgpt" || provider === "openai") && env.MM_FALLBACK_OPENAI_KEY) {
    // ChatGPT backend serves /responses; the public API serves /v1/responses.
    return {
      provider: "openai",
      upstreamPath: (p) => (provider === "chatgpt" ? "/v1" + p : p),
      headers: { authorization: `Bearer ${env.MM_FALLBACK_OPENAI_KEY}` },
    };
  }
  return undefined;
}

export function createProxy(db: DatabaseSync, upstreams = UPSTREAMS, env: NodeJS.ProcessEnv = process.env): Server {
  return createServer(async (req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json" }).end('{"ok":true}');
      return;
    }
    const r = route(req.url ?? "/");
    if (!r) {
      res.writeHead(404).end("unknown provider; use /<anthropic|openai|openrouter|chatgpt>/...");
      return;
    }
    const subPath = r.upstream.slice(UPSTREAMS[r.provider].length); // path + query after the provider prefix
    const target = (provider: string, path: string) => upstreams[provider] + path;

    // Buffer the request so it can be replayed on failover (and the model read for logging).
    const reqBody = req.method === "GET" || req.method === "HEAD" ? undefined : await readBody(req);
    const reqModel = modelFromRequest(reqBody);
    const auth = authKind(r.provider, req.headers);

    const send = async (provider: string, path: string, extra: Record<string, string> = {}) => {
      const headers = forwardHeaders(req);
      if (extra["x-api-key"]) headers.delete("authorization");
      if (extra.authorization) headers.delete("x-api-key");
      for (const [k, v] of Object.entries(extra)) headers.set(k, v);
      return fetch(target(provider, path), { method: req.method, headers, body: reqBody });
    };

    const started = Date.now();
    let upstream: Response;
    let used = { provider: r.provider, path: subPath, auth, failover: false };
    try {
      upstream = await send(r.provider, subPath);
      const fb = upstream.status === 429 && auth === "subscription" ? fallbackFor(r.provider, env) : undefined;
      if (fb) {
        // Log the rejected subscription call, then retry on the API key.
        logCall(db, row(r, { provider: r.provider, auth, model: reqModel, path: subPath, status: 429, started, u: emptyUsage() }));
        await upstream.body?.cancel();
        used = { provider: fb.provider, path: fb.upstreamPath(subPath), auth: "api_key", failover: true };
        upstream = await send(fb.provider, used.path, fb.headers);
      }
    } catch (err) {
      res.writeHead(502).end(`upstream error: ${(err as Error).message}`);
      return;
    }

    const headers: Record<string, string> = {};
    upstream.headers.forEach((v, k) => {
      if (k !== "content-encoding" && k !== "content-length" && k !== "transfer-encoding") headers[k] = v;
    });
    if (used.failover) headers["x-mm-failover"] = "api_key";
    res.writeHead(upstream.status, headers);

    const chunks: Buffer[] = [];
    let captured = 0;
    if (upstream.body) {
      for await (const chunk of upstream.body as unknown as AsyncIterable<Uint8Array>) {
        res.write(chunk);
        if (captured < MAX_CAPTURE) {
          chunks.push(Buffer.from(chunk));
          captured += chunk.length;
        }
      }
    }
    res.end();

    const u = parseUsage(Buffer.concat(chunks).toString("utf8"));
    if (u.input || u.output || u.cacheRead || u.cacheWrite || upstream.status >= 400) {
      logCall(db, row(r, { provider: used.provider, auth: used.auth, model: u.model || reqModel, path: used.path, status: upstream.status, started, u }));
    }
  });
}

function row(
  r: { agent: string; task: string },
  x: { provider: string; auth: string; model: string; path: string; status: number; started: number; u: ReturnType<typeof parseUsage> },
) {
  return {
    ts: x.started,
    agent: r.agent,
    task: r.task,
    provider: x.provider,
    auth: x.auth,
    model: x.model || "unknown",
    path: x.path.split("?")[0],
    status: x.status,
    input_tokens: x.u.input,
    output_tokens: x.u.output,
    cache_read_tokens: x.u.cacheRead,
    cache_write_tokens: x.u.cacheWrite,
    cost_usd: x.u.reportedCost ?? costFor(x.model, x.u.input, x.u.output, x.u.cacheRead, x.u.cacheWrite),
    latency_ms: Date.now() - x.started,
  };
}

const emptyUsage = () => ({ model: "", input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const parts: Buffer[] = [];
  for await (const c of req) parts.push(c as Buffer);
  return Buffer.concat(parts);
}

// B-005: rejected calls carry no model in the response, so read it from the request.
export function modelFromRequest(body: Buffer | undefined): string {
  if (!body?.length || body[0] !== 0x7b) return "";
  try {
    const m = JSON.parse(body.toString("utf8")).model;
    return typeof m === "string" ? m : "";
  } catch {
    return "";
  }
}

function forwardHeaders(req: IncomingMessage): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (HOP_HEADERS.has(k) || v === undefined) continue;
    h.set(k, Array.isArray(v) ? v.join(", ") : v);
  }
  return h;
}

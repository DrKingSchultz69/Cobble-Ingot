// Tiny router + JSON helpers so the server has no framework dependency.
import type { IncomingMessage, ServerResponse } from "node:http";

export type Ctx = { req: IncomingMessage; res: ServerResponse; params: Record<string, string>; query: URLSearchParams; body: any };
export type Handler = (ctx: Ctx) => unknown | Promise<unknown>;
type Route = { method: string; re: RegExp; keys: string[]; handler: Handler };

export class Router {
  private routes: Route[] = [];

  on(method: string, path: string, handler: Handler): this {
    const keys: string[] = [];
    const re = new RegExp("^" + path.replace(/:(\w+)/g, (_, k) => (keys.push(k), "([^/]+)")) + "$");
    this.routes.push({ method, re, keys, handler });
    return this;
  }
  get(p: string, h: Handler) { return this.on("GET", p, h); }
  post(p: string, h: Handler) { return this.on("POST", p, h); }
  delete(p: string, h: Handler) { return this.on("DELETE", p, h); }

  async handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const url = new URL(req.url ?? "/", "http://x");
    for (const r of this.routes) {
      if (r.method !== req.method) continue;
      const m = url.pathname.match(r.re);
      if (!m) continue;
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      try {
        const body = req.method === "POST" ? await readJson(req) : undefined;
        const out = await r.handler({ req, res, params, query: url.searchParams, body });
        if (!res.headersSent && out !== undefined) json(res, 200, out);
      } catch (e) {
        if (!res.headersSent) json(res, (e as { status?: number }).status ?? 400, { error: (e as Error).message });
      }
      return true;
    }
    return false;
  }
}

export function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(data));
}

export async function readJson(req: IncomingMessage, limit = 5 * 1024 * 1024): Promise<any> {
  let size = 0;
  const parts: Buffer[] = [];
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > limit) throw Object.assign(new Error("body too large"), { status: 413 });
    parts.push(c as Buffer);
  }
  const s = Buffer.concat(parts).toString("utf8");
  if (!s) return {};
  try {
    return JSON.parse(s);
  } catch {
    throw new Error("invalid JSON body");
  }
}

export const httpError = (status: number, message: string) => Object.assign(new Error(message), { status });

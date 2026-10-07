// One random token protects the workspace UI/API (needed once it's reachable from a phone or tunnel).
import { randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { IncomingMessage } from "node:http";
import { join } from "node:path";
import { DATA_DIR } from "./config.ts";

export function loadToken(dir = DATA_DIR): string {
  const file = join(dir, "token");
  if (existsSync(file)) return readFileSync(file, "utf8").trim();
  mkdirSync(dir, { recursive: true });
  const t = randomBytes(24).toString("base64url");
  writeFileSync(file, t, { mode: 0o600 });
  return t;
}

export function cookies(req: IncomingMessage): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (req.headers.cookie ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function requestToken(req: IncomingMessage): string {
  const h = req.headers.authorization;
  if (h?.startsWith("Bearer ")) return h.slice(7);
  return cookies(req).mm_token ?? new URL(req.url ?? "/", "http://x").searchParams.get("token") ?? "";
}

export function isAuthorized(req: IncomingMessage, token: string): boolean {
  const t = requestToken(req);
  return !!t && same(t, token);
}

// Browsers send Origin on WebSocket handshakes and POST/DELETE. Reject cross-site ones so another
// website open in the same browser can't drive the workspace with the user's cookie.
export function sameOrigin(req: IncomingMessage): boolean {
  const origin = req.headers.origin;
  if (!origin) return true; // non-browser clients (curl, tests, agents)
  try {
    const host = new URL(origin).host;
    // Behind a tunnel (cloudflared) the public host may only appear in X-Forwarded-Host.
    return host === req.headers.host || host === String(req.headers["x-forwarded-host"] ?? "").split(",")[0].trim();
  } catch {
    return false;
  }
}

export const tokenCookie = (token: string) => `mm_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`;

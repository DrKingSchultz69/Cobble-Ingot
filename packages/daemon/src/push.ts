// Web push (P24 S2): notifications even when no Netheron tab is open (desktop, or the phone over the https tunnel).
// Pushes carry no payload, so no message encryption is needed: the push only wakes the service worker,
// which then fetches the latest notification from this server (with the login cookie). VAPID (RFC 8292) signs
// each push request so the browser's push service knows it comes from this server.
import { createPrivateKey, generateKeyPairSync, sign } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { DATA_DIR } from "./config.ts";

const b64url = (b: Buffer) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export type Vapid = { publicKey: string; privateJwk: Record<string, string> };

/** Load (or create once) this server's VAPID key pair. */
export function vapidKeys(file = join(DATA_DIR, "vapid.json")): Vapid {
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const pub = publicKey.export({ format: "jwk" }) as { x: string; y: string };
  const raw = Buffer.concat([Buffer.from([4]), Buffer.from(pub.x, "base64url"), Buffer.from(pub.y, "base64url")]);
  const v: Vapid = { publicKey: b64url(raw), privateJwk: privateKey.export({ format: "jwk" }) as Record<string, string> };
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(v), { mode: 0o600 });
  return v;
}

/** ES256 JWT for one push service origin (valid 12 hours). */
export function vapidJwt(v: Vapid, endpoint: string, now = Date.now()): string {
  const header = b64url(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = b64url(Buffer.from(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub: "mailto:netheron@localhost" })));
  const key = createPrivateKey({ key: v.privateJwk, format: "jwk" });
  const sig = sign("sha256", Buffer.from(`${header}.${payload}`), { key, dsaEncoding: "ieee-p1363" });
  return `${header}.${payload}.${b64url(sig)}`;
}

export function ensurePushSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS push_subs (endpoint TEXT PRIMARY KEY, created INTEGER NOT NULL, agent TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS push_last (id INTEGER PRIMARY KEY CHECK (id = 1), title TEXT NOT NULL, body TEXT NOT NULL, task TEXT NOT NULL DEFAULT '', ts INTEGER NOT NULL);
  `);
}

export function subscribe(db: DatabaseSync, endpoint: string, userAgent = ""): void {
  const u = new URL(endpoint); // throws on garbage
  if (u.protocol !== "https:") throw new Error("push endpoints are https URLs from the browser");
  db.prepare("INSERT INTO push_subs (endpoint, created, agent) VALUES (?, ?, ?) ON CONFLICT(endpoint) DO NOTHING").run(endpoint, Date.now(), userAgent.slice(0, 200));
}

export function unsubscribe(db: DatabaseSync, endpoint: string): void {
  db.prepare("DELETE FROM push_subs WHERE endpoint = ?").run(endpoint);
}

export function lastNotification(db: DatabaseSync) {
  return (db.prepare("SELECT title, body, task, ts FROM push_last WHERE id = 1").get() as { title: string; body: string; task: string; ts: number } | undefined) ?? null;
}

/** Remember the notification and wake every subscribed browser. Dead subscriptions (404/410) are removed. */
export async function pushAll(db: DatabaseSync, n: { title: string; body: string; task?: string }, v = vapidKeys(), send: typeof fetch = fetch): Promise<{ sent: number; removed: number }> {
  db.prepare("INSERT INTO push_last (id, title, body, task, ts) VALUES (1, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, task = excluded.task, ts = excluded.ts")
    .run(n.title, n.body, n.task ?? "", Date.now());
  const subs = db.prepare("SELECT endpoint FROM push_subs").all() as Array<{ endpoint: string }>;
  let sent = 0;
  let removed = 0;
  await Promise.all(subs.map(async ({ endpoint }) => {
    try {
      const r = await send(endpoint, {
        method: "POST",
        headers: { TTL: "300", Urgency: "high", Authorization: `vapid t=${vapidJwt(v, endpoint)}, k=${v.publicKey}`, "Content-Length": "0" },
      });
      if (r.status === 404 || r.status === 410) { unsubscribe(db, endpoint); removed++; } else if (r.ok) sent++;
    } catch { /* offline push service: try next time */ }
  }));
  return { sent, removed };
}

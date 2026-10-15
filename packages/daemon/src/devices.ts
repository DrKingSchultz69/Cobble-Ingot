// Paired devices (phones): each gets its own key, so one lost phone can be revoked without touching the others.
// Pairing: the PC shows a QR code holding a one-time code (5 minutes, works once). The phone opens that link over
// the private network (Tailscale or Wi-Fi), the code is swapped for the phone's own key, kept as an HttpOnly cookie.
// Only hashes of codes and keys are stored. Revoking deletes the key's validity at once; the server also closes the
// phone's open connections (server.ts).
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { join } from "node:path";
import { DATA_DIR } from "./config.ts";
import type { DatabaseSync } from "node:sqlite";

export const PAIR_TTL_MS = 5 * 60_000;
export type Device = { id: string; name: string; created: number; last_seen: number; revoked_at: number; agent: string };

const hash = (s: string) => createHash("sha256").update(s).digest("hex");

export function ensureDeviceSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, created INTEGER NOT NULL,
      last_seen INTEGER NOT NULL DEFAULT 0, revoked_at INTEGER NOT NULL DEFAULT 0, agent TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS pairing_codes (code_hash TEXT PRIMARY KEY, expires INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0);
  `);
}

/** A new one-time pairing code. Older unused codes stay valid until they expire. */
export function createPairing(db: DatabaseSync, now = Date.now()): { code: string; expiresAt: number } {
  ensureDeviceSchema(db);
  db.prepare("DELETE FROM pairing_codes WHERE expires < ? OR used = 1").run(now);
  const code = randomBytes(18).toString("base64url");
  db.prepare("INSERT INTO pairing_codes (code_hash, expires) VALUES (?, ?)").run(hash(code), now + PAIR_TTL_MS);
  return { code, expiresAt: now + PAIR_TTL_MS };
}

/** Swap a pairing code for a device key. Throws if the code is unknown, used or expired. */
export function redeemPairing(db: DatabaseSync, code: string, o: { name?: string; agent?: string } = {}, now = Date.now()): { device: Device; token: string } {
  ensureDeviceSchema(db);
  const row = db.prepare("SELECT expires, used FROM pairing_codes WHERE code_hash = ?").get(hash(code)) as { expires: number; used: number } | undefined;
  if (!row) throw new Error("This pairing code isn't valid. Make a new one on the PC (Settings › Devices › Pair a phone).");
  if (row.used) throw new Error("This pairing code was already used. Make a new one on the PC.");
  if (row.expires < now) throw new Error("This pairing code expired. Make a new one on the PC.");
  // Claim the code first so two phones can't redeem it at the same moment.
  const claimed = db.prepare("UPDATE pairing_codes SET used = 1 WHERE code_hash = ? AND used = 0").run(hash(code));
  if (Number(claimed.changes) !== 1) throw new Error("This pairing code was already used. Make a new one on the PC.");
  const token = "dev_" + randomBytes(32).toString("base64url");
  const id = "d" + now.toString(36) + randomBytes(2).toString("hex");
  const name = (o.name || deviceName(o.agent ?? "")).slice(0, 60);
  db.prepare("INSERT INTO devices (id, name, token_hash, created, last_seen, agent) VALUES (?, ?, ?, ?, ?, ?)").run(id, name, hash(token), now, now, (o.agent ?? "").slice(0, 300));
  return { device: getDevice(db, id)!, token };
}

/** The device a key belongs to, if it's a live (not revoked) key. Updates "last seen" at most once a minute. */
export function deviceForToken(db: DatabaseSync, token: string, now = Date.now()): Device | undefined {
  if (!token.startsWith("dev_")) return undefined;
  ensureDeviceSchema(db);
  const h = hash(token);
  const d = db.prepare("SELECT * FROM devices WHERE token_hash = ? AND revoked_at = 0").get(h) as (Device & { token_hash: string }) | undefined;
  if (!d || !timingSafeEqual(Buffer.from(d.token_hash), Buffer.from(h))) return undefined;
  if (now - d.last_seen > 60_000) db.prepare("UPDATE devices SET last_seen = ? WHERE id = ?").run(now, d.id);
  const { token_hash: _, ...dev } = d;
  return dev;
}

export function listDevices(db: DatabaseSync): Device[] {
  ensureDeviceSchema(db);
  return db.prepare("SELECT id, name, created, last_seen, revoked_at, agent FROM devices ORDER BY revoked_at > 0, last_seen DESC").all() as Device[];
}
export function getDevice(db: DatabaseSync, id: string): Device | undefined {
  return db.prepare("SELECT id, name, created, last_seen, revoked_at, agent FROM devices WHERE id = ?").get(id) as Device | undefined;
}
export function revokeDevice(db: DatabaseSync, id: string, now = Date.now()) {
  ensureDeviceSchema(db);
  db.prepare("UPDATE devices SET revoked_at = ? WHERE id = ? AND revoked_at = 0").run(now, id);
}
export function renameDevice(db: DatabaseSync, id: string, name: string) {
  db.prepare("UPDATE devices SET name = ? WHERE id = ?").run(name.trim().slice(0, 60) || "Phone", id);
}

/** "iPhone", "Android phone", "iPad"… from the browser's user agent. */
export function deviceName(ua: string): string {
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return /Mobile/i.test(ua) ? "Android phone" : "Android tablet";
  if (/Windows/i.test(ua)) return "Windows PC";
  if (/Macintosh/i.test(ua)) return "Mac";
  return "Device";
}

/** Addresses a phone could use to reach this PC: Tailscale (100.64.0.0/10) first, then private Wi-Fi/LAN ones. */
export function reachableAddresses(): Array<{ ip: string; kind: "tailscale" | "lan"; iface: string }> {
  const out: Array<{ ip: string; kind: "tailscale" | "lan"; iface: string }> = [];
  for (const [iface, addrs] of Object.entries(networkInterfaces())) {
    for (const a of addrs ?? []) {
      if (a.family !== "IPv4" || a.internal) continue;
      const [x, y] = a.address.split(".").map(Number);
      if (x === 100 && y >= 64 && y <= 127) out.push({ ip: a.address, kind: "tailscale", iface });
      else if (x === 10 || (x === 172 && y >= 16 && y <= 31) || (x === 192 && y === 168)) out.push({ ip: a.address, kind: "lan", iface });
    }
  }
  return out.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "tailscale" ? -1 : 1));
}

/** "Network access": listen on all network addresses (so paired phones can reach this PC over Tailscale or Wi-Fi)
 *  instead of only on this PC. Saved, and read by `mm serve` at start; a change needs a restart. */
export function networkAccess(dir = DATA_DIR): boolean {
  try { return !!JSON.parse(readFileSync(join(dir, "network.json"), "utf8")).lan; } catch { return false; }
}
export function setNetworkAccess(on: boolean, dir = DATA_DIR) {
  writeFileSync(join(dir, "network.json"), JSON.stringify({ lan: on }));
}
export const hasNetworkPref = (dir = DATA_DIR) => existsSync(join(dir, "network.json"));

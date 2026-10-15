// Phone pairing: one-time QR code -> the phone's own key; revoking one phone cuts it off at once (HTTP and WebSocket).
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { WebSocket } from "ws";

const dataDir = mkdtempSync(join(tmpdir(), "mm-dev-data-"));
process.env.MM_DATA_DIR = dataDir;
const { openDb } = await import("../src/db.ts");
const dev = await import("../src/devices.ts");
const { createWorkspaceServer } = await import("../src/server.ts");
const { TaskManager } = await import("../src/tasks.ts");

test("pairing codes work once, expire after 5 minutes, and only hashes are stored", () => {
  const db = openDb(join(dataDir, "unit.db"));
  const now = Date.now();
  const p = dev.createPairing(db, now);
  const { device, token } = dev.redeemPairing(db, p.code, { agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" }, now + 1000);
  assert.equal(device.name, "iPhone");
  assert.ok(token.startsWith("dev_"));
  assert.throws(() => dev.redeemPairing(db, p.code, {}, now + 2000), /already used/);
  const late = dev.createPairing(db, now);
  assert.throws(() => dev.redeemPairing(db, late.code, {}, now + dev.PAIR_TTL_MS + 1), /expired/);
  assert.throws(() => dev.redeemPairing(db, "nope", {}, now), /isn't valid/);
  const stored = JSON.stringify(db.prepare("SELECT * FROM devices").all()) + JSON.stringify(db.prepare("SELECT * FROM pairing_codes").all());
  assert.ok(!stored.includes(token) && !stored.includes(p.code), "no raw keys or codes on disk");
  assert.equal(dev.deviceForToken(db, token)?.id, device.id);
  dev.revokeDevice(db, device.id);
  assert.equal(dev.deviceForToken(db, token), undefined, "a revoked key stops working");
});

test("server: /pair sets the phone's key, the phone can use the API and WebSocket, revoke closes both", async () => {
  const db = openDb(join(dataDir, "srv.db"));
  const tasks = new TaskManager(db, { home: dataDir });
  const { server } = createWorkspaceServer({ db, token: "owner-key", tasks, previewPort: 0 });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as AddressInfo).port;
  const base = `http://127.0.0.1:${port}`;
  const owner = (p: string, body?: unknown) => fetch(base + p, { method: body ? "POST" : "GET", headers: { authorization: "Bearer owner-key", "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  try {
    const pair = await (await owner("/api/devices/pair", {})).json();
    assert.ok(pair.code && pair.url.includes(`/pair?code=${pair.code}`));
    assert.equal(pair.reachable, false, "bound to localhost: the phone can't reach it yet");
    assert.match(pair.hint, /--lan/);

    const r = await fetch(`${base}/pair?code=${pair.code}`, { redirect: "manual", headers: { "user-agent": "Mozilla/5.0 (Linux; Android 15) Mobile" } });
    assert.equal(r.status, 302);
    const cookie = /mm_token=([^;]+)/.exec(r.headers.get("set-cookie") ?? "")![1];
    const key = decodeURIComponent(cookie);
    assert.ok(key.startsWith("dev_"));
    assert.equal((await fetch(`${base}/pair?code=${pair.code}`, { redirect: "manual" })).status, 400, "the code works once");

    const phone = (p: string, body?: unknown) => fetch(base + p, { method: body ? "POST" : "GET", headers: { cookie: `mm_token=${cookie}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    assert.equal((await phone("/api/state")).status, 200, "the phone's own key works");
    const list = await (await phone("/api/devices")).json();
    assert.equal(list.devices.length, 1);
    assert.equal(list.devices[0].name, "Android phone");
    assert.equal(list.me, list.devices[0].id);
    assert.equal((await phone("/api/devices/pair", {})).status, 403, "new phones are paired from the PC");

    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`, { headers: { cookie: `mm_token=${cookie}` } });
    await new Promise((res, rej) => { ws.once("open", res); ws.once("error", rej); });
    const closed = new Promise<number>((res) => ws.once("close", (code) => res(code)));

    await owner(`/api/devices/${list.devices[0].id}/revoke`, {});
    assert.equal(await closed, 4401, "the live connection is closed at once");
    assert.equal((await phone("/api/state")).status, 401, "and the key no longer works");
    assert.equal((await owner("/api/state")).status, 200, "the PC is unaffected");
  } finally {
    await tasks.dispose();
    server.closeAllConnections();
    server.close();
  }
});

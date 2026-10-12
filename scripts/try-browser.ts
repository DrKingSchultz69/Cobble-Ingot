// Manual check for the shared browser core (B-041). Opens a VISIBLE Netheron Chrome window and plays the
// agent: clicks, types, gets blocked, hands control to you, waits for you, resumes.
// Run: node scripts/try-browser.ts
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { createInterface } from "node:readline/promises";
import { BrowserBlocked, SharedBrowser } from "../packages/daemon/src/browser.ts";

const PAGE = `<!doctype html><title>Netheron browser check</title><body style="margin:0;font:18px sans-serif;background:#f4f4f6">
<h2 style="position:absolute;left:20px;top:0">Netheron browser check</h2>
<form action="/search" style="position:absolute;left:20px;top:80px">Search: <input name="q" style="width:220px;height:30px;font-size:16px"></form>
<label style="position:absolute;left:20px;top:140px">Password: <input type="password" style="width:200px;height:30px"></label>
<button style="position:absolute;left:20px;top:200px;width:160px;height:44px" onclick="document.getElementById('out').textContent='Next clicked ✔'">Next</button>
<button style="position:absolute;left:200px;top:200px;width:160px;height:44px" onclick="document.getElementById('out').textContent='ORDER PLACED (should never happen)'">Place order</button>
<p id="out" style="position:absolute;left:20px;top:260px;font-weight:bold"></p>
</body>`;

const server = createServer((req, res) => res.writeHead(200, { "content-type": "text/html; charset=utf-8" })
  .end(req.url === "/" ? PAGE : `<body style="font:20px sans-serif;padding:20px">You searched: <b>${decodeURIComponent((req.url ?? "").split("q=")[1] ?? "")}</b></body>`));
await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

const rl = createInterface({ input: process.stdin, output: process.stdout });
const pause = (msg: string) => rl.question(`\n👉 ${msg}  [press Enter]`);
const br = new SharedBrowser({ headless: false });
const T = "manual-check";

async function step(label: string, f: () => Promise<{ url: string; width: number; height: number }>) {
  try {
    const s = await f();
    console.log(`✔ ${label}  → page ${s.url} (screenshot ${s.width}×${s.height})`);
  } catch (e) {
    console.log(`${e instanceof BrowserBlocked ? "⛔ BLOCKED" : "✖ ERROR"} ${label}\n   ${(e as Error).message}`);
  }
}

try {
  console.log("Opening a Netheron Chrome window (separate profile, not your normal Chrome)…");
  await step("agent opens the test page", () => br.act(T, { action: "navigate", url: base + "/" }));
  await pause("A Chrome window shows 'Netheron browser check'. Watch it.");

  await step("agent clicks Next", () => br.act(T, { action: "click", x: 100, y: 222 }));
  await pause("The page should say 'Next clicked ✔'.");

  await step("agent clicks Place order (should be blocked)", () => br.act(T, { action: "click", x: 280, y: 222 }));
  await step("agent clicks the password box", () => br.act(T, { action: "click", x: 200, y: 155 }));
  await step("agent types into the password box (should be blocked)", () => br.act(T, { action: "type_text", text: "hunter2" }));
  await pause("Two ⛔ above. The page must NOT say 'ORDER PLACED', and the password box stays empty.");

  await br.handToUser(T);
  console.log("\n🙋 Control handed to YOU (like the agent calling ask_user).");
  await step("agent tries to click while you have control (should be blocked)", () => br.act(T, { action: "click", x: 100, y: 222 }));
  await pause("Your turn: in the Chrome window, type anything into the PASSWORD box yourself. Then come back here.");

  const back = await br.resume(T);
  console.log(`▶ Resumed. Agent got a fresh screenshot of ${back.url}`);
  await step("agent clicks the search box", () => br.act(T, { action: "click", x: 200, y: 95 }));
  await step("agent types 'netheron'", () => br.act(T, { action: "type_text", text: "netheron" }));
  await step("agent presses Enter", () => br.act(T, { action: "press_key", key: "Enter" }));
  await pause("The page should say 'You searched: netheron'. That's the end of the check.");
} finally {
  rl.close();
  await br.dispose();
  server.close();
  console.log("Closed. (The profile stays in ~/.mm/browser-profile.)");
}

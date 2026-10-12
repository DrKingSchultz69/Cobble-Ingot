// Shared browser core (step 1): real Chrome/Edge, headless, against a local test page.
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { mkdtempSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";

process.env.MM_DATA_DIR = mkdtempSync(join(tmpdir(), "mm-browser-data-"));
const { SharedBrowser, BrowserBlocked, findChrome, RISKY_BUTTON } = await import("../src/browser.ts");

// Elements at fixed spots so the test knows the coordinates, like an agent reading a screenshot.
const PAGE = `<!doctype html><title>t</title><body style="margin:0;height:3000px;font:16px sans-serif">
<form action="/search" style="position:absolute;left:20px;top:20px"><input id="q" name="q" style="width:200px;height:30px"></form>
<input id="pw" type="password" style="position:absolute;left:20px;top:80px;width:200px;height:30px">
<button style="position:absolute;left:20px;top:140px;width:150px;height:40px" onclick="location='/next'">Next page</button>
<button style="position:absolute;left:200px;top:140px;width:150px;height:40px" onclick="location='/ordered'">Place order</button>
<a href="/gone" style="position:absolute;left:380px;top:140px;display:block;width:150px;height:40px">Delete account</a>
<div id="dbl" style="position:absolute;left:20px;top:200px;width:150px;height:40px" ondblclick="this.textContent='double!'">dbl</div>
</body>`;

let server: Server;
let base = "";
let br: InstanceType<typeof SharedBrowser>;
const chrome = findChrome();

before(async () => {
  server = createServer((req, res) => res.writeHead(200, { "content-type": "text/html" }).end(req.url === "/" ? PAGE : `<title>x</title><p>${req.url}</p>`));
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  br = new SharedBrowser({ profileDir: mkdtempSync(join(tmpdir(), "mm-browser-profile-")), headless: true });
});
after(async () => {
  await br?.dispose();
  await new Promise((r) => server.close(r));
});

test("risky-button pattern: pay / payment / place order / buy / delete, not PayPal or 'payload'", () => {
  for (const s of ["Pay now", "Submit Payment", "Place order", "Buy", "Delete account"]) assert.ok(RISKY_BUTTON.test(s), s);
  for (const s of ["PayPal", "payload", "Next page", "Buyer guide"]) assert.ok(!RISKY_BUTTON.test(s), s);
});

test("shared browser: navigate, click, type, Enter, scroll, double-click; screenshots match the page size", { skip: !chrome && "no Chrome/Edge" }, async () => {
  let s = await br.act("t1", { action: "navigate", url: base + "/" });
  assert.equal(s.url, base + "/");
  assert.ok(s.width > 300 && s.height > 300);
  assert.equal(Buffer.from(s.image, "base64").subarray(1, 4).toString(), "PNG");
  s = await br.act("t1", { action: "click", x: 100, y: 35 }); // the search box
  s = await br.act("t1", { action: "type_text", text: "hello" });
  s = await br.act("t1", { action: "type_text", text: "netheron", clear_before: true });
  s = await br.act("t1", { action: "press_key", key: "Enter" });
  assert.equal(s.url, base + "/search?q=netheron", "typed text replaced, form submitted with Enter");
  s = await br.act("t1", { action: "navigate", url: base + "/" });
  s = await br.act("t1", { action: "double_click", x: 90, y: 220 });
  s = await br.act("t1", { action: "scroll", direction: "down", amount_pixels: 500 });
  s = await br.act("t1", { action: "click", x: 90, y: 160 - 500 + 500 }); // after scrolling, the button moved off-screen: nothing to click here
  s = await br.act("t1", { action: "scroll", direction: "up", amount_pixels: 500 });
  s = await br.act("t1", { action: "click", x: 90, y: 160 }); // Next page
  assert.equal(s.url, base + "/next");
});

test("hard blocks: password field, Place order, Delete link; bad URL schemes", { skip: !chrome && "no Chrome/Edge" }, async () => {
  await br.act("t2", { action: "navigate", url: base + "/" });
  await br.act("t2", { action: "click", x: 100, y: 95 }); // password box
  await assert.rejects(br.act("t2", { action: "type_text", text: "secret" }), (e: Error) => e instanceof BrowserBlocked && /password/.test(e.message));
  await assert.rejects(br.act("t2", { action: "click", x: 270, y: 160 }), (e: Error) => e instanceof BrowserBlocked && /Place order/.test(e.message));
  await assert.rejects(br.act("t2", { action: "double_click", x: 450, y: 160 }), /Delete account/);
  await assert.rejects(br.act("t2", { action: "navigate", url: "javascript:alert(1)" }), /http/);
  await assert.rejects(br.act("t2", { action: "navigate", url: "file:///C:/Windows/win.ini" }), /http/);
  const s = await br.screenshot("t2");
  assert.equal(s.url, base + "/", "nothing was clicked");
});

test("control: hand to user blocks every agent action; resume gives a fresh screenshot and unblocks; tabs are per task", { skip: !chrome && "no Chrome/Edge" }, async () => {
  await br.act("t3", { action: "navigate", url: base + "/next" });
  await br.handToUser("t3");
  assert.equal(br.control("t3"), "user");
  await assert.rejects(br.act("t3", { action: "click", x: 10, y: 10 }), /user has control/);
  await assert.rejects(br.act("t3", { action: "wait", seconds: 1 }), /user has control/);
  assert.equal(br.control("t1"), "agent", "other tasks keep going");
  await br.act("t1", { action: "wait", seconds: 0 });
  const s = await br.resume("t3");
  assert.equal(s.url, base + "/next");
  assert.equal(br.control("t3"), "agent");
  await br.act("t3", { action: "navigate", url: base + "/" });
  assert.equal((await br.screenshot("t1")).url, base + "/next", "t1's tab didn't move");
  await br.closeTab("t3");
  assert.equal((await br.screenshot("t3")).url, "about:blank", "a closed tab comes back fresh");
});

test("live view: frames while watched (≤ ~10/s), stop after unwatch; your input only while you have control, no agent blocks", { skip: !chrome && "no Chrome/Edge" }, async () => {
  const frames: Array<{ data: string; width: number; height: number; url: string; at: number }> = [];
  // watching before the window exists: frames start once the agent opens it
  const stop = await br.watch("t4", (f) => frames.push({ ...f, at: Date.now() }));
  assert.equal(br.has("t4"), false, "watching alone doesn't open a window");
  await br.act("t4", { action: "navigate", url: base + "/" });
  const until = async (fn: () => boolean, ms = 8000) => { const end = Date.now() + ms; while (!fn()) { if (Date.now() > end) throw new Error("timed out"); await new Promise((r) => setTimeout(r, 50)); } };
  await until(() => frames.length > 0);
  const f = frames.at(-1)!;
  assert.equal(Buffer.from(f.data, "base64").subarray(0, 2).toString("hex"), "ffd8", "JPEG");
  assert.ok(f.width > 300 && f.height > 300, `${f.width}x${f.height}`);
  assert.equal(f.url, base + "/");
  // a burst of changes: Chrome waits for our ack, so frames stay ~100 ms apart
  await br.act("t4", { action: "scroll", direction: "down", amount_pixels: 300 });
  await br.act("t4", { action: "scroll", direction: "up", amount_pixels: 300 });
  const gaps = frames.slice(1).map((x, i) => x.at - frames[i].at);
  assert.ok(gaps.every((g) => g >= 80), `gaps ${gaps.join(",")}`);

  // your input: refused while the agent drives
  await assert.rejects(br.userInput("t4", { kind: "click", x: 100, y: 95 }), /Take over first/);
  await br.handToUser("t4");
  // you may type a password (blocks are for the agent) and click anything
  await br.userInput("t4", { kind: "click", x: 100, y: 95 });
  await br.userInput("t4", { kind: "text", text: "secret" });
  const s0 = await br.screenshot("t4");
  assert.equal(s0.url, base + "/");
  await br.userInput("t4", { kind: "click", x: 100, y: 35 });
  await br.userInput("t4", { kind: "text", text: "typed by you" });
  await br.userInput("t4", { kind: "key", key: "Enter" });
  await until(() => frames.at(-1)!.url === base + "/search?q=typed+by+you");
  await br.resume("t4");
  await assert.rejects(br.userInput("t4", { kind: "key", key: "Enter" }), /Take over first/);
  await assert.rejects(br.userInput("nope", { kind: "key", key: "Enter" }), /no browser window/);

  stop();
  await new Promise((r) => setTimeout(r, 300));
  const n = frames.length;
  await br.act("t4", { action: "navigate", url: base + "/" });
  await new Promise((r) => setTimeout(r, 500));
  assert.equal(frames.length, n, "no frames after unwatch");
});

// Hands-on check of the shared browser, steps 1–3 (B-041, B-043, B-044), with NO Claude quota.
// Starts a separate practice Netheron on http://localhost:4199 (own temp data, own Chrome profile) with one
// 🌐 task. Its "agent" is a script that browses a fake shop through the same endpoints the real browser_* tools
// use: it searches, hits a login page, asks for you, waits for Resume, then tries "Place order" (blocked).
// Run: node scripts/try-browser-tab.ts     Stop: Ctrl+C
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";

const UI_PORT = 4199;
const SHOP_PORT = 4198;
const TOKEN = "try-browser";
const data = mkdtempSync(join(tmpdir(), "netheron-try-browser-"));
process.env.MM_DATA_DIR = data; // before Netheron modules load: nothing touches ~/.mm
const src = (p: string) => new URL(`../packages/${p}`, import.meta.url).href;
const { openDb } = await import(src("daemon/src/db.ts"));
const { createWorkspaceServer } = await import(src("daemon/src/server.ts"));
const { TaskManager } = await import(src("daemon/src/tasks.ts"));
const { SharedBrowser } = await import(src("daemon/src/browser.ts"));

// ---- a fake shop -------------------------------------------------------------------------------------------
const page = (title: string, body: string) => `<!doctype html><meta charset="utf-8"><title>${title}</title>
<body style="margin:0;font:18px sans-serif;background:#f6f6f8;color:#222"><div style="position:absolute;left:20px;top:0;right:20px">${body}</div></body>`;
const box = (top: number, html: string) => `<div style="position:absolute;left:0;top:${top}px">${html}</div>`;
const SHOP = page("Demo Shop", box(10, "<h2 style='margin:0'>🛍 Demo Shop</h2>")
  + box(70, `<form action="/search">Search: <input name="q" style="width:240px;height:32px;font-size:16px"></form>`));
const results = (q: string) => page("Results", box(10, `<h2 style='margin:0'>Results for “${q}”</h2>`)
  + box(70, `<a href="/login" style="display:block;width:260px;padding:12px;background:#fff;border:1px solid #ccc">👟 ${q} for $49, see details</a>`));
const LOGIN = page("Sign in", box(10, "<h2 style='margin:0'>Sign in to Demo Shop</h2>")
  + box(70, `<form action="/account" method="post">Email <input name="email" style="width:220px;height:30px"><br><br>
     Password <input type="password" name="pw" style="width:200px;height:30px"><br><br>
     <button style="width:120px;height:38px">Sign in</button></form>`));
const ACCOUNT = page("Checkout", box(10, "<h2 style='margin:0'>✅ Signed in. Checkout</h2>")
  + box(70, `<button style="width:180px;height:44px" onclick="document.getElementById('o').textContent='ORDER PLACED (only a person should be able to do this)'">Place order</button>`)
  + box(140, `<p id="o" style="font-weight:bold"></p>`));
const shop = createServer((req, res) => {
  const u = new URL(req.url ?? "/", "http://x");
  const html = u.pathname === "/search" ? results(u.searchParams.get("q") ?? "") : u.pathname === "/login" ? LOGIN : u.pathname === "/account" ? ACCOUNT : SHOP;
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(html);
});
await new Promise<void>((r) => shop.listen(SHOP_PORT, "127.0.0.1", () => r()));
const SHOP_URL = `http://127.0.0.1:${SHOP_PORT}`;

// ---- the scripted "agent" (talks to Netheron exactly like the browser_* tools do) ------------------------------
const agentJs = join(data, "agent.js");
writeFileSync(agentJs, `
const API = process.env.TRY_API, TOKEN = process.env.TRY_TOKEN, ID = process.env.TRY_TASK, SHOP = process.env.TRY_SHOP;
const say = (s) => process.stdout.write("\\r\\n🤖 " + s + "\\r\\n");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function call(path, body) {
  const r = await fetch(API + "/api/tasks/" + ID + "/browser" + path, { method: "POST", headers: { authorization: "Bearer " + TOKEN, "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, ...j };
}
const act = async (a, label) => {
  await sleep(1800); // slow enough to watch
  const r = await call("", a);
  say(r.ok ? label + "  → " + r.url : "⛔ " + label + " REFUSED: " + r.error);
  return r;
};
let resumed = null;
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => { if (d.includes("Done, continue") && resumed) resumed(); else if (d.trim()) say("(you typed: " + d.trim() + ")"); });
(async () => {
  say("Hi! I'm a scripted test agent. Open the 🌐 Browser tab on the right to watch me.");
  await sleep(4000);
  await act({ action: "navigate", url: SHOP + "/" }, "opened the shop");
  await act({ action: "click", x: 200, y: 88 }, "clicked the search box");
  await act({ action: "type_text", text: "red shoes" }, "typed 'red shoes'");
  await act({ action: "press_key", key: "Enter" }, "pressed Enter");
  await act({ action: "click", x: 120, y: 92 }, "clicked the shoes");
  await act({ action: "click", x: 200, y: 135 }, "clicked the password box");
  await act({ action: "type_text", text: "hunter2" }, "tried to type a password (should be refused)");
  await sleep(1500);
  const a = await call("/ask", { reason: "Login page: please sign in for me (any email/password)" });
  say("🙋 I called ask_user: " + (a.message || a.error));
  say("👉 YOUR TURN: in the Browser tab, click the boxes, type, click Sign in. Then press Resume.");
  await new Promise((r) => { resumed = r; });
  say("Got 'Done, continue'. Looking at the page again…");
  const s = await call("", { action: "screenshot" });
  say("I see: " + s.url);
  await act({ action: "click", x: 110, y: 92 }, "clicked Place order (should be refused)");
  const f = await call("/finish", { summary: "Searched red shoes; you signed in; I was not allowed to place the order." });
  say("✅ finish: " + (f.message || f.error));
  say("Test done. Try Take over / Resume / Show window as much as you like, then press Ctrl+C in the terminal that runs try-browser-tab.");
  setInterval(() => {}, 1 << 30);
})().catch((e) => say("crashed: " + e.message));
`);

// ---- practice Netheron -------------------------------------------------------------------------------------
const repo = join(data, "project");
const git = (...a: string[]) => execFileSync("git", a, { stdio: "ignore" });
git("init", "-q", repo);
writeFileSync(join(repo, "README.md"), "# browser practice\n");
git("-C", repo, "add", ".");
git("-C", repo, "-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "init");
const db = openDb(join(data, "mm.db"));
const tasks = new TaskManager(db, {
  launcher: (_agent: string, o: { taskId?: string }) => ({
    cmd: process.execPath, args: [agentJs],
    env: { TRY_API: `http://127.0.0.1:${UI_PORT}`, TRY_TOKEN: TOKEN, TRY_TASK: o?.taskId ?? "", TRY_SHOP: SHOP_URL },
  }),
  home: data, availability: { claude: true, codex: true, opencode: false, openrouter: false },
});
// A real (visible) Chrome window, with a practice profile so it never clashes with your normal Netheron's Chrome.
// TRY_HEADLESS=1 hides it (used to self-check this script).
const browser = new SharedBrowser({ profileDir: join(data, "browser-profile"), headless: process.env.TRY_HEADLESS === "1", imageFormat: "jpeg" });
const { server } = createWorkspaceServer({ db, token: TOKEN, tasks, previewPort: 0, browser });
await new Promise<void>((r) => server.listen(UI_PORT, "127.0.0.1", () => r()));
const t = await tasks.create({ prompt: "Buy red shoes in the Demo Shop (practice run)", agent: "claude", repo, isolate: true, browser: true });

const url = `http://localhost:${UI_PORT}/?token=${TOKEN}#task=${t.id}`;
console.log(`
Practice Netheron is running (separate from your real one, no quota used).

  1. Open: ${url}
  2. Click the task "Buy red shoes…" on the left, then the 🌐 Browser tab on the right.
  3. Follow the 🤖 lines in the task's terminal.

Ctrl+C here to stop. (A Chrome window opens too: that's the agent's own window.)
`);
const stop = async () => {
  console.log("\nStopping…");
  await tasks.dispose();
  await browser.dispose();
  server.closeAllConnections(); server.close(); shop.close();
  process.exit(0);
};
process.on("SIGINT", stop);

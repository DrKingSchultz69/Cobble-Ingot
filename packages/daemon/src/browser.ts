// Shared browser (design: docs in .vibe-wise/project-map.md). One real Chrome with its own Netheron-only
// profile; each task gets its own window. The Browser tab in Netheron shows a live view (screencast). Agents act on screenshots, one action at a time. While the user has
// control (agent called ask_user, or the user pressed Take over) every agent action is refused in code.
// Chrome is driven over its DevTools Protocol (CDP), using Node's built-in WebSocket.
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { DATA_DIR } from "./config.ts";

export type BrowserAction =
  | { action: "click" | "double_click"; x: number; y: number }
  | { action: "type_text"; text: string; clear_before?: boolean }
  | { action: "press_key"; key: string }
  | { action: "scroll"; direction: "up" | "down"; amount_pixels: number }
  | { action: "navigate"; url: string }
  | { action: "wait"; seconds: number };

export type Shot = { image: string; mime: string; width: number; height: number; url: string };
/** One live-view frame (JPEG). width/height are the page's CSS pixels: the coordinates userInput() takes. */
export type Frame = { data: string; width: number; height: number; url: string };
/** The user's own input from the live view. Allowed only while the user has control; no agent blocks apply. */
export type UserInput =
  | { kind: "click"; x: number; y: number; count?: number }
  | { kind: "scroll"; x?: number; y?: number; dy: number }
  | { kind: "key"; key: string }
  | { kind: "text"; text: string };
export type Control = "agent" | "user";

/** An action Netheron refused on purpose. The message tells the agent what to do instead. */
export class BrowserBlocked extends Error {}

// Hard blocks chosen by the user: no typing into password fields, no clicking pay / place order / buy / delete.
export const RISKY_BUTTON = /\b(pay(ment)?|place\s+order|buy|delete)\b/i;

const KEYS: Record<string, { code: string; vk: number; text?: string }> = {
  Enter: { code: "Enter", vk: 13, text: "\r" }, Tab: { code: "Tab", vk: 9 }, Escape: { code: "Escape", vk: 27 },
  Backspace: { code: "Backspace", vk: 8 }, Delete: { code: "Delete", vk: 46 }, Space: { code: "Space", vk: 32, text: " " },
  ArrowUp: { code: "ArrowUp", vk: 38 }, ArrowDown: { code: "ArrowDown", vk: 40 }, ArrowLeft: { code: "ArrowLeft", vk: 37 },
  ArrowRight: { code: "ArrowRight", vk: 39 }, Home: { code: "Home", vk: 36 }, End: { code: "End", vk: 35 },
  PageUp: { code: "PageUp", vk: 33 }, PageDown: { code: "PageDown", vk: 34 },
};

/** Chrome or Edge on this machine (override with NETHERON_CHROME). */
export function findChrome(): string {
  const env = process.env.NETHERON_CHROME;
  if (env && existsSync(env)) return env;
  const pf = [process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"], process.env.LOCALAPPDATA].filter(Boolean) as string[];
  const candidates = process.platform === "win32"
    ? pf.flatMap((d) => [join(d, "Google/Chrome/Application/chrome.exe"), join(d, "Microsoft/Edge/Application/msedge.exe")])
    : process.platform === "darwin"
      ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"]
      : ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge"];
  return candidates.find((c) => existsSync(c)) ?? "";
}

/** What an element is, so a saved step can find it again by its text after the layout moves (Forecast). */
export type Target = { tag: string; text: string; id?: string; name?: string; placeholder?: string; nth: number };
/** A JavaScript error or a failed request on the page (Forecast reports them). */
export type PageProblem = { kind: "js" | "http"; message: string; url: string; ts: number };

// Runs in the page: the actionable element at a point, or the elements matching a saved Target.
const PAGE_HELPERS = `
  const ACT = 'button, a, [role=button], [role=tab], input, textarea, select, summary, label';
  // A field's own text is its label, never what was typed into it (that changes).
  const field = (n) => n.matches('textarea, select, input:not([type=submit]):not([type=button])');
  const own = (n) => String((field(n) ? n.getAttribute('aria-label') || n.title : n.innerText || n.value || n.getAttribute('aria-label') || n.title) || '').trim().replace(/\\s+/g, ' ').slice(0, 120);
  const visible = (n) => { const r = n.getBoundingClientRect(); const s = getComputedStyle(n); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const same = (n, t) => n.tagName.toLowerCase() === t.tag && (t.id ? n.id === t.id : true)
    && (t.name ? n.getAttribute('name') === t.name : true) && (t.placeholder ? n.getAttribute('placeholder') === t.placeholder : true)
    && (t.text ? own(n) === t.text : true);
  const matches = (t) => [...document.querySelectorAll(t.tag)].filter((n) => visible(n) && same(n, t));`;

type Pending = { resolve: (v: any) => void; reject: (e: Error) => void };
type Tab = {
  targetId: string; session: string; control: Control; busy: Promise<unknown>; url: string;
  casting: boolean; lastFrame?: Frame; sentAt: number; frameTimer?: NodeJS.Timeout;
  /** Forecast: JS errors and failed requests since the last takeProblems(). Only collected once tracking is on. */
  problems?: PageProblem[];
};
const FRAME_MS = 100; // live view: at most ~10 frames a second (Chrome waits for our ack before the next one)

export class SharedBrowser {
  profileDir: string;
  headless: boolean;
  chromePath: string;
  /** "jpeg" for agents (about 5x smaller), "png" for exact pixels. */
  imageFormat: "png" | "jpeg";
  private proc: ChildProcess | null = null;
  private ws: WebSocket | null = null;
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private tabs = new Map<string, Tab>();
  private watchers = new Map<string, Set<(f: Frame) => void>>();
  private starting: Promise<void> | null = null;

  constructor(o: { profileDir?: string; headless?: boolean; chromePath?: string; imageFormat?: "png" | "jpeg" } = {}) {
    this.profileDir = o.profileDir ?? join(DATA_DIR, "browser-profile");
    this.headless = o.headless ?? false; // the user drives in a real window
    this.chromePath = o.chromePath ?? findChrome();
    this.imageFormat = o.imageFormat ?? "png";
  }

  get running() { return !!this.ws && this.ws.readyState === 1; }

  // ---- connection ----------------------------------------------------------------------------------------
  private start(): Promise<void> {
    if (this.running) return Promise.resolve();
    this.starting ??= this.launch().finally(() => { this.starting = null; });
    return this.starting;
  }

  private async launch() {
    if (!this.chromePath) throw new Error("No Chrome or Edge found. Install one, or set NETHERON_CHROME to its path.");
    mkdirSync(this.profileDir, { recursive: true });
    const portFile = join(this.profileDir, "DevToolsActivePort");
    rmSync(portFile, { force: true });
    const args = [
      `--user-data-dir=${this.profileDir}`, "--remote-debugging-port=0", "--no-first-run", "--no-default-browser-check",
      "--window-size=1280,860",
      // Agents work in background tabs: keep them drawing and running at full speed.
      "--disable-renderer-backgrounding", "--disable-background-timer-throttling", "--disable-backgrounding-occluded-windows", ...(this.headless ? ["--headless=new"] : []), "about:blank",
    ];
    this.proc = spawn(this.chromePath, args, { stdio: "ignore", windowsHide: this.headless });
    this.proc.on("exit", () => this.onClosed());
    // Chrome writes "<port>\n/devtools/browser/<id>" once its control port is open.
    const deadline = Date.now() + 15_000;
    while (!existsSync(portFile) || readFileSync(portFile, "utf8").split("\n").length < 2) {
      if (Date.now() > deadline) throw new Error("Chrome didn't open its control port (is another Chrome using the Netheron profile?)");
      await new Promise((r) => setTimeout(r, 100));
    }
    const [port, path] = readFileSync(portFile, "utf8").trim().split("\n");
    const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
    await new Promise<void>((ok, bad) => { ws.onopen = () => ok(); ws.onerror = () => bad(new Error("couldn't connect to Chrome")); });
    ws.onmessage = (ev) => this.onMessage(String(ev.data));
    ws.onclose = () => this.onClosed();
    this.ws = ws;
  }

  private onMessage(raw: string) {
    const m = JSON.parse(raw);
    if (m.id && this.pending.has(m.id)) {
      const p = this.pending.get(m.id)!;
      this.pending.delete(m.id);
      if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result);
    } else if (m.method === "Page.screencastFrame") {
      const entry = [...this.tabs].find(([, t]) => t.session === m.sessionId);
      const ack = () => this.send("Page.screencastFrameAck", { sessionId: m.params.sessionId }, m.sessionId).catch(() => {});
      if (!entry) return void ack();
      const [task, t] = entry;
      const md = m.params.metadata ?? {};
      const frame: Frame = { data: m.params.data, width: Math.round(md.deviceWidth ?? 0), height: Math.round(md.deviceHeight ?? 0), url: t.url };
      t.lastFrame = frame;
      // Chrome may have 2 frames in flight, so gate here too: at most one per FRAME_MS, and always the newest.
      const emit = () => {
        t.frameTimer = undefined;
        t.sentAt = Date.now();
        for (const fn of this.watchers.get(task) ?? []) { try { fn(t.lastFrame!); } catch { /* one bad viewer */ } }
      };
      const wait = t.sentAt + FRAME_MS - Date.now();
      if (wait <= 0) emit();
      else t.frameTimer ??= setTimeout(emit, wait);
      setTimeout(ack, FRAME_MS);
    } else if (m.method === "Runtime.exceptionThrown" || m.method === "Runtime.consoleAPICalled" || m.method === "Network.responseReceived" || m.method === "Network.loadingFailed") {
      const t = [...this.tabs.values()].find((x) => x.session === m.sessionId);
      if (!t?.problems) return;
      const p = m.params;
      let problem: PageProblem | null = null;
      if (m.method === "Runtime.exceptionThrown") problem = { kind: "js", message: String(p.exceptionDetails?.exception?.description ?? p.exceptionDetails?.text ?? "error").split("\n")[0], url: t.url, ts: Date.now() };
      else if (m.method === "Runtime.consoleAPICalled" && p.type === "error") problem = { kind: "js", message: (p.args ?? []).map((a: any) => a.value ?? a.description ?? "").join(" ").slice(0, 300), url: t.url, ts: Date.now() };
      else if (m.method === "Network.responseReceived" && p.response?.status >= 400) problem = { kind: "http", message: `${p.response.status} ${p.response.url}`, url: t.url, ts: Date.now() };
      else if (m.method === "Network.loadingFailed" && !p.canceled) problem = { kind: "http", message: `failed: ${p.errorText}`, url: t.url, ts: Date.now() };
      if (problem && t.problems.length < 200) t.problems.push(problem);
    } else if (m.method === "Page.frameNavigated" && !m.params.frame.parentId) {
      for (const t of this.tabs.values()) if (t.session === m.sessionId) t.url = m.params.frame.url;
    } else if (m.method === "Target.detachedFromTarget") {
      for (const [task, t] of this.tabs) if (t.session === m.params.sessionId) this.tabs.delete(task); // user closed the tab
    }
  }

  private onClosed() {
    this.ws = null;
    this.tabs.clear();
    for (const p of this.pending.values()) p.reject(new Error("the browser was closed"));
    this.pending.clear();
  }

  private send(method: string, params: Record<string, unknown> = {}, sessionId?: string): Promise<any> {
    if (!this.ws) return Promise.reject(new Error("the browser isn't running"));
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => { if (this.pending.delete(id)) reject(new Error(`browser didn't answer ${method}`)); }, 30_000);
    });
  }

  // ---- tabs and control ------------------------------------------------------------------------------------
  private async tab(taskId: string): Promise<Tab> {
    await this.start();
    const existing = this.tabs.get(taskId);
    if (existing) return existing;
    const { targetId } = await this.send("Target.createTarget", { url: "about:blank", newWindow: true });
    const { sessionId } = await this.send("Target.attachToTarget", { targetId, flatten: true });
    await this.send("Page.enable", {}, sessionId);
    await this.send("Runtime.enable", {}, sessionId);
    const t: Tab = { targetId, session: sessionId, control: "agent", busy: Promise.resolve(), url: "about:blank", casting: false, sentAt: 0 };
    this.tabs.set(taskId, t);
    if (this.watchers.get(taskId)?.size) await this.cast(t, true); // someone is already looking at the Browser tab
    return t;
  }

  control(taskId: string): Control { return this.tabs.get(taskId)?.control ?? "agent"; }

  /** Agent called ask_user, or the user pressed Take over: agent actions are refused until resume(). */
  async handToUser(taskId: string) {
    const t = await this.tab(taskId);
    t.control = "user";
    await this.send("Target.activateTarget", { targetId: t.targetId }).catch(() => {}); // bring the tab to front
  }

  /** User pressed Resume: the agent may act again. Returns a fresh screenshot to send with "Done, continue". */
  async resume(taskId: string): Promise<Shot> {
    const t = await this.tab(taskId);
    t.control = "agent";
    return this.screenshot(taskId);
  }

  // ---- live view ---------------------------------------------------------------------------------------
  private async cast(t: Tab, on: boolean) {
    if (t.casting === on) return;
    t.casting = on;
    if (on) await this.send("Page.startScreencast", { format: "jpeg", quality: 55, maxWidth: 1600, maxHeight: 1600, everyNthFrame: 1 }, t.session).catch(() => { t.casting = false; });
    else await this.send("Page.stopScreencast", {}, t.session).catch(() => {});
  }

  /** Live view: frames while someone watches (only when the page changes, ~10/s max). Doesn't open a window by
   *  itself: if the agent hasn't browsed yet, frames start when it does. Returns the stop function. */
  async watch(taskId: string, onFrame: (f: Frame) => void): Promise<() => void> {
    const set = this.watchers.get(taskId) ?? new Set();
    set.add(onFrame);
    this.watchers.set(taskId, set);
    const t = this.tabs.get(taskId);
    if (t) {
      if (t.lastFrame && t.casting) onFrame(t.lastFrame);
      await this.cast(t, true);
    }
    return () => {
      set.delete(onFrame);
      if (set.size) return;
      this.watchers.delete(taskId);
      const tt = this.tabs.get(taskId);
      if (tt) void this.cast(tt, false);
    };
  }

  /** Your clicks/keys from the live view. Refused while the agent has control (one driver at a time). */
  async userInput(taskId: string, ev: UserInput): Promise<void> {
    const t = this.tabs.get(taskId);
    if (!t) throw new BrowserBlocked("This task has no browser window yet.");
    if (t.control !== "user") throw new BrowserBlocked("The agent has the browser. Press Take over first.");
    const run = t.busy.then(async () => {
      if (ev.kind === "click") await this.mouse(t, Number(ev.x), Number(ev.y), [Math.min(3, Math.max(1, Number(ev.count) || 1))]);
      else if (ev.kind === "scroll") await this.wheel(t, ev.dy, ev.x, ev.y);
      else if (ev.kind === "key") await this.key(t, String(ev.key));
      else if (ev.kind === "text") await this.send("Input.insertText", { text: String(ev.text ?? "") }, t.session);
      else throw new Error("unknown input");
    });
    t.busy = run.catch(() => {});
    return run;
  }

  /** Does this task have a window right now? */
  has(taskId: string) { return this.tabs.has(taskId); }

  /** Bring the task's window to the front (opens one if needed). */
  async show(taskId: string) {
    const t = await this.tab(taskId);
    await this.send("Target.activateTarget", { targetId: t.targetId }).catch(() => {});
  }

  private guard(t: Tab) {
    if (t.control === "user") throw new BrowserBlocked("The user has control of the browser right now. Wait: you'll get a message when they hand it back.");
  }

  // ---- reading the page --------------------------------------------------------------------------------
  private async evaluate<T>(t: Tab, expression: string): Promise<T> {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true }, t.session);
    return r.result?.value as T;
  }

  /** Forecast: start collecting JS errors and failed requests for this window. */
  async trackProblems(taskId: string) {
    const t = await this.tab(taskId);
    if (t.problems) return;
    t.problems = [];
    await this.send("Network.enable", {}, t.session);
  }

  takeProblems(taskId: string): PageProblem[] {
    const t = this.tabs.get(taskId);
    if (!t?.problems) return [];
    return t.problems.splice(0);
  }

  /** The actionable element at x,y, described so it can be found again later (null on a blank spot). */
  async describe(taskId: string, x: number, y: number): Promise<Target | null> {
    const t = await this.tab(taskId);
    return this.evaluate<Target | null>(t, `(() => {${PAGE_HELPERS}
      const at = document.elementFromPoint(${Number(x)}, ${Number(y)});
      const n = at && at.closest(ACT);
      if (!n) return null;
      const t = { tag: n.tagName.toLowerCase(), text: own(n), nth: 0 };
      if (n.id) t.id = n.id;
      if (n.getAttribute('name')) t.name = n.getAttribute('name');
      if (n.getAttribute('placeholder')) t.placeholder = n.getAttribute('placeholder');
      t.nth = Math.max(0, matches(t).indexOf(n));
      return t;
    })()`);
  }

  /** Where a saved Target is now (its centre), or null if it isn't on the page. Scrolls it into view first. */
  async locate(taskId: string, target: Target): Promise<{ x: number; y: number } | null> {
    const t = await this.tab(taskId);
    return this.evaluate<{ x: number; y: number } | null>(t, `(() => {${PAGE_HELPERS}
      const t = ${JSON.stringify(target)};
      const all = matches(t);
      const n = all[t.nth] || (all.length === 1 ? all[0] : null);
      if (!n) return null;
      n.scrollIntoView({ block: 'center', inline: 'center' });
      const r = n.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    })()`);
  }

  /** Does the page show this text right now? */
  async hasText(taskId: string, text: string): Promise<boolean> {
    const t = await this.tab(taskId);
    return this.evaluate<boolean>(t, `document.body ? document.body.innerText.toLowerCase().includes(${JSON.stringify(String(text).toLowerCase())}) : false`);
  }

  async screenshot(taskId: string): Promise<Shot> {
    const t = await this.tab(taskId);
    const m = await this.send("Page.getLayoutMetrics", {}, t.session);
    const v = m.cssVisualViewport;
    // Clip at scale 1 so screenshot pixels == CSS pixels == the coordinates the agent sends back.
    const shot = await this.send("Page.captureScreenshot", {
      format: this.imageFormat, ...(this.imageFormat === "jpeg" ? { quality: 60 } : {}), clip: { x: v.pageX, y: v.pageY, width: v.clientWidth, height: v.clientHeight, scale: 1 },
    }, t.session);
    const url = await this.evaluate<string>(t, "location.href");
    return { image: shot.data, mime: `image/${this.imageFormat}`, width: Math.round(v.clientWidth), height: Math.round(v.clientHeight), url };
  }

  private async settle(t: Tab) {
    await new Promise((r) => setTimeout(r, 250));
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      const st = await this.evaluate<string>(t, "document.readyState").catch(() => "loading");
      if (st === "complete") return;
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  // ---- acting --------------------------------------------------------------------------------------------
  /** Run one agent action, then return a fresh screenshot. Actions on one tab never overlap. */
  async act(taskId: string, a: BrowserAction): Promise<Shot> {
    const t = await this.tab(taskId);
    const run = t.busy.then(() => this.run(taskId, t, a));
    t.busy = run.catch(() => {});
    return run;
  }

  private async run(taskId: string, t: Tab, a: BrowserAction): Promise<Shot> {
    this.guard(t);
    switch (a.action) {
      case "click":
      case "double_click": {
        const x = Number(a.x);
        const y = Number(a.y);
        if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) throw new Error("x and y must be coordinates inside the screenshot");
        const label = await this.evaluate<string>(t, `(() => {
          const el = document.elementFromPoint(${x}, ${y});
          if (!el) return '';
          const btn = el.closest('button, a, [role=button], input[type=submit], input[type=button]');
          const own = (n) => String(n.innerText || n.value || n.getAttribute('aria-label') || n.title || '').trim();
          if (btn) return own(btn).slice(0, 120);
          // Not a button: judge only a small element by its own text (a blank spot on the page is not "Delete").
          const t = el === document.body || el === document.documentElement ? '' : own(el);
          return t.length <= 60 ? t : '';
        })()`);
        if (RISKY_BUTTON.test(label)) throw new BrowserBlocked(`Blocked: "${label}" looks like a payment or delete button. Netheron never clicks those for an agent. Call ask_user so the user can decide.`);
        this.guard(t);
        await this.mouse(t, x, y, a.action === "double_click" ? [1, 2] : [1]);
        break;
      }
      case "type_text": {
        const focus = await this.evaluate<{ tag: string; password: boolean }>(t, `(() => {
          const el = document.activeElement;
          return { tag: el ? el.tagName : '', password: !!el && el.tagName === 'INPUT' && (el.type === 'password' || /password/i.test(el.autocomplete || '')) };
        })()`);
        if (focus.password) throw new BrowserBlocked("Blocked: the focused field is a password field. Netheron never types passwords for an agent. Call ask_user so the user can log in.");
        this.guard(t);
        if (a.clear_before) {
          await this.evaluate(t, `(() => { const el = document.activeElement; if (el && 'value' in el) { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); } else if (el && el.isContentEditable) el.textContent = ''; })()`);
        }
        await this.send("Input.insertText", { text: String(a.text ?? "") }, t.session);
        break;
      }
      case "press_key":
        await this.key(t, a.key);
        break;
      case "scroll": {
        const px = Math.min(5000, Math.abs(Number(a.amount_pixels) || 400));
        await this.wheel(t, a.direction === "up" ? -px : px);
        break;
      }
      case "navigate": {
        let u: URL;
        try { u = new URL(String(a.url)); } catch { throw new Error("navigate needs a full URL, e.g. https://example.com"); }
        if (u.protocol !== "http:" && u.protocol !== "https:") throw new BrowserBlocked("Only http:// and https:// pages can be opened.");
        await this.send("Page.navigate", { url: u.href }, t.session);
        break;
      }
      case "wait":
        await new Promise((r) => setTimeout(r, Math.min(5, Math.max(0, Number(a.seconds) || 1)) * 1000));
        break;
      default:
        throw new Error(`unknown action ${(a as { action: string }).action}`);
    }
    await this.settle(t);
    return this.screenshot(taskId);
  }

  // ---- low-level input (no checks here: callers decide who may act) --------------------------------------
  private async mouse(t: Tab, x: number, y: number, clickCounts: number[]) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) throw new Error("x and y must be coordinates inside the screenshot");
    const base = { x, y, button: "left" };
    await this.send("Input.dispatchMouseEvent", { ...base, type: "mouseMoved" }, t.session);
    for (const n of clickCounts) {
      await this.send("Input.dispatchMouseEvent", { ...base, type: "mousePressed", clickCount: n }, t.session);
      await this.send("Input.dispatchMouseEvent", { ...base, type: "mouseReleased", clickCount: n }, t.session);
    }
  }

  private async key(t: Tab, key: string) {
    const k = KEYS[key] ?? (key.length === 1 ? { code: "", vk: key.toUpperCase().charCodeAt(0), text: key } : null);
    if (!k) throw new Error(`unknown key "${key}" (use Enter, Tab, Escape, Backspace, arrows, or one character)`);
    const ev = { key: key === "Space" ? " " : key, code: k.code, windowsVirtualKeyCode: k.vk, nativeVirtualKeyCode: k.vk };
    await this.send("Input.dispatchKeyEvent", { ...ev, type: k.text ? "keyDown" : "rawKeyDown", ...(k.text ? { text: k.text } : {}) }, t.session);
    await this.send("Input.dispatchKeyEvent", { ...ev, type: "keyUp" }, t.session);
  }

  private async wheel(t: Tab, dy: number, x?: number, y?: number) {
    const m = await this.send("Page.getLayoutMetrics", {}, t.session);
    const v = m.cssVisualViewport;
    const d = Math.max(-5000, Math.min(5000, Number(dy) || 0));
    await this.send("Input.dispatchMouseEvent", {
      type: "mouseWheel", x: Number.isFinite(x) ? x : v.clientWidth / 2, y: Number.isFinite(y) ? y : v.clientHeight / 2, deltaX: 0, deltaY: d,
    }, t.session);
  }

  // ---- cleanup -------------------------------------------------------------------------------------------
  async closeTab(taskId: string) {
    const t = this.tabs.get(taskId);
    if (!t) return;
    this.tabs.delete(taskId);
    await this.send("Target.closeTarget", { targetId: t.targetId }).catch(() => {});
  }

  async dispose() {
    const p = this.proc;
    this.ws?.close();
    this.onClosed();
    if (p && p.exitCode === null) {
      const exited = new Promise((r) => p.once("exit", r));
      p.kill();
      await Promise.race([exited, new Promise((r) => setTimeout(r, 5000))]);
    }
    this.proc = null;
  }
}

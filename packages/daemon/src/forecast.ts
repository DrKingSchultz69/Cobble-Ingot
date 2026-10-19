// Forecast, first slice (design: .vibe-wise/progress.md, "Forecast design"): an agent uses every feature of
// Netheron like a real user, in a throwaway test copy with fake "echo" agents. What it does is saved as a step
// file (.netheron/forecast/<run>.json) that finds buttons by their text, so Replay can run it again after a fix.
// Issues come with a screenshot and a suggested fix; nothing is fixed until the user has reviewed them.
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadToken } from "./auth.ts";
import { DATA_DIR } from "./config.ts";
import { BrowserBlocked, type BrowserAction, type PageProblem, type SharedBrowser, type Shot, type Target } from "./browser.ts";
import type { TaskManager } from "./tasks.ts";

export const ROOT = resolve(fileURLToPath(new URL("../../..", import.meta.url)));

// ---- the step file ---------------------------------------------------------------------------------------
export type Step =
  | { do: "feature"; name: string }
  | { do: "click" | "double_click"; target: Target | null; at?: { x: number; y: number } }
  | { do: "type_text"; text: string; clear_before?: boolean }
  | { do: "press_key"; key: string }
  | { do: "scroll"; direction: "up" | "down"; amount_pixels: number }
  | { do: "navigate"; path: string }
  | { do: "wait"; seconds: number }
  | { do: "expect"; text: string };
export type Script = { version: 1; app: string; created: number; steps: Step[] };

export type StepResult = { i: number; step: Step; feature: string; ok: boolean; ms: number; error?: string; problems: PageProblem[] };
export type Issue = {
  id: number; title: string; severity: "high" | "medium" | "low"; feature: string; url: string;
  steps?: string; expected?: string; actual: string; fix: string; shot?: string; source: "agent" | "page";
};
export type Run = {
  id: string; kind: "explore" | "replay"; project: string; status: "starting" | "running" | "done" | "failed" | "stopped";
  created: number; ended?: number; taskId?: string; agent?: string; from?: string; script: string;
  results: StepResult[]; issues: Issue[]; blocked: string[]; summary?: string; error?: string;
};

/** Describe a step in one short line (report and UI). */
export function stepLabel(s: Step): string {
  switch (s.do) {
    case "feature": return `— ${s.name}`;
    case "click": case "double_click": return `${s.do === "click" ? "click" : "double-click"} ${s.target ? `"${s.target.text || s.target.placeholder || s.target.name || s.target.id || s.target.tag}"` : `at ${s.at?.x},${s.at?.y}`}`;
    case "type_text": return `type "${s.text.slice(0, 40)}"`;
    case "press_key": return `press ${s.key}`;
    case "scroll": return `scroll ${s.direction}`;
    case "navigate": return `open ${s.path}`;
    case "wait": return `wait ${s.seconds}s`;
    case "expect": return `should see "${s.text}"`;
  }
}

// ---- the analytics ------------------------------------------------------------------------------------------
export function analyse(run: Run) {
  const acts = run.results.filter((r) => r.step.do !== "feature");
  const checks = acts.filter((r) => r.step.do === "expect");
  const features = new Map<string, { name: string; steps: number; failed: number; ms: number; issues: number }>();
  const f = (name: string) => features.get(name) ?? features.set(name, { name, steps: 0, failed: 0, ms: 0, issues: 0 }).get(name)!;
  for (const r of acts) { const x = f(r.feature); x.steps++; x.ms += r.ms; if (!r.ok) x.failed++; }
  for (const i of run.issues) f(i.feature).issues++;
  const sev = { high: 0, medium: 0, low: 0 };
  for (const i of run.issues) sev[i.severity]++;
  return {
    steps: acts.length, failed: acts.filter((r) => !r.ok).length,
    checks: { passed: checks.filter((r) => r.ok).length, failed: checks.filter((r) => !r.ok).length },
    issues: sev, problems: acts.reduce((n, r) => n + r.problems.length, 0),
    ms: (run.ended ?? Date.now()) - run.created,
    features: [...features.values()],
    slowest: [...acts].sort((a, b) => b.ms - a.ms).slice(0, 5).map((r) => ({ i: r.i, label: stepLabel(r.step), ms: r.ms })),
  };
}

/** JS errors and failed requests, grouped: one issue each (the agent may not have noticed them). */
export function pageIssues(results: StepResult[], firstId: number): Issue[] {
  const seen = new Map<string, { p: PageProblem; feature: string; n: number }>();
  for (const r of results) for (const p of r.problems) {
    if (/favicon\.ico/.test(p.message)) continue;
    const key = `${p.kind}:${p.message}`;
    const e = seen.get(key);
    if (e) e.n++; else seen.set(key, { p, feature: r.feature, n: 1 });
  }
  return [...seen.values()].map(({ p, feature, n }, k) => ({
    id: firstId + k, source: "page" as const, feature, url: p.url,
    severity: p.kind === "js" || /^5\d\d /.test(p.message) || p.message.startsWith("failed:") ? "medium" as const : "low" as const,
    title: p.kind === "js" ? `JavaScript error: ${p.message.slice(0, 90)}` : `Request failed: ${p.message.slice(0, 90)}`,
    actual: `${p.message}${n > 1 ? ` (${n} times)` : ""}`,
    fix: p.kind === "js" ? "Find where this error is thrown in apps/web (the browser console shows the line) and guard it." : "Check the server route for this address in packages/daemon/src/server.ts.",
  }));
}

// ---- the test copy -------------------------------------------------------------------------------------------
/** A second Netheron on its own ports, data folder and home folder, with echo agents and no credentials. */
export type Copy = { origin: string; token: string; sample: string; stop: () => Promise<void> };
export type StartCopy = (dir: string) => Promise<Copy>;

const SECRET = /KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL/i;

export function copyEnv(dir: string, base: number, env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const home = join(dir, "home");
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) if (v !== undefined && !SECRET.test(k) && !k.startsWith("MM_")) out[k] = v;
  return Object.assign(out, {
    MM_PORT: String(base), MM_UI_PORT: String(base + 1), MM_PREVIEW_PORT: String(base + 2), MM_DATA_DIR: join(dir, "data"),
    MM_FAKE_AGENTS: "echo", MM_FORECAST_SANDBOX: join(dir, "projects"),
    // Its own home: no real Claude / Codex / GitHub logins, chat history or settings can be seen or changed.
    HOME: home, USERPROFILE: home, APPDATA: join(home, "AppData", "Roaming"), LOCALAPPDATA: join(home, "AppData", "Local"),
    CLAUDE_CONFIG_DIR: join(home, ".claude"), CODEX_HOME: join(home, ".codex"), GH_CONFIG_DIR: join(home, "gh"),
  });
}

/** The sample project test tasks run in (a tiny git repo inside the copy's folder). */
export function makeSample(dir: string): string {
  const sample = join(dir, "projects", "sample-app");
  if (existsSync(join(sample, ".git"))) return sample;
  mkdirSync(sample, { recursive: true });
  writeFileSync(join(sample, "README.md"), "# Sample app\n\nA throwaway project for Forecast's test copy of Netheron.\n");
  writeFileSync(join(sample, "index.js"), "console.log('hello from the sample app');\n");
  const g = (...a: string[]) => execFileSync("git", ["-C", sample, "-c", "user.name=Forecast", "-c", "user.email=forecast@localhost.test", ...a], { stdio: "ignore" });
  g("init", "-q"); g("add", "."); g("commit", "-qm", "sample app");
  return sample;
}

function killTree(p: ChildProcess): Promise<void> {
  if (p.exitCode !== null || !p.pid) return Promise.resolve();
  const exited = new Promise<void>((r) => p.once("exit", () => r()));
  if (process.platform === "win32") { try { execFileSync("taskkill", ["/pid", String(p.pid), "/T", "/F"], { stdio: "ignore" }); } catch { /* gone */ } }
  else p.kill();
  return Promise.race([exited, new Promise<void>((r) => setTimeout(r, 5000))]);
}

export function testCopy(base = Number(process.env.MM_FORECAST_PORT ?? 5141)): StartCopy {
  return async (dir) => {
    const env = copyEnv(dir, base);
    for (const d of [env.MM_DATA_DIR, env.APPDATA, env.LOCALAPPDATA]) mkdirSync(d, { recursive: true });
    writeFileSync(join(env.HOME, ".gitconfig"), "[user]\n\tname = Forecast\n\temail = forecast@localhost.test\n");
    const sample = makeSample(dir);
    const token = loadToken(env.MM_DATA_DIR);
    // 127.0.0.1, not localhost: browser cookies are per host name, so the copy's cookie never replaces yours.
    const origin = `http://127.0.0.1:${base + 1}`;
    try { await fetch(`${origin}/api/version`); throw new Error(`Port ${base + 1} is already in use (another Forecast run?). Set MM_FORECAST_PORT to move the test copy.`); }
    catch (e) { if ((e as Error).message.startsWith("Port")) throw e; }
    const log: string[] = [];
    const p = spawn(process.execPath, [join(ROOT, "packages", "daemon", "src", "cli.ts"), "serve"], { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    for (const s of [p.stdout, p.stderr]) s?.on("data", (d) => { log.push(String(d)); if (log.length > 50) log.shift(); });
    const deadline = Date.now() + 20_000;
    for (;;) {
      if (p.exitCode !== null) throw new Error(`The test copy stopped while starting:\n${log.join("").slice(-800)}`);
      try { if ((await fetch(`${origin}/api/version`)).status) break; } catch { /* not up yet */ }
      if (Date.now() > deadline) { await killTree(p); throw new Error("The test copy didn't start within 20 seconds."); }
      await new Promise((r) => setTimeout(r, 200));
    }
    return { origin, token, sample, stop: () => killTree(p) };
  };
}

// ---- runs ----------------------------------------------------------------------------------------------------
export function explorerPrompt(origin: string, sample: string): string {
  return `You are Forecast's tester. Test Netheron the way a real user would: use every screen, button and form, and report what breaks.

The app under test is a separate test copy of Netheron at ${origin}. Your browser window is already open on it. It is safe to use: its agents are fake "echo" agents that only repeat text, its data starts empty and is thrown away afterwards.
- When a form asks for a project folder, use: ${sample}
- Your own folder is a worktree of the Netheron code. First read apps/web/index.html (and apps/web/app.js where needed) to list every feature: sidebar views, dialogs, forms, settings, menus. Don't edit any files.

How to test:
1. For each feature call forecast_feature with its name, then use it like a user: open it, fill forms with realistic values, press its buttons, open and close its dialogs.
2. After each important action call forecast_expect with a short text the page should now show (for example "Running"). These checks become the replayable script, so pick text that is stable.
3. When something is wrong (an error, a button that does nothing, wrong or confusing text, a very slow screen, a broken layout), call forecast_issue: what you did, what you expected, what happened, and a concrete fix (file and change).
4. Netheron refuses Delete / pay buttons. Don't retry those: move on (they are listed as not tested).
5. Only call browser_ask_user if you are completely stuck.
6. When every feature is covered, call browser_finish with a short summary.`;
}

type ForecastOpts = { tasks: TaskManager; browser: () => SharedBrowser; broadcast: (m: unknown) => void; dataDir?: string; startCopy?: StartCopy; root?: string };
type Live = { run: Run; copy?: Copy; feature: string; script: Script };

export class Forecast {
  private dir: string;
  private live = new Map<string, Live>(); // run id -> live state (one run at a time)
  private startCopy: StartCopy;
  private o: ForecastOpts;

  constructor(o: ForecastOpts) {
    this.o = o;
    this.dir = join(o.dataDir ?? DATA_DIR, "forecast");
    this.startCopy = o.startCopy ?? testCopy();
    mkdirSync(this.dir, { recursive: true });
    // Runs don't survive a restart.
    for (const r of this.list()) if (r.status === "starting" || r.status === "running") { r.status = "stopped"; r.error = "Netheron was restarted during this run."; this.save(r); }
    o.tasks.on("removed", (id: string) => { const l = this.byTask(id); if (l) void this.end(l, "stopped", "The tester task was removed."); });
    o.tasks.on("task", (t?: { id: string; status: string }) => {
      const l = t && ["done", "failed", "stopped"].includes(t.status) ? this.byTask(t.id) : undefined;
      if (l) void this.end(l, t!.status === "failed" ? "failed" : "stopped", "The tester agent ended before calling browser_finish.");
    });
  }

  private runDir(id: string) { return join(this.dir, id); }
  private save(r: Run) {
    mkdirSync(this.runDir(r.id), { recursive: true });
    writeFileSync(join(this.runDir(r.id), "run.json"), JSON.stringify(r, null, 2));
    this.o.broadcast({ t: "forecast", id: r.id, status: r.status });
  }

  list(): Run[] {
    if (!existsSync(this.dir)) return [];
    return readdirSync(this.dir).flatMap((d) => {
      try { return [JSON.parse(readFileSync(join(this.dir, d, "run.json"), "utf8")) as Run]; } catch { return []; }
    }).sort((a, b) => b.created - a.created);
  }

  get(id: string): Run | undefined {
    try { return JSON.parse(readFileSync(join(this.runDir(id), "run.json"), "utf8")); } catch { return undefined; }
  }

  shotPath(id: string, name: string): string | undefined {
    if (!/^[\w.-]+\.jpg$/.test(name)) return undefined;
    const p = join(this.runDir(id), name);
    return existsSync(p) ? p : undefined;
  }

  byTask(taskId: string): Live | undefined {
    return [...this.live.values()].find((l) => l.run.taskId === taskId);
  }

  private busy() {
    if (this.live.size) throw new Error("A Forecast run is already going. Wait for it, or stop it first.");
  }

  private newRun(kind: Run["kind"], project: string, script: string, extra: Partial<Run> = {}): Run {
    const id = `f${Date.now().toString(36)}`;
    return { id, kind, project, status: "starting", created: Date.now(), script, results: [], issues: [], blocked: [], ...extra };
  }

  /** Explore: start the test copy, then a tester agent with the browser and forecast_* tools. */
  async explore(input: { agent?: string; model?: string; budgetMin?: number } = {}): Promise<Run> {
    this.busy();
    const project = this.o.root ?? ROOT;
    const run = this.newRun("explore", project, "", { agent: input.agent || "claude" });
    run.script = join(project, ".netheron", "forecast", `${run.id}.json`);
    const l: Live = { run, feature: "Start", script: { version: 1, app: "netheron", created: run.created, steps: [] } };
    this.live.set(run.id, l);
    this.save(run);
    try {
      l.copy = await this.startCopy(join(this.runDir(run.id), "copy"));
      const task = await this.o.tasks.create({
        prompt: explorerPrompt(l.copy.origin, l.copy.sample), title: "Forecast: use every feature", agent: run.agent, model: input.model,
        repo: project, browser: true, forecast: true, budgetMin: input.budgetMin ?? 40,
      });
      run.taskId = task.id;
      run.status = "running";
      this.save(run);
      // Open the window on the app (sets the copy's cookie) and start collecting page errors.
      const b = this.o.browser();
      await b.trackProblems(task.id);
      await this.record(task.id, { action: "navigate", url: `${l.copy.origin}/?token=${l.copy.token}` }, () => b.act(task.id, { action: "navigate", url: `${l.copy!.origin}/?token=${l.copy!.token}` }));
    } catch (e) {
      await this.end(l, "failed", (e as Error).message);
    }
    return run;
  }

  /** The tester's browser action, run and saved as a step (clicks keep the button's text, not its position). */
  async record(taskId: string, a: BrowserAction, act: () => Promise<Shot>): Promise<Shot> {
    const l = this.byTask(taskId);
    if (!l) return act();
    const b = this.o.browser();
    let step: Step;
    if (a.action === "click" || a.action === "double_click") {
      const target = await b.describe(taskId, a.x, a.y).catch(() => null);
      step = target ? { do: a.action, target } : { do: a.action, target: null, at: { x: a.x, y: a.y } };
    } else if (a.action === "navigate") step = { do: "navigate", path: this.appPath(l, a.url) };
    else if (a.action === "type_text") step = { do: "type_text", text: String(a.text ?? ""), ...(a.clear_before ? { clear_before: true } : {}) };
    else if (a.action === "press_key") step = { do: "press_key", key: a.key };
    else if (a.action === "scroll") step = { do: "scroll", direction: a.direction, amount_pixels: a.amount_pixels };
    else step = { do: "wait", seconds: a.seconds };
    const t0 = Date.now();
    try {
      const shot = await act();
      this.push(l, step, true, Date.now() - t0, undefined, b.takeProblems(taskId));
      return shot;
    } catch (e) {
      if (e instanceof BrowserBlocked) l.run.blocked.push(`${l.feature}: ${stepLabel(step)} (${e.message.split(".")[0]})`);
      else this.push(l, step, false, Date.now() - t0, (e as Error).message, b.takeProblems(taskId), false);
      this.save(l.run);
      throw e;
    }
  }

  /** Tester's own URLs are saved relative to the app, without the copy's token (a replay has a new one). */
  private appPath(l: Live, url: string): string {
    try {
      const u = new URL(url);
      if (!l.copy || u.origin !== l.copy.origin) return url;
      u.searchParams.delete("token");
      return u.pathname + u.search + u.hash;
    } catch { return url; }
  }

  private push(l: Live, step: Step, ok: boolean, ms: number, error?: string, problems: PageProblem[] = [], save = true) {
    if (save) l.script.steps.push(step);
    l.run.results.push({ i: l.run.results.length, step, feature: l.feature, ok, ms, ...(error ? { error } : {}), problems });
    this.save(l.run);
  }

  feature(taskId: string, name: string): string {
    const l = this.need(taskId);
    l.feature = String(name || "Untitled").slice(0, 80);
    this.push(l, { do: "feature", name: l.feature }, true, 0);
    return `Testing "${l.feature}". Steps from now on are grouped under it.`;
  }

  async expect(taskId: string, text: string): Promise<string> {
    const l = this.need(taskId);
    const want = String(text ?? "").trim();
    if (!want) throw new Error("text is required");
    const t0 = Date.now();
    const ok = await this.o.browser().hasText(taskId, want);
    this.push(l, { do: "expect", text: want }, ok, Date.now() - t0, ok ? undefined : `"${want}" is not on the page`, this.o.browser().takeProblems(taskId));
    return ok ? `Pass: the page shows "${want}".` : `Fail: "${want}" is not on the page. If that's a bug, report it with forecast_issue.`;
  }

  async issue(taskId: string, body: Record<string, unknown>): Promise<string> {
    const l = this.need(taskId);
    const id = l.run.issues.length + 1;
    let shot: string | undefined;
    let url = "";
    try {
      const s = await this.o.browser().screenshot(taskId);
      shot = `issue-${id}.jpg`;
      writeFileSync(join(this.runDir(l.run.id), shot), Buffer.from(s.image, "base64"));
      url = this.appPath(l, s.url);
    } catch { /* no screenshot: still keep the issue */ }
    const severity = ["high", "medium", "low"].includes(String(body.severity)) ? (body.severity as Issue["severity"]) : "medium";
    const s = (k: string, n = 2000) => (body[k] === undefined ? undefined : String(body[k]).slice(0, n));
    l.run.issues.push({ id, source: "agent", feature: l.feature, url, severity, title: s("title", 160) || "Untitled issue", steps: s("steps"), expected: s("expected"), actual: s("actual") ?? "", fix: s("fix") ?? "", shot });
    this.save(l.run);
    return `Saved issue #${id} with a screenshot. Keep testing.`;
  }

  /** browser_finish from the tester: the run is done. */
  async finished(taskId: string, summary: string) {
    const l = this.byTask(taskId);
    if (l) await this.end(l, "done", undefined, summary);
  }

  private need(taskId: string): Live {
    const l = this.byTask(taskId);
    if (!l) throw new Error("This task isn't a running Forecast test.");
    return l;
  }

  /** Replay a saved step file in a fresh test copy. No agent: Netheron runs the steps itself. */
  async replay(fromId: string): Promise<Run> {
    this.busy();
    const from = this.get(fromId);
    if (!from) throw new Error("no such run");
    if (!existsSync(from.script)) throw new Error(`The step file is missing: ${from.script}`);
    const script = JSON.parse(readFileSync(from.script, "utf8")) as Script;
    if (!Array.isArray(script.steps)) throw new Error("The step file has no steps.");
    const run = this.newRun("replay", from.project, from.script, { from: from.kind === "replay" ? from.from : from.id });
    const l: Live = { run, feature: "Start", script };
    this.live.set(run.id, l);
    this.save(run);
    void this.play(l).catch((e) => this.end(l, "failed", (e as Error).message));
    return run;
  }

  private async play(l: Live) {
    const key = `forecast-${l.run.id}`;
    const b = this.o.browser();
    l.copy = await this.startCopy(join(this.runDir(l.run.id), "copy"));
    l.run.status = "running";
    this.save(l.run);
    await b.trackProblems(key);
    await b.act(key, { action: "navigate", url: `${l.copy.origin}/?token=${l.copy.token}` });
    b.takeProblems(key);
    for (const step of l.script.steps) {
      if (!this.live.has(l.run.id)) return; // stopped
      if (step.do === "feature") { l.feature = step.name; this.push(l, step, true, 0, undefined, [], false); continue; }
      const t0 = Date.now();
      let error: string | undefined;
      try {
        if (step.do === "expect") { if (!(await b.hasText(key, step.text))) error = `"${step.text}" is not on the page`; }
        else if (step.do === "click" || step.do === "double_click") {
          const at = step.target ? await b.locate(key, step.target) : step.at ?? null;
          if (!at) error = `Couldn't find ${stepLabel(step).replace(/^\S+ /, "")} on the page`;
          else await b.act(key, { action: step.do, x: at.x, y: at.y });
        } else if (step.do === "navigate") {
          await b.act(key, { action: "navigate", url: step.path.startsWith("/") ? l.copy.origin + step.path : step.path });
        } else await b.act(key, { action: step.do, ...step } as unknown as BrowserAction);
      } catch (e) { error = (e as Error).message; }
      this.push(l, step, !error, Date.now() - t0, error, b.takeProblems(key), false);
    }
    await this.end(l, "done", undefined, `Replayed ${l.script.steps.length} steps.`);
  }

  async stop(id: string) {
    const l = this.live.get(id);
    if (!l) throw new Error("This run isn't going.");
    await this.end(l, "stopped", "Stopped by you.");
  }

  private async end(l: Live, status: Run["status"], error?: string, summary?: string) {
    if (!this.live.delete(l.run.id)) return;
    const r = l.run;
    r.status = status;
    r.ended = Date.now();
    if (error) r.error = error;
    if (summary) r.summary = summary.slice(0, 2000);
    r.issues.push(...pageIssues(r.results, r.issues.length + 1));
    if (r.kind === "explore" && l.script.steps.length) {
      mkdirSync(join(r.script, ".."), { recursive: true });
      writeFileSync(r.script, JSON.stringify(l.script, null, 2));
    }
    if (r.kind === "replay") await this.o.browser().closeTab(`forecast-${r.id}`).catch(() => {});
    if (r.taskId && status !== "done") { try { this.o.tasks.stop(r.taskId); } catch { /* already gone */ } }
    await l.copy?.stop().catch(() => {});
    this.save(r);
  }

  async dispose() {
    for (const l of [...this.live.values()]) await this.end(l, "stopped", "Netheron stopped.");
  }
}

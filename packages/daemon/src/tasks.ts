// Task lifecycle: route -> worktree (+ setup recipe) -> agent in a PTY -> status updates -> outcome written to memory.
// Wave 1 (docs/research/solutions): checkpoints + edit guard after every agent turn, message queue, budget,
// stuck detection, pause-until-limit-reset, live meter, cost alarms and a receipt per task.
import { EventEmitter } from "node:events";
import { existsSync } from "node:fs";
import { resolve, sep } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { buildContext, record, rulesPreamble } from "../../memory/src/context.ts";
import { ensureGraphSchema, findNode, upsertNode } from "../../memory/src/graph.ts";
import { indexProject, projectKey } from "../../memory/src/indexer.ts";
import { CATALOG, decide, ladder, type Availability, type Decision } from "../../router/src/router.ts";
import { AGENTS, launchFor, NO_MCP, type Launch } from "./agents.ts";
import { checkCall, listAlerts, saveAlert, type Alert, type AlertKind, type CallEvent } from "./alarms.ts";
import { createCheckpoint, deleteCheckpoints, guardCheck, listCheckpoints, restoreCheckpoint, type GuardWarning } from "./checkpoints.ts";
import { callEvents } from "./db.ts";
import { spawnPty, type PtySession } from "./pty.ts";
import { applyRecipe, ensureSetupSchema, getRecipe, removeLinks } from "./setup.ts";
import { deleteProfile, ensureProfileSchema, getProfile, loginCommand, profileDir, projectProfiles } from "./profiles.ts";
import { trustClaudeFolder, untrustClaudeFolder } from "./trust.ts";
import { SessionLogReader } from "./sessionlogs.ts";
import { runVerify, type VerifyResult } from "./verify.ts";
import { createWorktree, isGitRepo, removeWorktree, repoRoot, slugify, worktreeDiff } from "./worktree.ts";

export type TaskStatus = "starting" | "running" | "idle" | "done" | "failed" | "stopped";

export type Task = {
  id: string;
  title: string;
  prompt: string;
  agent: string;
  model: string;
  candidate: string;
  category: string;
  reason: string;
  repo: string;
  cwd: string;
  branch: string;
  worktree: number;
  lean: number;
  parent: string;
  status: TaskStatus;
  exit_code: number | null;
  created: number;
  updated: number;
  budget_usd: number;
  budget_min: number;
  budget_hit: number;
  stuck_at: number;
  wait_until: number;
  setup_note: string;
  setup_links: string;
  trusted: number;
  auto_handoff: number;
  handoff_from: string;
  handoff_to: string;
  checks: string; // "" | "run" | "dial"
  verify_cmd: string;
  verify_last: string; // JSON VerifyResult
  verify_tree: string;
  dial_ladder: string; // JSON [{agent, model, label}]
  dial_step: number;
  rules_given: string; // JSON [rule titles] given at launch (P26 S2)
  profile: string; // account profile id (P13), "" = the CLI's normal login
  pipeline: string; // JSON { steps: PipelineStep[], index } (P23 S2)
  step_started: number; // buffer length when the current pipeline step started
  race: string; // race id (P34 S3)
  browser: number; // 1 = this task's agent has the shared browser (opt-in)
  browser_wait: string; // why the user has the browser right now ("" = the agent has it)
};

export type Eval = { id: number; project: string; title: string; prompt: string; verify: string; created: number };
export type QualityScore = { candidate: string; agent: string; model: string; runs: number; passRate: number; recent: number; previous: number | null };
export type RaceEntry = { task: string; agent: string; model: string; status: string; checks: "pass" | "fail" | "none"; lines: number; files: number; costUsd: number; score: number };
export type Race = { id: string; prompt: string; repo: string; created: number; status: string; winner: string; verify: string; eval_id: number; results: RaceEntry[] };

export type PipelineStep = { agent: string; model?: string; instruction: string; label?: string };
export type Scheduled = { id: number; input: string; run_at: number; repeat: string; when: string; created: number; last_task: string; status: string; title: string };

/** The standard Plan → Build → Review chain; agents swap in for whatever is installed. */
export function presetPipeline(name: string, avail: { claude: boolean; codex: boolean }): PipelineStep[] {
  const strong = avail.claude ? { agent: "claude", model: "opus" } : { agent: "codex" };
  const builder = avail.codex ? { agent: "codex" } : { agent: "claude", model: "sonnet" };
  const reviewer = avail.claude ? { agent: "claude", model: "sonnet" } : { agent: "codex" };
  if (name !== "plan-build-review") throw new Error(`unknown pipeline ${name}`);
  return [
    { ...strong, label: "Plan", instruction: "Step 1 of 3, PLAN ONLY: write a short, concrete implementation plan to PLAN.md (files, steps, risks). Don't change code." },
    { ...builder, label: "Build", instruction: "Step 2 of 3, BUILD: implement the plan in PLAN.md. Keep changes focused." },
    { ...reviewer, label: "Review", instruction: "Step 3 of 3, REVIEW: review the changes against PLAN.md, fix real problems you find, then summarise what was done." },
  ];
}
const STEP_DONE = "STEP DONE";
/** Added to the prompt of tasks with the browser ticked (the user's browsing rules). */
export const BROWSER_GUIDE = `You also have a web browser: Netheron's shared Chrome, with a window of your own, through the browser_* tools.
- Work from screenshots. Call browser_screenshot first. Then do one action per turn and check the new screenshot before the next one. Coordinates are pixels in the screenshot.
- Click a field before typing. Scroll to bring things into view before clicking. Close pop-ups and cookie banners first.
- Call browser_ask_user and then stop and wait when: a login, password, 2FA code or CAPTCHA appears; a step would pay, order, buy, delete or can't be undone; or the same step failed twice.
- When the browsing part is done, call browser_finish with a short summary.
Netheron refuses to type into password fields, refuses to click pay / place order / buy / delete, and refuses every action while the user has the browser.`;
export const BROWSER_RESUME = "Done, continue. The user handed the browser back to you: call browser_screenshot first to see where things are now.";

export type NewTask = {
  prompt: string;
  title?: string;
  agent?: string; // "auto" or an agent name
  model?: string;
  repo: string;
  isolate?: boolean;
  lean?: boolean;
  parentId?: string;
  /** Stop (interrupt) the agent once this much is spent / this many minutes pass. 0 = no limit. */
  budgetUsd?: number;
  budgetMin?: number;
  /** Wave 2 #1: when stuck or rate-limited, hand the task to another agent automatically. */
  autoHandoff?: boolean;
  /** Continue in this task's folder (hand-off) instead of creating a new worktree. */
  continueIn?: string;
  /** After each turn: "run" the project's checks, or "dial" = run them and move up a model tier when they fail. */
  checks?: "" | "run" | "dial";
  /** Override the project's checks command. */
  verifyCmd?: string;
  /** Internal (hand-off): carry the dial state over. */
  dial?: { ladder: Array<{ agent: string; model?: string; label: string }>; step: number };
  /** Account profile to run under; "" = the CLI's normal login, undefined = the project's default. */
  profile?: string;
  /** Pipeline (P23 S2): steps run one after another in the same folder; this task is step `index`. */
  pipeline?: { steps: PipelineStep[]; index: number };
  /** Shared browser (opt-in): the agent gets browser_* tools and its own Chrome window. */
  browser?: boolean;
  /** Resume a past Claude / Codex session (its id) in the folder it ran in, instead of starting fresh. */
  resume?: string;
  /** Forecast explorer: also gets the forecast_* tools (needs the browser). */
  forecast?: boolean;
};

export type QueuedMessage = { id: number; task: string; text: string; created: number; sent: number };
export type Meter = {
  calls: number; errors: number; tokensIn: number; tokensOut: number; costUsd: number;
  lastModel: string; contextTokens: number; tokensPerSec: number; resetAt: number; lastCallAt: number;
};

const IDLE_MS = 15_000;
const plain = (s: string) => s.replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, "").replace(/\x1b\[[0-9;?]*[ -\/]*[@-~]/g, "").replace(/\x1b[@-Z\\\-_]/g, "").replace(/\r(?!\n)/g, "\n");
const num = (v: unknown) => Number(v) || 0;
export const WATCH = {
  stuckMs: num(process.env.MM_STUCK_MS) || 10 * 60_000,
  stuckErrors: 5,
  defaultWaitMs: 5 * 60_000,
  resumeText: "Continue where you left off; the usage limit has reset.",
};

export function ensureTaskSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      prompt TEXT NOT NULL,
      agent TEXT NOT NULL,
      model TEXT NOT NULL DEFAULT '',
      candidate TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      reason TEXT NOT NULL DEFAULT '',
      repo TEXT NOT NULL,
      cwd TEXT NOT NULL,
      branch TEXT NOT NULL DEFAULT '',
      worktree INTEGER NOT NULL DEFAULT 0,
      lean INTEGER NOT NULL DEFAULT 0,
      parent TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      exit_code INTEGER,
      created INTEGER NOT NULL,
      updated INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS evals (
      id INTEGER PRIMARY KEY, project TEXT NOT NULL, title TEXT NOT NULL, prompt TEXT NOT NULL, verify TEXT NOT NULL, created INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS eval_runs (
      id INTEGER PRIMARY KEY, eval_id INTEGER NOT NULL, candidate TEXT NOT NULL, agent TEXT NOT NULL, model TEXT NOT NULL DEFAULT '',
      ok INTEGER NOT NULL, ts INTEGER NOT NULL, race TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS races (
      id TEXT PRIMARY KEY, prompt TEXT NOT NULL, repo TEXT NOT NULL, created INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'running',
      winner TEXT NOT NULL DEFAULT '', verify TEXT NOT NULL DEFAULT '', results TEXT NOT NULL DEFAULT '[]'
    );
    CREATE TABLE IF NOT EXISTS schedule (
      id INTEGER PRIMARY KEY, input TEXT NOT NULL, run_at INTEGER NOT NULL, repeat TEXT NOT NULL DEFAULT '',
      "when" TEXT NOT NULL DEFAULT 'at', created INTEGER NOT NULL, last_task TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'waiting',
      title TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS schedule_runs (
      id INTEGER PRIMARY KEY, schedule_id INTEGER NOT NULL, task TEXT NOT NULL DEFAULT '', ts INTEGER NOT NULL, error TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS task_queue (
      id INTEGER PRIMARY KEY, task TEXT NOT NULL, text TEXT NOT NULL, created INTEGER NOT NULL, sent INTEGER NOT NULL DEFAULT 0
    );
  `);
  for (const col of ["budget_usd REAL NOT NULL DEFAULT 0", "budget_min INTEGER NOT NULL DEFAULT 0", "budget_hit INTEGER NOT NULL DEFAULT 0",
                     "stuck_at INTEGER NOT NULL DEFAULT 0", "wait_until INTEGER NOT NULL DEFAULT 0", "setup_note TEXT NOT NULL DEFAULT ''",
                     "setup_links TEXT NOT NULL DEFAULT '[]'", "trusted INTEGER NOT NULL DEFAULT 0",
                     "auto_handoff INTEGER NOT NULL DEFAULT 0", "handoff_from TEXT NOT NULL DEFAULT ''", "handoff_to TEXT NOT NULL DEFAULT ''",
                     "checks TEXT NOT NULL DEFAULT ''", "verify_cmd TEXT NOT NULL DEFAULT ''", "verify_last TEXT NOT NULL DEFAULT ''",
                     "verify_tree TEXT NOT NULL DEFAULT ''", "dial_ladder TEXT NOT NULL DEFAULT ''", "dial_step INTEGER NOT NULL DEFAULT 0",
                     "rules_given TEXT NOT NULL DEFAULT '[]'", "profile TEXT NOT NULL DEFAULT ''",
                     "pipeline TEXT NOT NULL DEFAULT ''", "step_started INTEGER NOT NULL DEFAULT 0", "race TEXT NOT NULL DEFAULT ''",
                     "browser INTEGER NOT NULL DEFAULT 0", "browser_wait TEXT NOT NULL DEFAULT ''"]) {
    try { db.exec(`ALTER TABLE tasks ADD COLUMN ${col}`); } catch { /* exists */ }
  }
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS alerts (id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, kind TEXT NOT NULL,
             task TEXT NOT NULL DEFAULT '', agent TEXT NOT NULL DEFAULT '', message TEXT NOT NULL)`);
  } catch { /* exists */ }
  try { db.exec("ALTER TABLE races ADD COLUMN eval_id INTEGER NOT NULL DEFAULT 0"); } catch { /* exists */ }
  // Sessions don't survive a daemon restart; anything still "live" is now stopped.
  db.prepare("UPDATE tasks SET status = 'stopped', wait_until = 0, updated = ? WHERE status IN ('starting','running','idle')").run(Date.now());
}

export const REPEATS = ["hourly", "daily", "weekdays", "weekly"] as const;
/** The next run of a repeating automation after `prev`. Slots missed while Netheron was off are skipped, not caught up. */
export function nextRun(repeat: string, prev: number, now = Date.now()): number {
  const step = repeat === "hourly" ? 3600_000 : repeat === "weekly" ? 7 * 86_400_000 : 86_400_000;
  let t = prev;
  do {
    t += step;
    if (repeat === "weekdays") while ([0, 6].includes(new Date(t).getDay())) t += 86_400_000;
  } while (t <= now);
  return t;
}

export class TaskManager extends EventEmitter {
  private sessions = new Map<string, PtySession>();
  private db: DatabaseSync;
  /** Usage of subscription logins, read from the CLIs' own session logs (they never pass the proxy). */
  private logs: SessionLogReader;
  private launcher: (agent: string, o: Parameters<typeof launchFor>[2]) => Launch;
  private idleTimer: NodeJS.Timeout;
  private home?: string;
  private idleMs: number;
  private guards = new Map<string, { warnings: GuardWarning[]; checkpoint: number; ts: number }>();
  private turnChain = new Map<string, Promise<void>>();
  private onCall = (c: CallEvent) => this.handleCall(c);

  private availability?: Availability;

  constructor(db: DatabaseSync, opts: { launcher?: TaskManager["launcher"]; home?: string; idleMs?: number; tickMs?: number; availability?: Availability } = {}) {
    super();
    this.db = db;
    this.home = opts.home;
    this.availability = opts.availability;
    this.idleMs = opts.idleMs ?? IDLE_MS;
    ensureTaskSchema(db);
    ensureGraphSchema(db);
    ensureSetupSchema(db);
    ensureProfileSchema(db);
    this.logs = new SessionLogReader(db);
    this.launcher = opts.launcher ?? ((agent, o) => launchFor(agent, [], o));
    this.idleTimer = setInterval(() => this.tick(), opts.tickMs ?? 2_000);
    this.idleTimer.unref();
    callEvents.on("call", this.onCall);
  }

  list(): Task[] {
    return this.db.prepare("SELECT * FROM tasks ORDER BY created DESC LIMIT 200").all() as Task[];
  }

  get(id: string): Task | undefined {
    return this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Task | undefined;
  }

  session(id: string): PtySession | undefined {
    return this.sessions.get(id);
  }

  route(prompt: string): Decision {
    return decide(prompt, { db: this.db, availability: this.availability });
  }

  async create(input: NewTask): Promise<Task> {
    const prompt = input.prompt.trim();
    if (!prompt && input.agent !== "shell" && !input.resume) throw new Error("prompt is required");
    if (input.resume && !["claude", "codex"].includes(input.agent ?? "")) throw new Error("only Claude and Codex sessions can be resumed");
    if (!input.repo || !existsSync(input.repo)) throw new Error(`project folder not found: ${input.repo}`);
    let repo = resolve(input.repo);
    // Forecast's test copy: tasks may only use the sample projects inside its own folder, never a real repo.
    const sandbox = process.env.MM_FORECAST_SANDBOX;
    if (sandbox && !(repo + sep).toLowerCase().startsWith(resolve(sandbox).toLowerCase() + sep)) {
      throw new Error(`Forecast test copy: only projects inside ${resolve(sandbox)} can be used here.`);
    }
    const git = await isGitRepo(repo);
    if (git) repo = await repoRoot(repo);

    // Pick agent + model.
    let agent = input.agent && input.agent !== "auto" ? input.agent : "";
    let model = input.model ?? "";
    let candidate = "";
    let category = "";
    let reason = "chosen by you";
    const from = input.continueIn ? this.get(input.continueIn) : undefined;
    if (input.continueIn && !from) throw new Error("task to continue not found");
    let dial = input.dial;
    const pipe = input.pipeline;
    if (pipe) {
      const step = pipe.steps[pipe.index];
      if (!step) throw new Error("pipeline has no such step");
      agent = step.agent;
      model = step.model ?? "";
      reason = `Pipeline step ${pipe.index + 1}/${pipe.steps.length}: ${step.label ?? step.agent}`;
    }
    if (input.checks === "dial" && !dial) {
      const steps = ladder(prompt, { availability: this.availability, startAt: agent ? { agent, model: model || undefined } : undefined });
      if (!steps.length) throw new Error("Budget Dial: no models available for this task");
      dial = { ladder: steps.map((c) => ({ agent: c.agent, model: c.model, label: c.label })), step: 0 };
      agent = steps[0].agent;
      model = steps[0].model ?? "";
      candidate = steps[0].id;
      category = this.route(prompt).category;
      reason = `Budget Dial: start small (${steps[0].label}), move up only if checks fail`;
    }
    if (!agent) {
      const exclude = [...(from ? this.chainAgents(from.id) : []), ...(input.browser ? [...NO_MCP, "shell"] : [])];
      const d = decide(prompt, { db: this.db, availability: this.availability, exclude: exclude.length ? exclude : undefined });
      agent = d.candidate.agent;
      model = model || d.candidate.model || "";
      candidate = d.candidate.id;
      category = d.category;
      reason = d.reason;
    } else {
      if (!(AGENTS as readonly string[]).includes(agent)) throw new Error(`unknown agent ${agent}`);
      category = this.route(prompt || "shell").category;
      candidate = CATALOG.find((c) => c.agent === agent && (!model || c.model === model))?.id ?? agent;
    }

    if (input.browser && (NO_MCP.has(agent) || agent === "shell")) {
      throw new Error(`${agent} can't use the browser: it has no tool connection (MCP). Pick Claude Code, Codex or OpenCode.`);
    }
    const profileId = input.profile !== undefined ? input.profile : projectProfiles(this.db, repo)[agent] ?? "";
    const profile = profileId ? getProfile(this.db, profileId) : undefined;
    if (profileId && !profile) throw new Error("account profile not found");
    if (profile && profile.agent !== agent && agent !== "shell") throw new Error(`profile "${profile.name}" is for ${profile.agent}, not ${agent}`);
    const id = `t${Date.now().toString(36)}`;
    const title = (input.title || prompt.split("\n")[0] || agent).slice(0, 80);

    // Isolate in a worktree when possible.
    let cwd = repo;
    let branch = "";
    let worktree = 0;
    if (from) {
      // Hand-off: same folder and branch as the previous agent. The folder stays owned by the first task.
      cwd = from.cwd;
      branch = from.branch;
    } else if (input.resume) {
      cwd = resolve(input.repo); // a session belongs to the exact folder it ran in
    } else if (git && input.isolate !== false && agent !== "shell") {
      const wt = await createWorktree(repo, `${slugify(title, 24)}-${id}`);
      cwd = wt.path;
      branch = wt.branch;
      worktree = 1;
    }

    // Memory: index on first use, register the task node, build the hand-off prompt.
    const project = projectKey(repo);
    if (!findNode(this.db, "project", project)) {
      try { indexProject(this.db, repo); } catch { /* best effort */ }
    }
    let fullPrompt = prompt;
    if (pipe && !from) {
      fullPrompt = `${pipe.steps[pipe.index].instruction}\n\nTask: ${prompt}\n\nWhen this step is complete, say exactly: ${STEP_DONE}`;
    }
    if (input.parentId) {
      const parent = this.get(input.parentId);
      if (parent) {
        fullPrompt = `${prompt}\n\nThis continues task "${parent.title}" (done by ${parent.agent}). Call mm_get_context first to see what it decided and changed.`;
      }
    }
    let rulesGiven: string[] = [];
    if (fullPrompt && agent !== "shell") {
      // P26: one set of project rules for every agent, whatever its own instruction-file format.
      const rules = rulesPreamble(this.db, project);
      if (rules.text) {
        fullPrompt = `${rules.text}\n\n${fullPrompt}`;
        rulesGiven = (this.db.prepare(`SELECT title FROM nodes WHERE id IN (${rules.ids.join(",")})`).all() as Array<{ title: string }>).map((r) => r.title);
      }
      if (NO_MCP.has(agent)) {
        // No MCP: hand over the shared memory up front (decisions, outcomes, file tree), trimmed.
        const ctx = buildContext(this.db, project, prompt).slice(0, 6000);
        fullPrompt += `\n\nShared project memory from Netheron (other agents' decisions and outcomes):\n${ctx}`;
      } else {
        fullPrompt += "\n\n(Shared memory is available through the mm_* tools: read context with mm_get_context, save decisions with mm_record.)";
      }
      if (input.browser) fullPrompt += `\n\n${BROWSER_GUIDE}`;
    }
    upsertNode(this.db, { kind: "task", key: id, title, body: prompt, project, data: { agent, model, branch } });

    const now = Date.now();
    const budgetUsd = Math.max(0, num(input.budgetUsd));
    const budgetMin = Math.max(0, Math.round(num(input.budgetMin)));
    this.db
      .prepare(
        `INSERT INTO tasks (id, title, prompt, agent, model, candidate, category, reason, repo, cwd, branch, worktree, lean, parent, status,
                            created, updated, budget_usd, budget_min, auto_handoff, handoff_from, checks, verify_cmd, dial_ladder, dial_step)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, title, prompt, agent, model, candidate, category, reason, repo, cwd, branch, worktree, input.lean ? 1 : 0, input.parentId ?? "",
           "starting", now, now, budgetUsd, budgetMin, input.autoHandoff ? 1 : 0, from?.id ?? "",
           input.checks || (dial ? "dial" : ""), input.checks || dial ? (input.verifyCmd ?? getRecipe(this.db, repo).verify ?? "") : "",
           dial ? JSON.stringify(dial.ladder) : "", dial?.step ?? 0);
    if (from) this.db.prepare("UPDATE tasks SET handoff_to = ? WHERE id = ?").run(id, from.id);
    if (rulesGiven.length) this.db.prepare("UPDATE tasks SET rules_given = ? WHERE id = ?").run(JSON.stringify(rulesGiven), id);
    if (pipe) this.db.prepare("UPDATE tasks SET pipeline = ? WHERE id = ?").run(JSON.stringify(pipe), id);
    if (profile) this.db.prepare("UPDATE tasks SET profile = ? WHERE id = ?").run(profile.id, id);
    if (input.browser) this.db.prepare("UPDATE tasks SET browser = 1 WHERE id = ?").run(id);

    const launched = this.launcher(agent, { taskId: id, project: repo, cwd, model: model || undefined, prompt: fullPrompt || undefined, lean: !!input.lean, browser: !!input.browser, forecast: !!input.forecast && !!input.browser, env: profile?.env, resume: input.resume });
    const launch = profile ? { ...launched, env: { ...launched.env, ...profile.env } } : launched;
    if (launch.logs) this.logs.add({ task: id, agent: launch.logs.agent, home: launch.logs.home, cwd, since: now - 5_000 });
    if (from?.worktree && agent === "claude" && (this.home || !process.env.NODE_TEST_CONTEXT)) {
      if (trustClaudeFolder(cwd, this.home).ok) this.db.prepare("UPDATE tasks SET trusted = 0 WHERE id = ?").run(id); // owner task cleans up
    }
    if (worktree) {
      // P44: Netheron's own worktrees are pre-trusted in Claude (B-014 option 2).
      // Never touch the real ~/.claude.json from a test run unless the test gives its own home folder.
      if (agent === "claude" && (this.home || !process.env.NODE_TEST_CONTEXT)) {
        const t = trustClaudeFolder(cwd, this.home);
        if (t.ok) this.db.prepare("UPDATE tasks SET trusted = 1 WHERE id = ?").run(id);
      }
      // P35: copy .env files, link node_modules, optional install command.
      const recipe = getRecipe(this.db, repo);
      if (recipe.run) {
        this.db.prepare("UPDATE tasks SET setup_note = ? WHERE id = ?").run(`running setup: ${recipe.run}`, id);
        this.emit("task", this.get(id));
        void applyRecipe(repo, cwd, recipe).then((r) => {
          this.saveSetup(id, r.notes, r.links);
          if (this.get(id)?.status === "starting") this.startAgent(id, launch, cwd);
        });
        return this.get(id)!;
      }
      const r = await applyRecipe(repo, cwd, recipe);
      this.saveSetup(id, r.notes, r.links);
    }
    this.startAgent(id, launch, cwd);
    return this.get(id)!;
  }

  private saveSetup(id: string, notes: string[], links: string[]) {
    this.db.prepare("UPDATE tasks SET setup_note = ?, setup_links = ? WHERE id = ?").run(notes.join("; "), JSON.stringify(links), id);
  }

  /**
   * "Make it a task" (+ terminals): a terminal that is already running becomes a task in place. Same process and
   * output, nothing restarts. It keeps working in its folder without a new worktree (like a hand-off), so a task's
   * worktree stays owned by that task. Started bare, it has no shared memory or per-task usage of its own.
   */
  adopt(s: PtySession, o: { title: string; agent: string; cwd: string; task?: string }): Task {
    const owner = o.task ? this.get(o.task) : undefined;
    const repo = owner?.repo ?? resolve(o.cwd);
    const agent = (AGENTS as readonly string[]).includes(o.agent) ? o.agent : "shell";
    const id = `t${Date.now().toString(36)}`;
    const title = (o.title.trim() || agent).slice(0, 80);
    const now = Date.now();
    upsertNode(this.db, { kind: "task", key: id, title, body: "", project: projectKey(repo), data: { agent, model: "", branch: owner?.branch ?? "" } });
    this.db
      .prepare(
        `INSERT INTO tasks (id, title, prompt, agent, model, candidate, category, reason, repo, cwd, branch, worktree, lean, parent, status, created, updated)
         VALUES (?, ?, '', ?, '', ?, 'code', 'made from a terminal', ?, ?, ?, 0, 0, ?, 'running', ?, ?)`,
      )
      .run(id, title, agent, agent, repo, o.cwd, owner?.branch ?? "", owner?.id ?? "", now, now);
    this.attachSession(id, s);
    return this.get(id)!;
  }

  private startAgent(id: string, launch: Launch, cwd: string) {
    this.attachSession(id, spawnPty(id, launch, cwd, {}));
  }

  private attachSession(id: string, s: PtySession) {
    this.sessions.set(id, s);
    s.subscribe(() => {
      const t = this.get(id);
      if (t && (t.status === "starting" || t.status === "idle")) this.setStatus(id, "running");
    });
    s.onExit((code) => this.finish(id, code));
    this.emit("session", id);
    this.emit("task", this.get(id));
    void this.turnEnd(id, "start", { guard: false });
  }

  private setStatus(id: string, status: TaskStatus, exitCode?: number) {
    const before = this.get(id)?.status;
    this.db.prepare("UPDATE tasks SET status = ?, exit_code = COALESCE(?, exit_code), updated = ? WHERE id = ?").run(status, exitCode ?? null, Date.now(), id);
    const t = this.get(id);
    this.emit("task", t);
    if (t && (status === "idle" || status === "done" || status === "failed")) {
      const msg = { idle: "is waiting for you", done: "finished", failed: `failed (exit ${exitCode})` }[status];
      this.emit("notify", { taskId: id, title: `${t.agent}: ${t.title}`, body: msg, status });
    }
    if (before === "running" && status === "idle") void this.turnEnd(id, "turn", { deliver: true });
  }

  // ---- after every agent turn: edit guard, checkpoint, queued message --------------------------------
  private turnEnd(id: string, label: string, o: { guard?: boolean; deliver?: boolean } = {}): Promise<void> {
    const next = (this.turnChain.get(id) ?? Promise.resolve()).then(async () => {
      const t = this.get(id);
      if (!t || !existsSync(t.cwd)) return;
      try {
        const all = await listCheckpoints(t.cwd, id);
        const last = all.at(-1);
        if (last && o.guard !== false) {
          const warnings = await guardCheck(t.cwd, last.commit);
          if (warnings.length) {
            this.guards.set(id, { warnings, checkpoint: last.n, ts: Date.now() });
            const msg = `Possible damage in ${warnings.length} file(s): ${warnings.map((w) => `${w.path} (${w.kind})`).join(", ")}. Restore from checkpoint #${last.n}.`;
            this.alert({ kind: "guard", task: id, agent: t.agent, message: msg });
            this.emit("guard", { id, ...this.guards.get(id) });
          } else if (this.guards.delete(id)) this.emit("guard", { id, warnings: [], checkpoint: 0, ts: Date.now() });
        }
        const cp = await createCheckpoint(t.cwd, id, label === "turn" ? `after turn ${(last?.n ?? 0)}` : label);
        if (cp && cp.n !== last?.n) this.emit("checkpoint", { id, checkpoint: cp });
        if (cp && label !== "start" && label !== "before restore" && (await this.checkTurn(id, cp.commit))) return; // escalated: don't feed the old agent
        if (label === "turn" && (await this.advancePipeline(id))) return;
        if (label === "turn" || label === "end") {
          this.turnCount.set(id, this.turns(id) + 1);
          if (t.race) void this.maybeJudge(t.race);
        }
      } catch { /* checkpoints are best effort (non-git folder, git busy) */ }
      if (o.deliver) this.deliver(id);
    });
    this.turnChain.set(id, next.catch(() => {}));
    return next;
  }

  // ---- checks after each turn + Budget Dial (P07 S1) ------------------------------------------------------
  /** Run the project's checks if the folder changed since the last run. Returns true if the task was escalated. */
  private async checkTurn(id: string, commit: string): Promise<boolean> {
    const t = this.get(id);
    if (!t || !t.checks || !t.verify_cmd || t.handoff_to) return false;
    if (t.verify_tree === commit) return false; // nothing changed since the last check
    this.emit("verify", { id, running: true });
    const r = await runVerify(t.cwd, t.verify_cmd);
    this.db.prepare("UPDATE tasks SET verify_last = ?, verify_tree = ? WHERE id = ?").run(JSON.stringify(r), commit, id);
    this.emit("verify", { id, running: false, result: r });
    this.emit("task", this.get(id));
    if (r.ok) {
      this.alert({ kind: "verify", task: id, agent: t.agent, message: `Checks pass (${t.verify_cmd}, ${Math.round(r.ms / 1000)} s).` });
      return false;
    }
    const steps = t.dial_ladder ? (JSON.parse(t.dial_ladder) as Array<{ agent: string; model?: string; label: string }>) : [];
    const next = steps[t.dial_step + 1];
    if (t.checks !== "dial" || !next || t.budget_hit) {
      this.alert({ kind: "verify", task: id, agent: t.agent, message: `Checks fail (${t.verify_cmd}, exit ${r.code})${t.checks === "dial" ? (next ? " and the budget is used up" : " on the largest model too: over to you") : ""}.` });
      return false;
    }
    await this.handoff(id, `didn't pass the checks (${t.verify_cmd}, exit ${r.code})`, next.agent, {
      model: next.model, extra: `The checks failed with this output:\n${r.output.slice(-1500)}`, dial: { ladder: steps, step: t.dial_step + 1 },
    });
    return true;
  }

  async runChecks(id: string): Promise<VerifyResult> {
    const t = this.get(id);
    if (!t) throw new Error("no such task");
    const cmd = t.verify_cmd || getRecipe(this.db, t.repo).verify;
    if (!cmd) throw new Error("No checks command for this project. Set one in ⚙ Worktree setup.");
    const r = await runVerify(t.cwd, cmd);
    this.db.prepare("UPDATE tasks SET verify_last = ? WHERE id = ?").run(JSON.stringify(r), id);
    this.emit("task", this.get(id));
    return r;
  }

  guard(id: string) {
    return this.guards.get(id) ?? { warnings: [], checkpoint: 0, ts: 0 };
  }

  async checkpoints(id: string) {
    const t = this.get(id);
    return t && existsSync(t.cwd) ? listCheckpoints(t.cwd, id) : [];
  }

  /** Restore one file or the whole folder from checkpoint n. A safety checkpoint is taken first. */
  async restore(id: string, n: number, path?: string) {
    const t = this.get(id);
    if (!t) throw new Error("no such task");
    await this.turnEnd(id, "before restore", { guard: false });
    const cp = (await listCheckpoints(t.cwd, id)).find((c) => c.n === n);
    if (!cp) throw new Error(`no checkpoint #${n}`);
    const r = await restoreCheckpoint(t.cwd, cp.commit, path);
    if (!path) this.guards.delete(id);
    else {
      const g = this.guards.get(id);
      if (g) g.warnings = g.warnings.filter((w) => w.path !== path);
    }
    this.emit("guard", { id, ...this.guard(id) });
    return { ...r, checkpoint: n };
  }

  // ---- message queue (P20) + diff comments (P36) ------------------------------------------------------
  /** The user has the browser now (agent called ask_user, or the user took over): "Needs you" + 🔔/push. */
  browserToUser(id: string, reason: string, byUser = false) {
    const t = this.get(id);
    if (!t) throw new Error("no such task");
    const why = (reason || "the agent asked for you").slice(0, 300);
    this.db.prepare("UPDATE tasks SET browser_wait = ?, updated = ? WHERE id = ?").run(byUser ? "You took over" : why, Date.now(), id);
    this.emit("task", this.get(id));
    if (byUser) return;
    this.alert({ kind: "browser", task: id, agent: t.agent, message: `Needs you in the browser: ${why}` });
    this.emit("notify", { taskId: id, title: `${t.agent}: ${t.title}`, body: `Needs you in the browser: ${why}`, status: "browser" });
  }

  /** User pressed Resume: the agent gets the browser back and is told to continue. */
  browserToAgent(id: string) {
    const t = this.get(id);
    if (!t) throw new Error("no such task");
    this.db.prepare("UPDATE tasks SET browser_wait = '', updated = ? WHERE id = ?").run(Date.now(), id);
    this.emit("task", this.get(id));
    return this.enqueue(id, BROWSER_RESUME);
  }

  browserFinished(id: string, summary: string) {
    const t = this.get(id);
    if (!t) throw new Error("no such task");
    this.alert({ kind: "browser", task: id, agent: t.agent, message: `Finished browsing: ${(summary || "no summary").slice(0, 400)}` });
  }

  enqueue(id: string, text: string): QueuedMessage[] {
    const t = this.get(id);
    if (!t) throw new Error("no such task");
    const clean = text.replace(/\r?\n/g, " ").trim();
    if (!clean) throw new Error("message is empty");
    this.db.prepare("INSERT INTO task_queue (task, text, created) VALUES (?, ?, ?)").run(id, clean, Date.now());
    if (t.status === "idle") this.deliver(id); // agent is waiting: send right away
    this.emit("queue", { id, queue: this.queue(id) });
    return this.queue(id);
  }

  comment(id: string, file: string, line: number, text: string) {
    return this.enqueue(id, `Review comment on ${file}${line ? `:${line}` : ""}: ${text}`);
  }

  queue(id: string): QueuedMessage[] {
    return this.db.prepare("SELECT * FROM task_queue WHERE task = ? ORDER BY id DESC LIMIT 30").all(id) as QueuedMessage[];
  }

  unqueue(id: string, qid: number) {
    this.db.prepare("DELETE FROM task_queue WHERE id = ? AND task = ? AND sent = 0").run(qid, id);
    this.emit("queue", { id, queue: this.queue(id) });
    return this.queue(id);
  }

  private deliver(id: string) {
    const s = this.sessions.get(id);
    if (!s?.alive) return;
    const next = this.db.prepare("SELECT * FROM task_queue WHERE task = ? AND sent = 0 ORDER BY id LIMIT 1").get(id) as QueuedMessage | undefined;
    if (!next) return;
    this.db.prepare("UPDATE task_queue SET sent = ? WHERE id = ?").run(Date.now(), next.id);
    s.write(next.text);
    setTimeout(() => s.write("\r"), 150); // separate Enter, like a person typing
    this.emit("queue", { id, queue: this.queue(id) });
  }

  // ---- watchdog: budget (P46), stuck (P46/P10), resume after limit (P10) -------------------------------
  private tick(now = Date.now()) {
    void this.runDue(now).catch(() => {});
    this.logs.poll();
    for (const [id, s] of this.sessions) {
      if (!s.alive) continue;
      const t = this.get(id);
      if (!t) continue;
      if (t.status === "running" && now - s.lastOutputAt > this.idleMs) this.setStatus(id, "idle");
      this.watch(t, s, now);
    }
  }

  private watch(t: Task, s: PtySession, now: number) {
    // Budget: interrupt once and ask the user.
    if ((t.budget_usd || t.budget_min) && !t.budget_hit) {
      const m = this.meter(t.id);
      const mins = (now - t.created) / 60_000;
      const over = t.budget_usd && m.costUsd >= t.budget_usd ? `$${m.costUsd.toFixed(2)} of $${t.budget_usd}` : t.budget_min && mins >= t.budget_min ? `${Math.round(mins)} of ${t.budget_min} minutes` : "";
      if (over) {
        this.db.prepare("UPDATE tasks SET budget_hit = 1 WHERE id = ?").run(t.id);
        s.write("\x1b"); // Esc interrupts the turn in Claude Code / Codex without quitting
        this.alert({ kind: "budget", task: t.id, agent: t.agent, message: `Budget reached (${over}). The agent was interrupted; continue, raise the budget, or hand off.` });
        this.emit("task", this.get(t.id));
      }
    }
    // Stuck: repeated errors, or running with no successful model call for a long time.
    if (t.status === "running" && !t.stuck_at) {
      const errors = num((this.db.prepare("SELECT COUNT(*) AS n FROM calls WHERE task = ? AND status >= 400 AND status <> 429 AND ts >= ?").get(t.id, now - 5 * 60_000) as { n: number }).n);
      const lastOk = num((this.db.prepare("SELECT MAX(ts) AS ts FROM calls WHERE task = ? AND status < 400").get(t.id) as { ts: number }).ts);
      const quietFor = now - Math.max(lastOk, t.created, t.updated);
      const why = errors >= WATCH.stuckErrors ? `${errors} failed model calls in 5 minutes` : quietFor > WATCH.stuckMs ? `no progress for ${Math.round(quietFor / 60_000)} minutes` : "";
      if (why) {
        this.db.prepare("UPDATE tasks SET stuck_at = ? WHERE id = ?").run(now, t.id);
        this.alert({ kind: "stuck", task: t.id, agent: t.agent, message: `${t.agent} looks stuck (${why}). Hand it off to another agent or stop it.` });
        this.emit("task", this.get(t.id));
        if (t.auto_handoff) void this.autoHandoff(t.id, `looked stuck (${why})`);
      }
    }
    // Resume after a rate limit reset.
    if (t.wait_until && now >= t.wait_until) {
      this.db.prepare("UPDATE tasks SET wait_until = 0 WHERE id = ?").run(t.id);
      s.write(WATCH.resumeText);
      setTimeout(() => s.write("\r"), 150);
      this.alert({ kind: "resumed", task: t.id, agent: t.agent, message: "Usage limit reset: the agent was asked to continue." });
      this.emit("task", this.get(t.id));
    }
  }

  // ---- Race & Judge (P34 S3) -------------------------------------------------------------------------------
  /** The same task on several agents, each in its own worktree. Judged when all have finished a turn. */
  async race(input: NewTask, contenders?: Array<{ agent: string; model?: string }>, evalId = 0): Promise<Race> {
    if (!input.repo || !existsSync(input.repo) || !(await isGitRepo(input.repo))) throw new Error("Race & Judge needs a git project (each contender gets its own worktree).");
    let picks = contenders?.length ? contenders : [];
    if (!picks.length) {
      // Best model per available agent for this kind of task, up to 3 different agents.
      const seen = new Set<string>();
      for (const c of ladder(input.prompt, { availability: this.availability }).reverse()) {
        if (seen.has(c.agent) || picks.length >= 3) continue;
        seen.add(c.agent);
        picks.push({ agent: c.agent, model: c.model });
      }
    }
    if (picks.length < (evalId ? 1 : 2)) throw new Error("Race & Judge needs at least two agents available.");
    const id = `r${Date.now().toString(36)}`;
    const verify = input.verifyCmd ?? getRecipe(this.db, input.repo).verify ?? "";
    this.db.prepare("INSERT INTO races (id, prompt, repo, created, verify, eval_id) VALUES (?, ?, ?, ?, ?, ?)").run(id, input.prompt, resolve(input.repo), Date.now(), verify, evalId);
    for (const p of picks) {
      const t = await this.create({ ...input, agent: p.agent, model: p.model, isolate: true, title: `🏁 ${p.agent}${p.model ? ` ${p.model}` : ""}: ${input.prompt.split("\n")[0]}`.slice(0, 80) });
      this.db.prepare("UPDATE tasks SET race = ? WHERE id = ?").run(id, t.id);
      this.emit("task", this.get(t.id));
    }
    this.emit("race", { race: this.getRace(id) });
    return this.getRace(id)!;
  }

  getRace(id: string): Race | undefined {
    const r = this.db.prepare("SELECT * FROM races WHERE id = ?").get(id) as (Omit<Race, "results"> & { results: string }) | undefined;
    return r ? { ...r, results: JSON.parse(r.results) } : undefined;
  }

  raceTasks(id: string): Task[] {
    return this.db.prepare("SELECT * FROM tasks WHERE race = ? ORDER BY created").all(id) as Task[];
  }

  private judging = new Set<string>();

  /** Judge once every contender has finished at least one turn (or ended). */
  private async maybeJudge(raceId: string) {
    const r = this.getRace(raceId);
    if (!r || r.status !== "running" || this.judging.has(raceId)) return;
    const ts = this.raceTasks(raceId);
    const settled = ts.every((t) => ["done", "failed", "stopped"].includes(t.status) || (t.status === "idle" && this.turns(t.id) > 0));
    if (ts.length && settled) await this.judge(raceId);
  }

  private turnCount = new Map<string, number>();
  private turns(id: string) { return this.turnCount.get(id) ?? 0; }

  /** Score: checks pass (+100) > smaller change > cheaper. Ties go to the earlier contender. */
  async judge(raceId: string): Promise<Race> {
    const r = this.getRace(raceId);
    if (!r) throw new Error("no such race");
    this.judging.add(raceId);
    try {
      const results: RaceEntry[] = [];
      for (const t of this.raceTasks(raceId)) {
        let lines = 0;
        let files = 0;
        try {
          const d = await worktreeDiff(t.cwd);
          files = d.files.length;
          lines = d.diff.split("\n").filter((l) => /^[+-](?![+-])/.test(l)).length;
        } catch { /* folder gone */ }
        let checks: RaceEntry["checks"] = "none";
        if (r.verify && files && existsSync(t.cwd)) checks = (await runVerify(t.cwd, r.verify)).ok ? "pass" : "fail";
        const costUsd = this.meter(t.id).costUsd;
        const score = (checks === "pass" ? 100 : checks === "none" && files ? 50 : 0) + (files ? Math.max(0, 40 - Math.log2(1 + lines) * 4) : 0) - Math.min(10, costUsd * 5);
        results.push({ task: t.id, agent: t.agent, model: t.model, status: t.status, checks, lines, files, costUsd, score: Math.round(score * 10) / 10 });
      }
      const ranked = [...results].sort((a, b) => b.score - a.score);
      const winner = ranked[0]?.files ? ranked[0].task : "";
      this.db.prepare("UPDATE races SET status = 'judged', winner = ?, results = ? WHERE id = ?").run(winner, JSON.stringify(results), raceId);
      const w = results.find((x) => x.task === winner);
      this.alert({ kind: "race", task: winner, agent: w?.agent ?? "", message: w ? `Race judged: ${w.agent}${w.model ? ` ${w.model}` : ""} wins (checks ${w.checks}, ${w.lines} lines changed, $${w.costUsd.toFixed(2)}).` : "Race judged: no contender changed anything." });
      this.emit("race", { race: this.getRace(raceId) });
      if (r.eval_id) await this.finishEval(r, results);
      return this.getRace(raceId)!;
    } finally {
      this.judging.delete(raceId);
    }
  }

  // ---- quality watch (P01 S1/S2) ---------------------------------------------------------------------------
  addEval(project: string, title: string, prompt: string, verify: string): Eval {
    if (!existsSync(project)) throw new Error("project folder not found");
    if (!prompt.trim() || !verify.trim()) throw new Error("an eval needs a task prompt and a check command");
    this.db.prepare("INSERT INTO evals (project, title, prompt, verify, created) VALUES (?, ?, ?, ?, ?)").run(resolve(project), (title || prompt).slice(0, 80), prompt, verify, Date.now());
    return this.db.prepare("SELECT * FROM evals ORDER BY id DESC LIMIT 1").get() as Eval;
  }

  evals(project: string): Eval[] {
    return this.db.prepare("SELECT * FROM evals WHERE project = ? ORDER BY id").all(resolve(project)) as Eval[];
  }

  deleteEval(id: number) {
    this.db.prepare("DELETE FROM evals WHERE id = ?").run(id);
  }

  /** Run every eval of the project on every available model (each in its own worktree). Uses your quota. */
  async runQuality(project: string): Promise<Race[]> {
    const evals = this.evals(project);
    if (!evals.length) throw new Error("Add an eval first: a small task plus a command that checks it.");
    const out: Race[] = [];
    for (const e of evals) {
      const models = ladder(e.prompt, { availability: this.availability }).map((c) => ({ agent: c.agent, model: c.model }));
      out.push(await this.race({ prompt: e.prompt, repo: e.project, verifyCmd: e.verify, lean: true, title: `🧪 ${e.title}` }, models, e.id));
    }
    return out;
  }

  private async finishEval(r: Race, results: RaceEntry[]) {
    const ts = Date.now();
    for (const x of results) {
      const cand = CATALOG.find((c) => c.agent === x.agent && (c.model ?? "") === (x.model ?? ""))?.id ?? `${x.agent}${x.model ? "-" + x.model : ""}`;
      this.db.prepare("INSERT INTO eval_runs (eval_id, candidate, agent, model, ok, ts, race) VALUES (?, ?, ?, ?, ?, ?, ?)").run(r.eval_id, cand, x.agent, x.model ?? "", x.checks === "pass" ? 1 : 0, ts, r.id);
    }
    // Evals are throwaway: remove their tasks and worktrees.
    for (const t of this.raceTasks(r.id)) await this.remove(t.id, { removeWorktree: true }).catch(() => {});
    // Regression alarm: recent pass rate far below the earlier one.
    for (const s of this.quality(r.repo)) {
      if (s.previous !== null && s.previous >= 0.6 && s.recent <= s.previous - 0.3) {
        this.alert({ kind: "quality", task: "", agent: s.agent, message: `${s.agent}${s.model ? ` ${s.model}` : ""} got worse on your evals: ${Math.round(s.recent * 100)}% now vs ${Math.round(s.previous * 100)}% before. The router will prefer other models.` });
      }
    }
    this.emit("quality", { project: r.repo, scores: this.quality(r.repo) });
  }

  /** Pass rates per model on this project's evals: overall (30 days), last 5 runs, and the 10 before those. */
  quality(project: string): QualityScore[] {
    const rows = this.db.prepare(
      `SELECT r.candidate, r.agent, r.model, r.ok, r.ts FROM eval_runs r JOIN evals e ON e.id = r.eval_id
       WHERE e.project = ? AND r.ts > ? ORDER BY r.ts DESC, r.id DESC`,
    ).all(resolve(project), Date.now() - 30 * 24 * 3600_000) as Array<{ candidate: string; agent: string; model: string; ok: number; ts: number }>;
    const by = new Map<string, typeof rows>();
    for (const r of rows) (by.get(r.candidate) ?? by.set(r.candidate, []).get(r.candidate)!).push(r);
    const rate = (xs: typeof rows) => (xs.length ? xs.reduce((a, x) => a + x.ok, 0) / xs.length : 0);
    return [...by].map(([candidate, xs]) => ({
      candidate, agent: xs[0].agent, model: xs[0].model, runs: xs.length, passRate: rate(xs),
      recent: rate(xs.slice(0, 5)), previous: xs.length > 5 ? rate(xs.slice(5, 15)) : null,
    })).sort((a, b) => b.passRate - a.passRate);
  }

  /** Keep the winner: stop and remove the other contenders with their worktrees. */
  async keepWinner(raceId: string, taskId?: string) {
    const r = this.getRace(raceId);
    if (!r) throw new Error("no such race");
    const keep = taskId || r.winner;
    if (!keep) throw new Error("no winner to keep");
    for (const t of this.raceTasks(raceId)) if (t.id !== keep) await this.remove(t.id, { removeWorktree: true });
    this.db.prepare("UPDATE races SET status = 'kept', winner = ? WHERE id = ?").run(keep, raceId);
    this.emit("race", { race: this.getRace(raceId) });
    return this.getRace(raceId)!;
  }

  // ---- pipelines (P23 S2) ---------------------------------------------------------------------------------
  /** Move to the next step when the agent said STEP DONE (and the checks pass, if this task has checks). */
  private async advancePipeline(id: string): Promise<boolean> {
    const t = this.get(id);
    if (!t?.pipeline || t.handoff_to) return false;
    const out = plain(this.sessions.get(id)?.buffer() ?? "").slice(t.step_started);
    // The instruction itself contains the phrase (echoed by the agent's input box): need it said after that.
    const said = out.split(STEP_DONE).length - 1 > (out.includes(`say exactly: ${STEP_DONE}`) ? 1 : 0);
    if (!said) return false;
    if (t.checks && t.verify_last && !JSON.parse(t.verify_last).ok) return false; // checks must pass first
    const pipe = JSON.parse(t.pipeline) as { steps: PipelineStep[]; index: number };
    const next = pipe.steps[pipe.index + 1];
    if (!next) {
      this.alert({ kind: "pipeline", task: id, agent: t.agent, message: `Pipeline finished: all ${pipe.steps.length} steps done.` });
      return false;
    }
    await this.handoff(id, `finished step ${pipe.index + 1} (${pipe.steps[pipe.index].label ?? t.agent})`, next.agent, {
      model: next.model,
      extra: `${next.instruction}\n\nWhen this step is complete, say exactly: ${STEP_DONE}`,
      pipeline: { steps: pipe.steps, index: pipe.index + 1 },
    });
    return true;
  }

  // ---- Night Shift: scheduled runs (P23 S1, P07 S4) ------------------------------------------------------
  /** Run a task later: at a time, when the agent's usage limit resets, and optionally again and again (automations). */
  schedule(input: NewTask, when: { at?: number; afterReset?: boolean; daily?: boolean; repeat?: string; title?: string }): Scheduled {
    if (!input.repo || !existsSync(input.repo)) throw new Error(`project folder not found: ${input.repo}`);
    let runAt = when.at ?? 0;
    if (when.afterReset) {
      const agent = input.agent && input.agent !== "auto" ? input.agent : this.route(input.prompt).candidate.agent;
      const r = this.db.prepare("SELECT MAX(reset_at) AS t FROM calls WHERE agent = ?").get(agent) as { t: number | null };
      runAt = num(r.t) > Date.now() ? num(r.t) + 60_000 : Date.now() + 5 * 3600_000; // unknown: the usual 5-hour window
    }
    if (!runAt) throw new Error("give a time, or choose 'after the limit resets'");
    const title = (when.title || input.title || input.prompt.split("\n")[0] || input.agent || "task").slice(0, 80);
    const repeat = (REPEATS as readonly string[]).includes(when.repeat ?? "") ? when.repeat! : when.daily ? "daily" : "";
    if (repeat === "weekdays") while ([0, 6].includes(new Date(runAt).getDay())) runAt += 86_400_000; // start on a weekday
    this.db.prepare('INSERT INTO schedule (input, run_at, repeat, "when", created, title) VALUES (?, ?, ?, ?, ?, ?)')
      .run(JSON.stringify(input), runAt, repeat, when.afterReset ? "reset" : "at", Date.now(), title);
    const s = this.db.prepare("SELECT * FROM schedule ORDER BY id DESC LIMIT 1").get() as Scheduled;
    this.emit("schedule", { schedule: this.scheduled() });
    return s;
  }

  scheduled(): Scheduled[] {
    return this.db.prepare("SELECT * FROM schedule WHERE status = 'waiting' ORDER BY run_at").all() as Scheduled[];
  }

  unschedule(sid: number) {
    this.db.prepare("UPDATE schedule SET status = 'cancelled' WHERE id = ?").run(sid);
    this.emit("schedule", { schedule: this.scheduled() });
  }

  // ---- Automations: scheduled runs as a list you manage (pause, resume, run now, history) ------------------
  automations(): Array<Scheduled & { prompt: string; agent: string; repo: string; runs: number }> {
    const rows = this.db.prepare(`SELECT * FROM schedule WHERE status <> 'cancelled'
      ORDER BY CASE status WHEN 'waiting' THEN 0 WHEN 'paused' THEN 1 ELSE 2 END, run_at`).all() as Scheduled[];
    const count = this.db.prepare("SELECT COUNT(*) AS n FROM schedule_runs WHERE schedule_id = ?");
    return rows.map((r) => {
      let input: Partial<NewTask> = {};
      try { input = JSON.parse(r.input); } catch { /* old row */ }
      return { ...r, prompt: input.prompt ?? "", agent: input.agent ?? "auto", repo: input.repo ?? "", runs: num((count.get(r.id) as { n: number }).n) };
    });
  }

  automationRuns(limit = 50) {
    return this.db.prepare(`SELECT r.id, r.schedule_id, r.task, r.ts, r.error, s.title, t.status, t.agent
      FROM schedule_runs r JOIN schedule s ON s.id = r.schedule_id LEFT JOIN tasks t ON t.id = r.task ORDER BY r.ts DESC, r.id DESC LIMIT ?`).all(limit);
  }

  pauseAutomation(sid: number) {
    this.db.prepare("UPDATE schedule SET status = 'paused' WHERE id = ? AND status = 'waiting'").run(sid);
    this.emit("schedule", { schedule: this.scheduled() });
  }

  resumeAutomation(sid: number, now = Date.now()) {
    const s = this.db.prepare("SELECT * FROM schedule WHERE id = ?").get(sid) as Scheduled | undefined;
    if (!s || s.status !== "paused") return;
    // A repeating automation picks up at its next slot; a one-off that came due while paused runs in a minute.
    const at = s.run_at > now ? s.run_at : s.repeat ? nextRun(s.repeat, s.run_at, now) : now + 60_000;
    this.db.prepare("UPDATE schedule SET status = 'waiting', run_at = ? WHERE id = ?").run(at, sid);
    this.emit("schedule", { schedule: this.scheduled() });
  }

  /** Start an automation's task right now, without moving its schedule. */
  async runAutomation(sid: number): Promise<Task> {
    const s = this.db.prepare("SELECT * FROM schedule WHERE id = ?").get(sid) as Scheduled | undefined;
    if (!s) throw new Error("no such automation");
    const t = await this.create(JSON.parse(s.input));
    this.db.prepare("INSERT INTO schedule_runs (schedule_id, task, ts) VALUES (?, ?, ?)").run(sid, t.id, Date.now());
    this.db.prepare("UPDATE schedule SET last_task = ? WHERE id = ?").run(t.id, sid);
    this.emit("schedule", { schedule: this.scheduled() });
    return t;
  }

  private runningDue = false;
  private disposed = false;

  private async runDue(now: number) {
    if (this.runningDue || this.disposed) return; // one pass at a time: a slow start must not overlap the next tick
    this.runningDue = true;
    try { await this.runDueOnce(now); } finally { this.runningDue = false; }
  }

  private async runDueOnce(now: number) {
    const due = this.db.prepare("SELECT * FROM schedule WHERE status = 'waiting' AND run_at <= ?").all(now) as Scheduled[];
    for (const s of due) {
      if (this.disposed) return;
      // Claim it first; start it only if the claim actually succeeded (never run twice).
      const claimed = this.db.prepare("UPDATE schedule SET status = 'starting' WHERE id = ? AND status = 'waiting'").run(s.id);
      if (Number(claimed.changes) !== 1) continue;
      try {
        const t = await this.create(JSON.parse(s.input));
        this.db.prepare("INSERT INTO schedule_runs (schedule_id, task, ts) VALUES (?, ?, ?)").run(s.id, t.id, now);
        if (s.repeat) this.db.prepare("UPDATE schedule SET status = 'waiting', run_at = ?, last_task = ? WHERE id = ?").run(nextRun(s.repeat, s.run_at, now), t.id, s.id);
        else this.db.prepare("UPDATE schedule SET status = 'done', last_task = ? WHERE id = ?").run(t.id, s.id);
      } catch (e) {
        this.db.prepare("INSERT INTO schedule_runs (schedule_id, ts, error) VALUES (?, ?, ?)").run(s.id, now, (e as Error).message.slice(0, 300));
        // A repeating automation tries again at its next slot; a one-off is marked failed.
        if (s.repeat) this.db.prepare("UPDATE schedule SET status = 'waiting', run_at = ? WHERE id = ?").run(nextRun(s.repeat, s.run_at, now), s.id);
        else this.db.prepare("UPDATE schedule SET status = 'failed' WHERE id = ?").run(s.id);
        this.alert({ kind: "pipeline", task: "", agent: "netheron", message: `Scheduled task "${s.title}" couldn't start: ${(e as Error).message}` });
      }
    }
    if (due.length) this.emit("schedule", { schedule: this.scheduled() });
  }

  /** Morning brief: what ran since `since`, one line each with outcome, changes, cost, checks and alerts. */
  brief(since: number) {
    const tasks = this.db.prepare("SELECT * FROM tasks WHERE created >= ? ORDER BY created").all(since) as Task[];
    return tasks.map((t) => {
      const m = this.meter(t.id);
      let checks = "";
      try { const r = JSON.parse(t.verify_last || "null"); if (r) checks = r.ok ? "pass" : `fail (exit ${r.code})`; } catch { /* none */ }
      return {
        id: t.id, title: t.title, agent: t.agent, model: t.model, status: t.status, created: t.created,
        costUsd: m.costUsd, tokens: m.tokensIn + m.tokensOut, checks, handoffTo: t.handoff_to,
        alerts: this.alerts({ task: t.id }).map((a) => `${a.kind}: ${a.message}`),
      };
    });
  }

  // ---- account profiles (P13): sign in inside Netheron ---------------------------------------------------
  async loginTask(profileId: string): Promise<Task> {
    const p = getProfile(this.db, profileId);
    if (!p) throw new Error("account profile not found");
    const dir = profileDir(p.id);
    const t = await this.create({ prompt: "", title: `Sign in: ${p.agent} · ${p.name}`, agent: "shell", repo: dir, isolate: false, profile: p.id });
    // The shell already has the profile's environment; start the agent's own login.
    setTimeout(() => this.write(t.id, `${loginCommand(p.agent)}\r`), 1500);
    return t;
  }

  /** Delete an account profile. Its sign-in terminals are closed; live tasks using it must be stopped first. */
  async deleteProfile(id: string) {
    const users = this.list().filter((t) => t.profile === id);
    const busy = users.filter((t) => t.agent !== "shell" && this.sessions.get(t.id)?.alive);
    if (busy.length) throw new Error(`still in use by ${busy.length} running task(s): ${busy.map((t) => t.title).join(", ")}. Stop them first.`);
    for (const t of users.filter((t) => t.agent === "shell")) await this.remove(t.id); // sign-in shells live in the profile folder
    deleteProfile(this.db, id);
  }

  // ---- Wave 2 #1: hand-off to another agent with a briefing (P10 S1, P46 Stuck Rescue) --------------------
  private handingOff = new Set<string>();

  /** Agents already used in this hand-off chain (so we never hand back to one that failed). */
  chainAgents(id: string): string[] {
    const out: string[] = [];
    for (let t = this.get(id), n = 0; t && n < 20; t = t.handoff_from ? this.get(t.handoff_from) : undefined, n++) out.push(t.agent);
    return [...new Set(out)];
  }

  async briefing(t: Task, reason: string): Promise<string> {
    let stat = "";
    if (existsSync(t.cwd) && (await isGitRepo(t.cwd))) {
      try { stat = (await worktreeDiff(t.cwd)).stat; } catch { /* ignore */ }
    }
    const decisions = this.db.prepare(
      "SELECT kind, title FROM nodes WHERE json_extract(data, '$.taskId') = ? AND kind IN ('decision','note','bug','todo') ORDER BY created",
    ).all(t.id) as Array<{ kind: string; title: string }>;
    const tail = plain(this.sessions.get(t.id)?.buffer() ?? "").split("\n").map((l) => l.trimEnd()).filter((l) => l.trim()).slice(-25).join("\n").slice(-2000);
    return [
      `You are taking over a task from ${t.agent}, which ${reason}.`,
      `Original task: ${t.prompt}`,
      `The work so far is in this folder (same files, nothing committed). Files changed so far: ${stat || "none yet"}.`,
      decisions.length ? `Decisions recorded: ${decisions.map((d) => `${d.kind}: ${d.title}`).join("; ")}.` : "",
      tail ? `Last output from ${t.agent}: ${tail}` : "",
      "Check the current state of the files first, then continue the task. Don't start over.",
    ].filter(Boolean).join("\n\n");
  }

  /** Stop this task's agent and continue the same work with another agent, in the same folder. */
  async handoff(id: string, reason = "was handed off by you", agent?: string,
                o: { model?: string; extra?: string; dial?: NewTask["dial"]; pipeline?: NewTask["pipeline"] } = {}): Promise<Task> {
    const t = this.get(id);
    if (!t) throw new Error("no such task");
    if (t.handoff_to) throw new Error("this task was already handed off");
    const tried = this.chainAgents(id);
    let next = agent && agent !== "auto" ? agent : "";
    if (!next) next = decide(t.prompt || t.title, { db: this.db, availability: this.availability, exclude: t.browser ? [...tried, ...NO_MCP] : tried }).candidate.agent;
    if (next === "shell") throw new Error("can't hand a task to the shell");
    const prompt = (await this.briefing(t, reason)) + (o.extra ? `\n\n${o.extra}` : "");
    this.stop(id); // frees the folder before the next agent starts
    const dial = o.dial ?? (t.dial_ladder ? { ladder: JSON.parse(t.dial_ladder), step: t.dial_step } : undefined);
    const child = await this.create({
      prompt, title: `↪ ${t.title}`.slice(0, 80), agent: next, repo: t.repo, continueIn: id, parentId: id,
      lean: !!t.lean, autoHandoff: !!t.auto_handoff,
      budgetUsd: t.budget_usd, budgetMin: t.budget_min,
      model: o.model, checks: (t.checks || "") as NewTask["checks"], verifyCmd: t.verify_cmd || undefined, dial,
      profile: next === t.agent ? t.profile : undefined,
      pipeline: o.pipeline ?? (t.pipeline ? JSON.parse(t.pipeline) : undefined),
      browser: !!t.browser,
    });
    this.alert({ kind: "handoff", task: id, agent: t.agent, message: `Handed off to ${next}${o.model ? ` (${o.model})` : ""} (${t.agent} ${reason}).` });
    this.emit("task", this.get(id));
    return child;
  }

  private async autoHandoff(id: string, reason: string) {
    if (this.handingOff.has(id)) return;
    this.handingOff.add(id);
    try {
      await this.handoff(id, reason);
    } catch (e) {
      // No other agent: fall back to waiting / asking the user.
      const t = this.get(id);
      if (t) this.alert({ kind: "handoff", task: id, agent: t.agent, message: `Couldn't hand off automatically: ${(e as Error).message}` });
    } finally {
      this.handingOff.delete(id);
    }
  }

  cancelWait(id: string) {
    this.db.prepare("UPDATE tasks SET wait_until = 0 WHERE id = ?").run(id);
    this.emit("task", this.get(id));
  }

  // ---- model calls: meters, alarms, limit handling ------------------------------------------------------
  private handleCall(c: CallEvent) {
    let alerts: Alert[] = [];
    try { alerts = checkCall(this.db, c); } catch { /* alerts table missing in a foreign db */ }
    for (const a of alerts) this.publish(a);
    const t = c.task ? this.get(c.task) : undefined;
    if (!t) return;
    if (c.status === 429 && !c.failover && this.sessions.get(t.id)?.alive && t.auto_handoff && !t.handoff_to) {
      void this.autoHandoff(t.id, "hit a usage limit");
    } else if (c.status === 429 && !c.failover && this.sessions.get(t.id)?.alive) {
      const until = c.reset_at || Date.now() + WATCH.defaultWaitMs;
      this.db.prepare("UPDATE tasks SET wait_until = ? WHERE id = ?").run(until, t.id);
      this.emit("task", this.get(t.id));
    } else if (c.status < 400 && (t.wait_until || t.stuck_at)) {
      this.db.prepare("UPDATE tasks SET wait_until = 0, stuck_at = 0 WHERE id = ?").run(t.id); // it's moving again
      this.emit("task", this.get(t.id));
    }
    this.emit("meter", { id: t.id, meter: this.meter(t.id) });
  }

  /** Raise an alert from outside the task manager (e.g. a revoked phone's recent input). */
  notice(a: Omit<Alert, "ts">) { this.alert(a); }

  private alert(a: Omit<Alert, "ts">) {
    this.publish(saveAlert(this.db, { ts: Date.now(), ...a }));
  }

  private publish(a: Alert) {
    this.emit("alert", a);
    const t = a.task ? this.get(a.task) : undefined;
    const titles: Record<AlertKind, string> = {
      drain: "Spending fast", cache: "Cache hit rate dropped", billing: "Billed to an API key", limit: "Usage limit",
      budget: "Budget reached", stuck: "Task looks stuck", guard: "Possible file damage", resumed: "Resumed", handoff: "Handed off", verify: "Checks", pipeline: "Pipeline", race: "Race & Judge", quality: "Quality watch",
    };
    this.emit("notify", { taskId: a.task, title: `${titles[a.kind]}${t ? `: ${t.title}` : ` (${a.agent})`}`, body: a.message, status: a.kind });
  }

  alerts(opts: { since?: number; task?: string } = {}) {
    return listAlerts(this.db, opts);
  }

  meter(id: string): Meter {
    const s = this.db.prepare(
      `SELECT COUNT(*) AS calls, SUM(status >= 400) AS errors, SUM(input_tokens + cache_read_tokens + cache_write_tokens) AS tin,
              SUM(output_tokens) AS tout, SUM(cost_usd) AS cost, MAX(reset_at) AS reset FROM calls WHERE task = ?`,
    ).get(id) as Record<string, number | null>;
    const last = this.db.prepare(
      "SELECT model, input_tokens + cache_read_tokens + cache_write_tokens AS ctx, output_tokens AS out, latency_ms AS ms, ts FROM calls WHERE task = ? AND status < 400 ORDER BY ts DESC, id DESC LIMIT 1",
    ).get(id) as { model: string; ctx: number; out: number; ms: number; ts: number } | undefined;
    const reset = num(s.reset);
    return {
      calls: num(s.calls), errors: num(s.errors), tokensIn: num(s.tin), tokensOut: num(s.tout), costUsd: Math.round(num(s.cost) * 10000) / 10000,
      lastModel: last?.model ?? "", contextTokens: last?.ctx ?? 0,
      tokensPerSec: last && last.ms > 0 ? Math.round((last.out / last.ms) * 1000) : 0,
      resetAt: reset > Date.now() ? reset : 0, lastCallAt: last?.ts ?? 0,
    };
  }

  // ---- receipt (P36) ------------------------------------------------------------------------------------
  async receipt(id: string) {
    const t = this.get(id);
    if (!t) throw new Error("no such task");
    let diff = { stat: "", files: [] as Array<{ status: string; path: string }> };
    if (existsSync(t.cwd) && (await isGitRepo(t.cwd))) {
      try { const d = await worktreeDiff(t.cwd); diff = { stat: d.stat, files: d.files }; } catch { /* gone */ }
    }
    const models = this.db.prepare(
      `SELECT model, auth, COUNT(*) AS calls, SUM(input_tokens + cache_read_tokens + cache_write_tokens) AS tokens_in,
              SUM(output_tokens) AS tokens_out, ROUND(SUM(cost_usd), 4) AS cost_usd, SUM(status >= 400) AS errors
       FROM calls WHERE task = ? GROUP BY model, auth ORDER BY cost_usd DESC`,
    ).all(id);
    const records = this.db.prepare(
      "SELECT kind, title, body, created FROM nodes WHERE json_extract(data, '$.taskId') = ? AND kind <> 'task' ORDER BY created",
    ).all(id);
    const live = this.sessions.get(id)?.alive;
    return {
      task: t,
      durationMs: (live ? Date.now() : t.updated) - t.created,
      meter: this.meter(id),
      models,
      files: diff.files,
      stat: diff.stat,
      checkpoints: (await this.checkpoints(id)).length,
      records,
      alerts: this.alerts({ task: id }),
      sent: this.queue(id).filter((q) => q.sent).length,
      setup: t.setup_note,
    };
  }

  // ---- end of life ----------------------------------------------------------------------------------------
  private async finish(id: string, code: number) {
    this.logs.remove(id); // last read, so the final turn is counted
    const t = this.get(id);
    if (!t) return;
    const stopped = t.status === "stopped";
    if (!stopped) this.setStatus(id, code === 0 ? "done" : "failed", code);
    if (t.wait_until) this.db.prepare("UPDATE tasks SET wait_until = 0 WHERE id = ?").run(id);
    await this.turnEnd(id, "end").catch(() => {});
    // Write the outcome back to shared memory so the next agent knows what happened.
    let stat = "";
    if (t.worktree) {
      try { stat = (await worktreeDiff(t.cwd)).stat; } catch { /* worktree gone */ }
    }
    try {
      record(this.db, {
        kind: "outcome",
        title: `${t.agent} ${stopped ? "stopped" : code === 0 ? "finished" : "failed"}: ${t.title}`,
        body: `exit ${code}${t.branch ? `, branch ${t.branch}` : ""}${stat ? `\n${stat}` : ", no file changes"}`,
        project: projectKey(t.repo),
        taskId: id,
        agent: t.agent,
      });
    } catch { /* memory is best effort */ }
  }

  write(id: string, data: string) {
    this.sessions.get(id)?.write(data);
  }

  resize(id: string, cols: number, rows: number) {
    this.sessions.get(id)?.resize(cols, rows);
  }

  /** Live terminals (resource manager, status bar, keep-awake). */
  liveSessions(): Array<{ id: string; pid: number; lastOutputAt: number; status: string; title: string; agent: string; repo: string }> {
    const out = [];
    for (const [id, s] of this.sessions) {
      if (!s.alive) continue;
      const t = this.get(id);
      out.push({ id, pid: s.pid, lastOutputAt: s.lastOutputAt, status: t?.status ?? "", title: t?.title ?? id, agent: t?.agent ?? "", repo: t?.repo ?? "" });
    }
    return out;
  }

  stop(id: string) {
    const s = this.sessions.get(id);
    if (s?.alive) {
      this.setStatus(id, "stopped");
      s.kill();
    }
  }

  async diff(id: string) {
    const t = this.get(id);
    if (!t) throw new Error("no such task");
    if (!(await isGitRepo(t.cwd))) return { stat: "Not a git repository — no diff available.", diff: "", files: [] };
    return worktreeDiff(t.cwd);
  }

  async remove(id: string, opts: { removeWorktree?: boolean } = {}) {
    const t = this.get(id);
    if (!t) return;
    this.stop(id);
    const s = this.sessions.get(id);
    this.sessions.delete(id);
    await s?.destroy(); // waits for the agent to exit before its folder is deleted
    await (this.turnChain.get(id) ?? Promise.resolve());
    const child = t.handoff_to ? this.get(t.handoff_to) : undefined;
    const folderInUse = !!child && existsSync(t.cwd);
    if (opts.removeWorktree && t.worktree && folderInUse) {
      this.alert({ kind: "handoff", task: id, agent: t.agent, message: `Kept the folder: task "${child!.title}" is still using it. Remove that task with its worktree instead.` });
      this.db.prepare("UPDATE tasks SET worktree = 0 WHERE id = ?").run(child!.id);
      this.db.prepare("UPDATE tasks SET worktree = 1, setup_links = ?, trusted = ? WHERE id = ?").run(t.setup_links, t.trusted, child!.id); // ownership moves on
    } else if (opts.removeWorktree && t.worktree) {
      // Remove setup links first, so deleting the worktree can't reach through them into the main checkout.
      try { removeLinks(t.cwd, JSON.parse(t.setup_links || "[]")); } catch { /* ignore */ }
      await removeWorktree(t.repo, t.cwd);
      if (t.trusted) untrustClaudeFolder(t.cwd, this.home);
    }
    try { await deleteCheckpoints(t.repo, id); } catch { /* not a git repo */ }
    this.db.prepare("DELETE FROM task_queue WHERE task = ?").run(id);
    this.db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
    this.logs.remove(id);
    this.guards.delete(id);
    this.emit("removed", id);
  }

  async dispose() {
    this.disposed = true;
    clearInterval(this.idleTimer);
    callEvents.off("call", this.onCall);
    await Promise.all([...this.sessions.values()].map((s) => s.destroy()));
  }
}

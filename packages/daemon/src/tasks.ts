// Task lifecycle: route -> worktree -> agent in a PTY -> status updates -> outcome written to memory.
import { EventEmitter } from "node:events";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { record } from "../../memory/src/context.ts";
import { ensureGraphSchema, findNode, upsertNode } from "../../memory/src/graph.ts";
import { indexProject, projectKey } from "../../memory/src/indexer.ts";
import { CATALOG, decide, type Decision } from "../../router/src/router.ts";
import { AGENTS, launchFor, type Launch } from "./agents.ts";
import { spawnPty, type PtySession } from "./pty.ts";
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
};

export type NewTask = {
  prompt: string;
  title?: string;
  agent?: string; // "auto" or an agent name
  model?: string;
  repo: string;
  isolate?: boolean;
  lean?: boolean;
  parentId?: string;
};

const IDLE_MS = 15_000;

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
  `);
  // Sessions don't survive a daemon restart; anything still "live" is now stopped.
  db.prepare("UPDATE tasks SET status = 'stopped', updated = ? WHERE status IN ('starting','running','idle')").run(Date.now());
}

export class TaskManager extends EventEmitter {
  private sessions = new Map<string, PtySession>();
  private db: DatabaseSync;
  private launcher: (agent: string, o: Parameters<typeof launchFor>[2]) => Launch;
  private idleTimer: NodeJS.Timeout;

  constructor(db: DatabaseSync, opts: { launcher?: TaskManager["launcher"] } = {}) {
    super();
    this.db = db;
    ensureTaskSchema(db);
    ensureGraphSchema(db);
    this.launcher = opts.launcher ?? ((agent, o) => launchFor(agent, [], o));
    this.idleTimer = setInterval(() => this.checkIdle(), 2_000);
    this.idleTimer.unref();
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
    return decide(prompt, { db: this.db });
  }

  async create(input: NewTask): Promise<Task> {
    const prompt = input.prompt.trim();
    if (!prompt && input.agent !== "shell") throw new Error("prompt is required");
    if (!input.repo || !existsSync(input.repo)) throw new Error(`project folder not found: ${input.repo}`);
    let repo = resolve(input.repo);
    const git = await isGitRepo(repo);
    if (git) repo = await repoRoot(repo);

    // Pick agent + model.
    let agent = input.agent && input.agent !== "auto" ? input.agent : "";
    let model = input.model ?? "";
    let candidate = "";
    let category = "";
    let reason = "chosen by you";
    if (!agent) {
      const d = this.route(prompt);
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

    const id = `t${Date.now().toString(36)}`;
    const title = (input.title || prompt.split("\n")[0] || agent).slice(0, 80);

    // Isolate in a worktree when possible.
    let cwd = repo;
    let branch = "";
    let worktree = 0;
    if (git && input.isolate !== false && agent !== "shell") {
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
    if (input.parentId) {
      const parent = this.get(input.parentId);
      if (parent) {
        fullPrompt = `${prompt}\n\nThis continues task "${parent.title}" (done by ${parent.agent}). Call mm_get_context first to see what it decided and changed.`;
      }
    }
    if (fullPrompt && agent !== "shell") {
      fullPrompt += "\n\n(Shared memory is available through the mm_* tools: read context with mm_get_context, save decisions with mm_record.)";
    }
    upsertNode(this.db, { kind: "task", key: id, title, body: prompt, project, data: { agent, model, branch } });

    const now = Date.now();
    const task: Task = {
      id, title, prompt, agent, model, candidate, category, reason, repo, cwd, branch, worktree,
      lean: input.lean ? 1 : 0, parent: input.parentId ?? "", status: "starting", exit_code: null, created: now, updated: now,
    };
    this.db
      .prepare(
        `INSERT INTO tasks (id, title, prompt, agent, model, candidate, category, reason, repo, cwd, branch, worktree, lean, parent, status, created, updated)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, title, prompt, agent, model, candidate, category, reason, repo, cwd, branch, worktree, task.lean, task.parent, "starting", now, now);

    const launch = this.launcher(agent, { taskId: id, project: repo, model: model || undefined, prompt: fullPrompt || undefined, lean: !!input.lean });
    const s = spawnPty(id, launch, cwd, {});
    this.sessions.set(id, s);
    s.subscribe(() => {
      const t = this.get(id);
      if (t && (t.status === "starting" || t.status === "idle")) this.setStatus(id, "running");
    });
    s.onExit((code) => this.finish(id, code));
    this.emit("task", this.get(id));
    return this.get(id)!;
  }

  private setStatus(id: string, status: TaskStatus, exitCode?: number) {
    this.db.prepare("UPDATE tasks SET status = ?, exit_code = COALESCE(?, exit_code), updated = ? WHERE id = ?").run(status, exitCode ?? null, Date.now(), id);
    const t = this.get(id);
    this.emit("task", t);
    if (t && (status === "idle" || status === "done" || status === "failed")) {
      const msg = { idle: "is waiting for you", done: "finished", failed: `failed (exit ${exitCode})` }[status];
      this.emit("notify", { taskId: id, title: `${t.agent}: ${t.title}`, body: msg, status });
    }
  }

  private checkIdle() {
    for (const [id, s] of this.sessions) {
      if (!s.alive) continue;
      const t = this.get(id);
      if (t?.status === "running" && Date.now() - s.lastOutputAt > IDLE_MS) this.setStatus(id, "idle");
    }
  }

  private async finish(id: string, code: number) {
    const t = this.get(id);
    if (!t) return;
    const stopped = t.status === "stopped";
    if (!stopped) this.setStatus(id, code === 0 ? "done" : "failed", code);
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
    this.sessions.get(id)?.destroy();
    this.sessions.delete(id);
    if (opts.removeWorktree && t.worktree) await removeWorktree(t.repo, t.cwd);
    this.db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
    this.emit("removed", id);
  }

  dispose() {
    clearInterval(this.idleTimer);
    for (const s of this.sessions.values()) s.destroy();
  }
}

// Plain terminals from the Workspace "+" menu: cmd, PowerShell, or an agent CLI started bare, in a task's folder.
// They are not tasks: no database row, no worktree, no memory, no usage tracking, never on Home or the Board.
// Kept in memory until the tab is closed or Netheron stops; a page reload re-attaches like it does for tasks.
import { EventEmitter } from "node:events";
import { existsSync } from "node:fs";
import type { Launch } from "./agents.ts";
import { spawnPty, type PtySession } from "./pty.ts";

export const TERMINAL_KINDS = ["cmd", "powershell", "claude", "codex", "opencode"] as const;
export type TerminalKind = (typeof TERMINAL_KINDS)[number];
const LABEL: Record<TerminalKind, string> = { cmd: "cmd", powershell: "PowerShell", claude: "Claude Code", codex: "Codex", opencode: "OpenCode" };

export type TerminalInfo = {
  id: string;
  kind: TerminalKind;
  title: string;
  cwd: string;
  /** The task whose folder it opened in ("" = the project folder). */
  task: string;
  created: number;
  alive: boolean;
  exit_code: number | null;
};

/** What each kind runs. Windows goes through cmd.exe in spawnPty, so `cmd` here is an interactive cmd inside it. */
export function terminalLaunch(kind: TerminalKind, platform = process.platform): Launch {
  const win = platform === "win32";
  if (kind === "cmd") return win ? { cmd: "cmd.exe", args: [], env: {} } : { cmd: process.env.SHELL ?? "bash", args: [], env: {} };
  if (kind === "powershell") return { cmd: win ? "powershell.exe" : "pwsh", args: ["-NoLogo"], env: {} };
  return { cmd: kind, args: [], env: {} };
}

type Spawn = (id: string, launch: Launch, cwd: string, env: Record<string, string>) => PtySession;

export class Terminals extends EventEmitter {
  private items = new Map<string, { info: TerminalInfo; s: PtySession }>();
  private n = 0;
  private launchFor: (kind: TerminalKind) => Launch;
  private spawn: Spawn;

  /** `launchFor` and `spawn` are swappable so tests can run a tiny script instead of a real shell. */
  constructor(launchFor: (kind: TerminalKind) => Launch = terminalLaunch, spawn: Spawn = spawnPty) {
    super();
    this.launchFor = launchFor;
    this.spawn = spawn;
  }

  open(kind: string, cwd: string, task = ""): TerminalInfo {
    if (!(TERMINAL_KINDS as readonly string[]).includes(kind)) throw new Error(`unknown terminal "${kind}". Use: ${TERMINAL_KINDS.join(" | ")}`);
    if (!cwd || !existsSync(cwd)) throw new Error("folder not found");
    const k = kind as TerminalKind;
    const id = `x${Date.now().toString(36)}${(this.n++).toString(36)}`;
    const s = this.spawn(id, this.launchFor(k), cwd, {});
    const info: TerminalInfo = { id, kind: k, title: LABEL[k], cwd, task, created: Date.now(), alive: true, exit_code: null };
    this.items.set(id, { info, s });
    // The tab stays open after the program ends so its last output can still be read.
    s.onExit((code) => {
      info.alive = false;
      info.exit_code = code;
      if (this.items.has(id)) this.emit("terminal", { ...info }); // not after it became a task
    });
    this.emit("terminal", { ...info });
    return { ...info };
  }

  list(): TerminalInfo[] {
    return [...this.items.values()].map((x) => ({ ...x.info }));
  }

  has(id: string): boolean {
    return this.items.has(id);
  }

  session(id: string): PtySession | undefined {
    return this.items.get(id)?.s;
  }

  write(id: string, data: string) {
    this.items.get(id)?.s.write(data);
  }

  resize(id: string, cols: number, rows: number) {
    this.items.get(id)?.s.resize(cols, rows);
  }

  /** Hand the running terminal over (it becomes a task): it leaves this list but its process keeps running. */
  release(id: string): { info: TerminalInfo; s: PtySession } | undefined {
    const x = this.items.get(id);
    if (!x) return undefined;
    this.items.delete(id);
    this.emit("closed", id);
    return { info: { ...x.info }, s: x.s };
  }

  async close(id: string) {
    const x = this.items.get(id);
    if (!x) return;
    this.items.delete(id);
    this.emit("closed", id);
    await x.s.destroy();
  }

  async dispose() {
    await Promise.all([...this.items.keys()].map((id) => this.close(id)));
  }
}

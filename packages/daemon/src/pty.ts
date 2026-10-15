// One pseudo-terminal per task. Keeps a scrollback buffer so a browser (desktop or phone)
// can attach at any time and see the full session.
import pty from "@lydell/node-pty";
import { commandLine, type Launch } from "./agents.ts";

const MAX_BUFFER = 512 * 1024;

export type PtySession = {
  id: string;
  write(data: string): void;
  resize(cols: number, rows: number): void;
  kill(): void;
  buffer(): string;
  subscribe(fn: (data: string) => void): () => void;
  onExit(fn: (code: number) => void): void;
  /** Kill the process, wait for it to exit, then release the terminal's pipes. */
  destroy(): Promise<void>;
  readonly lastOutputAt: number;
  readonly alive: boolean;
  /** Process id of the terminal's root process (cmd.exe / sh), for the resource manager. */
  readonly pid: number;
};

// Markers a parent Claude Code session puts in its children's environment. If Netheron itself was started from a
// Claude Code terminal they would leak into every agent, and Claude Code then treats the agent as a sub-session:
// it stops saving its transcript, which is where Netheron reads subscription usage from (sessionlogs.ts).
const PARENT_SESSION_VARS = ["CLAUDECODE", "CLAUDE_CODE_CHILD_SESSION", "CLAUDE_CODE_SESSION_ID", "CLAUDE_CODE_SESSION_ATTENDED",
  "CLAUDE_CODE_ENTRYPOINT", "CLAUDE_CODE_EXECPATH", "CLAUDE_CODE_MESSAGING_SOCKET", "CLAUDE_CODE_MESSAGING_TOKEN", "CLAUDE_PID", "CLAUDE_EFFORT"];

/** The environment an agent starts with: Netheron's own, minus a parent Claude Code session's markers, plus the launch's. */
export function agentEnv(launch: Launch, env: Record<string, string>, base: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const inherited = { ...base };
  for (const k of PARENT_SESSION_VARS) delete inherited[k];
  return { ...inherited, ...launch.env, ...env, TERM: "xterm-256color", COLORTERM: "truecolor" } as Record<string, string>;
}

export function spawnPty(id: string, launch: Launch, cwd: string, env: Record<string, string>): PtySession {
  const fullEnv = agentEnv(launch, env);
  // Windows: run through cmd.exe so .cmd shims resolve. node-pty takes a raw command line string here.
  const p =
    process.platform === "win32"
      ? pty.spawn("cmd.exe", `/d /s /c "${commandLine(launch)}"`, { name: "xterm-256color", cols: 120, rows: 32, cwd, env: fullEnv })
      : pty.spawn(process.env.SHELL ?? "/bin/sh", ["-lc", commandLine(launch)], { name: "xterm-256color", cols: 120, rows: 32, cwd, env: fullEnv });

  let buf = "";
  let last = Date.now();
  let alive = true;
  let killed = false;
  let markExited: () => void = () => {};
  const exited = new Promise<void>((r) => (markExited = r));
  const subs = new Set<(d: string) => void>();
  const exits: Array<(c: number) => void> = [];

  p.onData((d) => {
    last = Date.now();
    buf += d;
    if (buf.length > MAX_BUFFER) buf = buf.slice(buf.length - MAX_BUFFER);
    for (const s of subs) s(d);
  });
  p.onExit(({ exitCode }) => {
    alive = false;
    markExited();
    for (const e of exits) e(exitCode);
  });

  return {
    id,
    write: (d) => alive && p.write(d),
    resize: (c, r) => {
      if (alive && c > 0 && r > 0) p.resize(Math.min(c, 500), Math.min(r, 200));
    },
    // Kill at most once: a second kill (or closing pipes) while ConPTY is still shutting down
    // corrupts the heap on Windows and takes the whole daemon down (B-030).
    kill: () => {
      if (!alive || killed) return;
      killed = true;
      try { p.kill(); } catch { /* already gone */ }
    },
    destroy: async () => {
      subs.clear();
      if (alive && !killed) {
        killed = true;
        try { p.kill(); } catch { /* already gone */ }
      }
      await Promise.race([exited, new Promise((r) => setTimeout(r, 3000))]);
      // Once the process is gone, kill() is safe again and releases ConPTY's handles (else the daemon can't exit).
      try { p.kill(); } catch { /* already gone */ }
      // node-pty (ConPTY on Windows) can keep its pipes open after exit; close them so the process can exit.
      for (const k of ["_socket", "_inSocket", "_outSocket"]) {
        try { (p as unknown as Record<string, { destroy?: () => void }>)[k]?.destroy?.(); } catch { /* closed */ }
      }
    },
    buffer: () => buf,
    subscribe: (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    onExit: (fn) => exits.push(fn),
    get lastOutputAt() {
      return last;
    },
    get alive() {
      return alive;
    },
    pid: p.pid,
  };
}

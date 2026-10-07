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
  /** Kill the process and release the terminal's pipes even if it already exited. */
  destroy(): void;
  readonly lastOutputAt: number;
  readonly alive: boolean;
};

export function spawnPty(id: string, launch: Launch, cwd: string, env: Record<string, string>): PtySession {
  const fullEnv = { ...process.env, ...launch.env, ...env, TERM: "xterm-256color", COLORTERM: "truecolor" } as Record<string, string>;
  // Windows: run through cmd.exe so .cmd shims resolve. node-pty takes a raw command line string here.
  const p =
    process.platform === "win32"
      ? pty.spawn("cmd.exe", `/d /s /c "${commandLine(launch)}"`, { name: "xterm-256color", cols: 120, rows: 32, cwd, env: fullEnv })
      : pty.spawn(process.env.SHELL ?? "/bin/sh", ["-lc", commandLine(launch)], { name: "xterm-256color", cols: 120, rows: 32, cwd, env: fullEnv });

  let buf = "";
  let last = Date.now();
  let alive = true;
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
    for (const e of exits) e(exitCode);
  });

  return {
    id,
    write: (d) => alive && p.write(d),
    resize: (c, r) => {
      if (alive && c > 0 && r > 0) p.resize(Math.min(c, 500), Math.min(r, 200));
    },
    kill: () => {
      if (alive) p.kill();
    },
    destroy: () => {
      subs.clear();
      try { p.kill(); } catch { /* already gone */ }
      // node-pty (ConPTY on Windows) can keep its pipes open after exit; close them so the process can exit.
      for (const k of ["_socket", "_inSocket", "_outSocket"]) (p as unknown as Record<string, { destroy?: () => void }>)[k]?.destroy?.();
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
  };
}

// Resource manager: memory and CPU of each task's terminal, counting every process under it (cmd.exe → agent →
// tools it started). One process-table snapshot per call: PowerShell CIM on Windows, `ps` elsewhere. CPU % comes from
// the change in CPU time since the previous snapshot. Snapshots are cached for a few seconds.
import { execFile } from "node:child_process";
import { cpus } from "node:os";
import { promisify } from "node:util";

const run = promisify(execFile);
export type Proc = { pid: number; ppid: number; name: string; mem: number; cpuMs: number };
export type TaskUse = { id: string; title: string; agent: string; repo: string; status: string; pid: number; memBytes: number; cpuPct: number;
                        processes: number; idleMs: number; history: number[] };

export async function processTable(): Promise<Proc[]> {
  if (process.platform === "win32") {
    const cmd = "Get-CimInstance Win32_Process | ForEach-Object { '{0} {1} {2} {3} {4}' -f $_.ProcessId,$_.ParentProcessId,$_.WorkingSetSize,([uint64]$_.KernelModeTime+[uint64]$_.UserModeTime),$_.Name }";
    const { stdout } = await run("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", cmd], { windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
    return parse(stdout, (n) => n / 10_000); // 100 ns units -> ms
  }
  const { stdout } = await run("ps", ["-axo", "pid=,ppid=,rss=,time=,comm="], { maxBuffer: 16 * 1024 * 1024 });
  return stdout.split("\n").map((l) => l.trim().split(/\s+/)).filter((p) => p.length >= 5).map(([pid, ppid, rss, time, ...name]) => ({
    pid: +pid, ppid: +ppid, mem: +rss * 1024, cpuMs: cpuTime(time), name: name.join(" "),
  }));
}

function parse(out: string, toMs: (n: number) => number): Proc[] {
  return out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const [pid, ppid, mem, cpu, ...name] = l.split(" ");
    return { pid: +pid, ppid: +ppid, mem: +mem || 0, cpuMs: toMs(+cpu || 0), name: name.join(" ") };
  });
}

/** "[[dd-]hh:]mm:ss" from ps -> ms. */
function cpuTime(t: string): number {
  const [d, rest] = t.includes("-") ? t.split("-") : ["0", t];
  const parts = rest.split(":").map(Number);
  while (parts.length < 3) parts.unshift(0);
  return ((+d * 24 + parts[0]) * 3600 + parts[1] * 60 + parts[2]) * 1000;
}

/** Every process under `root`, root included. */
export function subtree(table: Proc[], root: number): Proc[] {
  const kids = new Map<number, Proc[]>();
  for (const p of table) (kids.get(p.ppid) ?? kids.set(p.ppid, []).get(p.ppid)!).push(p);
  const out: Proc[] = [];
  const self = table.find((p) => p.pid === root);
  const stack = self ? [self] : [];
  const seen = new Set<number>();
  while (stack.length) {
    const p = stack.pop()!;
    if (seen.has(p.pid)) continue;
    seen.add(p.pid);
    out.push(p);
    for (const k of kids.get(p.pid) ?? []) if (k.pid !== k.ppid) stack.push(k);
  }
  return out;
}

type Live = { id: string; pid: number; lastOutputAt: number; status: string; title: string; agent: string; repo: string };

export class ResourceMonitor {
  private last?: { at: number; cpu: Map<number, number> };
  private cache?: { at: number; value: { tasks: TaskUse[]; totalMem: number; totalCpuPct: number; netheronMem: number } };
  private hist = new Map<string, number[]>();
  private table: () => Promise<Proc[]>;
  constructor(table: () => Promise<Proc[]> = processTable) { this.table = table; }

  async snapshot(live: Live[], now = Date.now(), maxAgeMs = 3000) {
    if (this.cache && now - this.cache.at < maxAgeMs) return this.cache.value;
    let table: Proc[] = [];
    try { table = await this.table(); } catch { /* no process listing available */ }
    const cores = Math.max(1, cpus().length);
    const prev = this.last;
    const tasks: TaskUse[] = live.map((s) => {
      const procs = subtree(table, s.pid);
      const memBytes = procs.reduce((a, p) => a + p.mem, 0);
      const cpuMs = procs.reduce((a, p) => a + p.cpuMs, 0);
      const before = prev ? procs.reduce((a, p) => a + (prev.cpu.get(p.pid) ?? p.cpuMs), 0) : cpuMs;
      const cpuPct = prev && now > prev.at ? Math.max(0, Math.min(100, ((cpuMs - before) / (now - prev.at)) * 100 / cores)) : 0;
      const h = [...(this.hist.get(s.id) ?? []), memBytes].slice(-20);
      this.hist.set(s.id, h);
      return { id: s.id, title: s.title, agent: s.agent, repo: s.repo, status: s.status, pid: s.pid, memBytes, cpuPct: Math.round(cpuPct * 10) / 10,
               processes: procs.length, idleMs: now - s.lastOutputAt, history: h };
    });
    this.last = { at: now, cpu: new Map(table.map((p) => [p.pid, p.cpuMs])) };
    for (const id of this.hist.keys()) if (!live.some((s) => s.id === id)) this.hist.delete(id);
    const value = {
      tasks: tasks.sort((a, b) => b.memBytes - a.memBytes),
      totalMem: tasks.reduce((a, t) => a + t.memBytes, 0),
      totalCpuPct: Math.round(tasks.reduce((a, t) => a + t.cpuPct, 0) * 10) / 10,
      netheronMem: process.memoryUsage().rss,
    };
    this.cache = { at: now, value };
    return value;
  }
}

// Keep the computer awake: On (always), Agent (only while an agent is working) or Off (normal sleep).
// Windows: a small hidden PowerShell process calls SetThreadExecutionState(ES_CONTINUOUS | ES_SYSTEM_REQUIRED) and
// stays alive; ending it gives sleep back. macOS: caffeinate -i. Linux: systemd-inhibit. The display may still turn
// off; only system sleep is held off. The chosen mode is saved, so it survives a restart.
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DATA_DIR } from "./config.ts";

export type AwakeMode = "on" | "agent" | "off";
export const AWAKE_MODES: AwakeMode[] = ["on", "agent", "off"];
type Spawner = () => ChildProcess | undefined;

const WIN_SCRIPT = [
  "$s = '[DllImport(\"kernel32.dll\")] public static extern uint SetThreadExecutionState(uint f);'",
  "Add-Type -MemberDefinition $s -Name P -Namespace NetheronAwake",
  "[void][NetheronAwake.P]::SetThreadExecutionState([uint32]'0x80000001')",
  "while ($true) { Start-Sleep -Seconds 3600 }",
].join("; ");

export function defaultSpawner(): ChildProcess | undefined {
  const opts = { stdio: "ignore" as const, windowsHide: true };
  if (process.platform === "win32") return spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", WIN_SCRIPT], opts);
  if (process.platform === "darwin") return spawn("caffeinate", ["-i"], opts);
  return spawn("systemd-inhibit", ["--what=sleep", "--who=Netheron", "--why=An agent is working", "sleep", "infinity"], opts);
}

export class KeepAwake {
  mode: AwakeMode;
  private proc?: ChildProcess;
  private working = false;
  private file: string;
  private spawner: Spawner;

  constructor(o: { dir?: string; spawner?: Spawner } = {}) {
    this.file = join(o.dir ?? DATA_DIR, "awake.json");
    // Test runs never hold the real PC awake unless a test passes its own starter.
    this.spawner = o.spawner ?? (process.env.NODE_TEST_CONTEXT ? () => undefined : defaultSpawner);
    let mode: AwakeMode = "agent";
    try { const m = JSON.parse(readFileSync(this.file, "utf8")).mode; if (AWAKE_MODES.includes(m)) mode = m; } catch { /* first run */ }
    this.mode = mode;
    this.apply();
  }

  setMode(mode: AwakeMode) {
    if (!AWAKE_MODES.includes(mode)) throw new Error(`mode must be one of ${AWAKE_MODES.join(", ")}`);
    this.mode = mode;
    try { if (!existsSync(join(this.file, ".."))) mkdirSync(join(this.file, ".."), { recursive: true }); writeFileSync(this.file, JSON.stringify({ mode })); } catch { /* read-only data dir */ }
    this.apply();
  }

  /** Tell it whether any agent is working right now (called on every task change). */
  setWorking(working: boolean) {
    if (working === this.working) return;
    this.working = working;
    this.apply();
  }

  get active() { return !!this.proc; }
  state() { return { mode: this.mode, active: this.active, working: this.working }; }

  private apply() {
    const want = this.mode === "on" || (this.mode === "agent" && this.working);
    if (want && !this.proc) {
      try {
        const p = this.spawner();
        if (!p) return;
        p.on("error", () => { if (this.proc === p) this.proc = undefined; }); // e.g. caffeinate missing
        p.on("exit", () => { if (this.proc === p) this.proc = undefined; });
        this.proc = p;
      } catch { /* can't hold sleep on this system */ }
    } else if (!want && this.proc) {
      const p = this.proc;
      this.proc = undefined;
      try { p.kill(); } catch { /* gone */ }
    }
  }

  dispose() {
    const p = this.proc;
    this.proc = undefined;
    try { p?.kill(); } catch { /* gone */ }
  }
}

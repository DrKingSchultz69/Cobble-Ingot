// Live diff: watch a task's folder and push a fresh diff whenever files change.
// One watcher per task, shared by every browser tab viewing it; stops when the last viewer leaves.
import { watch, type FSWatcher } from "node:fs";
import type { DiffResult } from "./worktree.ts";

type Entry = { watcher?: FSWatcher; poll?: NodeJS.Timeout; timer?: NodeJS.Timeout; listeners: Set<(d: DiffResult) => void>; last: string; busy: boolean; again: boolean };

const keyOf = (d: DiffResult) => JSON.stringify([d.stat, d.diff]);
const IGNORE = /(^|[\\/])(node_modules|\.git[\\/](objects|logs)|\.next|dist|build|__pycache__)([\\/]|$)/;

export class DiffWatcher {
  private entries = new Map<string, Entry>();

  private load: (id: string) => Promise<DiffResult>;
  private cwdOf: (id: string) => string | undefined;
  private debounceMs: number;

  constructor(load: (id: string) => Promise<DiffResult>, cwdOf: (id: string) => string | undefined, debounceMs = 300) {
    this.load = load;
    this.cwdOf = cwdOf;
    this.debounceMs = debounceMs;
  }

  /** Sends the current diff right away, then again on every change. Returns an unsubscribe function. */
  subscribe(id: string, fn: (d: DiffResult) => void): () => void {
    let e = this.entries.get(id);
    if (!e) {
      e = { listeners: new Set(), last: "", busy: false, again: false };
      this.entries.set(id, e);
      this.start(id, e);
    }
    e.listeners.add(fn);
    this.load(id).then((d) => { e.last = keyOf(d); fn(d); }, () => {});
    return () => {
      e.listeners.delete(fn);
      if (!e.listeners.size) this.stop(id);
    };
  }

  private start(id: string, e: Entry) {
    const cwd = this.cwdOf(id);
    if (!cwd) return;
    const kick = () => {
      clearTimeout(e.timer);
      e.timer = setTimeout(() => this.refresh(id, e), this.debounceMs);
    };
    try {
      e.watcher = watch(cwd, { recursive: true }, (_ev, file) => {
        if (file && IGNORE.test(String(file))) return;
        kick();
      });
      e.watcher.on("error", () => { e.watcher?.close(); e.watcher = undefined; e.poll ??= setInterval(kick, 3000); });
    } catch {
      // Recursive watch unsupported (older Linux Node): fall back to polling.
      e.poll = setInterval(kick, 3000);
    }
  }

  private async refresh(id: string, e: Entry) {
    if (e.busy) return void (e.again = true); // a change landed mid-diff: run once more after
    e.busy = true;
    try {
      const d = await this.load(id);
      const key = keyOf(d);
      if (key !== e.last) {
        e.last = key;
        for (const fn of e.listeners) fn(d);
      }
    } catch { /* folder removed */ }
    e.busy = false;
    if (e.again) {
      e.again = false;
      this.refresh(id, e);
    }
  }

  private stop(id: string) {
    const e = this.entries.get(id);
    if (!e) return;
    e.watcher?.close();
    clearInterval(e.poll);
    clearTimeout(e.timer);
    this.entries.delete(id);
  }

  dispose() {
    for (const id of [...this.entries.keys()]) this.stop(id);
  }
}

// Pre-trust Netheron's own worktrees in Claude Code (P44 / B-014, option 2), so each new task doesn't
// stop at "Do you trust the files in this folder?". Only folders Netheron created are touched.
// ~/.claude.json is also written by running Claude sessions, so: back it up once, re-read right before
// writing, write a temp file and rename it into place, and give up (prompt shows) rather than risk it.
import { copyFileSync, existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const keysFor = (folder: string) => {
  const abs = resolve(folder);
  return [...new Set([abs, abs.replace(/\\/g, "/")])]; // Claude has stored both forms on Windows
};

type Result = { ok: boolean; note: string };

function update(home: string, edit: (projects: Record<string, Record<string, unknown>>) => boolean): Result {
  const file = join(home, ".claude.json");
  if (!existsSync(file)) return { ok: false, note: "Claude config not found; Claude will ask once." };
  const backup = `${file}.netheron-backup`;
  if (!existsSync(backup)) copyFileSync(file, backup);
  for (let attempt = 0; attempt < 3; attempt++) {
    const raw = readFileSync(file, "utf8");
    let json: { projects?: Record<string, Record<string, unknown>> };
    try { json = JSON.parse(raw); } catch { return { ok: false, note: "Claude config is not valid JSON; left untouched." }; }
    json.projects ??= {};
    if (!edit(json.projects)) return { ok: true, note: "already set" };
    const tmp = `${file}.netheron-${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(json, null, 2));
    if (readFileSync(file, "utf8") !== raw) { unlinkSync(tmp); continue; } // a Claude session wrote meanwhile: retry
    try {
      renameSync(tmp, file);
      return { ok: true, note: "trusted" };
    } catch {
      try { unlinkSync(tmp); } catch { /* ignore */ }
    }
  }
  return { ok: false, note: "Claude config busy; Claude will ask once." };
}

export function trustClaudeFolder(folder: string, home = homedir()): Result {
  return update(home, (projects) => {
    let changed = false;
    for (const k of keysFor(folder)) {
      if (projects[k]?.hasTrustDialogAccepted === true) continue;
      projects[k] = { ...(projects[k] ?? {}), hasTrustDialogAccepted: true };
      changed = true;
    }
    return changed;
  });
}

/** Forget a removed worktree (keeps ~/.claude.json from collecting dead entries). */
export function untrustClaudeFolder(folder: string, home = homedir()): Result {
  return update(home, (projects) => {
    let changed = false;
    for (const k of keysFor(folder)) if (k in projects) { delete projects[k]; changed = true; }
    return changed;
  });
}

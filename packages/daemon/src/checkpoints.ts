// Checkpoints (P03) and the edit guard (P02): snapshots of a task's folder after every agent turn,
// so damaged or deleted work can be restored. Snapshots use a temporary git index, so the agent's own
// index, branch and stash are never touched. They're stored as commits under refs/netheron/<task>/<n>.
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const KEEP = 50;
const IDENTITY = { GIT_AUTHOR_NAME: "Netheron", GIT_AUTHOR_EMAIL: "checkpoint@netheron.local", GIT_COMMITTER_NAME: "Netheron", GIT_COMMITTER_EMAIL: "checkpoint@netheron.local" };

async function git(cwd: string, args: string[], env: Record<string, string> = {}, buffer = false): Promise<string> {
  // Byte-exact snapshots: no CRLF conversion in either direction (Windows defaults to core.autocrlf=true).
  const { stdout } = await run("git", ["-C", cwd, "-c", "core.autocrlf=false", "-c", "core.safecrlf=false", ...args], {
    env: { ...process.env, ...env }, maxBuffer: 256 * 1024 * 1024, windowsHide: true, encoding: buffer ? "buffer" : "utf8",
  } as never);
  return stdout as unknown as string;
}

export type Checkpoint = { n: number; ref: string; commit: string; ts: number; label: string };

/** Tree of the folder as it is now (tracked + untracked, respecting .gitignore), without touching the real index. */
export async function snapshotTree(cwd: string): Promise<string> {
  const idx = join(tmpdir(), `netheron-idx-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const env = { GIT_INDEX_FILE: idx };
  try {
    try { await git(cwd, ["read-tree", "HEAD"], env); } catch { /* no commits yet: start empty */ }
    await git(cwd, ["add", "-A"], env);
    return (await git(cwd, ["write-tree"], env)).trim();
  } finally {
    rmSync(idx, { force: true });
  }
}

export async function listCheckpoints(cwd: string, taskId: string): Promise<Checkpoint[]> {
  let out = "";
  try {
    out = await git(cwd, ["for-each-ref", `refs/netheron/${taskId}/`, "--format=%(refname)%09%(objectname)%09%(creatordate:unix)%09%(contents:subject)"]);
  } catch { return []; }
  return out.split("\n").filter(Boolean).map((l) => {
    const [ref, commit, ts, label] = l.split("\t");
    return { n: Number(ref.split("/").pop()), ref, commit, ts: Number(ts) * 1000, label: label.replace(/^netheron checkpoint: /, "") };
  }).sort((a, b) => a.n - b.n);
}

/** Snapshot the folder. Returns the previous checkpoint unchanged if nothing changed since it. */
export async function createCheckpoint(cwd: string, taskId: string, label: string): Promise<Checkpoint | null> {
  if (!existsSync(cwd)) return null;
  try { await git(cwd, ["rev-parse", "--git-dir"]); } catch { return null; } // not a git folder
  const tree = await snapshotTree(cwd);
  const all = await listCheckpoints(cwd, taskId);
  const last = all.at(-1);
  if (last && (await git(cwd, ["rev-parse", `${last.commit}^{tree}`])).trim() === tree) return last;
  let parent: string[] = [];
  try { parent = ["-p", (await git(cwd, ["rev-parse", "HEAD"])).trim()]; } catch { /* no HEAD */ }
  const commit = (await git(cwd, ["commit-tree", tree, ...parent, "-m", `netheron checkpoint: ${label}`], IDENTITY)).trim();
  const n = (last?.n ?? 0) + 1;
  const ref = `refs/netheron/${taskId}/${String(n).padStart(4, "0")}`;
  await git(cwd, ["update-ref", ref, commit]);
  for (const old of all.slice(0, Math.max(0, all.length + 1 - KEEP))) await git(cwd, ["update-ref", "-d", old.ref]);
  return { n, ref, commit, ts: Date.now(), label };
}

export async function deleteCheckpoints(cwd: string, taskId: string): Promise<void> {
  for (const c of await listCheckpoints(cwd, taskId)) {
    try { await git(cwd, ["update-ref", "-d", c.ref]); } catch { /* gone */ }
  }
}

const filesIn = async (cwd: string, treeish: string) =>
  (await git(cwd, ["ls-tree", "-r", "-z", "--name-only", treeish])).split("\0").filter(Boolean);

/** Restore one file (or the whole folder) to how it was at a checkpoint. Never touches the real index. */
export async function restoreCheckpoint(cwd: string, commit: string, path?: string): Promise<{ restored: number; deleted: number }> {
  if (path) {
    const abs = join(cwd, path);
    const inSnapshot = (await filesIn(cwd, commit)).includes(path.replace(/\\/g, "/"));
    if (!inSnapshot) {
      if (existsSync(abs)) unlinkSync(abs);
      return { restored: 0, deleted: 1 };
    }
    const blob = await git(cwd, ["cat-file", "blob", `${commit}:${path.replace(/\\/g, "/")}`], {}, true);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, blob as unknown as Buffer);
    return { restored: 1, deleted: 0 };
  }
  const idx = join(tmpdir(), `netheron-idx-${process.pid}-${Date.now()}`);
  try {
    await git(cwd, ["read-tree", commit], { GIT_INDEX_FILE: idx });
    await git(cwd, ["checkout-index", "-a", "-f"], { GIT_INDEX_FILE: idx });
  } finally {
    rmSync(idx, { force: true });
  }
  // Remove files created after the checkpoint (tracked or untracked, ignored files left alone).
  const keep = new Set(await filesIn(cwd, commit));
  const now = (await git(cwd, ["ls-files", "-z", "--cached", "--others", "--exclude-standard"])).split("\0").filter(Boolean);
  let deleted = 0;
  for (const f of now) {
    if (keep.has(f)) continue;
    const abs = join(cwd, f);
    if (existsSync(abs) && statSync(abs).isFile()) { unlinkSync(abs); deleted++; }
  }
  return { restored: keep.size, deleted };
}

// ---- edit guard ----------------------------------------------------------------------------------
export type GuardWarning = { path: string; kind: "emptied" | "truncated" | "reasoning" | "git"; detail: string };

// Lines an agent's reasoning tends to leave behind when an edit goes wrong (only checked in code files).
const REASONING = /^\s*(<\/?think(ing)?>|thinking:|let me (now )?(check|look|update|fix|read|see)\b|i'll (now )?(update|fix|add|check|edit)\b|i will now\b|now i (need|will)\b)/i;
const PROSE = /\.(md|mdx|txt|rst|adoc)$/i;

/** Compare the folder now with a checkpoint and flag edits that look like damage, not work. */
export async function guardCheck(cwd: string, baseCommit: string): Promise<GuardWarning[]> {
  const out: GuardWarning[] = [];
  if (!existsSync(join(cwd, ".git"))) {
    out.push({ path: ".git", kind: "git", detail: "The folder's .git is missing or was renamed, so git no longer sees this checkout." });
    return out;
  }
  const now = await snapshotTree(cwd);
  const numstat = await git(cwd, ["diff-tree", "-r", "--numstat", "--no-renames", baseCommit, now]);
  for (const line of numstat.split("\n").filter(Boolean).slice(0, 300)) {
    const [a, d, path] = line.split("\t");
    if (a === "-" || !path) continue; // binary
    const added = Number(a);
    const deleted = Number(d);
    if (deleted >= 3) {
      const before = (await git(cwd, ["cat-file", "-p", `${baseCommit}:${path}`]).catch(() => "")).split("\n").length - 1;
      const size = existsSync(join(cwd, path)) ? statSync(join(cwd, path)).size : -1;
      if (size === 0 && before >= 3) out.push({ path, kind: "emptied", detail: `Was ${before} lines, now empty.` });
      else if (size > 0 && before >= 20 && deleted >= before * 0.5 && added <= deleted * 0.2) {
        out.push({ path, kind: "truncated", detail: `Lost ${deleted} of ${before} lines and gained only ${added}.` });
      }
    }
    if (added > 0 && !PROSE.test(path) && out.filter((w) => w.kind === "reasoning").length < 20) {
      const patch = await git(cwd, ["diff-tree", "-p", "--no-color", "--unified=0", baseCommit, now, "--", path]);
      const hit = patch.split("\n").find((l) => l.startsWith("+") && !l.startsWith("+++") && REASONING.test(l.slice(1)));
      if (hit) out.push({ path, kind: "reasoning", detail: `Looks like the agent's reasoning was written into the file: "${hit.slice(1).trim().slice(0, 80)}"` });
    }
  }
  return out;
}

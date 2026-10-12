// Worktree setup recipe (P35): a fresh git worktree lacks everything git doesn't track (.env files,
// node_modules…). Per project, Netheron copies files, links heavy folders and can run a command
// before the agent starts. Links are removed again before the worktree is deleted, so deleting a
// worktree can never reach through a link into the main checkout.
import { exec } from "node:child_process";
import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, rmdirSync, statSync, symlinkSync, unlinkSync } from "node:fs";
import { dirname, join, normalize, relative, resolve } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { detectVerify } from "./verify.ts";

export type SetupRecipe = { copy: string[]; link: string[]; run: string; verify: string; auto?: boolean };

export function ensureSetupSchema(db: DatabaseSync): void {
  db.exec("CREATE TABLE IF NOT EXISTS project_setup (project TEXT PRIMARY KEY, recipe TEXT NOT NULL, updated INTEGER NOT NULL)");
}

/** What Netheron does when nothing is configured: copy root .env files, link node_modules. */
export function defaultRecipe(repo: string): SetupRecipe {
  const files = existsSync(repo) ? readdirSync(repo) : [];
  return {
    copy: files.filter((f) => /^\.env(\..+)?$/.test(f) && !/\.(example|sample|template)$/.test(f) && statSync(join(repo, f)).isFile()),
    link: existsSync(join(repo, "node_modules")) ? ["node_modules"] : [],
    run: "",
    verify: detectVerify(repo),
    auto: true,
  };
}

export function getRecipe(db: DatabaseSync, repo: string): SetupRecipe {
  const row = db.prepare("SELECT recipe FROM project_setup WHERE project = ?").get(resolve(repo)) as { recipe: string } | undefined;
  return row ? { verify: "", ...JSON.parse(row.recipe), auto: false } : defaultRecipe(repo);
}

const clean = (list: unknown): string[] =>
  (Array.isArray(list) ? list : String(list ?? "").split(/[\n,]/)).map((x) => String(x).trim()).filter(Boolean);

export function saveRecipe(db: DatabaseSync, repo: string, r: Partial<SetupRecipe>): SetupRecipe {
  const recipe = { copy: clean(r.copy), link: clean(r.link), run: String(r.run ?? "").trim(), verify: String(r.verify ?? "").trim() };
  for (const p of [...recipe.copy, ...recipe.link]) safeRel(p);
  db.prepare("INSERT INTO project_setup (project, recipe, updated) VALUES (?, ?, ?) ON CONFLICT(project) DO UPDATE SET recipe = excluded.recipe, updated = excluded.updated")
    .run(resolve(repo), JSON.stringify(recipe), Date.now());
  return { ...recipe, auto: false };
}

function safeRel(p: string): string {
  const n = normalize(p);
  if (!n || n.startsWith("..") || /^([a-zA-Z]:|[\\/])/.test(p)) throw new Error(`setup paths must be inside the project: ${p}`);
  return n;
}

export type SetupResult = { notes: string[]; links: string[]; ok: boolean };

/** Apply a recipe to a new worktree. Never throws: problems become notes so the task still starts. */
export async function applyRecipe(repo: string, worktree: string, r: SetupRecipe, runTimeoutMs = 10 * 60_000): Promise<SetupResult> {
  const notes: string[] = [];
  const links: string[] = [];
  let ok = true;
  for (const p of r.copy) {
    try {
      const rel = safeRel(p);
      const src = join(repo, rel);
      const dst = join(worktree, rel);
      if (!existsSync(src)) { notes.push(`skip copy ${rel} (not in project)`); continue; }
      if (existsSync(dst)) continue;
      mkdirSync(dirname(dst), { recursive: true });
      copyFileSync(src, dst);
      notes.push(`copied ${rel}`);
    } catch (e) { ok = false; notes.push(`copy ${p} failed: ${(e as Error).message}`); }
  }
  for (const p of r.link) {
    try {
      const rel = safeRel(p);
      const src = join(repo, rel);
      const dst = join(worktree, rel);
      if (!existsSync(src)) { notes.push(`skip link ${rel} (not in project)`); continue; }
      if (existsSync(dst)) continue;
      mkdirSync(dirname(dst), { recursive: true });
      // Junctions need no admin rights on Windows; elsewhere a normal directory symlink.
      symlinkSync(src, dst, process.platform === "win32" ? "junction" : statSync(src).isDirectory() ? "dir" : "file");
      links.push(rel);
      notes.push(`linked ${rel}`);
    } catch (e) { ok = false; notes.push(`link ${p} failed: ${(e as Error).message}`); }
  }
  if (r.run) {
    const res = await new Promise<{ code: number; out: string }>((done) => {
      exec(r.run, { cwd: worktree, timeout: runTimeoutMs, windowsHide: true, maxBuffer: 4 * 1024 * 1024 }, (err, stdout, stderr) =>
        done({ code: err ? (typeof err.code === "number" ? err.code : 1) : 0, out: `${stdout}${stderr}`.trim().split("\n").slice(-3).join(" | ") }));
    });
    if (res.code) ok = false;
    notes.push(res.code ? `ran "${r.run}": failed (exit ${res.code}) ${res.out}` : `ran "${r.run}"`);
  }
  return { notes, links, ok };
}

/** Remove the links a recipe created (only links, never real folders) before deleting a worktree. */
export function removeLinks(worktree: string, links: string[]): void {
  for (const rel of links) {
    const p = join(worktree, rel);
    if (relative(worktree, p).startsWith("..")) continue;
    try {
      if (!lstatSync(p).isSymbolicLink()) continue;
      if (process.platform === "win32") rmdirSync(p); // removes the junction itself, not the target
      else unlinkSync(p);
    } catch { /* already gone */ }
  }
}

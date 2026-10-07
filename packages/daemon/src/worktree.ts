// Git worktree per task, so parallel agents never edit the same checkout.
import { execFile, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import { promisify } from "node:util";
import { DATA_DIR } from "./config.ts";

const run = promisify(execFile);

export async function git(dir: string, ...args: string[]): Promise<string> {
  const { stdout } = await run("git", ["-C", dir, ...args], { maxBuffer: 64 * 1024 * 1024, windowsHide: true });
  return stdout;
}

export async function isGitRepo(dir: string): Promise<boolean> {
  try {
    return (await git(dir, "rev-parse", "--is-inside-work-tree")).trim() === "true";
  } catch {
    return false;
  }
}

export async function repoRoot(dir: string): Promise<string> {
  return resolve((await git(dir, "rev-parse", "--show-toplevel")).trim());
}

// For a linked worktree, the main checkout's folder; otherwise the repo root. Memory is keyed by this
// so every worktree of a repo shares one project memory (B-014).
export function mainRepoRootSync(dir: string): string {
  try {
    const common = execFileSync("git", ["-C", dir, "rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return resolve(common.replace(/[\\/]\.git$/, ""));
  } catch {
    return resolve(dir);
  }
}

export function worktreeRoot(repo: string): string {
  const h = createHash("sha1").update(resolve(repo).toLowerCase()).digest("hex").slice(0, 8);
  return join(DATA_DIR, "worktrees", `${basename(repo)}-${h}`);
}

export function slugify(s: string, max = 32): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max) || "task";
}

export async function createWorktree(repo: string, name: string): Promise<{ path: string; branch: string }> {
  const root = worktreeRoot(repo);
  mkdirSync(root, { recursive: true });
  const branch = `mm/${name}`;
  const path = join(root, name);
  if (existsSync(path)) throw new Error(`worktree already exists: ${path}`);
  // Repos with no commits can't have worktrees.
  try {
    await git(repo, "rev-parse", "--verify", "HEAD");
  } catch {
    throw new Error("Repository has no commits yet; make an initial commit or turn off isolation.");
  }
  await git(repo, "worktree", "add", "-b", branch, path, "HEAD");
  return { path, branch };
}

// Removes the worktree folder; the branch is kept so no committed work is lost.
export async function removeWorktree(repo: string, path: string): Promise<void> {
  if (!resolve(path).startsWith(resolve(worktreeRoot(repo)))) throw new Error("refusing to remove a folder mm did not create");
  await git(repo, "worktree", "remove", "--force", path);
}

export type DiffResult = { stat: string; diff: string; files: Array<{ status: string; path: string }> };

const MAX_UNTRACKED = 100_000;

export async function worktreeDiff(dir: string): Promise<DiffResult> {
  const porcelain = await git(dir, "status", "--porcelain", "--untracked-files=all");
  const files = porcelain
    .split("\n")
    .filter(Boolean)
    .map((l) => ({ status: l.slice(0, 2).trim(), path: l.slice(3).replace(/^"|"$/g, "") }));
  let diff = "";
  let stat = "";
  try {
    diff = await git(dir, "diff", "HEAD", "--no-color");
    stat = await git(dir, "diff", "HEAD", "--stat", "--no-color");
  } catch {
    diff = await git(dir, "diff", "--no-color"); // no HEAD yet
  }
  // Untracked files don't show in `git diff`; render them as additions without touching the index.
  for (const f of files.filter((f) => f.status === "??")) {
    const abs = join(dir, f.path);
    try {
      if (statSync(abs).size > MAX_UNTRACKED) {
        diff += `\ndiff --git a/${f.path} b/${f.path}\nnew file (too large to show)\n`;
        continue;
      }
      const body = readFileSync(abs, "utf8");
      const lines = body.split("\n");
      diff += `\ndiff --git a/${f.path} b/${f.path}\nnew file\n--- /dev/null\n+++ b/${f.path}\n@@ -0,0 +1,${lines.length} @@\n${lines.map((l) => "+" + l).join("\n")}\n`;
    } catch { /* unreadable */ }
  }
  const untracked = files.filter((f) => f.status === "??").length;
  if (untracked) stat = `${stat.trim()}\n${untracked} untracked file(s)`;
  return { stat: stat.trim(), diff, files };
}

// --- Clone from a GitHub (or any git host) URL --------------------------------
// Only https://, ssh:// and scp-style git@host:owner/repo. No file://, ext:: or option-looking input.
export function parseRepoUrl(input: string): { url: string; name: string } {
  const url = input.trim();
  // Hosts and users must start with a letter/digit so nothing can be read as an ssh option.
  const ok = /^https:\/\/\w[\w.-]*(:\d+)?\/[\w.\/-]+$/.test(url) ||
    /^ssh:\/\/\w[\w.-]*@\w[\w.-]*(:\d+)?\/[\w.\/-]+$/.test(url) ||
    /^\w[\w.-]*@\w[\w.-]*:\w[\w.\/-]*$/.test(url);
  if (!ok) throw new Error("Paste an HTTPS or SSH repo URL, e.g. https://github.com/owner/repo or git@github.com:owner/repo.git");
  const name = url.replace(/\/+$/, "").split(/[\/:]/).pop()!.replace(/\.git$/, "");
  if (!name || name === "." || name === "..") throw new Error("Can't tell the repo name from that URL");
  return { url, name };
}

export function defaultCloneDir(): string {
  return process.env.MM_PROJECTS_DIR ?? join(homedir(), "mm-projects");
}

/** Clones into `<parent>/<repo name>`. If that folder is already a clone of the same URL, reuses it. */
export async function cloneRepo(input: string, parent = defaultCloneDir()): Promise<{ path: string; reused: boolean }> {
  const { url, name } = parseRepoUrl(input);
  const dest = join(resolve(parent), name);
  if (existsSync(dest)) {
    const origin = await git(dest, "remote", "get-url", "origin").catch(() => "");
    if (origin.trim().replace(/\.git$/, "") === url.replace(/\.git$/, "")) return { path: dest, reused: true };
    throw new Error(`${dest} already exists. Pick another folder to clone into.`);
  }
  mkdirSync(resolve(parent), { recursive: true });
  try {
    await run("git", ["clone", "--", url, dest], {
      windowsHide: true,
      timeout: 10 * 60_000,
      maxBuffer: 16 * 1024 * 1024,
      // Never hang on a hidden password prompt; first SSH connect to a new host is accepted.
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_SSH_COMMAND: process.env.GIT_SSH_COMMAND ?? "ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new" },
    });
  } catch (e) {
    const msg = String((e as { stderr?: string }).stderr || (e as Error).message);
    if (/port 22: (Connection timed out|Connection refused)/i.test(msg)) throw new Error("This network blocks SSH port 22. Use the HTTPS URL, or point github.com at ssh.github.com port 443 in ~/.ssh/config.");
    if (/Permission denied \(publickey\)/i.test(msg)) throw new Error("SSH key not accepted by the host. Add your key to GitHub, or use the HTTPS URL.");
    if (/could not read Username|Authentication failed|terminal prompts disabled/i.test(msg)) throw new Error("Private repo: sign in first (run `git clone` once in a terminal so Git saves your login), or use the SSH URL.");
    if (/not found|does not exist/i.test(msg)) throw new Error("Repo not found. Check the URL, or that you have access.");
    const why = msg.split("\n").find((l) => /^(fatal|error|ssh):/i.test(l.trim())) ?? msg.trim().split("\n").pop();
    throw new Error(`git clone failed: ${why?.trim()}`);
  }
  return { path: dest, reused: false };
}

// --- Detect the hosted repo behind a local folder -------------------------------
export type RemoteInfo = { remote: string; host: string; owner: string; repo: string; web: string; github: boolean; branch: string };

/** Reads origin (or the first remote) + current branch. null when the folder isn't a repo or has no remote. */
export function remoteInfo(dir: string): RemoteInfo | null {
  const g = (...a: string[]) => {
    try { return execFileSync("git", ["-C", dir, ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], windowsHide: true }).trim(); } catch { return ""; }
  };
  const remotes = g("remote").split("\n").filter(Boolean);
  if (!remotes.length) return null;
  const remote = g("remote", "get-url", remotes.includes("origin") ? "origin" : remotes[0]);
  const m = remote.match(/^(?:https?:\/\/(?:[^@\/]+@)?|ssh:\/\/[^@]+@|[\w.-]+@)([\w.-]+)(?::\d+)?[:\/](.+?)(?:\.git)?\/?$/);
  if (!m) return null;
  const host = m[1] === "ssh.github.com" ? "github.com" : m[1];
  const parts = m[2].split("/");
  const repo = parts.pop() ?? "";
  const owner = parts.join("/");
  // Never send a token embedded in an https remote (https://user:token@host/...) to the browser.
  return { remote: remote.replace(/^(https?:\/\/)[^@\/]+@/, "$1"), host, owner, repo, web: `https://${host}/${owner}/${repo}`, github: host === "github.com", branch: g("branch", "--show-current") || "(detached)" };
}

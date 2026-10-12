// File access for the Code tab: read, list and save files inside one root folder (a task's worktree).
// Every path is resolved and checked against the root, including through symlinks.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { httpError } from "./http.ts";

export const MAX_EDIT_BYTES = 2 * 1024 * 1024;
const HIDDEN = new Set([".git"]);
const COLLAPSED = new Set(["node_modules", ".next", "dist", "build", "__pycache__", ".venv"]);

const hashOf = (buf: Buffer | string) => createHash("sha1").update(buf).digest("hex");

function inside(root: string, p: string): boolean {
  const r = relative(root, p);
  return r === "" || (!r.startsWith("..") && !isAbsolute(r));
}

/** Absolute path for `rel` under `root`; 400 if it (or the real file behind a symlink) leaves the root. */
export function safePath(root: string, rel: string): string {
  if (typeof rel !== "string" || isAbsolute(rel) || /^[a-zA-Z]:/.test(rel) || rel.includes("\0")) throw httpError(400, "path must be relative to the task folder");
  const realRoot = realpathSync(root);
  const abs = resolve(realRoot, rel);
  if (!inside(realRoot, abs)) throw httpError(400, "path is outside the task folder");
  // Follow symlinks for whatever part of the path exists already.
  let probe = abs;
  while (!existsSync(probe)) probe = dirname(probe);
  if (!inside(realRoot, realpathSync(probe))) throw httpError(400, "path is outside the task folder");
  return abs;
}

export function listDir(root: string, rel = "") {
  const abs = safePath(root, rel);
  if (!existsSync(abs) || !statSync(abs).isDirectory()) throw httpError(400, "not a folder");
  const entries = readdirSync(abs, { withFileTypes: true }).filter((e) => !HIDDEN.has(e.name));
  const path = (name: string) => (rel ? `${rel.replace(/[\\/]+$/, "")}/${name}` : name);
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  return {
    dirs: entries.filter((e) => e.isDirectory()).map((e) => ({ name: e.name, path: path(e.name), collapsed: COLLAPSED.has(e.name) })).sort(byName),
    files: entries.filter((e) => e.isFile()).map((e) => ({ name: e.name, path: path(e.name) })).sort(byName).slice(0, 2000),
  };
}

export function readText(root: string, rel: string) {
  const abs = safePath(root, rel);
  if (!existsSync(abs) || !statSync(abs).isFile()) throw httpError(404, "file not found");
  const size = statSync(abs).size;
  if (size > MAX_EDIT_BYTES) throw httpError(413, `file is too big to edit here (${Math.round(size / 1024)} KB, limit 2 MB)`);
  const buf = readFileSync(abs);
  if (buf.subarray(0, 8192).includes(0)) throw httpError(415, "binary file, can't be edited as text");
  return { path: rel, content: buf.toString("utf8"), hash: hashOf(buf), size };
}

/** Saves only if the file still matches `baseHash` (null = must not exist yet). `force` skips the check. */
export function writeText(root: string, rel: string, content: string, baseHash: string | null, force = false) {
  const abs = safePath(root, rel);
  if (Buffer.byteLength(content) > MAX_EDIT_BYTES) throw httpError(413, "content is over 2 MB");
  const exists = existsSync(abs);
  if (exists && !statSync(abs).isFile()) throw httpError(400, "not a file");
  if (!force) {
    const current = exists ? hashOf(readFileSync(abs)) : null;
    if (current !== baseHash) throw httpError(409, "changed on disk: an agent (or something else) edited this file after you opened it");
  }
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
  return { path: rel, hash: hashOf(content), size: Buffer.byteLength(content) };
}


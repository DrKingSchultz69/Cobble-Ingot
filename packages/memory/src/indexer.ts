// Indexes a project folder into the graph: project -> file -> symbol.
// The file list doubles as the project "tree" shown to agents and the UI.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { deleteNodes, link, upsertNode } from "./graph.ts";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "target", "__pycache__", ".venv", "venv", ".mm-worktrees"]);
const TEXT_EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".go", ".rs", ".java", ".kt", ".rb", ".php", ".cs", ".c", ".h",
  ".cpp", ".hpp", ".swift", ".md", ".txt", ".json", ".toml", ".yaml", ".yml", ".html", ".css", ".scss", ".sql", ".sh", ".ps1",
]);
const MAX_FILES = 5000;
const MAX_BYTES = 200_000;

const SYMBOL_PATTERNS: Array<[RegExp, string]> = [
  [/^\s*export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|type|interface|enum)\s+([A-Za-z_$][\w$]*)/gm, "export"],
  [/^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm, "function"],
  [/^\s*class\s+([A-Za-z_$][\w$]*)/gm, "class"],
  [/^\s*def\s+([A-Za-z_]\w*)/gm, "function"],
  [/^\s*func\s+(?:\([^)]*\)\s*)?([A-Za-z_]\w*)/gm, "function"],
  [/^\s*(?:pub\s+)?(?:fn|struct|enum|trait)\s+([A-Za-z_]\w*)/gm, "function"],
];

export function projectKey(dir: string): string {
  return resolve(dir).replace(/\\/g, "/").toLowerCase();
}

export function listFiles(dir: string): string[] {
  try {
    const out = execFileSync("git", ["-C", dir, "ls-files", "--cached", "--others", "--exclude-standard"], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.split("\n").filter(Boolean).slice(0, MAX_FILES);
  } catch {
    const files: string[] = [];
    const walk = (d: string) => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        if (files.length >= MAX_FILES) return;
        if (e.isDirectory()) {
          if (!SKIP_DIRS.has(e.name) && !e.name.startsWith(".")) walk(join(d, e.name));
        } else files.push(relative(dir, join(d, e.name)).replace(/\\/g, "/"));
      }
    };
    walk(dir);
    return files;
  }
}

export function extractSymbols(src: string): Array<{ name: string; kind: string; line: number }> {
  const seen = new Map<string, { name: string; kind: string; line: number }>();
  for (const [re, kind] of SYMBOL_PATTERNS) {
    re.lastIndex = 0;
    for (const m of src.matchAll(re)) {
      if (seen.has(m[1])) continue;
      const line = src.slice(0, m.index).split("\n").length;
      seen.set(m[1], { name: m[1], kind, line });
    }
  }
  return [...seen.values()].sort((a, b) => a.line - b.line);
}

export function indexProject(db: DatabaseSync, dir: string): { files: number; symbols: number } {
  const project = projectKey(dir);
  const files = listFiles(dir);
  let symbols = 0;
  db.exec("BEGIN");
  try {
    deleteNodes(db, { kind: "file", project });
    deleteNodes(db, { kind: "symbol", project });
    const pid = upsertNode(db, {
      kind: "project",
      key: project,
      title: basename(dir),
      body: `Project at ${resolve(dir)} with ${files.length} files`,
      project,
      data: { path: resolve(dir), files: files.length, indexed: Date.now() },
    });
    for (const rel of files) {
      const abs = join(dir, rel);
      const ext = extname(rel).toLowerCase();
      let src = "";
      let size = 0;
      try {
        size = statSync(abs).size;
        if (TEXT_EXT.has(ext) && size <= MAX_BYTES) src = readFileSync(abs, "utf8");
      } catch { continue; }
      const syms = src ? extractSymbols(src) : [];
      const head = src.split("\n").slice(0, 30).join("\n").slice(0, 3000);
      const fid = upsertNode(db, {
        kind: "file",
        key: `${project}:${rel}`,
        title: rel,
        body: `${rel}\n${syms.map((s) => s.name).join(" ")}\n${head}`,
        project,
        data: { path: rel, size, ext },
      });
      link(db, pid, fid, "contains");
      for (const s of syms) {
        const sid = upsertNode(db, {
          kind: "symbol",
          key: `${project}:${rel}#${s.name}`,
          title: s.name,
          body: `${s.kind} ${s.name} in ${rel}:${s.line}`,
          project,
          data: { file: rel, line: s.line, kind: s.kind },
        });
        link(db, fid, sid, "defines");
        symbols++;
      }
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return { files: files.length, symbols };
}

// Compact indented tree of the project's files, capped so it fits in a prompt.
export function renderTree(paths: string[], opts: { maxDepth?: number; maxLines?: number; under?: string } = {}): string {
  const maxDepth = opts.maxDepth ?? 3;
  const maxLines = opts.maxLines ?? 120;
  const prefix = opts.under ? opts.under.replace(/\/$/, "") + "/" : "";
  type Dir = Map<string, Dir>;
  const root: Dir = new Map();
  for (const p of paths) {
    if (prefix && !p.startsWith(prefix)) continue;
    let cur = root;
    for (const part of p.slice(prefix.length).split("/")) {
      if (!cur.has(part)) cur.set(part, new Map());
      cur = cur.get(part)!;
    }
  }
  const lines: string[] = [];
  const walk = (d: Dir, depth: number) => {
    const entries = [...d.entries()].sort(([a, x], [b, y]) => (y.size > 0 ? 1 : 0) - (x.size > 0 ? 1 : 0) || a.localeCompare(b));
    for (const [name, child] of entries) {
      if (lines.length >= maxLines) return;
      const isDir = child.size > 0;
      lines.push(`${"  ".repeat(depth)}${name}${isDir ? "/" : ""}${isDir && depth + 1 >= maxDepth ? ` (${count(child)} files)` : ""}`);
      if (isDir && depth + 1 < maxDepth) walk(child, depth + 1);
    }
  };
  const count = (d: Dir): number => [...d.values()].reduce((n, c) => n + (c.size ? count(c) : 1), 0);
  walk(root, 0);
  if (lines.length >= maxLines) lines.push("…");
  return lines.join("\n");
}

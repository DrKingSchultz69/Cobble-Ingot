// LSP-lite (P32): run the project's type checker / linter and turn its output into file:line diagnostics
// that every agent (MCP tool mm_diagnostics) and the Code tab (editor markers) can use.
import { exec } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";

export type Diagnostic = { file: string; line: number; col: number; severity: "error" | "warning"; message: string };

/** A type-check style command for the folder, or "" if none is obvious. */
export function detectDiagnostics(dir: string): string {
  const has = (f: string) => existsSync(join(dir, f));
  if (has("package.json")) {
    try {
      const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
      if (pkg.scripts?.typecheck) return "npm run typecheck --silent";
      if (pkg.scripts?.lint) return "npm run lint --silent";
    } catch { /* ignore */ }
  }
  if (has("tsconfig.json")) return "npx --no-install tsc --noEmit --pretty false";
  if (has("Cargo.toml")) return "cargo check --message-format short -q";
  if (has("go.mod")) return "go vet ./...";
  if (has("pyproject.toml") || has("setup.py") || has("requirements.txt")) return "python -m pyflakes .";
  return "";
}

// tsc:     src/a.ts(12,5): error TS2322: message
// generic: src/a.ts:12:5: error: message   |  a.py:3:1: F401 message   |  src/lib.rs:4:9: warning: message
const TSC = /^(.+?)\((\d+),(\d+)\):\s*(error|warning)\s+(.*)$/;
const GENERIC = /^(.+?):(\d+):(?:(\d+):)?\s*(?:(error|warning|note)\b:?\s*)?(.*)$/i;

export function parseDiagnostics(output: string, root: string): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const raw of output.split(/\r?\n/)) {
    const line = raw.replace(/\x1b\[[0-9;]*m/g, "").trim();
    const m = TSC.exec(line) ?? GENERIC.exec(line);
    if (!m || /^\s*at\s/.test(line) || /^https?:/.test(m[1])) continue;
    const file = m[1].trim();
    if (!/\.[a-z0-9]+$/i.test(file) || file.length > 300) continue; // must look like a source file
    const rel = isAbsolute(file) ? relative(root, file) : file;
    if (rel.startsWith("..")) continue;
    const sev = (m[4] ?? "").toLowerCase();
    out.push({ file: rel.replace(/\\/g, "/"), line: Number(m[2]), col: Number(m[3] ?? 1), severity: sev === "warning" || sev === "note" ? "warning" : "error", message: (m[5] ?? "").trim() });
    if (out.length >= 500) break;
  }
  return out;
}

export function runDiagnostics(dir: string, cmd = detectDiagnostics(dir), timeoutMs = 5 * 60_000): Promise<{ cmd: string; ok: boolean; items: Diagnostic[]; ms: number }> {
  const started = Date.now();
  if (!cmd) return Promise.resolve({ cmd: "", ok: true, items: [], ms: 0 });
  return new Promise((done) => {
    exec(cmd, { cwd: dir, timeout: timeoutMs, windowsHide: true, maxBuffer: 16 * 1024 * 1024, env: { ...process.env, FORCE_COLOR: "0", CI: "1" } }, (err, stdout, stderr) => {
      const items = parseDiagnostics(`${stdout}\n${stderr}`, dir);
      done({ cmd, ok: !err && !items.some((d) => d.severity === "error"), items, ms: Date.now() - started });
    });
  });
}

export function formatDiagnostics(r: { cmd: string; ok: boolean; items: Diagnostic[] }): string {
  if (!r.cmd) return "No type checker or linter found for this project (set a checks command in Netheron's worktree setup).";
  if (!r.items.length) return `${r.cmd}: no problems found.`;
  return `${r.cmd}: ${r.items.length} problem(s)\n` + r.items.slice(0, 60).map((d) => `${d.file}:${d.line}:${d.col} ${d.severity}: ${d.message}`).join("\n");
}

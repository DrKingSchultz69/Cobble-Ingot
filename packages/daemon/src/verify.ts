// "Checks": a project's own test/build command, run in a task's folder. Used by the Budget Dial (escalate when
// checks fail), pipelines (only move on when checks pass), Race & Judge (tests pick the winner) and quality watch.
import { exec } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type VerifyResult = { ok: boolean; code: number; output: string; ms: number; cmd: string; ts: number };

/** Best guess at a project's check command; "" when there's nothing obvious. */
export function detectVerify(repo: string): string {
  const has = (f: string) => existsSync(join(repo, f));
  if (has("package.json")) {
    try {
      const pkg = JSON.parse(readFileSync(join(repo, "package.json"), "utf8"));
      const t = pkg.scripts?.test as string | undefined;
      if (t && !/no test specified/i.test(t)) return "npm test --silent";
      if (pkg.scripts?.typecheck) return "npm run typecheck --silent";
      if (has("tsconfig.json")) return "npx --no-install tsc --noEmit";
    } catch { /* bad package.json */ }
  }
  if (has("Cargo.toml")) return "cargo test -q";
  if (has("go.mod")) return "go test ./...";
  if (has("pytest.ini") || has("conftest.py") || (has("pyproject.toml") && /\[tool\.pytest/.test(readFileSync(join(repo, "pyproject.toml"), "utf8")))) return "python -m pytest -q";
  if (has("tests") && readdirSync(join(repo, "tests")).some((f) => /^test_.*\.py$/.test(f))) return "python -m pytest -q";
  return "";
}

export function runVerify(cwd: string, cmd: string, timeoutMs = 10 * 60_000): Promise<VerifyResult> {
  const started = Date.now();
  return new Promise((done) => {
    exec(cmd, { cwd, timeout: timeoutMs, windowsHide: true, maxBuffer: 16 * 1024 * 1024, env: { ...process.env, CI: "1", FORCE_COLOR: "0" } }, (err, stdout, stderr) => {
      const out = `${stdout}${stderr}`.replace(/\x1b\[[0-9;]*m/g, "");
      done({
        ok: !err,
        code: err ? (typeof err.code === "number" ? err.code : 1) : 0,
        output: out.length > 4000 ? "…" + out.slice(-4000) : out,
        ms: Date.now() - started,
        cmd,
        ts: Date.now(),
      });
    });
  });
}

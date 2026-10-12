// Hash-anchored line edits (P02 S1; idea credit: Oh My Pi's "hashline"). Agents read lines tagged with a
// short content hash and edit by those anchors. If the file changed since the read, the anchors no longer
// match and the edit is refused, so an edit can't land on the wrong lines or wipe a newer change.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

export const hashLine = (text: string) => createHash("sha1").update(text.replace(/\r$/, "")).digest("hex").slice(0, 4);

function safe(root: string, rel: string): string {
  if (!rel || isAbsolute(rel)) throw new Error("path must be relative to the task folder");
  const abs = resolve(root, rel);
  const r = relative(resolve(root), abs);
  if (r.startsWith("..") || isAbsolute(r)) throw new Error("path is outside the task folder");
  return abs;
}

function load(abs: string) {
  if (!existsSync(abs) || !statSync(abs).isFile()) throw new Error("file not found");
  const text = readFileSync(abs, "utf8");
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const endsWithEol = text.endsWith("\n");
  const lines = text.split(/\r?\n/);
  if (endsWithEol) lines.pop();
  return { lines, eol, endsWithEol };
}

const tag = (n: number, line: string) => `${n}:${hashLine(line)}|${line}`;

/** Lines start..end (1-based, inclusive) as "n:hash|text". */
export function readLines(root: string, rel: string, start = 1, end?: number): string {
  const { lines } = load(safe(root, rel));
  const from = Math.max(1, Math.floor(start));
  const to = Math.min(lines.length, Math.floor(end ?? from + 199));
  if (!lines.length) return `(${rel} is empty: use mm_edit_lines with after: "0:0000" to add lines)`;
  const out = [];
  for (let i = from; i <= to; i++) out.push(tag(i, lines[i - 1]));
  return `${rel} lines ${from}-${to} of ${lines.length}\n${out.join("\n")}`;
}

function anchor(lines: string[], a: string, what: string): number {
  const m = /^(\d+):([0-9a-f]{4})$/.exec(String(a).trim());
  if (!m) throw new Error(`${what} must look like "12:a3f9" (from mm_read_lines)`);
  const n = Number(m[1]);
  if (n === 0 && m[2] === "0000") return 0; // start of file (insert only)
  if (n < 1 || n > lines.length) throw new Error(`${what} line ${n} doesn't exist (file has ${lines.length} lines); read the file again`);
  if (hashLine(lines[n - 1]) !== m[2]) {
    throw new Error(`stale ${what}: line ${n} changed since you read it (now: "${lines[n - 1].slice(0, 80)}"). Call mm_read_lines again.`);
  }
  return n;
}

/**
 * Replace lines start..end (both anchors must still match), or insert after an anchor.
 * Returns the edited region with fresh anchors.
 */
export function editLines(root: string, rel: string, op: { start?: string; end?: string; after?: string; text: string }): string {
  const abs = safe(root, rel);
  const f = load(abs);
  const insert = op.text === "" ? [] : String(op.text).replace(/\r?\n$/, "").split(/\r?\n/);
  let at: number;
  if (op.after !== undefined) {
    const n = anchor(f.lines, op.after, "after");
    f.lines.splice(n, 0, ...insert);
    at = n + 1;
  } else {
    const s = anchor(f.lines, op.start ?? "", "start");
    if (s === 0) throw new Error('use "after" to insert at the start of the file');
    const e = op.end ? anchor(f.lines, op.end, "end") : s;
    if (e < s) throw new Error("end is before start");
    f.lines.splice(s - 1, e - s + 1, ...insert);
    at = s;
  }
  writeFileSync(abs, f.lines.join(f.eol) + (f.endsWithEol || !f.lines.length ? f.eol : ""));
  const from = Math.max(1, at - 2);
  const to = Math.min(f.lines.length, at + insert.length + 1);
  return `Edited ${rel}. Lines ${from}-${to} now:\n${f.lines.slice(from - 1, to).map((l, i) => tag(from + i, l)).join("\n")}`;
}

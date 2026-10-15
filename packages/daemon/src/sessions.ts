// Session history: past Claude Code and Codex sessions on this PC, read from the CLIs' own log folders, so any of
// them can be resumed as a Netheron task (claude --resume <id>, codex resume <id>). Only the start of each file is
// read (folder, first prompt), and results are cached by file size + time, so a rescan of hundreds of files is cheap.
import { closeSync, existsSync, openSync, readdirSync, readSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join } from "node:path";

export type PastSession = { agent: "claude" | "codex"; id: string; cwd: string; title: string; updated: number; size: number };

const cache = new Map<string, { key: string; s: PastSession | null }>();
const HEAD = 256 * 1024;

function head(file: string, bytes = HEAD): string {
  const fd = openSync(file, "r");
  try {
    const buf = Buffer.alloc(bytes);
    return buf.subarray(0, readSync(fd, buf, 0, bytes, 0)).toString("utf8");
  } finally { closeSync(fd); }
}

const clean = (t: string) => t.replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
function textOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((c) => (c && typeof c === "object" && "text" in c ? String((c as { text: unknown }).text) : "")).join(" ");
  return "";
}
/** Skip what isn't a real request: tool results, command echoes, system reminders. */
const isPrompt = (t: string) => !!t && !/^\s*<(command-|local-command|system-reminder|ide_)/.test(t) && !/^\[Request interrupted/.test(t);

export function readClaudeSession(file: string): PastSession | null {
  let cwd = "", title = "";
  for (const line of head(file).split("\n")) {
    if (!line.startsWith("{")) continue;
    let r: Record<string, any>;
    try { r = JSON.parse(line); } catch { continue; } // the last line of the head is usually cut
    if (!cwd && typeof r.cwd === "string") cwd = r.cwd;
    if (!title && r.type === "user" && !r.isMeta && r.message?.role === "user") {
      const t = textOf(r.message.content);
      if (isPrompt(t)) title = clean(t);
    }
    if (cwd && title) break;
  }
  if (!cwd) return null;
  const st = statSync(file);
  return { agent: "claude", id: basename(file, ".jsonl"), cwd, title: title || "(no prompt)", updated: st.mtimeMs, size: st.size };
}

export function readCodexSession(file: string): PastSession | null {
  let cwd = "", id = "", title = "";
  for (const line of head(file).split("\n")) {
    if (!line.startsWith("{")) continue;
    let r: Record<string, any>;
    try { r = JSON.parse(line); } catch { continue; }
    const p = r.payload ?? {};
    if (r.type === "session_meta") { cwd = String(p.cwd ?? ""); id = String(p.id ?? p.session_id ?? ""); }
    if (!title && r.type === "event_msg" && p.type === "user_message" && isPrompt(String(p.message ?? ""))) title = clean(String(p.message));
    if (!title && r.type === "response_item" && p.role === "user") {
      const t = textOf(p.content);
      if (isPrompt(t) && !/^<environment_context>|^# AGENTS\.md/.test(t.trim())) title = clean(t);
    }
    if (cwd && id && title) break;
  }
  if (!cwd || !id) return null;
  const st = statSync(file);
  return { agent: "codex", id, cwd, title: title || "(no prompt)", updated: st.mtimeMs, size: st.size };
}

function cached(file: string, read: (f: string) => PastSession | null): PastSession | null {
  try {
    const st = statSync(file);
    const key = `${st.size}:${st.mtimeMs}`;
    const hit = cache.get(file);
    if (hit?.key === key) return hit.s;
    const s = read(file);
    cache.set(file, { key, s });
    return s;
  } catch { return null; }
}

function walk(dir: string, out: string[], depth: number) {
  if (depth < 0 || !existsSync(dir)) return;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out, depth - 1);
    else if (e.name.endsWith(".jsonl")) out.push(p);
  }
}

/** Newest first. `homes` are extra Claude config folders / Codex homes (account profiles). */
export function listSessions(o: { claudeHomes?: string[]; codexHomes?: string[]; limit?: number } = {}): PastSession[] {
  const claude = [join(homedir(), ".claude"), ...(o.claudeHomes ?? [])];
  const codex = [process.env.CODEX_HOME || join(homedir(), ".codex"), ...(o.codexHomes ?? [])];
  const files: Array<{ f: string; agent: "claude" | "codex"; m: number }> = [];
  for (const h of claude) {
    const fs: string[] = [];
    walk(join(h, "projects"), fs, 1); // projects/<folder>/<session>.jsonl (subagent files live one level deeper)
    for (const f of fs) files.push({ f, agent: "claude", m: statSync(f).mtimeMs });
  }
  for (const h of codex) {
    const fs: string[] = [];
    walk(join(h, "sessions"), fs, 3); // sessions/YYYY/MM/DD/rollout-*.jsonl
    for (const f of fs) files.push({ f, agent: "codex", m: statSync(f).mtimeMs });
  }
  files.sort((a, b) => b.m - a.m);
  const out: PastSession[] = [];
  for (const x of files.slice(0, (o.limit ?? 200) * 2)) {
    const s = cached(x.f, x.agent === "claude" ? readClaudeSession : readCodexSession);
    if (s && s.title !== "(no prompt)") out.push(s);
    if (out.length >= (o.limit ?? 200)) break;
  }
  return out;
}

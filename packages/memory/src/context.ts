// Builds the context pack an agent reads at the start of a task, and records what it learned at the end.
import type { DatabaseSync } from "node:sqlite";
import { findNode, link, recent, search, upsertNode } from "./graph.ts";
import { renderTree } from "./indexer.ts";

export const RECORD_KINDS = ["decision", "note", "bug", "outcome", "todo", "rule"] as const;
export type RecordKind = (typeof RECORD_KINDS)[number];

export function projectFiles(db: DatabaseSync, project: string): string[] {
  return (db.prepare("SELECT title FROM nodes WHERE kind = 'file' AND project = ? ORDER BY title").all(project) as Array<{ title: string }>).map(
    (r) => r.title,
  );
}

export function buildContext(db: DatabaseSync, project: string, query = "", opts: { taskId?: string } = {}): string {
  const out: string[] = [];
  const proj = findNode(db, "project", project);
  out.push(`# Shared project memory${proj ? ` — ${proj.title}` : ""}`);
  if (!proj) out.push("_Project not indexed yet. Call mm_index or ask the user to index it in the workspace._");

  const rules = projectRules(db, project);
  if (rules.length) {
    out.push("\n## Project rules (always follow these; written once for every agent)");
    for (const r of rules) out.push(`- ${r.title}${r.body ? ` — ${oneLine(r.body, 300)}` : ""}`);
  }

  if (opts.taskId) {
    const task = findNode(db, "task", opts.taskId);
    if (task) out.push(`\n## Current task\n${task.title}\n${task.body}`.trim());
  }

  const records = recent(db, { project, kinds: ["decision", "bug", "todo", "note"], limit: 8 });
  if (records.length) {
    out.push("\n## Recent decisions & notes (from all agents)");
    for (const r of records) out.push(`- [${r.kind}] ${r.title}${r.body ? ` — ${oneLine(r.body, 200)}` : ""} (#${r.id})`);
  }

  const outcomes = recent(db, { project, kinds: ["outcome"], limit: 5 });
  if (outcomes.length) {
    out.push("\n## Recent task outcomes");
    for (const r of outcomes) out.push(`- ${r.title} — ${oneLine(r.body, 200)}`);
  }

  if (query.trim()) {
    const hits = search(db, query, { project, limit: 8 });
    if (hits.length) {
      out.push(`\n## Relevant to "${oneLine(query, 80)}"`);
      for (const h of hits) out.push(`- [${h.kind}] ${h.title}: ${oneLine(h.snippet, 160)}`);
    }
  }

  const files = projectFiles(db, project);
  if (files.length) out.push(`\n## File tree (${files.length} files)\n\`\`\`\n${renderTree(files, { maxDepth: 2, maxLines: 60 })}\n\`\`\``);

  out.push("\nRecord important decisions, bugs and outcomes with the mm_record tool so other agents can use them.");
  return out.join("\n");
}

/** Rules/skills written once in shared memory and given to every agent (P26 S1). Newest first, max 40. */
export function projectRules(db: DatabaseSync, project: string): Array<{ id: number; title: string; body: string }> {
  return db.prepare("SELECT id, title, body FROM nodes WHERE kind = 'rule' AND project = ? ORDER BY updated DESC LIMIT 40").all(project) as Array<{ id: number; title: string; body: string }>;
}

/** The rules block put at the start of an agent's prompt. "" when the project has none. */
export function rulesPreamble(db: DatabaseSync, project: string): { text: string; ids: number[] } {
  const rules = projectRules(db, project);
  if (!rules.length) return { text: "", ids: [] };
  const lines = rules.map((r) => `- ${r.title}${r.body ? `: ${oneLine(r.body, 300)}` : ""}`);
  return { text: `Project rules (from Netheron shared memory; follow them):\n${lines.join("\n")}`, ids: rules.map((r) => r.id) };
}

export function record(
  db: DatabaseSync,
  r: { kind: RecordKind; title: string; body?: string; project: string; taskId?: string; agent?: string; files?: string[] },
): number {
  const key = `${r.project}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  const id = upsertNode(db, {
    kind: r.kind,
    key,
    title: r.title,
    body: r.body ?? "",
    project: r.project,
    data: { taskId: r.taskId, agent: r.agent },
  });
  if (r.taskId) {
    const task = findNode(db, "task", r.taskId);
    if (task) link(db, task.id, id, "recorded");
  }
  for (const f of r.files ?? []) {
    const file = findNode(db, "file", `${r.project}:${f}`);
    if (file) link(db, id, file.id, "about");
  }
  return id;
}

const oneLine = (s: string, n: number) => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
};

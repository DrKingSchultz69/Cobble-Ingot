// MCP server (stdio, newline-delimited JSON-RPC 2.0) that gives every agent the shared memory.
// Launched per agent with env: MM_PROJECT (folder), MM_TASK_ID, MM_AGENT, MM_DATA_DIR.
import { createInterface } from "node:readline";
import type { DatabaseSync } from "node:sqlite";
import { openDb } from "../../daemon/src/db.ts";
import { buildContext, projectFiles, RECORD_KINDS, record, type RecordKind } from "./context.ts";
import { ensureGraphSchema, findNode, neighbors, search } from "./graph.ts";
import { indexProject, projectKey, renderTree } from "./indexer.ts";

type Env = { project: string; dir: string; taskId?: string; agent?: string };

export const TOOLS = [
  {
    name: "mm_get_context",
    description:
      "Get the shared project memory: recent decisions/bugs/notes from all agents, recent task outcomes, the file tree, and items relevant to an optional query. Call this at the start of a task.",
    inputSchema: { type: "object", properties: { query: { type: "string", description: "What you are working on" } } },
  },
  {
    name: "mm_search",
    description: "Full-text search the shared memory (files, symbols, decisions, notes, bugs, docs, papers).",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        kinds: { type: "array", items: { type: "string" }, description: "Optional filter, e.g. [\"decision\",\"file\"]" },
        limit: { type: "number" },
      },
      required: ["query"],
    },
  },
  {
    name: "mm_record",
    description:
      "Save something other agents should know: a decision (and why), a bug found, an outcome, a todo, or a note. Keep title short; put reasoning in body.",
    inputSchema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: [...RECORD_KINDS] },
        title: { type: "string" },
        body: { type: "string" },
        files: { type: "array", items: { type: "string" }, description: "Repo-relative paths this is about" },
      },
      required: ["kind", "title"],
    },
  },
  {
    name: "mm_tree",
    description: "Show the project file tree (optionally under a sub-folder).",
    inputSchema: { type: "object", properties: { under: { type: "string" }, depth: { type: "number" } } },
  },
  {
    name: "mm_node",
    description: "Show one memory node by id with its linked nodes.",
    inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] },
  },
  {
    name: "mm_index",
    description: "Re-index the project files and symbols into memory (use after large changes).",
    inputSchema: { type: "object", properties: {} },
  },
];

export function callTool(db: DatabaseSync, env: Env, name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "mm_get_context":
      return buildContext(db, env.project, String(args.query ?? ""), { taskId: env.taskId });
    case "mm_search": {
      const hits = search(db, String(args.query ?? ""), {
        project: env.project,
        kinds: Array.isArray(args.kinds) ? (args.kinds as string[]) : undefined,
        limit: Number(args.limit ?? 10),
      });
      if (!hits.length) return "No matches.";
      return hits.map((h) => `#${h.id} [${h.kind}] ${h.title}\n  ${h.snippet.replace(/\s+/g, " ")}`).join("\n");
    }
    case "mm_record": {
      const kind = String(args.kind) as RecordKind;
      if (!RECORD_KINDS.includes(kind)) throw new Error(`kind must be one of ${RECORD_KINDS.join(", ")}`);
      const id = record(db, {
        kind,
        title: String(args.title ?? "").slice(0, 300),
        body: String(args.body ?? ""),
        project: env.project,
        taskId: env.taskId,
        agent: env.agent,
        files: Array.isArray(args.files) ? (args.files as string[]) : [],
      });
      return `Saved ${kind} #${id}.`;
    }
    case "mm_tree": {
      const files = projectFiles(db, env.project);
      if (!files.length) return "Project not indexed. Call mm_index first.";
      return renderTree(files, { under: args.under ? String(args.under) : undefined, maxDepth: Number(args.depth ?? 3), maxLines: 200 });
    }
    case "mm_node": {
      const id = Number(args.id);
      const node = (db.prepare("SELECT * FROM nodes WHERE id = ?").get(id) as Record<string, unknown> | undefined);
      if (!node) return `No node #${id}.`;
      const links = neighbors(db, id).slice(0, 30).map((l) => `  ${l.dir === "out" ? "->" : "<-"} ${l.rel} #${l.node.id} [${l.node.kind}] ${l.node.title}`);
      return `#${node.id} [${node.kind}] ${node.title}\n${node.body}\n${links.join("\n")}`;
    }
    case "mm_index": {
      const r = indexProject(db, env.dir);
      return `Indexed ${r.files} files, ${r.symbols} symbols.`;
    }
    default:
      throw new Error(`unknown tool ${name}`);
  }
}

export function handle(db: DatabaseSync, env: Env, msg: { id?: unknown; method: string; params?: Record<string, unknown> }) {
  switch (msg.method) {
    case "initialize":
      return {
        protocolVersion: (msg.params?.protocolVersion as string) ?? "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: "mm-memory", version: "0.1.0" },
        instructions: "Shared memory for all agents in this workspace. Call mm_get_context first; save decisions with mm_record.",
      };
    case "ping":
      return {};
    case "tools/list":
      return { tools: TOOLS };
    case "tools/call": {
      const p = msg.params ?? {};
      try {
        const text = callTool(db, env, String(p.name), (p.arguments as Record<string, unknown>) ?? {});
        return { content: [{ type: "text", text }] };
      } catch (e) {
        return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
      }
    }
    default:
      return undefined;
  }
}

// Entry point for packages/memory/bin/mcp.ts.
export function runMcp(): void {
  const dir = process.env.MM_PROJECT ?? process.cwd();
  const env: Env = { dir, project: projectKey(dir), taskId: process.env.MM_TASK_ID, agent: process.env.MM_AGENT };
  const db = openDb();
  ensureGraphSchema(db);
  if (!findNode(db, "project", env.project)) {
    try { indexProject(db, dir); } catch { /* indexing is best effort */ }
  }
  const rl = createInterface({ input: process.stdin });
  rl.on("line", (line) => {
    if (!line.trim()) return;
    let msg: { id?: unknown; method: string; params?: Record<string, unknown> };
    try { msg = JSON.parse(line); } catch { return; }
    if (msg.id === undefined) return; // notification
    const result = handle(db, env, msg);
    const reply = result === undefined
      ? { jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: `Method not found: ${msg.method}` } }
      : { jsonrpc: "2.0", id: msg.id, result };
    process.stdout.write(JSON.stringify(reply) + "\n");
  });
}

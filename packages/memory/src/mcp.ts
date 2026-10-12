// MCP server (stdio, newline-delimited JSON-RPC 2.0) that gives every agent the shared memory.
// Launched per agent with env: MM_PROJECT (folder), MM_TASK_ID, MM_AGENT, MM_DATA_DIR; browser tasks also MM_BROWSER=1, MM_API.
import { createInterface } from "node:readline";
import type { DatabaseSync } from "node:sqlite";
import { loadToken } from "../../daemon/src/auth.ts";
import { openDb } from "../../daemon/src/db.ts";
import { buildContext, projectFiles, RECORD_KINDS, record, type RecordKind } from "./context.ts";
import { ensureGraphSchema, findNode, neighbors, search } from "./graph.ts";
import { editLines, readLines } from "./hashline.ts";
import { formatDiagnostics, runDiagnostics } from "../../daemon/src/diagnostics.ts";
import { indexProject, projectKey, renderTree } from "./indexer.ts";

/** dir = project root (memory scope); workdir = the agent's own folder (worktree) where edits happen.
 *  browser = set only for tasks with the browser ticked: Netheron's address + token for the browser_* tools. */
type Env = { project: string; dir: string; workdir?: string; taskId?: string; agent?: string; browser?: { api: string; token: string } };

const xy = { x: { type: "number", description: "pixels from the left of the last screenshot" }, y: { type: "number", description: "pixels from the top" } };
/** Shared browser (opt-in per task). Each action returns a fresh screenshot; one action per turn. */
export const BROWSER_TOOLS = [
  { name: "browser_screenshot", description: "See the browser window: returns a screenshot and the page URL. Start with this.", inputSchema: { type: "object", properties: {} } },
  { name: "browser_click", description: "Click at x,y (screenshot pixels). Returns the new screenshot.", inputSchema: { type: "object", properties: xy, required: ["x", "y"] } },
  { name: "browser_double_click", description: "Double-click at x,y (screenshot pixels).", inputSchema: { type: "object", properties: xy, required: ["x", "y"] } },
  { name: "browser_type_text", description: "Type into the focused field (click it first). clear_before empties it first.", inputSchema: { type: "object", properties: { text: { type: "string" }, clear_before: { type: "boolean" } }, required: ["text"] } },
  { name: "browser_press_key", description: "Press one key: Enter, Tab, Escape, Backspace, Delete, Space, ArrowUp/Down/Left/Right, Home, End, PageUp, PageDown, or one character.", inputSchema: { type: "object", properties: { key: { type: "string" } }, required: ["key"] } },
  { name: "browser_scroll", description: "Scroll the page up or down.", inputSchema: { type: "object", properties: { direction: { type: "string", enum: ["up", "down"] }, amount_pixels: { type: "number" } }, required: ["direction"] } },
  { name: "browser_navigate", description: "Open a full http(s) URL.", inputSchema: { type: "object", properties: { url: { type: "string" } }, required: ["url"] } },
  { name: "browser_wait", description: "Wait for the page (max 5 seconds), then screenshot.", inputSchema: { type: "object", properties: { seconds: { type: "number" } } } },
  { name: "browser_ask_user", description: "Hand the browser to the user and stop. Use for login, 2FA, CAPTCHA, anything that pays/orders/buys/deletes, or after 2 failed attempts.", inputSchema: { type: "object", properties: { reason: { type: "string" } }, required: ["reason"] } },
  { name: "browser_finish", description: "Say the browsing part is done, with a short summary. The window stays open for the user.", inputSchema: { type: "object", properties: { summary: { type: "string" } }, required: ["summary"] } },
];
export const BROWSER_TOOL_NAMES = BROWSER_TOOLS.map((t) => t.name);

/** Browser tools are run by the Netheron server (it owns Chrome and the safety checks); this just forwards. */
async function browserCall(env: Env, name: string, args: Record<string, unknown>) {
  const fail = (text: string) => ({ content: [{ type: "text", text }], isError: true });
  if (!env.browser || !env.taskId) return fail("This task doesn't have the browser. The user can tick 🌐 Browser when starting a task.");
  const sub = name === "browser_ask_user" ? "/ask" : name === "browser_finish" ? "/finish" : "";
  const body = sub ? args : { ...args, action: name.slice("browser_".length) };
  let r: Response;
  try {
    r = await fetch(`${env.browser.api}/api/tasks/${encodeURIComponent(env.taskId)}/browser${sub}`, {
      method: "POST", headers: { authorization: `Bearer ${env.browser.token}`, "content-type": "application/json" }, body: JSON.stringify(body),
    });
  } catch {
    return fail(`Can't reach Netheron at ${env.browser.api}. Is it still running?`);
  }
  const j = (await r.json().catch(() => ({}))) as { error?: string; message?: string; image?: string; mime?: string; url?: string; width?: number; height?: number };
  if (!r.ok) return fail(j.error ?? `Netheron answered ${r.status}`);
  if (j.image) {
    return { content: [
      { type: "image", data: j.image, mimeType: j.mime ?? "image/jpeg" },
      { type: "text", text: `Page: ${j.url} (${j.width}×${j.height}). Coordinates are pixels in this screenshot.` },
    ] };
  }
  return { content: [{ type: "text", text: j.message ?? "OK" }] };
}

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
    name: "mm_read_lines",
    description:
      "Read lines of a file tagged with short hashes (\"12:a3f9|code\"). Use the tags as anchors for mm_edit_lines. Paths are relative to your working folder.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" }, start: { type: "number", description: "First line, 1-based (default 1)" }, end: { type: "number", description: "Last line (default start+199)" } },
      required: ["path"],
    },
  },
  {
    name: "mm_edit_lines",
    description:
      "Safe edit: replace lines from anchor `start` to `end` (inclusive, e.g. \"12:a3f9\"), or insert after anchor `after` (\"0:0000\" = top of file). Refused if those lines changed since you read them, so it never edits the wrong place. `text` is the new content (\"\" deletes).",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" }, start: { type: "string" }, end: { type: "string" }, after: { type: "string" }, text: { type: "string" } },
      required: ["path", "text"],
    },
  },
  {
    name: "mm_diagnostics",
    description: "Run the project's type checker / linter in your working folder and get real errors as file:line:col. Use it after edits instead of guessing.",
    inputSchema: { type: "object", properties: { command: { type: "string", description: "Optional: override the check command" } } },
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
    case "mm_read_lines":
      return readLines(env.workdir ?? env.dir, String(args.path ?? ""), args.start === undefined ? 1 : Number(args.start), args.end === undefined ? undefined : Number(args.end));
    case "mm_edit_lines":
      return editLines(env.workdir ?? env.dir, String(args.path ?? ""), {
        start: args.start === undefined ? undefined : String(args.start),
        end: args.end === undefined ? undefined : String(args.end),
        after: args.after === undefined ? undefined : String(args.after),
        text: String(args.text ?? ""),
      });
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
        instructions: "Shared memory for all agents in this workspace. Call mm_get_context first; save decisions with mm_record. For precise edits, mm_read_lines + mm_edit_lines refuse stale edits.",
      };
    case "ping":
      return {};
    case "tools/list":
      return { tools: env.browser ? [...TOOLS, ...BROWSER_TOOLS] : TOOLS };
    case "tools/call": {
      const p = msg.params ?? {};
      if (String(p.name).startsWith("browser_")) return browserCall(env, String(p.name), (p.arguments as Record<string, unknown>) ?? {});
      if (p.name === "mm_diagnostics") { // runs a process: answered asynchronously
        const args = (p.arguments as Record<string, unknown>) ?? {};
        return runDiagnostics(env.workdir ?? env.dir, args.command ? String(args.command) : undefined)
          .then((r) => ({ content: [{ type: "text", text: formatDiagnostics(r) }] }));
      }
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
  const env: Env = { dir, project: projectKey(dir), workdir: process.env.MM_WORKDIR ?? process.cwd(), taskId: process.env.MM_TASK_ID, agent: process.env.MM_AGENT };
  if (process.env.MM_BROWSER === "1" && process.env.MM_API) env.browser = { api: process.env.MM_API, token: loadToken() };
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
    const send = (result: unknown) => {
      const reply = result === undefined
        ? { jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: `Method not found: ${msg.method}` } }
        : { jsonrpc: "2.0", id: msg.id, result };
      process.stdout.write(JSON.stringify(reply) + "\n");
    };
    const result = handle(db, env, msg);
    if (result instanceof Promise) result.then(send, (e) => send({ content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true }));
    else send(result);
  });
}

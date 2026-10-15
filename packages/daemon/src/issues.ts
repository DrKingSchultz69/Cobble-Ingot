// Issues hub: GitHub issues and pull requests (through the gh CLI, using its own login) and Linear issues (personal
// API key). Each row can be started as a task. Jira is listed as "not connected" until someone needs it.
// The Linear key is stored in the data folder (owner-only file), like the access token.
import { execFile } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { DATA_DIR } from "./config.ts";

const exec = promisify(execFile);
export type Issue = { key: string; title: string; url: string; state: string; labels: string[]; who: string; updated: number; branch?: string };
export type Runner = (cmd: string, args: string[], cwd: string) => Promise<string>;
const defaultRunner: Runner = async (cmd, args, cwd) => (await exec(cmd, args, { cwd, windowsHide: true, maxBuffer: 8 * 1024 * 1024, timeout: 20_000 })).stdout;

export async function githubStatus(run: Runner = defaultRunner, cwd = process.cwd()) {
  try {
    const login = (await run("gh", ["api", "user", "--jq", ".login"], cwd)).trim();
    return { connected: !!login, user: login };
  } catch (e) {
    const msg = String((e as { stderr?: string }).stderr || (e as Error).message);
    return { connected: false, user: "", error: /ENOENT|not recognized/i.test(msg) ? "The GitHub CLI (gh) isn't installed. Install it from cli.github.com, then run `gh auth login`." : "Run `gh auth login` to connect GitHub." };
  }
}

export async function githubList(repo: string, kind: "issues" | "prs", run: Runner = defaultRunner): Promise<Issue[]> {
  if (!repo || !existsSync(repo)) throw new Error("Pick a project folder first.");
  const fields = kind === "prs" ? "number,title,url,state,labels,author,updatedAt,headRefName" : "number,title,url,state,labels,assignees,updatedAt";
  let out: string;
  try {
    out = await run("gh", [kind === "prs" ? "pr" : "issue", "list", "--state", "open", "--limit", "60", "--json", fields], repo);
  } catch (e) {
    const msg = String((e as { stderr?: string }).stderr || (e as Error).message);
    if (/ENOENT|not recognized/i.test(msg)) throw new Error("The GitHub CLI (gh) isn't installed. Install it from cli.github.com, then run `gh auth login`.");
    if (/no git remotes|not a git repository|could not determine/i.test(msg)) throw new Error("This project has no GitHub remote.");
    if (/auth login|authentication/i.test(msg)) throw new Error("Run `gh auth login` to connect GitHub.");
    throw new Error(msg.split("\n")[0].slice(0, 200));
  }
  return (JSON.parse(out || "[]") as Array<Record<string, any>>).map((r) => ({
    key: `#${r.number}`, title: String(r.title ?? ""), url: String(r.url ?? ""), state: String(r.state ?? "").toLowerCase(),
    labels: (r.labels ?? []).map((l: { name: string }) => l.name),
    who: kind === "prs" ? String(r.author?.login ?? "") : (r.assignees ?? []).map((a: { login: string }) => a.login).join(", "),
    updated: Date.parse(r.updatedAt) || 0, branch: r.headRefName,
  }));
}

const keyFile = (dir = DATA_DIR) => join(dir, "linear.json");
export function linearKey(dir = DATA_DIR): string {
  if (process.env.LINEAR_API_KEY) return process.env.LINEAR_API_KEY;
  try { return String(JSON.parse(readFileSync(keyFile(dir), "utf8")).key ?? ""); } catch { return ""; }
}
export function setLinearKey(key: string, dir = DATA_DIR) {
  writeFileSync(keyFile(dir), JSON.stringify({ key: key.trim() }), { mode: 0o600 });
}

type Fetcher = (url: string, init: RequestInit) => Promise<Response>;
export async function linearList(key = linearKey(), f: Fetcher = fetch): Promise<Issue[]> {
  if (!key) throw new Error("Linear isn't connected. Add a personal API key in Settings › Integrations.");
  const query = `{ issues(first: 60, orderBy: updatedAt, filter: { state: { type: { nin: ["completed", "canceled"] } } }) {
    nodes { identifier title url updatedAt state { name } assignee { name } labels { nodes { name } } } } }`;
  const r = await f("https://api.linear.app/graphql", { method: "POST", headers: { "content-type": "application/json", authorization: key }, body: JSON.stringify({ query }) });
  const j = (await r.json()) as { data?: { issues: { nodes: Array<Record<string, any>> } }; errors?: Array<{ message: string }> };
  if (!r.ok || j.errors?.length) throw new Error(j.errors?.[0]?.message ?? `Linear answered ${r.status}`);
  return (j.data?.issues.nodes ?? []).map((n) => ({
    key: String(n.identifier), title: String(n.title), url: String(n.url), state: String(n.state?.name ?? ""),
    labels: (n.labels?.nodes ?? []).map((l: { name: string }) => l.name), who: String(n.assignee?.name ?? ""), updated: Date.parse(n.updatedAt) || 0,
  }));
}

/** The prompt for a task started from an issue: what to do, plus where the full text lives. */
export function issuePrompt(source: string, i: Pick<Issue, "key" | "title" | "url">): string {
  const how = source === "github" ? `Read it first with \`gh ${i.key.startsWith("#") ? "issue" : "pr"} view ${i.key.slice(1)}\`.` : `Full description: ${i.url}`;
  return `Work on ${source === "github" ? "GitHub" : "Linear"} ${i.key}: ${i.title}\n\n${how}\n${i.url}`;
}

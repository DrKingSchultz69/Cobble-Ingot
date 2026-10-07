// Web search + page fetching. Uses a keyed provider when configured, otherwise Claude's WebSearch + Wikipedia (no key).
import { HOST, PORT } from "../../daemon/src/config.ts";
import { extractJson, runCli } from "./llm.ts";
export type WebResult = { title: string; url: string; snippet: string };
export type Search = ((q: string, n?: number) => Promise<WebResult[]>) & { provider: string };

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36 mm-research";

export function createSearch(env = process.env): Search {
  if (env.TAVILY_API_KEY) return Object.assign((q: string, n = 8) => tavily(env.TAVILY_API_KEY!, q, n), { provider: "tavily" });
  if (env.BRAVE_API_KEY) return Object.assign((q: string, n = 8) => brave(env.BRAVE_API_KEY!, q, n), { provider: "brave" });
  if (env.SEARXNG_URL) return Object.assign((q: string, n = 8) => searxng(env.SEARXNG_URL!, q, n), { provider: "searxng" });
  // No key: Claude Code's built-in WebSearch (included in the subscription), plus Wikipedia.
  return Object.assign(async (q: string, n = 8) => {
    const [web, wiki] = await Promise.allSettled([claudeWebSearch(q, n), wikipedia(q, 2)]);
    const out = [...(web.status === "fulfilled" ? web.value : []), ...(wiki.status === "fulfilled" ? wiki.value : [])];
    if (!out.length) {
      const why = web.status === "rejected" ? (web.reason as Error).message : "no results";
      throw new Error(`web search failed (${why}). Set TAVILY_API_KEY or BRAVE_API_KEY for a dedicated search API.`);
    }
    return dedupe(out).slice(0, n);
  }, { provider: "claude-websearch+wikipedia" });
}

async function claudeWebSearch(q: string, n: number): Promise<WebResult[]> {
  const prompt = `Search the web for: ${q}
Reply with ONLY a JSON array of the top ${n} results as {"title","url","snippet"}.`;
  const args = [
    "-p", "--model", "haiku", "--no-session-persistence", "--strict-mcp-config", "--mcp-config", '"{\\"mcpServers\\":{}}"',
    "--disable-slash-commands", "--tools", "WebSearch", "--allowedTools", "WebSearch", "--setting-sources", '""',
    "--system-prompt", '"You are a search API. Output only JSON."',
  ];
  const out = await runCli(`claude ${args.join(" ")}`, prompt, { ANTHROPIC_BASE_URL: `http://${HOST}:${PORT}/a/research/anthropic` }, 150_000);
  return extractJson<WebResult[]>(out).filter((r) => r && typeof r.url === "string" && /^https?:/.test(r.url));
}

async function tavily(key: string, q: string, n: number): Promise<WebResult[]> {
  const r = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ api_key: key, query: q, max_results: n }),
    signal: AbortSignal.timeout(20_000),
  });
  const j = (await r.json()) as { results?: Array<{ title: string; url: string; content: string }> };
  return (j.results ?? []).map((x) => ({ title: x.title, url: x.url, snippet: x.content }));
}

async function brave(key: string, q: string, n: number): Promise<WebResult[]> {
  const r = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=${n}`, {
    headers: { "x-subscription-token": key, accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  const j = (await r.json()) as { web?: { results?: Array<{ title: string; url: string; description: string }> } };
  return (j.web?.results ?? []).map((x) => ({ title: x.title, url: x.url, snippet: stripTags(x.description) }));
}

async function searxng(base: string, q: string, n: number): Promise<WebResult[]> {
  const r = await fetch(`${base.replace(/\/$/, "")}/search?format=json&q=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(20_000) });
  const j = (await r.json()) as { results?: Array<{ title: string; url: string; content: string }> };
  return (j.results ?? []).slice(0, n).map((x) => ({ title: x.title, url: x.url, snippet: x.content }));
}

async function wikipedia(q: string, n: number): Promise<WebResult[]> {
  const r = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=${n}&srsearch=${encodeURIComponent(q)}`,
    { headers: { "user-agent": "mm-research/0.1 (local research tool)" }, signal: AbortSignal.timeout(10_000) },
  );
  const j = (await r.json()) as { query?: { search?: Array<{ title: string; snippet: string }> } };
  return (j.query?.search ?? []).map((x) => ({
    title: `${x.title} — Wikipedia`,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(x.title.replace(/ /g, "_"))}`,
    snippet: stripTags(x.snippet),
  }));
}

export type Fetcher = (url: string) => Promise<string>;

export const fetchPage: Fetcher = async (url) => {
  const r = await fetch(url, { headers: { "user-agent": UA, accept: "text/html,text/plain" }, signal: AbortSignal.timeout(12_000), redirect: "follow" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const type = r.headers.get("content-type") ?? "";
  if (!/text|html|json|xml/.test(type)) throw new Error(`unsupported content-type ${type}`);
  const raw = (await r.text()).slice(0, 2_000_000);
  return /html/.test(type) ? htmlToText(raw) : raw;
};

export function htmlToText(html: string): string {
  const body = html
    .replace(/<(script|style|noscript|svg|nav|footer|header|form|aside)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr|br|section|article)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");
  // Keep line breaks (B-015): bestExcerpt() needs paragraphs to pick the relevant part of a page.
  return decodeEntities(body.replace(/<[^>]+>/g, " "))
    .split("\n")
    .map((l) => l.replace(/[ \t ]+/g, " ").trim())
    .filter((l) => l.length > 2)
    .join("\n");
}

export function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
}

function dedupe(rs: WebResult[]): WebResult[] {
  const seen = new Set<string>();
  return rs.filter((r) => {
    const k = r.url.replace(/[#?].*$/, "").replace(/\/$/, "");
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

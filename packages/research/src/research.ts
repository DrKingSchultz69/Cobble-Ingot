// Perplexity-style answers with citations, Deep Research reports, threads, spaces (collections),
// and Consensus-style paper tools (search, study snapshot, ask-a-paper, consensus meter, export).
import type { DatabaseSync } from "node:sqlite";
import { ensureGraphSchema, upsertNode } from "../../memory/src/graph.ts";
import { extractJson, type Llm } from "./llm.ts";
import type { Paper, PaperSearch } from "./papers.ts";
import type { Fetcher, Search, WebResult } from "./search.ts";

export type Focus = "web" | "academic" | "code";
export type Source = { n: number; title: string; url: string; snippet: string; kind: "web" | "paper"; paperId?: string };
export type Answer = { threadId: number; messageId: number; answer: string; sources: Source[]; followups: string[]; engine: string };

export type Deps = { db: DatabaseSync; llm: Llm; search: Search; fetchPage: Fetcher; searchPapers: PaperSearch };

export function ensureResearchSchema(db: DatabaseSync): void {
  ensureGraphSchema(db);
  db.exec(`
    CREATE TABLE IF NOT EXISTS research_threads (id INTEGER PRIMARY KEY, title TEXT NOT NULL, focus TEXT NOT NULL, created INTEGER NOT NULL, updated INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS research_messages (
      id INTEGER PRIMARY KEY, thread INTEGER NOT NULL REFERENCES research_threads(id) ON DELETE CASCADE,
      role TEXT NOT NULL, content TEXT NOT NULL, sources TEXT NOT NULL DEFAULT '[]', followups TEXT NOT NULL DEFAULT '[]', created INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS collections (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS collection_items (
      id INTEGER PRIMARY KEY, collection INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      kind TEXT NOT NULL, ref TEXT NOT NULL, title TEXT NOT NULL, data TEXT NOT NULL DEFAULT '{}', created INTEGER NOT NULL,
      UNIQUE(collection, kind, ref)
    );
  `);
}

const SYSTEM =
  "You answer using ONLY the numbered sources provided. Cite every factual claim inline like [1] or [2][3]. " +
  "If the sources don't contain the answer, say so plainly. Use short paragraphs or bullets. Markdown is fine.";

const EXCERPT = 1800;

export async function ask(
  d: Deps,
  input: { q: string; focus?: Focus; deep?: boolean; threadId?: number },
): Promise<Answer> {
  const q = input.q.trim();
  if (!q) throw new Error("question is required");
  const focus = input.focus ?? "web";
  const history = input.threadId ? threadHistory(d.db, input.threadId) : "";

  const sources = input.deep ? await deepSources(d, q, focus) : await gatherSources(d, q, focus, focus === "academic" ? 8 : 5);
  if (!sources.length) throw new Error("No sources found for that question.");

  const srcText = sources.map((s) => `[${s.n}] ${s.title}\n${s.url}\n${s.snippet}`).join("\n\n");
  const instructions = input.deep
    ? "Write a structured research report: a 2-3 sentence summary, then sections with headings, then 'Open questions'. Cite sources inline."
    : "Answer the question directly and concisely.";
  const prompt =
    `${history ? `Conversation so far:\n${history}\n\n` : ""}Sources:\n${srcText}\n\nQuestion: ${q}\n\n${instructions}\n\n` +
    "After the answer, output a line 'FOLLOWUPS:' followed by exactly 3 short follow-up questions, one per line.";
  const raw = await d.llm(prompt, { system: SYSTEM, maxTokens: input.deep ? 3000 : 1500 });
  const { answer, followups } = splitFollowups(raw);

  const threadId = input.threadId ?? createThread(d.db, q, focus);
  const now = Date.now();
  d.db.prepare("INSERT INTO research_messages (thread, role, content, created) VALUES (?, 'user', ?, ?)").run(threadId, q, now);
  const m = d.db
    .prepare("INSERT INTO research_messages (thread, role, content, sources, followups, created) VALUES (?, 'assistant', ?, ?, ?, ?) RETURNING id")
    .get(threadId, answer, JSON.stringify(sources), JSON.stringify(followups), now) as { id: number };
  d.db.prepare("UPDATE research_threads SET updated = ? WHERE id = ?").run(now, threadId);

  // Make the finding searchable by every coding agent through shared memory.
  upsertNode(d.db, {
    kind: "research",
    key: `msg:${m.id}`,
    title: q.slice(0, 200),
    body: `${answer}\n\nSources:\n${sources.map((s) => `[${s.n}] ${s.title} ${s.url}`).join("\n")}`,
    data: { threadId, focus },
  });

  return { threadId, messageId: m.id, answer, sources, followups, engine: d.llm.engine };
}

async function gatherSources(d: Deps, q: string, focus: Focus, n: number): Promise<Source[]> {
  if (focus === "academic") {
    const papers = await d.searchPapers(q, n);
    return papers.filter((p) => p.abstract || p.title).map((p, i) => paperSource(p, i + 1));
  }
  const query = focus === "code" ? `${q} (site:github.com OR site:stackoverflow.com OR documentation)` : q;
  const results = await d.search(query, n + 3);
  return withPageText(d, results.slice(0, n));
}

async function withPageText(d: Deps, results: WebResult[]): Promise<Source[]> {
  const pages = await Promise.allSettled(results.map((r) => d.fetchPage(r.url)));
  return results.map((r, i) => {
    const page = pages[i].status === "fulfilled" ? (pages[i] as PromiseFulfilledResult<string>).value : "";
    return { n: i + 1, title: r.title, url: r.url, snippet: (page ? bestExcerpt(page, r.snippet) : r.snippet).slice(0, EXCERPT), kind: "web" as const };
  });
}

// Deep research: have the model split the question, search each part, merge.
async function deepSources(d: Deps, q: string, focus: Focus): Promise<Source[]> {
  let subs: string[] = [];
  try {
    subs = extractJson<string[]>(
      await d.llm(`Break this research question into 3 distinct web search queries that together cover it. Reply with a JSON array of strings only.\n\nQuestion: ${q}`, { maxTokens: 300 }),
    ).filter((s) => typeof s === "string").slice(0, 4);
  } catch { /* fall back to the question itself */ }
  const queries = [q, ...subs];
  if (focus === "academic") {
    const lists = await Promise.allSettled(queries.map((x) => d.searchPapers(x, 5)));
    const seen = new Set<string>();
    const papers = lists.flatMap((l) => (l.status === "fulfilled" ? l.value : [])).filter((p) => !seen.has(p.id) && seen.add(p.id));
    return papers.slice(0, 12).map((p, i) => paperSource(p, i + 1));
  }
  const lists = await Promise.allSettled(queries.map((x) => d.search(x, 4)));
  const seen = new Set<string>();
  const results = lists.flatMap((l) => (l.status === "fulfilled" ? l.value : [])).filter((r) => !seen.has(r.url) && seen.add(r.url));
  return withPageText(d, results.slice(0, 8));
}

const paperSource = (p: Paper, n: number): Source => ({
  n,
  title: `${p.title} (${p.authors[0] ?? "Unknown"}${p.authors.length > 1 ? " et al." : ""}, ${p.year ?? "n.d."}; ${p.citations} citations)`,
  url: p.url,
  snippet: (p.abstract || "No abstract available.").slice(0, EXCERPT),
  kind: "paper",
  paperId: p.id,
});

// Pick the part of a long page that overlaps most with the search snippet / question words.
export function bestExcerpt(page: string, hint: string, size = EXCERPT): string {
  if (page.length <= size) return page;
  const words = new Set((hint.toLowerCase().match(/[a-z0-9]{4,}/g) ?? []).slice(0, 30));
  const paras = page.split("\n");
  const hits = (p: string | undefined) => {
    const t = (p ?? "").toLowerCase();
    let s = 0;
    for (const w of words) if (t.includes(w)) s++;
    return s;
  };
  // A paragraph's own matches count most; the next two add context.
  let best = 0;
  let bestScore = -1;
  for (let i = 0; i < paras.length; i++) {
    const s = hits(paras[i]) * 2 + hits(paras[i + 1]) + hits(paras[i + 2]);
    if (s > bestScore) {
      bestScore = s;
      best = i;
    }
  }
  return paras.slice(best).join("\n").slice(0, size);
}

export function splitFollowups(raw: string): { answer: string; followups: string[] } {
  const i = raw.search(/\n\s*\**FOLLOWUPS:?\**\s*\n?/i);
  if (i < 0) return { answer: raw.trim(), followups: [] };
  const followups = raw
    .slice(i)
    .replace(/^\s*\**FOLLOWUPS:?\**/i, "")
    .split("\n")
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
  return { answer: raw.slice(0, i).trim(), followups };
}

function createThread(db: DatabaseSync, q: string, focus: Focus): number {
  const now = Date.now();
  return (db.prepare("INSERT INTO research_threads (title, focus, created, updated) VALUES (?, ?, ?, ?) RETURNING id").get(q.slice(0, 120), focus, now, now) as { id: number }).id;
}

function threadHistory(db: DatabaseSync, id: number): string {
  const rows = db.prepare("SELECT role, content FROM research_messages WHERE thread = ? ORDER BY id DESC LIMIT 6").all(id) as Array<{ role: string; content: string }>;
  return rows.reverse().map((r) => `${r.role === "user" ? "User" : "Assistant"}: ${r.content.slice(0, 1200)}`).join("\n");
}

export function listThreads(db: DatabaseSync) {
  return db.prepare("SELECT * FROM research_threads ORDER BY updated DESC LIMIT 100").all();
}

export function getThread(db: DatabaseSync, id: number) {
  const thread = db.prepare("SELECT * FROM research_threads WHERE id = ?").get(id);
  if (!thread) throw new Error("thread not found");
  const messages = (db.prepare("SELECT * FROM research_messages WHERE thread = ? ORDER BY id").all(id) as Array<Record<string, unknown>>).map((m) => ({
    ...m,
    sources: JSON.parse(String(m.sources)),
    followups: JSON.parse(String(m.followups)),
  }));
  return { thread, messages };
}

export function deleteThread(db: DatabaseSync, id: number) {
  db.exec("PRAGMA foreign_keys = ON");
  db.prepare("DELETE FROM research_threads WHERE id = ?").run(id);
}

// --- Spaces / collections ---------------------------------------------------
export function listCollections(db: DatabaseSync) {
  return db.prepare("SELECT c.*, COUNT(i.id) AS items FROM collections c LEFT JOIN collection_items i ON i.collection = c.id GROUP BY c.id ORDER BY c.name").all();
}

export function addToCollection(db: DatabaseSync, name: string, item: { kind: string; ref: string; title: string; data?: unknown }) {
  const now = Date.now();
  db.prepare("INSERT OR IGNORE INTO collections (name, created) VALUES (?, ?)").run(name, now);
  const c = db.prepare("SELECT id FROM collections WHERE name = ?").get(name) as { id: number };
  db.prepare("INSERT OR REPLACE INTO collection_items (collection, kind, ref, title, data, created) VALUES (?, ?, ?, ?, ?, ?)").run(
    c.id, item.kind, item.ref, item.title, JSON.stringify(item.data ?? {}), now,
  );
  return { collection: c.id };
}

export function collectionItems(db: DatabaseSync, id: number) {
  return (db.prepare("SELECT * FROM collection_items WHERE collection = ? ORDER BY created DESC").all(id) as Array<Record<string, unknown>>).map((r) => ({
    ...r,
    data: JSON.parse(String(r.data)),
  }));
}

// --- Consensus-style paper tools ---------------------------------------------
export async function studySnapshot(llm: Llm, p: Paper) {
  if (!p.abstract) return { population: "", method: "", outcome: "", finding: "No abstract available to summarise.", limitations: "" };
  return extractJson<Record<string, string>>(
    await llm(
      `Summarise this study as JSON with keys: population, method, sample_size, outcome, finding, limitations. ` +
        `Use "not stated" when the abstract doesn't say. JSON only.\n\nTitle: ${p.title}\nAbstract: ${p.abstract}`,
      { maxTokens: 600 },
    ),
  );
}

export async function askPaper(d: Pick<Deps, "llm" | "fetchPage">, p: Paper, question: string): Promise<string> {
  let fullText = "";
  if (p.oaUrl && !/\.pdf($|\?)/i.test(p.oaUrl)) {
    try { fullText = (await d.fetchPage(p.oaUrl)).slice(0, 12_000); } catch { /* abstract only */ }
  }
  return d.llm(
    `Paper: ${p.title} (${p.authors.slice(0, 3).join(", ")}, ${p.year})\nAbstract: ${p.abstract || "n/a"}\n` +
      `${fullText ? `Open-access text (partial):\n${fullText}\n` : ""}\nQuestion: ${question}\n\n` +
      `Answer only from this paper. Say if the paper doesn't cover it.${fullText ? "" : " Only the abstract is available."}`,
    { maxTokens: 1000 },
  );
}

export type Verdict = "yes" | "possibly" | "no" | "unrelated";

export async function consensusMeter(llm: Llm, question: string, papers: Paper[]) {
  const usable = papers.filter((p) => p.abstract).slice(0, 15);
  if (!usable.length) throw new Error("None of these papers have abstracts to judge.");
  const list = usable.map((p, i) => `${i + 1}. ${p.title}\n${p.abstract.slice(0, 1600)}`).join("\n\n");
  const verdicts = extractJson<Array<{ i: number; verdict: Verdict; reason: string }>>(
    await llm(
      `Yes/no question: "${question}"\n\nFor each paper decide whether its findings answer yes, possibly, no, or are unrelated. ` +
        `Reply with a JSON array of {"i": number, "verdict": "yes"|"possibly"|"no"|"unrelated", "reason": "<15 words"} only.\n\n${list}`,
      { maxTokens: 1500 },
    ),
  );
  const counts: Record<Verdict, number> = { yes: 0, possibly: 0, no: 0, unrelated: 0 };
  const perPaper = verdicts
    .filter((v) => usable[v.i - 1] && v.verdict in counts)
    .map((v) => {
      counts[v.verdict]++;
      return { paperId: usable[v.i - 1].id, title: usable[v.i - 1].title, verdict: v.verdict, reason: v.reason };
    });
  const judged = counts.yes + counts.possibly + counts.no;
  const pct = (n: number) => (judged ? Math.round((n / judged) * 100) : 0);
  return { question, counts, percent: { yes: pct(counts.yes), possibly: pct(counts.possibly), no: pct(counts.no) }, perPaper };
}

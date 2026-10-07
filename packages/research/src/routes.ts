// HTTP API for research + learn, mounted into the workspace server behind auth.
import type { DatabaseSync } from "node:sqlite";
import { findNode, upsertNode } from "../../memory/src/graph.ts";
import type { Router } from "../../daemon/src/http.ts";
import { answerQuestion, bankStats, chatDocs, ensureLearnSchema, ingest, listDocs, makeQuiz, questionBank, solve } from "./learn.ts";
import { createLlm, type Llm } from "./llm.ts";
import { getPaper, searchPapers, toBibtex, toCsv, toRis, type Paper, type PaperSearch } from "./papers.ts";
import {
  addToCollection, ask, askPaper, collectionItems, consensusMeter, deleteThread, ensureResearchSchema,
  getThread, listCollections, listThreads, studySnapshot, type Focus,
} from "./research.ts";
import { createSearch, fetchPage, type Fetcher, type Search } from "./search.ts";

export type ResearchDeps = { llm?: Llm; search?: Search; fetchPage?: Fetcher; searchPapers?: PaperSearch; getPaper?: (id: string) => Promise<Paper> };

export function mountResearch(api: Router, db: DatabaseSync, deps: ResearchDeps = {}) {
  ensureResearchSchema(db);
  ensureLearnSchema(db);
  const d = {
    db,
    llm: deps.llm ?? createLlm(),
    search: deps.search ?? createSearch(),
    fetchPage: deps.fetchPage ?? fetchPage,
    searchPapers: deps.searchPapers ?? searchPapers,
  };
  const fetchPaper = deps.getPaper ?? getPaper;

  // Papers are cached in the graph so later actions (and agents) don't refetch them.
  const cachePapers = (ps: Paper[]) => {
    for (const p of ps) upsertNode(db, { kind: "paper", key: p.id, title: p.title, body: p.abstract, data: p as unknown as Record<string, unknown> });
    return ps;
  };
  const paper = async (id: string): Promise<Paper> => {
    const n = findNode(db, "paper", id);
    if (n) return n.data as unknown as Paper;
    return cachePapers([await fetchPaper(id)])[0];
  };

  api.get("/api/research/info", () => ({ llm: d.llm.engine, search: d.search.provider, papers: "openalex" }));
  api.post("/api/research/ask", ({ body }) =>
    ask(d, { q: String(body.q ?? ""), focus: (body.focus as Focus) ?? "web", deep: !!body.deep, threadId: body.threadId ? Number(body.threadId) : undefined }),
  );
  api.get("/api/research/threads", () => listThreads(db));
  api.get("/api/research/threads/:id", ({ params }) => getThread(db, Number(params.id)));
  api.delete("/api/research/threads/:id", ({ params }) => {
    deleteThread(db, Number(params.id));
    return { ok: true };
  });

  api.get("/api/collections", () => listCollections(db));
  api.get("/api/collections/:id", ({ params }) => collectionItems(db, Number(params.id)));
  api.post("/api/collections/add", ({ body }) =>
    addToCollection(db, String(body.name || "Saved"), { kind: String(body.kind), ref: String(body.ref), title: String(body.title ?? ""), data: body.data }),
  );

  api.post("/api/papers/search", async ({ body }) => cachePapers(await d.searchPapers(String(body.q ?? ""), Number(body.n ?? 10))));
  api.post("/api/papers/snapshot", async ({ body }) => studySnapshot(d.llm, await paper(String(body.id))));
  api.post("/api/papers/ask", async ({ body }) => ({ answer: await askPaper(d, await paper(String(body.id)), String(body.question ?? "")) }));
  api.post("/api/papers/meter", async ({ body }) => {
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
    const papers = ids.length ? await Promise.all(ids.map(paper)) : cachePapers(await d.searchPapers(String(body.question ?? ""), 12));
    return consensusMeter(d.llm, String(body.question ?? ""), papers);
  });
  api.get("/api/papers/export", async ({ query, res }) => {
    const ids = (query.get("ids") ?? "").split(",").filter(Boolean);
    const papers = await Promise.all(ids.map(paper));
    const fmt = query.get("format") ?? "bibtex";
    const [body, type, ext] =
      fmt === "ris" ? [toRis(papers), "application/x-research-info-systems", "ris"] : fmt === "csv" ? [toCsv(papers), "text/csv", "csv"] : [toBibtex(papers), "application/x-bibtex", "bib"];
    res.writeHead(200, { "content-type": `${type}; charset=utf-8`, "content-disposition": `attachment; filename="papers.${ext}"` });
    res.end(body);
  });

  api.post("/api/learn/ingest", ({ body }) => ingest(db, String(body.path ?? "")));
  api.get("/api/learn/docs", () => listDocs(db));
  api.post("/api/learn/chat", ({ body }) => chatDocs(db, d.llm, String(body.q ?? ""), Array.isArray(body.history) ? body.history : []));
  api.post("/api/learn/solve", ({ body }) => solve(db, d.llm, String(body.problem ?? ""), body.useDocs !== false));
  api.post("/api/learn/quiz", ({ body }) => makeQuiz(db, d.llm, { topic: String(body.topic ?? ""), n: Number(body.n ?? 5), difficulty: body.difficulty }));
  api.post("/api/learn/answer", ({ body }) => answerQuestion(db, Number(body.id), Number(body.choice)));
  api.get("/api/learn/bank", ({ query }) => ({ stats: bankStats(db), questions: questionBank(db, query.get("topic") ?? undefined) }));
}

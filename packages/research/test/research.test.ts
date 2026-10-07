import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { search as graphSearch } from "../../memory/src/graph.ts";
import { answerQuestion, chunkText, chatDocs, ensureLearnSchema, ingest, makeQuiz, questionBank } from "../src/learn.ts";
import { extractJson, pickEngine, type Llm } from "../src/llm.ts";
import { abstractFromIndex, toBibtex, toPaper, toRis } from "../src/papers.ts";
import { ask, bestExcerpt, consensusMeter, ensureResearchSchema, getThread, splitFollowups } from "../src/research.ts";
import { htmlToText, type Search } from "../src/search.ts";

// Fake model: records prompts, answers from a script.
function fakeLlm(reply: (prompt: string) => string): Llm & { prompts: string[] } {
  const prompts: string[] = [];
  const fn = async (p: string) => {
    prompts.push(p);
    return reply(p);
  };
  return Object.assign(fn, { engine: "fake", prompts });
}
const fakeSearch: Search = Object.assign(
  async (q: string) => [
    { title: "Worktrees explained", url: "https://a.example/wt", snippet: `about ${q}` },
    { title: "Clone docs", url: "https://b.example/clone", snippet: "clone copies history" },
  ],
  { provider: "fake" },
);
const pages: Record<string, string> = {
  "https://a.example/wt": "Intro\nA worktree shares the object store with the main repo.\nMore text",
  "https://b.example/clone": "git clone copies the full history into a new repository.",
};

function db() {
  const d = new DatabaseSync(":memory:");
  ensureResearchSchema(d);
  ensureLearnSchema(d);
  return d;
}

test("extractJson handles fences, prose and nested strings", () => {
  assert.deepEqual(extractJson('Sure!\n```json\n[{"a":"x]y"}]\n```'), [{ a: "x]y" }]);
  assert.deepEqual(extractJson('Here: {"k": {"n": 1}} trailing'), { k: { n: 1 } });
  assert.throws(() => extractJson("no json here"));
});

test("pickEngine prefers explicit, then keys, then the Claude CLI", () => {
  assert.equal(pickEngine({ MM_LLM: "codex-cli" }), "codex-cli");
  assert.equal(pickEngine({ OPENROUTER_API_KEY: "x" }), "openrouter");
  assert.equal(pickEngine({ MM_FALLBACK_ANTHROPIC_KEY: "x" }), "anthropic");
  assert.equal(pickEngine({}), "claude-cli");
});

test("splitFollowups separates the answer from follow-up questions", () => {
  const r = splitFollowups("Answer text [1].\n\nFOLLOWUPS:\n1. First?\n- Second?\n• Third?\nFourth?");
  assert.equal(r.answer, "Answer text [1].");
  assert.deepEqual(r.followups, ["First?", "Second?", "Third?"]);
  assert.deepEqual(splitFollowups("just an answer").followups, []);
});

test("htmlToText drops scripts/nav and decodes entities", () => {
  const t = htmlToText("<html><nav>menu</nav><script>x()</script><p>Tom &amp; Jerry&#39;s</p><p>Line two</p></html>");
  assert.equal(t, "Tom & Jerry's\nLine two");
});

test("bestExcerpt picks the paragraph matching the hint", () => {
  const page = Array.from({ length: 50 }, (_, i) => (i === 30 ? "worktree object store shared" : `filler paragraph ${i} ${"x".repeat(80)}`)).join("\n");
  assert.ok(bestExcerpt(page, "worktree shared object store", 200).startsWith("worktree object store shared"));
});

test("ask: cites sources, saves a thread and writes the answer into shared memory", async () => {
  const d = db();
  const llm = fakeLlm(() => "Worktrees share objects [1]; clones copy history [2].\nFOLLOWUPS:\nA?\nB?\nC?");
  const a = await ask({ db: d, llm, search: fakeSearch, fetchPage: async (u) => pages[u], searchPapers: async () => [] }, { q: "worktree vs clone" });
  assert.equal(a.sources.length, 2);
  assert.match(a.sources[0].snippet, /shares the object store/); // page text, not just the search snippet
  assert.deepEqual(a.followups, ["A?", "B?", "C?"]);
  assert.match(llm.prompts[0], /\[1\] Worktrees explained/);
  const t = getThread(d, a.threadId);
  assert.equal(t.messages.length, 2);
  assert.equal(graphSearch(d, "worktree clone", { kinds: ["research"] }).length, 1);
  // Follow-up in the same thread includes the history.
  await ask({ db: d, llm, search: fakeSearch, fetchPage: async (u) => pages[u], searchPapers: async () => [] }, { q: "and disk use?", threadId: a.threadId });
  assert.match(llm.prompts[1], /Conversation so far:[\s\S]*worktree vs clone/);
});

test("ask: academic focus uses papers; deep mode fans out sub-queries", async () => {
  const d = db();
  const paper = toPaper({ id: "https://openalex.org/W1", title: "Creatine and memory", publication_year: 2023, cited_by_count: 9, authorships: [{ author: { display_name: "A. Smith" } }], abstract_inverted_index: { Creatine: [0], helps: [1] } });
  const seen: string[] = [];
  const llm = fakeLlm((p) => (p.includes("Break this research question") ? '["q1","q2"]' : "Yes [1]."));
  const a = await ask(
    { db: d, llm, search: fakeSearch, fetchPage: async () => "", searchPapers: async (q) => (seen.push(q), [paper]) },
    { q: "does creatine help memory", focus: "academic", deep: true },
  );
  assert.deepEqual(seen, ["does creatine help memory", "q1", "q2"]);
  assert.equal(a.sources.length, 1); // deduplicated
  assert.equal(a.sources[0].kind, "paper");
  assert.match(a.sources[0].title, /Smith, 2023; 9 citations/);
});

test("papers: abstract rebuild + BibTeX/RIS export", () => {
  assert.equal(abstractFromIndex({ world: [1], Hello: [0], again: [2] }), "Hello world again");
  const p = toPaper({ id: "https://openalex.org/W9", title: "Deep {Learning}", publication_year: 2020, doi: "https://doi.org/10.1/x", authorships: [{ author: { display_name: "Ada Lovelace" } }], primary_location: { source: { display_name: "Nature" } } });
  const bib = toBibtex([p]);
  assert.match(bib, /^@article\{Lovelace2020deep,/);
  assert.match(bib, /title = \{Deep Learning\}/);
  assert.match(bib, /doi = \{10\.1\/x\}/);
  assert.match(toRis([p]), /TY {2}- JOUR\nTI {2}- Deep \{Learning\}\nAU {2}- Ada Lovelace\nPY {2}- 2020/);
});

test("consensusMeter counts verdicts and ignores out-of-range indexes", async () => {
  const mk = (id: string) => toPaper({ id, title: id, abstract_inverted_index: { text: [0] } });
  const llm = fakeLlm(() => '[{"i":1,"verdict":"yes","reason":"r"},{"i":2,"verdict":"no","reason":"r"},{"i":3,"verdict":"unrelated","reason":"r"},{"i":9,"verdict":"yes","reason":"bogus"}]');
  const m = await consensusMeter(llm, "q?", [mk("W1"), mk("W2"), mk("W3")]);
  assert.deepEqual(m.counts, { yes: 1, possibly: 0, no: 1, unrelated: 1 });
  assert.deepEqual(m.percent, { yes: 50, possibly: 0, no: 50 });
});

test("learn: chunking respects size and overlap", () => {
  const text = Array.from({ length: 40 }, (_, i) => `Sentence number ${i} is here.`).join(" ");
  const chunks = chunkText(text, 200, 40);
  assert.ok(chunks.length > 3);
  assert.ok(chunks.every((c) => c.length <= 200));
  assert.deepEqual(chunkText("short"), ["short"]);
  assert.deepEqual(chunkText("   "), []);
});

test("learn: ingest -> chat with citations -> quiz -> answer updates the bank", async () => {
  const d = db();
  const dir = mkdtempSync(join(tmpdir(), "mm-learn-"));
  writeFileSync(join(dir, "photosynthesis.md"), "# Photosynthesis\nPlants convert light into chemical energy in chloroplasts.");
  writeFileSync(join(dir, "image.png"), "binary");
  const r = ingest(d, dir);
  assert.deepEqual([r.docs, r.chunks], [1, 1]);
  // Re-ingest replaces chunks instead of duplicating.
  ingest(d, dir);
  assert.equal((d.prepare("SELECT COUNT(*) n FROM nodes WHERE kind='chunk'").get() as { n: number }).n, 1);

  const llm = fakeLlm((p) =>
    p.includes("multiple-choice")
      ? '[{"question":"Where does photosynthesis happen?","choices":["Mitochondria","Chloroplasts","Nucleus","Ribosome"],"answer":1,"explanation":"Chloroplasts."},{"question":"bad","choices":["x"],"answer":5}]'
      : "In chloroplasts [1].",
  );
  const c = await chatDocs(d, llm, "where does photosynthesis happen");
  assert.equal(c.sources[0].title, "photosynthesis.md §1");
  assert.match(llm.prompts[0], /chloroplasts/);

  const quiz = await makeQuiz(d, llm, { topic: "photosynthesis", n: 2 });
  assert.equal(quiz.length, 1); // the malformed item is dropped
  assert.equal("answer" in quiz[0], false); // answer is not sent to the client
  assert.equal(answerQuestion(d, quiz[0].id, 0).correct, false);
  assert.equal(answerQuestion(d, quiz[0].id, 1).correct, true);
  const bank = questionBank(d) as Array<Record<string, unknown>>;
  assert.equal(bank[0].seen, 2);
  assert.equal(bank[0].correct, 1);
  assert.equal("answer" in bank[0], false);
});

test("chatDocs with nothing ingested says so instead of calling the model", async () => {
  const llm = fakeLlm(() => "should not be called");
  const r = await chatDocs(db(), llm, "anything");
  assert.match(r.answer, /couldn't find anything/);
  assert.equal(llm.prompts.length, 0);
});

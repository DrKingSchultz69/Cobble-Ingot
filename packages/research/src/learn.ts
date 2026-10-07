// DeepTutor-style learning: ingest your documents, chat over them with citations,
// step-by-step problem solving, and quizzes that feed a reusable question bank.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { deleteNodes, ensureGraphSchema, link, search, upsertNode } from "../../memory/src/graph.ts";
import { htmlToText } from "./search.ts";
import { extractJson, type Llm } from "./llm.ts";

export const LEARN_PROJECT = "learn";
const TEXT_EXT = new Set([".md", ".txt", ".markdown", ".rst", ".html", ".htm", ".csv", ".json", ".ts", ".js", ".py", ".java", ".go", ".rs", ".tex"]);
const CHUNK = 1400;
const OVERLAP = 200;

export function ensureLearnSchema(db: DatabaseSync): void {
  ensureGraphSchema(db);
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY, topic TEXT NOT NULL, question TEXT NOT NULL, choices TEXT NOT NULL,
      answer INTEGER NOT NULL, explanation TEXT NOT NULL DEFAULT '', source TEXT NOT NULL DEFAULT '',
      seen INTEGER NOT NULL DEFAULT 0, correct INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL
    );
  `);
}

export function chunkText(text: string, size = CHUNK, overlap = OVERLAP): string[] {
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (clean.length <= size) return clean ? [clean] : [];
  const out: string[] = [];
  let i = 0;
  while (i < clean.length) {
    let end = Math.min(i + size, clean.length);
    // Prefer to cut at a paragraph or sentence boundary.
    if (end < clean.length) {
      const para = clean.lastIndexOf("\n\n", end);
      const sent = clean.lastIndexOf(". ", end);
      const cut = para > i + size / 2 ? para : sent > i + size / 2 ? sent + 1 : end;
      end = cut;
    }
    out.push(clean.slice(i, end).trim());
    if (end >= clean.length) break;
    i = Math.max(end - overlap, i + 1);
  }
  return out.filter(Boolean);
}

function readDoc(abs: string): string {
  const ext = extname(abs).toLowerCase();
  if (ext === ".pdf") {
    // Uses poppler's pdftotext when installed; otherwise PDFs are skipped (see BUGS B-011).
    return execFileSync("pdftotext", ["-layout", abs, "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
  }
  const raw = readFileSync(abs, "utf8");
  return ext === ".html" || ext === ".htm" ? htmlToText(raw) : raw;
}

export function ingest(db: DatabaseSync, path: string): { docs: number; chunks: number; skipped: string[] } {
  const abs = resolve(path);
  const files: string[] = [];
  const walk = (p: string) => {
    const st = statSync(p);
    if (st.isDirectory()) {
      for (const e of readdirSync(p)) if (!e.startsWith(".") && e !== "node_modules") walk(join(p, e));
    } else files.push(p);
  };
  walk(abs);
  let docs = 0;
  let chunks = 0;
  const skipped: string[] = [];
  for (const f of files.slice(0, 2000)) {
    const ext = extname(f).toLowerCase();
    if (!TEXT_EXT.has(ext) && ext !== ".pdf") continue;
    let text = "";
    try {
      if (statSync(f).size > 20 * 1024 * 1024) throw new Error("too large");
      text = readDoc(f);
    } catch (e) {
      skipped.push(`${basename(f)} (${ext === ".pdf" ? "install poppler/pdftotext to read PDFs" : (e as Error).message})`);
      continue;
    }
    const key = f.replace(/\\/g, "/");
    deleteNodes(db, { kind: "chunk", project: LEARN_PROJECT, keyPrefix: `${key}#` });
    const parts = chunkText(text);
    const docId = upsertNode(db, { kind: "doc", key, title: basename(f), body: parts[0]?.slice(0, 500) ?? "", project: LEARN_PROJECT, data: { path: key, chunks: parts.length } });
    parts.forEach((c, i) => {
      const cid = upsertNode(db, { kind: "chunk", key: `${key}#${i}`, title: `${basename(f)} §${i + 1}`, body: c, project: LEARN_PROJECT, data: { doc: key, i } });
      link(db, docId, cid, "contains");
    });
    docs++;
    chunks += parts.length;
  }
  return { docs, chunks, skipped };
}

export function listDocs(db: DatabaseSync) {
  return db.prepare("SELECT id, title, json_extract(data,'$.path') path, json_extract(data,'$.chunks') chunks, updated FROM nodes WHERE kind='doc' AND project=? ORDER BY updated DESC").all(LEARN_PROJECT);
}

export function retrieve(db: DatabaseSync, q: string, k = 6) {
  return search(db, q, { project: LEARN_PROJECT, kinds: ["chunk"], limit: k });
}

export async function chatDocs(db: DatabaseSync, llm: Llm, q: string, history: Array<{ role: string; content: string }> = []) {
  const hits = retrieve(db, q);
  if (!hits.length) return { answer: "I couldn't find anything about that in your documents. Ingest a file or folder first, or rephrase.", sources: [] };
  const sources = hits.map((h, i) => ({ n: i + 1, title: h.title, doc: String(h.data.doc ?? ""), text: h.body }));
  const prompt =
    `${history.length ? `Conversation:\n${history.slice(-6).map((m) => `${m.role}: ${m.content.slice(0, 800)}`).join("\n")}\n\n` : ""}` +
    `Excerpts from the user's documents:\n${sources.map((s) => `[${s.n}] ${s.title}\n${s.text}`).join("\n\n")}\n\nQuestion: ${q}\n\n` +
    "Teach clearly. Use only the excerpts, cite like [1]. If they don't cover it, say what is missing.";
  const answer = await llm(prompt, { system: "You are a patient tutor.", maxTokens: 1500 });
  return { answer, sources: sources.map(({ text, ...s }) => ({ ...s, snippet: text.slice(0, 300) })) };
}

export async function solve(db: DatabaseSync, llm: Llm, problem: string, useDocs = true) {
  const hits = useDocs ? retrieve(db, problem, 4) : [];
  const ctx = hits.length ? `Relevant notes from the user's documents:\n${hits.map((h, i) => `[${i + 1}] ${h.body}`).join("\n\n")}\n\n` : "";
  const answer = await llm(
    `${ctx}Problem:\n${problem}\n\nSolve step by step. Number each step, show the reasoning, state the final answer on its own line starting with "Answer:". ` +
      "Then add a 'Check' step that verifies the result.",
    { system: "You are a careful tutor who shows worked solutions.", maxTokens: 2000 },
  );
  return { answer, usedDocs: hits.map((h) => h.title) };
}

type QuizItem = { question: string; choices: string[]; answer: number; explanation: string };

export async function makeQuiz(db: DatabaseSync, llm: Llm, opts: { topic: string; n?: number; difficulty?: string }) {
  const n = Math.min(Math.max(opts.n ?? 5, 1), 15);
  const hits = retrieve(db, opts.topic, 6);
  const ctx = hits.length ? `Base the questions on these notes:\n${hits.map((h) => h.body).join("\n---\n")}\n\n` : "";
  const items = extractJson<QuizItem[]>(
    await llm(
      `${ctx}Write ${n} ${opts.difficulty ?? "medium"} multiple-choice questions about "${opts.topic}". ` +
        'Reply with a JSON array only: [{"question": "...", "choices": ["A","B","C","D"], "answer": <index 0-3>, "explanation": "..."}]',
      { maxTokens: 3000 },
    ),
  );
  const ins = db.prepare("INSERT INTO questions (topic, question, choices, answer, explanation, source, created) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id");
  const now = Date.now();
  return items
    .filter((q) => q && typeof q.question === "string" && Array.isArray(q.choices) && q.choices.length >= 2 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.choices.length)
    .map((q) => {
      const { id } = ins.get(opts.topic, q.question, JSON.stringify(q.choices), q.answer, q.explanation ?? "", hits.map((h) => h.title).join(", "), now) as { id: number };
      return { id, topic: opts.topic, question: q.question, choices: q.choices };
    });
}

export function answerQuestion(db: DatabaseSync, id: number, choice: number) {
  const q = db.prepare("SELECT * FROM questions WHERE id = ?").get(id) as { answer: number; explanation: string; choices: string } | undefined;
  if (!q) throw new Error("question not found");
  const correct = q.answer === choice;
  db.prepare("UPDATE questions SET seen = seen + 1, correct = correct + ? WHERE id = ?").run(correct ? 1 : 0, id);
  return { correct, answer: q.answer, explanation: q.explanation };
}

export function questionBank(db: DatabaseSync, topic?: string) {
  return (db.prepare("SELECT * FROM questions WHERE (? IS NULL OR topic = ?) ORDER BY created DESC LIMIT 200").all(topic ?? null, topic ?? null) as Array<Record<string, unknown>>).map(
    ({ answer, ...q }) => ({ ...q, choices: JSON.parse(String(q.choices)) }),
  );
}

export function bankStats(db: DatabaseSync) {
  return db.prepare("SELECT topic, COUNT(*) questions, SUM(seen) attempts, SUM(correct) correct FROM questions GROUP BY topic ORDER BY MAX(created) DESC").all();
}

// Scholarly paper search (OpenAlex, free, no key) + citation export.
export type Paper = {
  id: string; // OpenAlex id, e.g. W2741809807
  title: string;
  year: number | null;
  authors: string[];
  venue: string;
  doi: string;
  url: string;
  oaUrl: string;
  citations: number;
  abstract: string;
  type: string;
};

export type PaperSearch = (q: string, n?: number) => Promise<Paper[]>;

const BASE = "https://api.openalex.org";

export const searchPapers: PaperSearch = async (q, n = 10) => {
  const r = await fetch(`${BASE}/works?search=${encodeURIComponent(q)}&per-page=${Math.min(n, 50)}&mailto=mm@localhost`, {
    signal: AbortSignal.timeout(20_000),
  });
  if (!r.ok) throw new Error(`OpenAlex ${r.status}`);
  const j = (await r.json()) as { results: unknown[] };
  return j.results.map(toPaper);
};

export async function getPaper(id: string): Promise<Paper> {
  const r = await fetch(`${BASE}/works/${encodeURIComponent(id)}?mailto=mm@localhost`, { signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`OpenAlex ${r.status}`);
  return toPaper(await r.json());
}

export function toPaper(w: any): Paper {
  return {
    id: String(w.id ?? "").replace("https://openalex.org/", ""),
    title: w.title ?? w.display_name ?? "(untitled)",
    year: w.publication_year ?? null,
    authors: (w.authorships ?? []).map((a: any) => a.author?.display_name).filter(Boolean),
    venue: w.primary_location?.source?.display_name ?? "",
    doi: String(w.doi ?? "").replace("https://doi.org/", ""),
    url: w.doi ?? w.primary_location?.landing_page_url ?? w.id ?? "",
    oaUrl: w.open_access?.oa_url ?? "",
    citations: w.cited_by_count ?? 0,
    abstract: abstractFromIndex(w.abstract_inverted_index),
    type: w.type ?? "",
  };
}

// OpenAlex stores abstracts as {word: [positions]}.
export function abstractFromIndex(idx: Record<string, number[]> | null | undefined): string {
  if (!idx) return "";
  const words: string[] = [];
  for (const [w, ps] of Object.entries(idx)) for (const p of ps) words[p] = w;
  return words.filter((w) => w !== undefined).join(" ");
}

const bibKey = (p: Paper) =>
  `${(p.authors[0]?.split(" ").pop() ?? "anon").replace(/[^A-Za-z]/g, "")}${p.year ?? ""}${(p.title.match(/[A-Za-z]{4,}/)?.[0] ?? "").toLowerCase()}`;
const esc = (s: string) => s.replace(/[{}]/g, "");

export function toBibtex(papers: Paper[]): string {
  return papers
    .map((p) => {
      const kind = p.type === "book" ? "book" : p.type === "proceedings-article" ? "inproceedings" : "article";
      const f = [
        `  title = {${esc(p.title)}}`,
        p.authors.length && `  author = {${p.authors.map(esc).join(" and ")}}`,
        p.year && `  year = {${p.year}}`,
        p.venue && `  journal = {${esc(p.venue)}}`,
        p.doi && `  doi = {${p.doi}}`,
        p.url && `  url = {${p.url}}`,
      ].filter(Boolean);
      return `@${kind}{${bibKey(p)},\n${f.join(",\n")}\n}`;
    })
    .join("\n\n");
}

export function toRis(papers: Paper[]): string {
  return papers
    .map((p) =>
      [
        "TY  - JOUR",
        `TI  - ${p.title}`,
        ...p.authors.map((a) => `AU  - ${a}`),
        p.year && `PY  - ${p.year}`,
        p.venue && `JO  - ${p.venue}`,
        p.doi && `DO  - ${p.doi}`,
        p.url && `UR  - ${p.url}`,
        p.abstract && `AB  - ${p.abstract}`,
        "ER  - ",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
}

export function toCsv(papers: Paper[]): string {
  const q = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  return ["title,authors,year,venue,doi,citations,url", ...papers.map((p) => [p.title, p.authors.join("; "), p.year, p.venue, p.doi, p.citations, p.url].map(q).join(","))].join("\n");
}

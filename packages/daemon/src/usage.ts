// Extracts model + token usage from a provider response body.
// Handles plain JSON and SSE streams for Anthropic Messages, OpenAI Chat Completions and OpenAI Responses.

// input excludes cached tokens; cacheRead / cacheWrite are billed at different rates.
export type Usage = { model: string; input: number; output: number; cacheRead: number; cacheWrite: number; reportedCost?: number };

export function parseUsage(body: string): Usage {
  const u: Usage = { model: "", input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  const objs: unknown[] = [];

  const trimmed = body.trimStart();
  if (trimmed.startsWith("{")) {
    try { objs.push(JSON.parse(trimmed)); } catch { /* fall through to SSE */ }
  }
  if (objs.length === 0) {
    for (const line of body.split("\n")) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try { objs.push(JSON.parse(data)); } catch { /* partial line */ }
    }
  }

  const raw = { input: 0, oaCached: 0 };
  for (const o of objs) walk(o, u, raw, 0);
  // Subtract OpenAI cached tokens once, at the end: events can carry the raw input without the details.
  u.input = Math.max(0, raw.input - raw.oaCached);
  u.cacheRead += raw.oaCached;
  return u;
}

function walk(o: unknown, u: Usage, raw: { input: number; oaCached: number }, depth: number): void {
  if (!o || typeof o !== "object" || depth > 4) return;
  const r = o as Record<string, unknown>;
  if (!u.model && typeof r.model === "string") u.model = r.model;
  const usage = r.usage as Record<string, unknown> | undefined;
  if (usage && typeof usage === "object") {
    // Anthropic reports cache tokens separately; OpenAI includes cached tokens inside the input count.
    const details = (usage.prompt_tokens_details ?? usage.input_tokens_details) as Record<string, unknown> | undefined;
    const out = num(usage.output_tokens) || num(usage.completion_tokens);
    // Streams report cumulative counts; keep the max seen of each raw field.
    raw.input = Math.max(raw.input, num(usage.input_tokens) || num(usage.prompt_tokens));
    raw.oaCached = Math.max(raw.oaCached, num(details?.cached_tokens));
    u.output = Math.max(u.output, out);
    // OpenRouter returns the real charge in usage.cost (USD).
    if (typeof usage.cost === "number") u.reportedCost = Math.max(u.reportedCost ?? 0, usage.cost);
    u.cacheRead = Math.max(u.cacheRead, num(usage.cache_read_input_tokens));
    u.cacheWrite = Math.max(u.cacheWrite, num(usage.cache_creation_input_tokens));
  }
  for (const k of ["message", "response"]) walk(r[k], u, raw, depth + 1);
}

const num = (v: unknown) => (typeof v === "number" ? v : 0);

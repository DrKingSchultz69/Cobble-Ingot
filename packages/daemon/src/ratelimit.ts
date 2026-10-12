// When can we call again? Reads the reset hints providers attach to rate-limited responses.
// Handles: retry-after (seconds or HTTP date), *reset* headers given as epoch seconds/ms, ISO dates,
// plain seconds, or durations like "6m0s" / "1h2m3.5s" / "20ms" (OpenAI style).
const MAX_AHEAD = 7 * 24 * 3600_000;

export function parseDuration(s: string): number | undefined {
  const m = /^(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)m(?!s))?(?:(\d+(?:\.\d+)?)s)?(?:(\d+(?:\.\d+)?)ms)?$/.exec(s.trim());
  if (!m || !m.slice(1).some(Boolean)) return undefined;
  const [h = 0, min = 0, sec = 0, ms = 0] = m.slice(1).map((x) => Number(x ?? 0));
  return ((h * 60 + min) * 60 + sec) * 1000 + ms;
}

function toTime(value: string, now: number): number | undefined {
  const v = value.trim();
  if (!v) return undefined;
  if (/^\d+(\.\d+)?$/.test(v)) {
    const n = Number(v);
    if (n > 1e12) return n; // epoch ms
    if (n > 1e9) return n * 1000; // epoch seconds
    return now + n * 1000; // seconds from now
  }
  const d = parseDuration(v);
  if (d !== undefined) return now + d;
  const t = Date.parse(v);
  return Number.isNaN(t) ? undefined : t;
}

/** Epoch ms when the limit resets, or 0 if the response gives no usable hint. */
export function parseReset(headers: Record<string, string> | Headers, now = Date.now()): number {
  const get = (k: string) => (headers instanceof Headers ? headers.get(k) : headers[k]) ?? undefined;
  const entries: Array<[string, string]> = headers instanceof Headers ? [...headers.entries()] : Object.entries(headers);
  const retry = get("retry-after");
  if (retry) {
    const t = toTime(retry, now);
    if (t && t > now && t - now <= MAX_AHEAD) return t;
  }
  let best = 0;
  for (const [k, v] of entries) {
    if (!/reset/i.test(k)) continue;
    const t = toTime(v, now);
    if (t && t > now && t - now <= MAX_AHEAD && t > best) best = t; // latest reset = when everything is free again
  }
  return best;
}

/** The rate-limit related headers of a response, as JSON (kept with 429 calls, B-037). */
export function limitHeaders(headers: Headers): string {
  const out: Record<string, string> = {};
  for (const [k, v] of headers.entries()) if (/ratelimit|retry|reset|quota|limit/i.test(k)) out[k] = v;
  return Object.keys(out).length ? JSON.stringify(out) : "";
}

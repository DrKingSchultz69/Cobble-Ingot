import { homedir } from "node:os";
import { join } from "node:path";

export const PORT = Number(process.env.MM_PORT ?? 4141);
export const HOST = "127.0.0.1";
export const DATA_DIR = process.env.MM_DATA_DIR ?? join(homedir(), ".mm");
export const DB_PATH = join(DATA_DIR, "mm.db");

// Path prefix on the proxy -> upstream base URL.
export const UPSTREAMS: Record<string, string> = {
  anthropic: "https://api.anthropic.com",
  openai: "https://api.openai.com",
  openrouter: "https://openrouter.ai/api",
  // Codex signed in with a ChatGPT plan talks to this backend, not api.openai.com.
  chatgpt: "https://chatgpt.com/backend-api/codex",
};

// USD per 1M tokens [input, output]. Matched by substring on the model name, first hit wins.
// Edit freely; unknown models log tokens with cost 0.
export const PRICES: Array<[string, number, number]> = [
  ["opus", 15, 75],
  ["sonnet", 3, 15],
  ["haiku", 1, 5],
  ["gpt-5-mini", 0.25, 2],
  ["gpt-5", 1.25, 10],
  ["o4-mini", 1.1, 4.4],
];

// Cache reads bill at 10% of input, cache writes at 125% (Anthropic 5-min cache).
export function costFor(model: string, inTok: number, outTok: number, cacheRead = 0, cacheWrite = 0): number {
  const m = model.toLowerCase();
  const hit = PRICES.find(([k]) => m.includes(k));
  if (!hit) return 0;
  const [, pin, pout] = hit;
  return (inTok * pin + outTok * pout + cacheRead * pin * 0.1 + cacheWrite * pin * 1.25) / 1_000_000;
}

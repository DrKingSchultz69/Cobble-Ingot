import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import { openDb, usageSummary } from "../src/db.ts";
import { authKind, createProxy, fallbackFor, modelFromRequest, route } from "../src/proxy.ts";

test("authKind tells subscription from api key", () => {
  assert.equal(authKind("anthropic", { "x-api-key": "sk-ant-api03-x" }), "api_key");
  assert.equal(authKind("anthropic", { authorization: "Bearer sk-ant-oat01-x" }), "subscription");
  assert.equal(authKind("openai", { authorization: "Bearer sk-proj-x" }), "api_key");
  assert.equal(authKind("openai", { authorization: "Bearer eyJhbGci" }), "subscription");
  assert.equal(authKind("chatgpt", {}), "subscription");
  assert.equal(authKind("openrouter", { authorization: "Bearer sk-or-x" }), "api_key");
});
import { parseUsage } from "../src/usage.ts";

test("route parses agent tag and provider", () => {
  assert.deepEqual(route("/a/claude~t7/anthropic/v1/messages"), {
    agent: "claude",
    task: "t7",
    provider: "anthropic",
    upstream: "https://api.anthropic.com/v1/messages",
  });
  assert.equal(route("/a/x/nope/v1")?.provider, undefined);
});

test("parseUsage: anthropic SSE", () => {
  const sse = [
    'data: {"type":"message_start","message":{"model":"claude-sonnet-5-5","usage":{"input_tokens":120,"output_tokens":1}}}',
    'data: {"type":"message_delta","usage":{"output_tokens":45}}',
  ].join("\n");
  assert.deepEqual(parseUsage(sse), { model: "claude-sonnet-5-5", input: 120, output: 45, cacheRead: 0, cacheWrite: 0 });
});

test("parseUsage: openai chat JSON and responses SSE", () => {
  assert.deepEqual(parseUsage('{"model":"gpt-5","usage":{"prompt_tokens":10,"completion_tokens":5}}'), {
    model: "gpt-5", input: 10, output: 5, cacheRead: 0, cacheWrite: 0,
  });
  const sse = 'data: {"type":"response.completed","response":{"model":"gpt-5","usage":{"input_tokens":7,"output_tokens":3}}}\ndata: [DONE]';
  assert.deepEqual(parseUsage(sse), { model: "gpt-5", input: 7, output: 3, cacheRead: 0, cacheWrite: 0 });
});

test("parseUsage + cost: anthropic cache tokens billed separately", async () => {
  const { costFor } = await import("../src/config.ts");
  const u = parseUsage('{"model":"claude-opus-5-5","usage":{"input_tokens":10,"cache_read_input_tokens":350000,"cache_creation_input_tokens":2000,"output_tokens":50}}');
  assert.deepEqual(u, { model: "claude-opus-5-5", input: 10, output: 50, cacheRead: 350000, cacheWrite: 2000 });
  // 10*15 + 50*75 + 350000*1.5 + 2000*18.75 = 566400 -> $0.5664
  assert.equal(costFor(u.model, u.input, u.output, u.cacheRead, u.cacheWrite).toFixed(4), "0.5664");
});

test("parseUsage: openai cached tokens split out of input", () => {
  const u = parseUsage('{"model":"gpt-5","usage":{"prompt_tokens":100,"completion_tokens":5,"prompt_tokens_details":{"cached_tokens":80}}}');
  assert.deepEqual(u, { model: "gpt-5", input: 20, output: 5, cacheRead: 80, cacheWrite: 0 });
});

test("parseUsage: responses SSE where an early event lacks cached details (B-008)", () => {
  const sse = [
    'data: {"type":"response.in_progress","response":{"model":"gpt-x","usage":{"input_tokens":13181,"output_tokens":0}}}',
    'data: {"type":"response.completed","response":{"model":"gpt-x","usage":{"input_tokens":13181,"input_tokens_details":{"cached_tokens":5888},"output_tokens":5}}}',
  ].join("\n");
  assert.deepEqual(parseUsage(sse), { model: "gpt-x", input: 7293, output: 5, cacheRead: 5888, cacheWrite: 0 });
});

test("parseUsage: OpenRouter reported cost is kept", () => {
  const u = parseUsage('{"model":"google/gemini-flash","usage":{"prompt_tokens":544,"completion_tokens":3,"cost":0.00042}}');
  assert.equal(u.reportedCost, 0.00042);
});

test("proxy forwards, streams back and logs usage", async () => {
  const fake = createServer((req, res) => {
    assert.equal(req.headers["x-api-key"], "k");
    res.writeHead(200, { "content-type": "text/event-stream" });
    res.write('data: {"type":"message_start","message":{"model":"claude-haiku-4-5","usage":{"input_tokens":1000000}}}\n\n');
    res.end('data: {"type":"message_delta","usage":{"output_tokens":1000000}}\n\n');
  }).listen(0);
  const fakeUrl = `http://127.0.0.1:${(fake.address() as AddressInfo).port}`;

  const db = openDb(":memory:");
  const proxy = createProxy(db, { anthropic: fakeUrl, openai: fakeUrl, openrouter: fakeUrl, chatgpt: fakeUrl }).listen(0);
  const port = (proxy.address() as AddressInfo).port;

  const res = await fetch(`http://127.0.0.1:${port}/a/claude/anthropic/v1/messages`, {
    method: "POST",
    headers: { "x-api-key": "k", "content-type": "application/json" },
    body: "{}",
  });
  assert.match(await res.text(), /message_delta/);

  const rows = usageSummary(db, 0) as Array<Record<string, unknown>>;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].agent, "claude");
  assert.equal(rows[0].model, "claude-haiku-4-5");
  assert.equal(rows[0].cost_usd, 6); // 1M in * $1 + 1M out * $5

  proxy.close();
  fake.close();
});

test("modelFromRequest reads the model from a JSON body (B-005)", () => {
  assert.equal(modelFromRequest(Buffer.from('{"model":"claude-opus-5-5","messages":[]}')), "claude-opus-5-5");
  assert.equal(modelFromRequest(Buffer.from("not json")), "");
  assert.equal(modelFromRequest(undefined), "");
});

test("fallbackFor only with MM_FALLBACK_* keys; chatgpt maps to /v1 path", () => {
  assert.equal(fallbackFor("anthropic", {}), undefined);
  assert.equal(fallbackFor("anthropic", { ANTHROPIC_API_KEY: "x" }), undefined);
  const fb = fallbackFor("chatgpt", { MM_FALLBACK_OPENAI_KEY: "sk-x" })!;
  assert.equal(fb.provider, "openai");
  assert.equal(fb.upstreamPath("/responses"), "/v1/responses");
});

test("proxy fails over from subscription 429 to API key and logs both calls", async () => {
  const seen: string[] = [];
  const fake = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      seen.push(`${req.headers["x-api-key"] ? "key" : "oauth"}:${JSON.parse(body).model}`);
      if (!req.headers["x-api-key"]) {
        res.writeHead(429, { "content-type": "application/json" }).end('{"type":"error"}');
        return;
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end('{"model":"claude-sonnet-5-5","usage":{"input_tokens":100,"output_tokens":10}}');
    });
  }).listen(0);
  const url = `http://127.0.0.1:${(fake.address() as AddressInfo).port}`;
  const db = openDb(":memory:");
  const proxy = createProxy(db, { anthropic: url, openai: url, openrouter: url, chatgpt: url }, { MM_FALLBACK_ANTHROPIC_KEY: "sk-ant-api03-fb" }).listen(0);
  const port = (proxy.address() as AddressInfo).port;

  const res = await fetch(`http://127.0.0.1:${port}/a/claude~t1/anthropic/v1/messages`, {
    method: "POST",
    headers: { authorization: "Bearer sk-ant-oat01-sub", "content-type": "application/json" },
    body: '{"model":"claude-sonnet-5-5"}',
  });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("x-mm-failover"), "api_key");
  await res.text();
  assert.deepEqual(seen, ["oauth:claude-sonnet-5-5", "key:claude-sonnet-5-5"]);
  const rows = db.prepare("SELECT auth, status, model, task FROM calls ORDER BY id").all() as Array<Record<string, unknown>>;
  assert.deepEqual(rows.map((r) => `${r.auth}/${r.status}/${r.model}/${r.task}`), [
    "subscription/429/claude-sonnet-5-5/t1",
    "api_key/200/claude-sonnet-5-5/t1",
  ]);
  proxy.close();
  fake.close();
});

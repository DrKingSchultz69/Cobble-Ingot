import assert from "node:assert/strict";
import { test } from "node:test";
import { classify, decide } from "../src/router.ts";

const all = { claude: true, codex: true, opencode: true, openrouter: true };
const none = { outcomes: {}, rateLimited: {} };

test("classify picks categories from keywords", () => {
  assert.equal(classify("Fix the crash when login fails").category, "debug");
  assert.equal(classify("Design the architecture for payments").category, "plan");
  assert.equal(classify("fix a typo in the readme").category, "docs");
  assert.equal(classify("add a settings page with tailwind").category, "frontend");
  assert.equal(classify("make it work").category, "code");
});

test("planning goes to Opus, quick fixes to a cheap model", () => {
  assert.equal(decide("Plan the architecture of the sync engine", { availability: all, history: none }).candidate.id, "claude-opus");
  assert.equal(decide("quick rename of a variable, small change", { availability: all, history: none }).candidate.id, "claude-haiku");
});

test("subscription beats paid API on a tie", () => {
  const d = decide("write unit tests for utils", { availability: all, history: none });
  assert.notEqual(d.candidate.auth, "api_key");
});

test("rate-limited agent is pushed down", () => {
  const free = decide("Fix the failing build error", { availability: all, history: none });
  assert.equal(free.candidate.agent, "claude");
  const limited = decide("Fix the failing build error", { availability: all, history: { outcomes: {}, rateLimited: { claude: 4 } } });
  assert.equal(limited.candidate.agent, "codex");
  assert.match(limited.reason, /rate-limited recently: claude/);
});

test("past failures lower a candidate", () => {
  const h = { outcomes: { "claude-opus": { ok: 0, total: 6 } }, rateLimited: {} };
  assert.notEqual(decide("Fix the failing build error", { availability: all, history: h }).candidate.id, "claude-opus");
});

test("only available agents are considered", () => {
  const d = decide("Plan the architecture", { availability: { claude: false, codex: true, opencode: false, openrouter: false }, history: none });
  assert.equal(d.candidate.agent, "codex");
  assert.throws(() => decide("x", { availability: { claude: false, codex: false, opencode: false, openrouter: false }, history: none }));
});

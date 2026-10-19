// Fake agent for Forecast's test copy (MM_FAKE_AGENTS=echo): it starts like an agent and answers every line
// with the same text, so testing Netheron never runs a real Claude / Codex or uses plan limits.
import { createInterface } from "node:readline";

const prompt = process.argv.slice(2).join(" ").trim();
process.stdout.write("Echo agent (Forecast test copy). I repeat what you type.\r\n");
if (prompt) process.stdout.write(`echo: ${prompt}\r\n`);
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: !!process.stdin.isTTY, prompt: "> " });
rl.prompt();
rl.on("line", (line) => {
  if (line.trim()) process.stdout.write(`echo: ${line.trim()}\r\n`);
  rl.prompt();
});
rl.on("close", () => process.exit(0));

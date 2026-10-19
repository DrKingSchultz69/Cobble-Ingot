import { networkAccess } from "./devices.ts";
import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";
import { mountResearch } from "../../research/src/routes.ts";
import { commandLine, launchFor } from "./agents.ts";
import { loadToken } from "./auth.ts";
import { HOST, PORT, UI_PORT } from "./config.ts";
import { openDb, usageSummary } from "./db.ts";
import { createProxy } from "./proxy.ts";
import { createPreviewServer, createWorkspaceServer } from "./server.ts";
import { mainRepoRootSync } from "./worktree.ts";


const PREVIEW_PORT = Number(process.env.MM_PREVIEW_PORT ?? 4143);

const [cmd, ...rest] = process.argv.slice(2);

async function proxyUp(): Promise<boolean> {
  try {
    return (await fetch(`http://${HOST}:${PORT}/health`)).ok;
  } catch {
    return false;
  }
}

function lanIp(): string | undefined {
  for (const list of Object.values(networkInterfaces())) {
    for (const a of list ?? []) if (a.family === "IPv4" && !a.internal && !a.address.startsWith("169.254.")) return a.address;
  }
  return undefined;
}

switch (cmd) {
  case "serve": {
    // --lan, or "Network access" turned on in Devices (saved), lets paired phones reach this PC.
    const lan = rest.includes("--lan") || networkAccess();
    const bind = lan ? "0.0.0.0" : "127.0.0.1";
    const db = openDb();
    const token = loadToken();
    // The model proxy never leaves localhost: it forwards credentials and has no auth of its own.
    createProxy(db).listen(PORT, HOST, () => console.log(`proxy      http://${HOST}:${PORT}`));
    const { server, tasks, forecast } = createWorkspaceServer({ db, token, previewPort: PREVIEW_PORT, extend: (api) => mountResearch(api, db) });
    server.listen(UI_PORT, bind, () => {
      console.log(`workspace  http://localhost:${UI_PORT}/?token=${token}`);
      if (lan) {
        const ip = lanIp();
        console.log(ip ? `phone      http://${ip}:${UI_PORT}/?token=${token}   (same Wi-Fi)` : "phone      no LAN address found");
      }
    });
    createPreviewServer(token, [PORT, UI_PORT, PREVIEW_PORT]).listen(PREVIEW_PORT, bind, () => console.log(`preview    http://localhost:${PREVIEW_PORT}  (pick a port in the Preview tab)`));
    const shutdown = () => {
      Promise.all([forecast.dispose(), tasks.dispose()]).finally(() => process.exit(0));
      setTimeout(() => process.exit(0), 4000).unref(); // never hang on Ctrl+C
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    break;
  }

  case "tunnel": {
    // Phone access from anywhere through a Cloudflare quick tunnel (free, no account).
    const token = loadToken();
    const port = rest[0] === "preview" ? PREVIEW_PORT : UI_PORT;
    const cf = spawn("cloudflared", ["tunnel", "--no-autoupdate", "--url", `http://127.0.0.1:${port}`], { stdio: ["ignore", "pipe", "pipe"] });
    cf.on("error", () => {
      console.error("cloudflared is not installed. Install it with:\n  winget install --id Cloudflare.cloudflared\nor use `mm serve --lan` on the same Wi-Fi.");
      process.exit(1);
    });
    const onData = (d: Buffer) => {
      const m = String(d).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (m) console.log(port === UI_PORT ? `phone      ${m[0]}/?token=${token}` : `preview    ${m[0]}/__mm/target?port=<dev-port>&token=${token}`);
    };
    cf.stdout.on("data", onData);
    cf.stderr.on("data", onData);
    break;
  }

  case "token": {
    console.log(`http://localhost:${UI_PORT}/?token=${loadToken()}`);
    break;
  }

  case "run": {
    const [agent, ...args] = rest;
    if (!(await proxyUp())) {
      console.error(`Proxy not running. Start it first: npm run serve`);
      process.exit(1);
    }
    const l = launchFor(agent, args, { project: mainRepoRootSync(process.cwd()), memory: process.env.MM_NO_MEMORY !== "1", lean: process.env.MM_LEAN === "1" });
    // One quoted command line with shell:true so Windows resolves .cmd shims (B-009).
    const child = spawn(commandLine(l), { stdio: "inherit", shell: true, env: { ...process.env, ...l.env } });
    child.on("exit", (code) => process.exit(code ?? 0));
    break;
  }

  case "usage": {
    const hours = Number(rest[0] ?? 24);
    const rows = usageSummary(openDb(), Date.now() - hours * 3600_000);
    if (rows.length === 0) console.log(`No calls in the last ${hours}h.`);
    else console.table(rows);
    break;
  }

  default:
    console.log(`Netheron — multimodel workspace (command: mm)

  mm serve [--lan]            start proxy (:${PORT}), workspace UI (:${UI_PORT}) and build preview (:${PREVIEW_PORT})
                              --lan also listens on your Wi-Fi address so your phone can connect
  mm tunnel [preview]         expose the workspace (or preview) to your phone from anywhere via cloudflared
  mm token                    print the workspace link with its access token
  mm run <claude|codex|opencode|shell> [args]   launch an agent in this folder through the proxy + shared memory
  mm usage [hours=24]         tokens and cost per agent/model

  env: MM_LEAN=1 (Claude loads only mm memory MCP), MM_FALLBACK_ANTHROPIC_KEY / MM_FALLBACK_OPENAI_KEY (429 failover),
       TAVILY_API_KEY / BRAVE_API_KEY (better web search), MM_LLM=claude-cli|codex-cli|openrouter|anthropic`);
}

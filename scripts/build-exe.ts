// Builds dist/Netheron/ (Netheron.exe + runtime\node.exe + app\) and dist/Netheron-win-x64.zip.
// Usage: node scripts/build-exe.ts
// Needs only what is already here: this Node, the installed node_modules, and the C# compiler
// that ships with Windows (.NET Framework 4). Copy or unzip the folder anywhere and run Netheron.exe.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DIST = join(ROOT, "dist");
const OUT = join(DIST, "Netheron");
const APP = join(OUT, "app");
const CSC = join(process.env.WINDIR ?? "C:\\Windows", "Microsoft.NET", "Framework64", "v4.0.30319", "csc.exe");

if (process.platform !== "win32") throw new Error("The .exe build runs on Windows only.");
if (!existsSync(CSC)) throw new Error(`C# compiler not found at ${CSC} (.NET Framework 4 is part of Windows 10/11).`);

console.log("clean", relative(ROOT, OUT));
rmSync(OUT, { recursive: true, force: true });
mkdirSync(APP, { recursive: true });

// --- app files: what `node packages/daemon/src/cli.ts serve` needs, without tests or dev scripts
const skip = (p: string) => {
  const r = relative(ROOT, p).split(sep);
  return r[0] === "packages" && r.includes("test") || r.includes(".cache") || r[0] === "node_modules" && (r[1] === ".bin" || r[1] === "@mm");
};
for (const part of ["package.json", "LICENSE", "apps/web", "packages", "node_modules"]) {
  const from = join(ROOT, part);
  if (!existsSync(from)) continue;
  cpSync(from, join(APP, part), { recursive: true, filter: (p) => !skip(p) });
  console.log("copy", part);
}

// --- runtime: this exact Node (the app needs >= 24 for .ts files)
mkdirSync(join(OUT, "runtime"));
cpSync(process.execPath, join(OUT, "runtime", "node.exe"));
console.log("copy node", process.version);

// --- icon: the N tile from apps/web/icon.svg, drawn here so the build needs no image tools
const ico = join(DIST, "netheron.ico");
writeFileSync(ico, makeIco([16, 24, 32, 48, 64, 256]));

// --- launcher
const exe = join(OUT, "Netheron.exe");
execFileSync(CSC, ["/nologo", "/target:winexe", "/optimize+", `/win32icon:${ico}`, `/out:${exe}`,
  "/r:System.Windows.Forms.dll", "/r:System.Drawing.dll", join(ROOT, "scripts", "launcher", "Netheron.cs")], { stdio: "inherit" });
console.log("built", relative(ROOT, exe));

writeFileSync(join(OUT, "README.txt"), [
  "Netheron",
  "",
  "Double-click Netheron.exe. It starts the server, opens the workspace in its own window,",
  "and stays in the tray (bottom right) while agents work.",
  "Right-click the tray icon to open the window again, see the log, or quit.",
  "Quit stops the server and every agent it started.",
  "",
  "Keep this whole folder together: runtime\\ is Node, app\\ is Netheron.",
  "Your tasks, memory and settings live in %USERPROFILE%\\.mm (shared with start-netheron.cmd).",
  "Agents (claude, codex, ...) still need to be installed and signed in on this PC.",
  "",
].join("\r\n"));

// --- zip for sharing (tar.exe ships with Windows 10+)
const zip = join(DIST, "Netheron-win-x64.zip");
rmSync(zip, { force: true });
// Windows' own bsdtar by full path: Git Bash puts GNU tar (no zip support, no C: paths) first on PATH.
execFileSync(join(process.env.WINDIR ?? "C:\\Windows", "System32", "tar.exe"), ["-a", "-c", "-f", basename(zip), basename(OUT)], { cwd: DIST, stdio: "inherit" });
console.log(`zip ${relative(ROOT, zip)} (${(statSync(zip).size / 1048576).toFixed(0)} MB)`);

// ---------------------------------------------------------------- tiny ICO painter
// Rounded tile in the accent colour with a dark "N", 4x4 supersampled. ICO entries hold PNGs.
function makeIco(sizes: number[]): Buffer {
  const pngs = sizes.map((s) => png(s, paint(s)));
  const head = Buffer.alloc(6 + 16 * sizes.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
  let off = head.length;
  sizes.forEach((s, i) => {
    const e = 6 + 16 * i;
    head[e] = s >= 256 ? 0 : s; head[e + 1] = s >= 256 ? 0 : s;
    head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(pngs[i].length, e + 8); head.writeUInt32LE(off, e + 12);
    off += pngs[i].length;
  });
  return Buffer.concat([head, ...pngs]);
}

function paint(size: number): Buffer {
  const tile = [0x7c, 0x9c, 0xff], ink = [0x0d, 0x0f, 0x12];
  // Shapes in a 64-unit box (same as icon.svg): tile r=14; "N" as two stems and a diagonal.
  const inTile = (x: number, y: number) => {
    const r = 14, cx = Math.min(Math.max(x, r), 64 - r), cy = Math.min(Math.max(y, r), 64 - r);
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  };
  const stem = 7.5, top = 15, bot = 49, l = 17, rr = 47;
  const inN = (x: number, y: number) => {
    if (y < top || y > bot) return false;
    if (x >= l && x <= l + stem) return true;
    if (x >= rr - stem && x <= rr) return true;
    // diagonal band from top-left stem to bottom-right stem
    const t = (y - top) / (bot - top), cx = l + stem / 2 + t * (rr - l - stem);
    return Math.abs(x - cx) <= stem * 0.62;
  };
  const N = 4, px = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) for (let qx = 0; qx < size; qx++) {
    let a = 0, n = 0;
    for (let sy = 0; sy < N; sy++) for (let sx = 0; sx < N; sx++) {
      const x = ((qx + (sx + 0.5) / N) / size) * 64, y = ((py + (sy + 0.5) / N) / size) * 64;
      if (inTile(x, y)) { a++; if (inN(x, y)) n++; }
    }
    const i = (py * size + qx) * 4, k = a ? n / a : 0;
    for (let c = 0; c < 3; c++) px[i + c] = Math.round(tile[c] * (1 - k) + ink[c] * k);
    px[i + 3] = Math.round((a / (N * N)) * 255);
  }
  return px;
}

function png(size: number, rgba: Buffer): Buffer {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
  return Buffer.concat([len, td, crc]);
}

function crc32(b: Buffer): number {
  let c = ~0;
  for (const x of b) { c ^= x; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); }
  return ~c;
}

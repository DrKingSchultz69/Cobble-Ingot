// Account profiles (P13): several logins per agent side by side (work, personal…). Each profile gets its own
// config folder, so each stays signed in; tasks pick a profile, and projects can remember their default.
import { mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { DATA_DIR } from "./config.ts";

export type Profile = { id: string; agent: string; name: string; env: Record<string, string>; created: number };
const PROFILE_AGENTS = ["claude", "codex", "opencode"];

export function ensureProfileSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY, agent TEXT NOT NULL, name TEXT NOT NULL, env TEXT NOT NULL DEFAULT '{}', created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS project_profiles (project TEXT NOT NULL, agent TEXT NOT NULL, profile TEXT NOT NULL, PRIMARY KEY (project, agent));
  `);
}

export const profileDir = (id: string, root = DATA_DIR) => join(root, "profiles", id);

/** The environment that points each CLI at the profile's own config folder. */
export function baseEnv(agent: string, dir: string): Record<string, string> {
  switch (agent) {
    case "claude": return { CLAUDE_CONFIG_DIR: join(dir, "claude") };
    case "codex": return { CODEX_HOME: join(dir, "codex") };
    case "opencode": return { XDG_DATA_HOME: join(dir, "data"), XDG_CONFIG_HOME: join(dir, "config") };
    default: return {};
  }
}

/** The command that signs a CLI in (typed into the profile's shell). */
export function loginCommand(agent: string): string {
  return { claude: "claude", codex: "codex login", opencode: "opencode auth login" }[agent] ?? "";
}

const row = (r: Record<string, unknown>): Profile => ({ id: String(r.id), agent: String(r.agent), name: String(r.name), env: JSON.parse(String(r.env || "{}")), created: Number(r.created) });

export function listProfiles(db: DatabaseSync): Profile[] {
  return (db.prepare("SELECT * FROM profiles ORDER BY agent, name").all() as Record<string, unknown>[]).map(row);
}

export function getProfile(db: DatabaseSync, id: string): Profile | undefined {
  const r = db.prepare("SELECT * FROM profiles WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return r ? row(r) : undefined;
}

export function createProfile(db: DatabaseSync, agent: string, name: string, extraEnv: Record<string, string> = {}, root = DATA_DIR): Profile {
  if (!PROFILE_AGENTS.includes(agent)) throw new Error(`profiles are for ${PROFILE_AGENTS.join(", ")}`);
  const clean = name.trim();
  if (!clean) throw new Error("name the profile (e.g. work, personal)");
  if (db.prepare("SELECT 1 FROM profiles WHERE agent = ? AND name = ?").get(agent, clean)) throw new Error(`a ${agent} profile called "${clean}" already exists`);
  for (const k of Object.keys(extraEnv)) if (!/^[A-Z_][A-Z0-9_]*$/i.test(k)) throw new Error(`bad environment variable name: ${k}`);
  const id = `${agent}-${clean.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "p"}-${Date.now().toString(36)}`;
  const dir = profileDir(id, root);
  const env = { ...baseEnv(agent, dir), ...extraEnv };
  for (const v of Object.values(baseEnv(agent, dir))) mkdirSync(v, { recursive: true });
  db.prepare("INSERT INTO profiles (id, agent, name, env, created) VALUES (?, ?, ?, ?, ?)").run(id, agent, clean, JSON.stringify(env), Date.now());
  return getProfile(db, id)!;
}

export function deleteProfile(db: DatabaseSync, id: string, root = DATA_DIR): void {
  db.prepare("DELETE FROM profiles WHERE id = ?").run(id);
  db.prepare("DELETE FROM project_profiles WHERE profile = ?").run(id);
  const dir = profileDir(id, root);
  if (resolve(dir).startsWith(resolve(join(root, "profiles")))) rmSync(dir, { recursive: true, force: true });
}

export function setProjectProfile(db: DatabaseSync, project: string, agent: string, profile: string): void {
  if (!profile) db.prepare("DELETE FROM project_profiles WHERE project = ? AND agent = ?").run(resolve(project), agent);
  else db.prepare("INSERT INTO project_profiles (project, agent, profile) VALUES (?, ?, ?) ON CONFLICT(project, agent) DO UPDATE SET profile = excluded.profile").run(resolve(project), agent, profile);
}

export function projectProfiles(db: DatabaseSync, project: string): Record<string, string> {
  const rows = db.prepare("SELECT agent, profile FROM project_profiles WHERE project = ?").all(resolve(project)) as Array<{ agent: string; profile: string }>;
  return Object.fromEntries(rows.map((r) => [r.agent, r.profile]));
}

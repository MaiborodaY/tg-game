import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const TOWER_DEFENSE_BUILD_PLACEHOLDER = "__TD_APP_VERSION__";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultGameDir = resolve(scriptDir, "..");

export function parseTowerDefenseAppVersion(source) {
  const parsed = JSON.parse(source);
  const version = typeof parsed?.version === "string" ? parsed.version.trim() : "";
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
    throw new Error("Tower Defense version.json must contain a numeric semantic version");
  }
  return version;
}

export function createBuildFingerprint(entries) {
  const hash = createHash("sha256");
  const normalized = entries
    .map((entry) => ({
      path: String(entry.path).replaceAll("\\", "/"),
      content: entry.content,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));

  for (const entry of normalized) {
    hash.update(entry.path);
    hash.update("\0");
    hash.update(entry.content);
    hash.update("\0");
  }
  return `b${hash.digest("hex").slice(0, 8)}`;
}

export function readCiBuildId(env) {
  for (const value of [env?.CF_PAGES_COMMIT_SHA, env?.GITHUB_SHA]) {
    const sha = typeof value === "string" ? value.trim().toLowerCase() : "";
    if (/^[0-9a-f]{8,40}$/.test(sha)) return `g${sha.slice(0, 8)}`;
  }
  return null;
}

export function createTowerDefenseBuildInfo({ version, env = {}, entries }) {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
    throw new Error("Tower Defense app version must be a numeric semantic version");
  }
  const buildId = readCiBuildId(env) ?? createBuildFingerprint(entries);
  return Object.freeze({ version, buildId, label: `v${version} · ${buildId}` });
}

export function readTowerDefenseBuildInfo({ gameDir = defaultGameDir, env = process.env } = {}) {
  const repositoryDir = resolve(gameDir, "..");
  const version = parseTowerDefenseAppVersion(readFileSync(resolve(gameDir, "version.json"), "utf8"));
  const inputPaths = [
    resolve(gameDir, "index.html"),
    resolve(gameDir, "src"),
    resolve(gameDir, "version.json"),
    resolve(gameDir, "vite.config.ts"),
    resolve(gameDir, "scripts/app-version.mjs"),
    resolve(repositoryDir, "package.json"),
    resolve(repositoryDir, "package-lock.json"),
  ];
  const entries = inputPaths
    .flatMap(collectFiles)
    .map((path) => ({ path: relative(repositoryDir, path), content: readFileSync(path) }));
  return createTowerDefenseBuildInfo({ version, env, entries });
}

function collectFiles(path) {
  if (statSync(path).isFile()) return [path];
  return readdirSync(path, { withFileTypes: true })
    .flatMap((entry) => collectFiles(resolve(path, entry.name)));
}

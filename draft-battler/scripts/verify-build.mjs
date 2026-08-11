import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { assertNoAuthoringAssetsInBuild } from "./build-asset-policy.mjs";
import { getDynamicPublicAssetPaths, readRuntimeAssetContract } from "./runtime-asset-contract.mjs";

const repoRoot = process.cwd();
const buildRoot = path.resolve(repoRoot, "workers", "draft-battler-pvp", "dist", "client");
const runtimeAssetContract = await readRuntimeAssetContract(
  path.join(repoRoot, "draft-battler", "runtime-assets.json"),
);
const requiredPublicAssets = [
  "assets/ui/cards/frames/card-frame-common.svg",
  "assets/ui/cards/frames/card-frame-uncommon.svg",
  "assets/ui/cards/frames/card-frame-rare.svg",
  "assets/ui/cards/medallions/card-medallion-common.svg",
  "assets/ui/cards/medallions/card-medallion-uncommon.svg",
  "assets/ui/cards/medallions/card-medallion-rare.svg",
  ...getDynamicPublicAssetPaths(runtimeAssetContract).map((assetPath) => `assets/${assetPath}`),
];

await assertFile("index.html");
await Promise.all(requiredPublicAssets.map(assertFile));

const files = await listFiles(buildRoot);
const relativeFiles = new Set(files.map((filePath) => normalizePath(path.relative(buildRoot, filePath))));
assertNoAuthoringAssetsInBuild(relativeFiles);
const jsFiles = [...relativeFiles].filter((filePath) => filePath.endsWith(".js"));
const cssFiles = [...relativeFiles].filter((filePath) => filePath.endsWith(".css"));

if (jsFiles.length === 0 || cssFiles.length === 0) {
  throw new Error("Draft Battler build must contain JavaScript and CSS bundles.");
}

const indexHtml = await readFile(path.join(buildRoot, "index.html"), "utf8");
const documentReferences = [...indexHtml.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)]
  .map((match) => normalizeDocumentReference(match[1]))
  .filter(Boolean);

for (const reference of documentReferences) {
  if (!relativeFiles.has(reference)) {
    throw new Error(`index.html references a missing build file: ${reference}`);
  }
}

for (const filePath of files) {
  const fileStat = await stat(filePath);
  if (fileStat.size === 0) {
    throw new Error(`Draft Battler build contains an empty file: ${normalizePath(path.relative(buildRoot, filePath))}`);
  }
}

const imageFiles = files.filter((filePath) => /\.(?:avif|jpe?g|png|svg|webp)$/i.test(filePath));
for (const imageFile of imageFiles) {
  await assertValidImage(imageFile);
}

const totalBytes = (await Promise.all(files.map(async (filePath) => (await stat(filePath)).size)))
  .reduce((total, size) => total + size, 0);

console.log(`Verified Draft Battler build: ${files.length} files, ${formatBytes(totalBytes)}.`);

async function assertFile(relativePath) {
  const filePath = path.join(buildRoot, relativePath);
  try {
    await access(filePath);
  } catch {
    throw new Error(`Draft Battler build is missing required file: ${relativePath}`);
  }
}

async function assertValidImage(filePath) {
  try {
    await sharp(filePath).raw().toBuffer();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Draft Battler build contains an invalid image (${normalizePath(path.relative(buildRoot, filePath))}): ${message}`,
      { cause: error },
    );
  }
}

async function listFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const filePath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(filePath));
    } else if (entry.isFile()) {
      files.push(filePath);
    }
  }

  return files;
}

function normalizeDocumentReference(reference) {
  if (/^(?:https?:|data:|#)/i.test(reference)) {
    return undefined;
  }

  return normalizePath(reference.replace(/^\.\//, "").replace(/^\//, "").replace(/[?#].*$/, ""));
}

function normalizePath(value) {
  return value.replaceAll("\\", "/");
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

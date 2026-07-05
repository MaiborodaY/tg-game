import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const repoRoot = process.cwd();
const assetRoots = readPathArgs("--assets-root", [
  path.join(repoRoot, "draft-battler", "src", "assets"),
  path.join(repoRoot, "draft-battler", "public", "assets"),
]);
const sourceRoot = readPathArg("--source-root", path.join(repoRoot, "draft-battler", "src"));
const topLimit = readNumberArg("--top", 30);
const largeSideLimit = readNumberArg("--large-side", 1024);
const assetExtensions = new Set([".avif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);
const sourceExtensions = new Set([".css", ".html", ".js", ".mjs", ".ts", ".tsx"]);

const assetFiles = (
  await Promise.all(
    assetRoots.map(async (root) => (
      await listFiles(root, (filePath) => assetExtensions.has(path.extname(filePath).toLowerCase()))
    ).map((filePath) => ({ filePath, root }))),
  )
).flat();
const sourceFiles = [
  ...await listFiles(sourceRoot, (filePath) => sourceExtensions.has(path.extname(filePath).toLowerCase())),
  path.join(repoRoot, "draft-battler", "index.html"),
].filter((filePath, index, files) => files.indexOf(filePath) === index);

const references = await collectAssetReferences(sourceFiles, assetFiles);
const records = await Promise.all(assetFiles.map((assetFile) => createAssetRecord(assetFile, references)));
records.sort(compareAssetRecords);

const referencedAssets = records.filter((record) => record.referenced);
const unreferencedAssets = records.filter((record) => !record.referenced);
const sourceLikeAssets = records.filter((record) => record.sourceLike);
const largeReferencedAssets = referencedAssets.filter((record) => Math.max(record.width ?? 0, record.height ?? 0) > largeSideLimit);
const missingReferences = [...references.keys()]
  .filter((reference) => !records.some((record) => record.assetPath === reference))
  .sort();

console.log(`Assets roots: ${assetRoots.map(formatPath).join(", ")}`);
console.log(`Source root: ${formatPath(sourceRoot)}`);
console.log(`Scanned asset files: ${records.length}`);
console.log(`Referenced assets: ${referencedAssets.length}`);
console.log(`Unreferenced assets: ${unreferencedAssets.length}`);
console.log(`Source-like assets in scan root: ${sourceLikeAssets.length}`);
console.log(`Referenced file size: ${formatBytes(sum(referencedAssets, (record) => record.fileBytes))}`);
console.log(`Referenced raster decoded memory: ${formatBytes(sum(referencedAssets, (record) => record.decodedBytes))}`);
console.log(`Asset files on disk: ${formatBytes(sum(records, (record) => record.fileBytes))}`);
console.log(`Referenced assets over ${largeSideLimit}px side: ${largeReferencedAssets.length}`);

if (missingReferences.length > 0) {
  console.log("");
  console.log("Missing referenced assets");
  missingReferences.forEach((reference) => console.log(`- ${reference}`));
}

printSection(
  `Top ${Math.min(topLimit, referencedAssets.length)} referenced raster assets by decoded memory`,
  referencedAssets
    .filter((record) => record.decodedBytes > 0)
    .slice(0, topLimit)
    .map(toOutputRow),
);

printSection(
  `Referenced assets over ${largeSideLimit}px side`,
  largeReferencedAssets.map(toOutputRow),
);

printSection(
  `Top ${Math.min(topLimit, sourceLikeAssets.length)} source-like assets`,
  sourceLikeAssets.slice(0, topLimit).map(toOutputRow),
);

printSection(
  `Top ${Math.min(topLimit, unreferencedAssets.length)} unreferenced assets`,
  unreferencedAssets.slice(0, topLimit).map(toOutputRow),
);

async function createAssetRecord({ filePath, root }, references) {
  const relativePath = formatPath(path.relative(repoRoot, filePath));
  const assetPath = formatPath(path.relative(root, filePath));
  const fileStat = await stat(filePath);
  const extension = path.extname(filePath).toLowerCase().slice(1);
  const metadata = await readImageMetadata(filePath);
  const width = metadata?.width;
  const height = metadata?.height;
  const isRaster = extension !== "svg";
  const decodedBytes = isRaster && width && height ? width * height * 4 : 0;
  const referenceSources = [...(references.get(assetPath) ?? [])].sort();

  return {
    assetPath,
    decodedBytes,
    extension,
    fileBytes: fileStat.size,
    height,
    path: relativePath,
    referenced: referenceSources.length > 0,
    referenceSources,
    sourceLike: isSourceLikeAsset(assetPath),
    width,
  };
}

async function collectAssetReferences(files, assetFiles) {
  const references = new Map();
  const assetPaths = assetFiles.map(({ filePath, root }) => formatPath(path.relative(root, filePath)));
  const assetPathSet = new Set(assetPaths);

  for (const filePath of files) {
    const content = await readFile(filePath, "utf8");
    const sourceLabel = formatPath(path.relative(repoRoot, filePath));
    const assetPathPattern = /\/?(assets\/[A-Za-z0-9_./-]+\.(?:avif|jpeg|jpg|png|svg|webp)(?:\?[^"'`)\s;]*)?)/g;
    let match;

    while ((match = assetPathPattern.exec(content))) {
      addReference(references, normalizeRuntimeAssetPath(match[1]), sourceLabel);
    }

    if (content.includes("getUnitCardAssetPath")) {
      for (const assetPath of [...references.keys()]) {
        const unitMatch = assetPath.match(/^units\/([^/]+)\/unit\.png$/);
        if (unitMatch) {
          addReference(references, `units/${unitMatch[1]}/card.png`, `${sourceLabel} derived card path`);
        }
      }
    }

    if (content.includes("assets/ui/cards/abilities/ability-${abilityId}.svg")) {
      addFamilyReferences(references, assetPaths, /^ui\/cards\/abilities\/ability-.+\.svg$/, `${sourceLabel} dynamic ability icon`);
    }

    if (content.includes("assets/ui/cards/archetypes/archetype-${archetype}.svg")) {
      addFamilyReferences(references, assetPaths, /^ui\/cards\/archetypes\/archetype-.+\.svg$/, `${sourceLabel} dynamic archetype icon`);
    }
  }

  for (const assetPath of [...references.keys()]) {
    if (!assetPathSet.has(assetPath)) {
      references.set(assetPath, references.get(assetPath) ?? new Set());
    }
  }

  return references;
}

function addFamilyReferences(references, assetPaths, pattern, sourceLabel) {
  assetPaths
    .filter((assetPath) => pattern.test(assetPath))
    .forEach((assetPath) => addReference(references, assetPath, sourceLabel));
}

function addReference(references, assetPath, sourceLabel) {
  if (!assetPath) {
    return;
  }

  const sources = references.get(assetPath) ?? new Set();
  sources.add(sourceLabel);
  references.set(assetPath, sources);
}

function normalizeRuntimeAssetPath(value) {
  return value
    .replace(/\\/g, "/")
    .replace(/^\/?assets\//, "")
    .replace(/[?#].*$/, "");
}

async function readImageMetadata(filePath) {
  if (path.extname(filePath).toLowerCase() === ".svg") {
    return undefined;
  }

  try {
    return await sharp(filePath).metadata();
  } catch {
    return undefined;
  }
}

async function listFiles(root, predicate) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath, predicate));
    } else if (entry.isFile() && predicate(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function isSourceLikeAsset(assetPath) {
  return /(^|\/)(unit-raw|pose-sheet|pose-sheet-raw|preview-sheet)\./.test(assetPath) ||
    assetPath.includes("/frames/");
}

function compareAssetRecords(left, right) {
  return right.decodedBytes - left.decodedBytes || right.fileBytes - left.fileBytes || left.path.localeCompare(right.path);
}

function toOutputRow(record) {
  return {
    decoded: record.decodedBytes > 0 ? formatBytes(record.decodedBytes) : "-",
    dimensions: record.width && record.height ? `${record.width}x${record.height}` : "-",
    file: formatBytes(record.fileBytes),
    referenced: record.referenced ? "yes" : "no",
    source: record.sourceLike ? "yes" : "no",
    path: record.path,
  };
}

function printSection(title, rows) {
  console.log("");
  console.log(title);
  printRows(rows);
}

function printRows(rows) {
  if (rows.length === 0) {
    console.log("(none)");
    return;
  }

  const headers = Object.keys(rows[0]);
  const widths = headers.map((header) => Math.max(header.length, ...rows.map((row) => String(row[header]).length)));

  console.log(headers.map((header, index) => header.padEnd(widths[index])).join("  "));
  console.log(widths.map((width) => "-".repeat(width)).join("  "));

  for (const row of rows) {
    console.log(headers.map((header, index) => String(row[header]).padEnd(widths[index])).join("  "));
  }
}

function readPathArg(name, fallback) {
  const value = process.argv.find((argument) => argument.startsWith(`${name}=`));
  return value ? path.resolve(repoRoot, value.slice(name.length + 1)) : fallback;
}

function readPathArgs(name, fallback) {
  const values = process.argv
    .filter((argument) => argument.startsWith(`${name}=`))
    .map((argument) => path.resolve(repoRoot, argument.slice(name.length + 1)));

  return values.length > 0 ? values : fallback;
}

function readNumberArg(name, fallback) {
  const value = process.argv.find((argument) => argument.startsWith(`${name}=`));

  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value.slice(name.length + 1), 10);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function sum(items, getValue) {
  return items.reduce((total, item) => total + getValue(item), 0);
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatPath(filePath) {
  return filePath.replace(/\\/g, "/");
}

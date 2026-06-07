import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const repoRoot = process.cwd();
const assetsRoot = path.join(repoRoot, "gladiator-arena", "public", "assets");
const topLimit = readNumberArg("--top", 40);
const largeSideLimit = readNumberArg("--large-side", 1024);
const imageExtensions = new Set([".avif", ".jpeg", ".jpg", ".png", ".webp"]);

const imageFiles = await listImageFiles(assetsRoot);
const records = [];

for (const filePath of imageFiles) {
  const [metadata, fileStat] = await Promise.all([sharp(filePath).metadata(), stat(filePath)]);

  if (!metadata.width || !metadata.height) {
    continue;
  }

  records.push({
    decodedBytes: metadata.width * metadata.height * 4,
    extension: path.extname(filePath).toLowerCase().slice(1),
    fileBytes: fileStat.size,
    height: metadata.height,
    logicalPath: path.relative(assetsRoot, filePath).replace(/\.[^.]+$/, ""),
    path: path.relative(repoRoot, filePath),
    width: metadata.width,
  });
}

const logicalAssets = Array.from(groupBy(records, (record) => record.logicalPath).values()).map((variants) => {
  const preferred = variants.find((variant) => variant.extension === "webp") ?? variants[0];

  return {
    decodedBytes: preferred.decodedBytes,
    fileBytes: preferred.fileBytes,
    height: preferred.height,
    path: preferred.path,
    variants: variants.map((variant) => variant.extension).sort().join("+"),
    width: preferred.width,
  };
});

logicalAssets.sort((left, right) => right.decodedBytes - left.decodedBytes || right.fileBytes - left.fileBytes);

const totalSourceFileBytes = sum(records, (record) => record.fileBytes);
const totalPreferredFileBytes = sum(logicalAssets, (asset) => asset.fileBytes);
const totalDecodedBytes = sum(logicalAssets, (asset) => asset.decodedBytes);
const largeAssets = logicalAssets.filter((asset) => Math.max(asset.width, asset.height) > largeSideLimit);

console.log(`Scanned image files: ${records.length}`);
console.log(`Logical assets: ${logicalAssets.length}`);
console.log(`Source files on disk: ${formatBytes(totalSourceFileBytes)}`);
console.log(`Preferred runtime files: ${formatBytes(totalPreferredFileBytes)}`);
console.log(`Preferred decoded memory: ${formatBytes(totalDecodedBytes)}`);
console.log(`Assets over ${largeSideLimit}px side: ${largeAssets.length}`);
console.log("");
console.log(`Top ${Math.min(topLimit, logicalAssets.length)} logical assets by decoded memory`);
printRows(
  logicalAssets.slice(0, topLimit).map((asset) => ({
    decoded: formatBytes(asset.decodedBytes),
    dimensions: `${asset.width}x${asset.height}`,
    file: formatBytes(asset.fileBytes),
    variants: asset.variants,
    path: asset.path,
  })),
);

if (largeAssets.length > 0) {
  console.log("");
  console.log(`Assets over ${largeSideLimit}px side`);
  printRows(
    largeAssets.map((asset) => ({
      decoded: formatBytes(asset.decodedBytes),
      dimensions: `${asset.width}x${asset.height}`,
      file: formatBytes(asset.fileBytes),
      path: asset.path,
    })),
  );
}

async function listImageFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      files.push(...await listImageFiles(fullPath));
    } else if (entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

function groupBy(items, getKey) {
  const groups = new Map();

  for (const item of items) {
    const key = getKey(item);
    const group = groups.get(key);

    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  }

  return groups;
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

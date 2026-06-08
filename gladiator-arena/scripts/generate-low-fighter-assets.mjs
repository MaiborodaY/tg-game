/* global console, process */

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const repoRoot = process.cwd();
const sourceRoot = path.join(repoRoot, "gladiator-arena", "src", "assets", "fighters");
const outputRoot = path.join(repoRoot, "gladiator-arena", "src", "assets-low", "fighters");
const maxSide = readNumberArg("--max-side", 640);
const quality = readNumberArg("--quality", 84);

const webpFiles = await listFiles(sourceRoot, ".webp");
let runtimeTotal = 0;
let lowTotal = 0;

console.log(`Source root: ${path.relative(repoRoot, sourceRoot)}`);
console.log(`Output root: ${path.relative(repoRoot, outputRoot)}`);
console.log(`Max side: ${maxSide}px`);

for (const sourcePath of webpFiles) {
  const source = await readFile(sourcePath);
  const relativePath = path.relative(sourceRoot, sourcePath);
  const webpPath = path.join(outputRoot, relativePath);
  const webp = await sharp(source)
    .resize({
      fit: "inside",
      height: maxSide,
      width: maxSide,
      withoutEnlargement: true,
    })
    .webp({
      alphaQuality: 100,
      effort: 6,
      quality,
      smartSubsample: true,
    })
    .toBuffer();

  await mkdir(path.dirname(webpPath), { recursive: true });
  await writeFile(webpPath, webp);

  runtimeTotal += source.byteLength;
  lowTotal += webp.byteLength;

  console.log(`${path.relative(repoRoot, sourcePath)} -> ${path.relative(repoRoot, webpPath)} ${formatBytes(webp.byteLength)}`);
}

console.log(`Total runtime WebP ${formatBytes(runtimeTotal)} -> low WebP ${formatBytes(lowTotal)}`);

async function listFiles(root, extension) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath, extension));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(extension)) {
      files.push(fullPath);
    }
  }

  return files;
}

function readNumberArg(name, fallback) {
  const value = process.argv.find((argument) => argument.startsWith(`${name}=`));

  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value.slice(name.length + 1), 10);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

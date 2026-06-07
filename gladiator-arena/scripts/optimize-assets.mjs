import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const repoRoot = process.cwd();
const assetsRoot = path.join(repoRoot, "gladiator-arena", "public", "assets");
const quality = Number.parseFloat(process.argv[2] ?? "0.86");
const webpQuality = Math.round(quality <= 1 ? quality * 100 : quality);

const pngFiles = await listFiles(assetsRoot, ".png");
let originalTotal = 0;
let webpTotal = 0;

for (const pngPath of pngFiles) {
  const png = await readFile(pngPath);
  const webpPath = pngPath.replace(/\.png$/i, ".webp");
  const webp = await sharp(png)
    .webp({
      alphaQuality: 100,
      effort: 6,
      quality: webpQuality,
      smartSubsample: true,
    })
    .toBuffer();

  await writeFile(webpPath, webp);
  originalTotal += png.byteLength;
  webpTotal += webp.byteLength;

  console.log(`${path.relative(repoRoot, pngPath)} ${formatBytes(png.byteLength)} -> ${formatBytes(webp.byteLength)}`);
}

console.log(`Total ${formatBytes(originalTotal)} -> ${formatBytes(webpTotal)}`);

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

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

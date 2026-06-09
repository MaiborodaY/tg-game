import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const repoRoot = process.cwd();
const assetsRoot = readAssetsRoot();
const quality = readQualityArg();
const targetFile = readTargetFileArg();
const webpQuality = Math.round(quality <= 1 ? quality * 100 : quality);
const resizeRules = [
  { maxSide: 768, pattern: /^fighters\/bodies\// },
  { maxSide: 768, pattern: /^fighters\/body-parts\/head\// },
  { maxSide: 768, pattern: /^fighters\/body-parts\/torso\// },
  { maxSide: 768, pattern: /^fighters\/armor\/helmet\// },
  { maxSide: 512, pattern: /^fighters\/body-parts\/arms\// },
  { maxSide: 512, pattern: /^fighters\/body-parts\/legs\// },
  { maxSide: 512, pattern: /^fighters\/armor\/arms\// },
  { maxSide: 512, pattern: /^fighters\/armor\/breastplate\// },
  { maxSide: 512, pattern: /^fighters\/armor\/legs\// },
  { maxSide: 512, pattern: /^fighters\/weapons\// },
];

const pngFiles = targetFile ? [targetFile] : await listFiles(assetsRoot, ".png");
let originalTotal = 0;
let webpTotal = 0;

console.log(`Assets root: ${path.relative(repoRoot, assetsRoot)}`);

for (const pngPath of pngFiles) {
  if (path.extname(pngPath).toLowerCase() !== ".png") {
    console.log(`Skipping non-PNG file: ${path.relative(repoRoot, pngPath)}`);
    continue;
  }

  const png = await readFile(pngPath);
  const webpPath = pngPath.replace(/\.png$/i, ".webp");
  const relativePngPath = path.relative(assetsRoot, pngPath).replaceAll(path.sep, "/");
  const maxSide = getResizeMaxSide(relativePngPath);
  const pipeline = sharp(png);

  if (maxSide) {
    pipeline.resize({
      fit: "inside",
      height: maxSide,
      width: maxSide,
      withoutEnlargement: true,
    });
  }

  const webp = await pipeline
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

function getResizeMaxSide(relativePath) {
  const rule = resizeRules.find((resizeRule) => resizeRule.pattern.test(relativePath));

  return rule?.maxSide;
}

function readAssetsRoot() {
  const value = process.argv.find((argument) => argument.startsWith("--assets-root="));

  if (!value) {
    return path.join(repoRoot, "gladiator-arena", "src", "assets");
  }

  return path.resolve(repoRoot, value.slice("--assets-root=".length));
}

function readQualityArg() {
  const namedQuality = process.argv.find((argument) => argument.startsWith("--quality="));
  const rawQuality = namedQuality?.slice("--quality=".length) ?? process.argv.slice(2).find((argument) => !argument.startsWith("--")) ?? "0.86";
  const parsedQuality = Number.parseFloat(rawQuality);

  return Number.isFinite(parsedQuality) ? parsedQuality : 0.86;
}

function readTargetFileArg() {
  const value = process.argv.find((argument) => argument.startsWith("--file="));
  if (!value) {
    return null;
  }

  const resolvedPath = path.resolve(repoRoot, value.slice("--file=".length));
  return path.normalize(resolvedPath);
}

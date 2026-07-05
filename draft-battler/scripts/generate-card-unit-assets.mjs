import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const UNITS_ROOT = path.resolve("draft-battler/public/assets/units");
const PREVIEW_PATH = path.resolve(".tmp/draft-battler-card-unit-preview.png");

const ALPHA_THRESHOLD = 12;
const CARD_WIDTH = 512;
const CARD_HEIGHT = 768;
const CONTENT_MAX_WIDTH = 492;
const CONTENT_MAX_HEIGHT = 660;
const CONTENT_BASELINE_Y = 730;

async function listUnitDirs() {
  const entries = await fs.readdir(UNITS_ROOT, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(UNITS_ROOT, entry.name))
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
}

async function getAlphaBounds(inputPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width;
  let top = info.height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + 3] ?? 0;
      if (alpha <= ALPHA_THRESHOLD) {
        continue;
      }

      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < 0 || bottom < 0) {
    return undefined;
  }

  return {
    left,
    top,
    width: right - left + 1,
    height: bottom - top + 1,
    sourceWidth: info.width,
    sourceHeight: info.height,
  };
}

async function generateCardPortrait(unitDir) {
  const unitName = path.basename(unitDir);
  const inputPath = path.join(unitDir, "unit.png");
  const outputPath = path.join(unitDir, "card.png");
  const bounds = await getAlphaBounds(inputPath);

  if (!bounds) {
    throw new Error(`No visible pixels found in ${inputPath}`);
  }

  const scale = Math.min(CONTENT_MAX_WIDTH / bounds.width, CONTENT_MAX_HEIGHT / bounds.height);
  const resizedWidth = Math.max(1, Math.round(bounds.width * scale));
  const resizedHeight = Math.max(1, Math.round(bounds.height * scale));
  const left = Math.round((CARD_WIDTH - resizedWidth) / 2);
  const top = Math.round(CONTENT_BASELINE_Y - resizedHeight);

  const portrait = await sharp(inputPath)
    .extract({
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
    })
    .resize(resizedWidth, resizedHeight, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: portrait, left, top }])
    .png()
    .toFile(outputPath);

  return {
    unitName,
    outputPath,
    source: `${bounds.sourceWidth}x${bounds.sourceHeight}`,
    bounds: `${bounds.left},${bounds.top} ${bounds.width}x${bounds.height}`,
    portrait: `${left},${top} ${resizedWidth}x${resizedHeight}`,
  };
}

async function writePreview(results) {
  const tileWidth = 132;
  const tileHeight = 198;
  const columns = 4;
  const rows = Math.ceil(results.length / columns);
  const composites = [];

  for (const [index, result] of results.entries()) {
    const input = await sharp(result.outputPath).resize(tileWidth, tileHeight, { fit: "contain" }).png().toBuffer();
    const x = (index % columns) * tileWidth;
    const y = Math.floor(index / columns) * tileHeight;
    composites.push({ input, left: x, top: y });
  }

  await fs.mkdir(path.dirname(PREVIEW_PATH), { recursive: true });
  await sharp({
    create: {
      width: columns * tileWidth,
      height: rows * tileHeight,
      channels: 4,
      background: { r: 10, g: 13, b: 10, alpha: 1 },
    },
  })
    .composite(composites)
    .png()
    .toFile(PREVIEW_PATH);
}

const unitDirs = await listUnitDirs();
const results = [];
for (const unitDir of unitDirs) {
  results.push(await generateCardPortrait(unitDir));
}

await writePreview(results);

console.table(
  results.map(({ unitName, source, bounds, portrait }) => ({
    unit: unitName,
    source,
    bounds,
    portrait,
  })),
);
console.log(`Generated ${results.length} card portraits.`);
console.log(`Preview: ${path.relative(process.cwd(), PREVIEW_PATH)}`);

import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

export const CARD_ART_ALPHA_THRESHOLD = 12;
export const CARD_ART_SAFETY_PADDING = 2;
const gameRoot = fileURLToPath(new URL("../", import.meta.url));
const defaultUnitsRoot = path.join(gameRoot, "src", "assets", "units");
const metadataPath = path.join(gameRoot, "src", "card-art-bounds.json");

export function scanCardArtBounds(data, info) {
  const { width, height, channels } = info;
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1 || channels !== 4) {
    throw new Error("Card art must decode to a positive-size RGBA image.");
  }
  if (data.length !== width * height * channels) {
    throw new Error("Card art RGBA data does not match its dimensions.");
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * channels + 3] <= CARD_ART_ALPHA_THRESHOLD) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < 0) throw new Error("Card art has no visible silhouette.");

  // Preserve antialiased edges without letting near-transparent authoring noise set the scale.
  const left = Math.max(0, minX - CARD_ART_SAFETY_PADDING);
  const top = Math.max(0, minY - CARD_ART_SAFETY_PADDING);
  const right = Math.min(width, maxX + CARD_ART_SAFETY_PADDING + 1);
  const bottom = Math.min(height, maxY + CARD_ART_SAFETY_PADDING + 1);
  return { sourceWidth: width, sourceHeight: height, left, top, width: right - left, height: bottom - top };
}

export async function readCardArtBounds(imagePath) {
  const { data, info } = await sharp(imagePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return scanCardArtBounds(data, info);
}

export async function collectCardArtBounds(unitsRoot = defaultUnitsRoot) {
  const directories = (await readdir(unitsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const pairs = await Promise.all(directories.map(async (cardId) => [
    cardId,
    await readCardArtBounds(path.join(unitsRoot, cardId, "card.webp")),
  ]));
  return Object.fromEntries(pairs);
}

export function serializeCardArtBounds(bounds) {
  return `${JSON.stringify(bounds, null, 2)}\n`;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((argument) => argument !== "--check")) {
    throw new Error("Usage: node draft-battler/scripts/generate-card-art-bounds.mjs [--check]");
  }
  const bounds = await collectCardArtBounds();
  const serialized = serializeCardArtBounds(bounds);
  if (args.includes("--check")) {
    const existing = await readFile(metadataPath, "utf8");
    if (existing.replaceAll("\r\n", "\n") !== serialized) {
      throw new Error("Card art bounds are stale. Run node draft-battler/scripts/generate-card-art-bounds.mjs.");
    }
    console.log(`Card art bounds verified for ${Object.keys(bounds).length} cards.`);
    return;
  }
  await writeFile(metadataPath, serialized);
  console.log(`Card art bounds generated for ${Object.keys(bounds).length} cards; images were not changed.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}

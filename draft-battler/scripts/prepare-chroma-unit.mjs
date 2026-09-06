import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

/** Technical extraction for art authored against magenta, not general-purpose background segmentation. */
export function removeMagentaMatte(input, width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || input.length !== width * height * 4) {
    throw new Error("Expected a non-empty RGBA raster.");
  }
  const output = Buffer.from(input);
  const distance = new Uint8Array(width * height).fill(255);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  for (let index = 0; index < distance.length; index += 1) {
    const offset = index * 4;
    const dominance = Math.min(input[offset], input[offset + 2]) - input[offset + 1];
    if (dominance >= 140) {
      distance[index] = 0;
      queue[tail++] = index;
    }
  }
  if (tail < distance.length * 0.05) {
    throw new Error("Expected a clearly visible magenta matte; refusing to key an unrelated image.");
  }
  // Only unmix the immediate edge. Interior purples and skin remain untouched.
  const enqueue = (index, nextDistance) => {
    if (distance[index] <= nextDistance) return;
    distance[index] = nextDistance;
    queue[tail++] = index;
  };
  while (head < tail) {
    const index = queue[head++];
    if (distance[index] >= 3) continue;
    const next = distance[index] + 1;
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) enqueue(index - 1, next);
    if (x + 1 < width) enqueue(index + 1, next);
    if (y > 0) enqueue(index - width, next);
    if (y + 1 < height) enqueue(index + width, next);
  }
  for (let index = 0; index < distance.length; index += 1) {
    if (distance[index] > 3) continue;
    const offset = index * 4;
    const dominance = Math.min(input[offset], input[offset + 2]) - input[offset + 1];
    const alpha = Math.max(0, Math.min(1, (140 - dominance) / 120));
    if (alpha === 1) continue;
    output[offset + 3] = Math.round(input[offset + 3] * alpha);
    if (output[offset + 3] === 0) {
      output.fill(0, offset, offset + 4);
      continue;
    }
    // Generated matte pixels are not numerically uniform. Inverse color subtraction amplifies that
    // noise into green fringes, so feathered edge pixels borrow the nearest uncontaminated color.
    const edgeColor = findCleanEdgeColor(input, width, height, index);
    output[offset] = edgeColor[0];
    output[offset + 1] = edgeColor[1];
    output[offset + 2] = edgeColor[2];
  }
  return output;
}

function findCleanEdgeColor(input, width, height, index) {
  const x = index % width;
  const y = Math.floor(index / width);
  let closestDistance = Infinity;
  let closestOffset;
  for (let dy = -6; dy <= 6; dy += 1) {
    for (let dx = -6; dx <= 6; dx += 1) {
      const nextX = x + dx;
      const nextY = y + dy;
      if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) continue;
      const offset = (nextY * width + nextX) * 4;
      const distance = dx * dx + dy * dy;
      if (distance >= closestDistance || input[offset + 3] < 128 || Math.min(input[offset], input[offset + 2]) - input[offset + 1] > 20) continue;
      closestDistance = distance;
      closestOffset = offset;
    }
  }
  if (closestOffset !== undefined) return [...input.subarray(closestOffset, closestOffset + 3)];
  const offset = index * 4;
  const green = input[offset + 1];
  return [Math.min(input[offset], green + 20), green, Math.min(input[offset + 2], green + 20)];
}

export function getVisibleBounds(data, width, height) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] <= 12) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left || bottom < top) throw new Error("No visible character remains after extraction.");
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

export async function prepareChromaUnit(inputPath, outputPath) {
  if (path.resolve(inputPath) === path.resolve(outputPath)) throw new Error("Keep the generated original; use a separate output path.");
  if (path.extname(outputPath).toLowerCase() !== ".png") throw new Error("Authoring output must be PNG.");
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width < 512 || info.height < 512 || info.width > 1536 || info.height > 1536) {
    throw new Error("Authoring canvas must be between 512 and 1536 pixels per side.");
  }
  const keyed = removeMagentaMatte(data, info.width, info.height);
  const bounds = getVisibleBounds(keyed, info.width, info.height);
  const { data: cutout, info: cutoutInfo } = await sharp(keyed, { raw: info }).extract(bounds)
    .resize({ width: Math.floor(info.width * 0.94), height: Math.floor(info.height * 0.9), fit: "inside" })
    .png().toBuffer({ resolveWithObject: true });
  const left = Math.round((info.width - cutoutInfo.width) / 2);
  const top = Math.round(info.height * 0.96) - cutoutInfo.height;
  await mkdir(path.dirname(outputPath), { recursive: true });
  await sharp({ create: { width: info.width, height: info.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: cutout, left, top }]).png().toFile(outputPath);
  return { width: info.width, height: info.height, bounds, preparedBounds: { left, top, width: cutoutInfo.width, height: cutoutInfo.height } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const inputPath = process.argv.find((value) => value.startsWith("--input="))?.slice(8);
  const outputPath = process.argv.find((value) => value.startsWith("--output="))?.slice(9);
  if (!inputPath || !outputPath) throw new Error("Usage: --input=<generated.png> --output=<prepared-unit.png>");
  console.log(JSON.stringify(await prepareChromaUnit(inputPath, outputPath)));
}

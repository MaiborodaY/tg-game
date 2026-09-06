import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { getVisibleBounds, removeMagentaMatte } from "./prepare-chroma-unit.mjs";

const COLUMNS = 5;
const ROWS = 2;
const FRAME_SIZE = 256;
const BASELINE = 236;
const MAX_WIDTH = 220;
const MAX_HEIGHT = 196;

function validateLimits({ maxWidth = MAX_WIDTH, maxHeight = MAX_HEIGHT } = {}) {
  if (!Number.isInteger(maxWidth) || maxWidth < 1 || maxWidth > MAX_WIDTH
    || !Number.isInteger(maxHeight) || maxHeight < 1 || maxHeight > MAX_HEIGHT) {
    throw new Error(`Visible limits must be integers within 1..${MAX_WIDTH} width and 1..${MAX_HEIGHT} height.`);
  }
  return { maxWidth, maxHeight };
}

function isMattePixel(data, offset) {
  return data[offset + 3] >= 243 && Math.min(data[offset], data[offset + 2]) - data[offset + 1] >= 140;
}

function validateBackground(data, width, height, background, frameIndex) {
  let backgroundCount = 0;
  let borderCount = 0;
  let backgroundBorderCount = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const isBackground = background === "alpha" ? data[offset + 3] <= 12 : isMattePixel(data, offset);
      if (isBackground) backgroundCount += 1;
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        borderCount += 1;
        if (isBackground) backgroundBorderCount += 1;
      }
    }
  }
  if (backgroundCount < width * height * 0.05 || backgroundBorderCount < borderCount * 0.95) {
    throw new Error(`Frame ${frameIndex + 1} must have a clear ${background === "alpha" ? "transparent" : "magenta matte"} background and margins; checkerboard removal is not supported.`);
  }
}

function findVisibleComponents(data, width, height) {
  const labels = new Int32Array(width * height);
  const queue = new Int32Array(labels.length);
  const components = [];
  for (let start = 0; start < labels.length; start += 1) {
    if (labels[start] || data[start * 4 + 3] <= 12) continue;
    const id = components.length + 1;
    let head = 0;
    let tail = 1;
    let left = width;
    let top = height;
    let right = 0;
    let bottom = 0;
    let sumX = 0;
    let sumY = 0;
    queue[0] = start;
    labels[start] = id;
    while (head < tail) {
      const index = queue[head++];
      const x = index % width;
      const y = Math.floor(index / width);
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
      sumX += x;
      sumY += y;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nextX = x + dx;
          const nextY = y + dy;
          if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) continue;
          const next = nextY * width + nextX;
          if (labels[next] || data[next * 4 + 3] <= 12) continue;
          labels[next] = id;
          queue[tail++] = next;
        }
      }
    }
    components.push({
      id, area: tail, pixels: queue.slice(0, tail), center: { x: sumX / tail, y: sumY / tail },
      bounds: { left, top, width: right - left + 1, height: bottom - top + 1 },
    });
  }
  return { labels, components };
}

function nearestBody(component, bodyAtPixel, width, height, maxDistance, ambiguityMargin) {
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(visited.length);
  let head = 0;
  let tail = component.pixels.length;
  queue.set(component.pixels);
  for (const pixel of component.pixels) visited[pixel] = 1;
  const distances = new Map();
  let nearestDistance = Infinity;
  for (let distance = 0; head < tail && distance <= Math.min(maxDistance, nearestDistance + ambiguityMargin); distance += 1) {
    const end = tail;
    while (head < end) {
      const index = queue[head++];
      const body = bodyAtPixel[index];
      if (body && !distances.has(body)) {
        distances.set(body, distance);
        nearestDistance = Math.min(nearestDistance, distance);
      }
      const x = index % width;
      const y = Math.floor(index / width);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nextX = x + dx;
          const nextY = y + dy;
          if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) continue;
          const next = nextY * width + nextX;
          if (visited[next]) continue;
          visited[next] = 1;
          queue[tail++] = next;
        }
      }
    }
  }
  const candidates = [...distances.entries()].filter(([, distance]) => distance <= nearestDistance + ambiguityMargin);
  return candidates.length === 1 ? candidates[0][0] : undefined;
}

function collectLooseFrames(data, info, background) {
  validateBackground(data, info.width, info.height, background, 0);
  const keyed = background === "alpha" ? data : removeMagentaMatte(data, info.width, info.height);
  const { labels, components } = findVisibleComponents(keyed, info.width, info.height);
  const largestArea = Math.max(0, ...components.map((component) => component.area));
  const majorThreshold = Math.max(100, largestArea * 0.12);
  const bodies = components.filter((component) => component.area >= majorThreshold);
  if (bodies.length !== 10) throw new Error(`Loose grid requires exactly 10 large connected figures; found ${bodies.length}.`);
  const cellWidth = info.width / COLUMNS;
  const cellHeight = info.height / ROWS;
  const rows = [[], []];
  for (const body of bodies) {
    if (body.bounds.height > cellHeight * 1.15 || body.bounds.width > cellWidth * 1.7) {
      throw new Error("Loose grid contains an oversized or merged figure; separate the authored poses first.");
    }
    rows[body.center.y < cellHeight ? 0 : 1].push(body);
  }
  if (rows.some((row) => row.length !== COLUMNS)) throw new Error("Loose grid requires five distinct figures in each row.");
  const orderedBodies = rows.flatMap((row) => row.sort((a, b) => a.center.x - b.center.x));
  const componentOwners = new Uint8Array(components.length + 1);
  const bodyAtPixel = new Uint8Array(info.width * info.height);
  orderedBodies.forEach((body, index) => {
    componentOwners[body.id] = index + 1;
    for (const pixel of body.pixels) bodyAtPixel[pixel] = index + 1;
  });
  const skippedParticles = [];
  const maxParticleArea = Math.max(16, largestArea * 0.002);
  for (const component of components) {
    if (componentOwners[component.id]) continue;
    const owner = nearestBody(component, bodyAtPixel, info.width, info.height, Math.ceil(cellWidth * 0.24), Math.max(2, Math.round(cellWidth * 0.02)));
    if (owner !== undefined) componentOwners[component.id] = owner;
    else if (component.area <= maxParticleArea) skippedParticles.push({ area: component.area, bounds: component.bounds });
    else throw new Error(`Disconnected component (${component.area} pixels) cannot be assigned unambiguously; refusing to drop possible gear or a body part.`);
  }
  const owners = new Uint8Array(labels.length);
  for (let index = 0; index < labels.length; index += 1) owners[index] = componentOwners[labels[index]];
  const featheredOwners = Uint8Array.from(owners);
  // Keep genuine faint edge pixels only within three pixels of their uniquely owned visible contour.
  for (let index = 0; index < owners.length; index += 1) {
    if (owners[index] || keyed[index * 4 + 3] === 0 || keyed[index * 4 + 3] > 12) continue;
    const x = index % info.width;
    const y = Math.floor(index / info.width);
    let nearestDistance = 4;
    let owner = 0;
    for (let dy = -3; dy <= 3; dy += 1) {
      for (let dx = -3; dx <= 3; dx += 1) {
        const nextX = x + dx;
        const nextY = y + dy;
        if (nextX < 0 || nextY < 0 || nextX >= info.width || nextY >= info.height) continue;
        const candidate = owners[nextY * info.width + nextX];
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        if (!candidate || distance > nearestDistance) continue;
        if (distance < nearestDistance) {
          owner = candidate;
          nearestDistance = distance;
        } else if (candidate !== owner) owner = 0;
      }
    }
    featheredOwners[index] = owner;
  }
  const sourceFrames = orderedBodies.map((body, index) => {
    const owned = components.filter((component) => componentOwners[component.id] === index + 1);
    const left = Math.max(0, Math.min(...owned.map((component) => component.bounds.left)) - 3);
    const top = Math.max(0, Math.min(...owned.map((component) => component.bounds.top)) - 3);
    const right = Math.min(info.width, Math.max(...owned.map((component) => component.bounds.left + component.bounds.width)) + 3);
    const bottom = Math.min(info.height, Math.max(...owned.map((component) => component.bounds.top + component.bounds.height)) + 3);
    const cell = { left, top, width: right - left, height: bottom - top };
    const frameData = Buffer.alloc(cell.width * cell.height * 4);
    for (let y = 0; y < cell.height; y += 1) {
      for (let x = 0; x < cell.width; x += 1) {
        const sourceIndex = (top + y) * info.width + left + x;
        if (featheredOwners[sourceIndex] !== index + 1) continue;
        keyed.copy(frameData, (y * cell.width + x) * 4, sourceIndex * 4, sourceIndex * 4 + 4);
      }
    }
    return {
      index, cell, data: frameData, info: { width: cell.width, height: cell.height, channels: 4 },
      bounds: getVisibleBounds(frameData, cell.width, cell.height),
      cropBounds: { left: 0, top: 0, width: cell.width, height: cell.height },
    };
  });
  return { sourceFrames, skippedParticles };
}

/** Repack genuine poses only: preserve their order, proportions, shared scale, and transparent edges. */
export async function prepareUnitPoseSheet(inputPath, outputPath, options = {}) {
  const normalizePath = (value) => process.platform === "win32" ? path.resolve(value).toLowerCase() : path.resolve(value);
  if (normalizePath(inputPath) === normalizePath(outputPath)) {
    throw new Error("Keep the generated original; use a separate output path.");
  }
  if (path.extname(outputPath).toLowerCase() !== ".png") throw new Error("Authoring output must be PNG.");
  const { maxWidth, maxHeight } = validateLimits(options);
  const metadata = await sharp(inputPath).metadata();
  if (metadata.format !== "png") throw new Error("Expected a PNG pose sheet.");
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // Image generators may round the full canvas, e.g. 1984x794, so cell boundaries are proportional.
  if (info.width < COLUMNS * 16 || info.height < ROWS * 16 || Math.abs(info.width / COLUMNS - info.height / ROWS) > 1) {
    throw new Error("Expected a 5x2 grid of square pose cells (canvas ratio 5:2, allowing one-pixel rounding).");
  }
  let transparentCount = 0;
  for (let offset = 3; offset < data.length; offset += 4) {
    if (data[offset] <= 12) transparentCount += 1;
  }
  const background = transparentCount >= info.width * info.height * 0.05 ? "alpha" : "magenta";
  if (options.looseGrid !== undefined && typeof options.looseGrid !== "boolean") throw new Error("looseGrid must be boolean.");
  const loose = options.looseGrid ? collectLooseFrames(data, info, background) : undefined;
  const sourceFrames = loose?.sourceFrames ?? [];
  for (let index = 0; !loose && index < COLUMNS * ROWS; index += 1) {
    const column = index % COLUMNS;
    const row = Math.floor(index / COLUMNS);
    const left = Math.round(column * info.width / COLUMNS);
    const top = Math.round(row * info.height / ROWS);
    const cell = {
      left,
      top,
      width: Math.round((column + 1) * info.width / COLUMNS) - left,
      height: Math.round((row + 1) * info.height / ROWS) - top,
    };
    const { data: frameData, info: frameInfo } = await sharp(data, { raw: info }).extract(cell)
      .raw().toBuffer({ resolveWithObject: true });
    validateBackground(frameData, frameInfo.width, frameInfo.height, background, index);
    const cutout = background === "alpha" ? frameData : removeMagentaMatte(frameData, frameInfo.width, frameInfo.height);
    let bounds;
    try {
      bounds = getVisibleBounds(cutout, frameInfo.width, frameInfo.height);
    } catch (error) {
      throw new Error(`Frame ${index + 1} has no visible pose.`, { cause: error });
    }
    sourceFrames.push({ index, cell, bounds, data: cutout, info: frameInfo });
  }

  // All ten poses share one scale: a fallen figure must not be enlarged to standing height.
  // A padded cutout can gain one visible edge pixel on either side during resampling.
  const resamplingAllowance = loose ? 2 : 0;
  const scale = Math.min(
    Math.max(1, maxWidth - resamplingAllowance) / Math.max(...sourceFrames.map((frame) => frame.bounds.width)),
    Math.max(1, maxHeight - resamplingAllowance) / Math.max(...sourceFrames.map((frame) => frame.bounds.height)),
  );
  const composites = [];
  const frames = [];
  for (const frame of sourceFrames) {
    const cropBounds = frame.cropBounds ?? frame.bounds;
    // Round one axis only; two independently rounded limits can shrink low fallen poses unevenly.
    const resizeDimensions = cropBounds.width >= cropBounds.height
      ? { width: Math.max(1, Math.floor(cropBounds.width * scale)) }
      : { height: Math.max(1, Math.floor(cropBounds.height * scale)) };
    const { data: resized, info: resizedInfo } = await sharp(frame.data, { raw: frame.info }).extract(cropBounds)
      .resize(resizeDimensions).raw().toBuffer({ resolveWithObject: true });
    const visible = getVisibleBounds(resized, resizedInfo.width, resizedInfo.height);
    if (visible.width > maxWidth || visible.height > maxHeight) throw new Error("Resampled pose exceeds its visible limits; refusing to clip the figure.");
    const cutout = await sharp(resized, { raw: resizedInfo }).png().toBuffer();
    const preparedBounds = {
      left: Math.round((FRAME_SIZE - visible.width) / 2),
      top: BASELINE - visible.height,
      width: visible.width,
      height: visible.height,
    };
    composites.push({
      input: cutout,
      left: (frame.index % COLUMNS) * FRAME_SIZE + preparedBounds.left - visible.left,
      top: Math.floor(frame.index / COLUMNS) * FRAME_SIZE + preparedBounds.top - visible.top,
    });
    frames.push({ index: frame.index, sourceCell: frame.cell, sourceBounds: frame.bounds, preparedBounds });
  }
  const width = COLUMNS * FRAME_SIZE;
  const height = ROWS * FRAME_SIZE;
  const output = await sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(composites).png().toBuffer();
  // Validation and all ten frame conversions finish before the output file is touched.
  await mkdir(path.dirname(outputPath), { recursive: true });
  await sharp(output).toFile(outputPath);
  return { width, height, columns: COLUMNS, rows: ROWS, frameWidth: FRAME_SIZE, frameHeight: FRAME_SIZE, baseline: BASELINE, background, scale, frames, ...(loose ? { looseGrid: true, skippedParticles: loose.skippedParticles } : {}) };
}

export function readPoseSheetOptions(args) {
  const accepted = new Set(["input", "output", "max-width", "max-height"]);
  const values = new Map();
  for (const argument of args) {
    if (argument === "--loose-grid" && !values.has("loose-grid")) {
      values.set("loose-grid", true);
      continue;
    }
    const match = /^--([^=]+)=(.+)$/.exec(argument);
    if (!match || !accepted.has(match[1]) || values.has(match[1])) {
      throw new Error("Expected unique --input=, --output=, optional --max-width=, --max-height= and --loose-grid options.");
    }
    values.set(match[1], match[2]);
  }
  if (!values.has("input") || !values.has("output")) {
    throw new Error("Usage: --input=<generated.png> --output=<sprite-sheet.png> [--max-width=220] [--max-height=196] [--loose-grid]");
  }
  const limits = validateLimits({
    maxWidth: values.has("max-width") ? Number(values.get("max-width")) : MAX_WIDTH,
    maxHeight: values.has("max-height") ? Number(values.get("max-height")) : MAX_HEIGHT,
  });
  return { inputPath: values.get("input"), outputPath: values.get("output"), options: { ...limits, ...(values.has("loose-grid") ? { looseGrid: true } : {}) } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const { inputPath, outputPath, options } = readPoseSheetOptions(process.argv.slice(2));
  console.log(JSON.stringify(await prepareUnitPoseSheet(inputPath, outputPath, options)));
}

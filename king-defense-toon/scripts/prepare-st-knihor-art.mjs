import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const archive = new URL('../art/st-knihor/source/', import.meta.url);
const output = new URL('../assets/st-knihor/', import.meta.url);
const sourceNames = {
  down: 'exec-9bf9c6e8-9e13-4895-a2f5-f72fe3f45210.png',
  side: 'exec-7c23fcdb-de6c-4d74-bf32-225b75537a0d.png',
  up: 'exec-001641aa-f619-46c5-901d-9b4c2bb3bb7d.png',
  effects: 'exec-5a890803-8b13-402b-9874-0f7c1b5afd64.png',
  portrait: 'exec-365a1609-05e5-4779-8a7a-149447002d0d.png',
};
const actions = ['idle', 'walk', 'attack', 'cast', 'hit', 'death'];
const anchor = { x: 64, y: 110 };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const decode = bytes => sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  return (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.ceil((sorted.length - 1) / 2)]) / 2;
};

function bounds(image, rect, alphaThreshold = 0) {
  let left = Infinity, top = Infinity, right = -1, bottom = -1, pixels = 0;
  for (let y = rect.y; y < rect.y + rect.height; y++) for (let x = rect.x; x < rect.x + rect.width; x++) {
    if (image.data[(y * image.info.width + x) * 4 + 3] <= alphaThreshold) continue;
    left = Math.min(left, x); top = Math.min(top, y);
    right = Math.max(right, x); bottom = Math.max(bottom, y); pixels++;
  }
  assert.ok(pixels, 'every authored frame must contain visible pixels');
  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1, pixels };
}

function gutterCuts(image, axis, count, region) {
  const length = axis === 'y' ? image.info.height : image.info.width;
  const projection = Array(length).fill(0);
  for (let y = region.y; y < region.y + region.height; y++) for (let x = region.x; x < region.x + region.width; x++) {
    projection[axis === 'y' ? y : x] += image.data[(y * image.info.width + x) * 4 + 3];
  }
  const cuts = [0];
  for (let index = 1; index < count; index++) {
    const nominal = length * index / count;
    const radius = length / count * .22;
    const candidates = [];
    for (let position = Math.ceil(nominal - radius); position <= Math.floor(nominal + radius); position++) candidates.push(position);
    // Generated rows have uneven gutters. Prefer the emptiest seam, then the nearest nominal boundary.
    candidates.sort((a, b) => projection[a] - projection[b] || Math.abs(a - nominal) - Math.abs(b - nominal));
    cuts.push(candidates[0]);
  }
  cuts.push(length);
  return cuts;
}

function analyzeBody(image, kind) {
  const whole = { x: 0, y: 0, width: image.info.width, height: image.info.height };
  const rowCuts = gutterCuts(image, 'y', 6, whole);
  // The up sheet has isolated low-alpha matte pixels in this gutter; assign them to the lower band.
  if (kind === 'up') rowCuts[5] = 1264;
  const columnCuts = [], frames = [];
  for (let row = 0; row < 6; row++) {
    const band = { x: 0, y: rowCuts[row], width: image.info.width, height: rowCuts[row + 1] - rowCuts[row] };
    const cuts = gutterCuts(image, 'x', 4, band);
    columnCuts.push(cuts);
    for (let column = 0; column < 4; column++) {
      const rect = { x: cuts[column], y: band.y, width: cuts[column + 1] - cuts[column], height: band.height };
      frames.push({ index: row * 4 + column, action: actions[row], pose: column, sourceRect: rect,
        sourceBounds: bounds(image, rect), opaqueBounds: bounds(image, rect, 128) });
    }
  }
  const columnAnchors = frames.slice(0, 4).map(frame => {
    const opaque = frame.opaqueBounds;
    const feet = bounds(image, { x: frame.sourceRect.x, y: opaque.y + opaque.height - 14,
      width: frame.sourceRect.width, height: 14 }, 128);
    return feet.x + (feet.width - 1) / 2;
  });
  for (const frame of frames) frame.sourceFootAnchor = {
    // Keep each authored column's horizontal origin fixed through all actions; do not recenter a swinging hammer.
    x: columnAnchors[frame.pose], y: frame.opaqueBounds.y + frame.opaqueBounds.height - 1,
  };
  return { rowCuts, columnCuts, columnAnchors, frames };
}

await mkdir(archive, { recursive: true });
await mkdir(output, { recursive: true });
const sources = {}, images = {}, bodies = {};
for (const [kind, generatedName] of Object.entries(sourceNames)) {
  const archivedName = `st-knihor-${kind}-source.png`;
  const archivedPath = fileURLToPath(new URL(archivedName, archive));
  const sourcePath = process.argv[2] ? resolve(process.argv[2], generatedName) : archivedPath;
  if (sourcePath !== archivedPath) await copyFile(sourcePath, archivedPath);
  const bytes = await readFile(archivedPath);
  const image = await decode(bytes);
  assert.equal(image.info.channels, 4);
  images[kind] = image;
  sources[kind] = { path: `art/st-knihor/source/${archivedName}`, generatedName,
    width: image.info.width, height: image.info.height, bytes: bytes.length, sha256: hash(bytes) };
  if (['down', 'side', 'up'].includes(kind)) {
    assert.equal(image.info.width, 1024);
    assert.equal(image.info.height, 1536);
    bodies[kind] = analyzeBody(image, kind);
  }
}

// One scale for all 72 poses preserves the body size during crouching, hits and death.
let scale = .45;
const envelopes = [];
for (const [kind, { frames }] of Object.entries(bodies)) for (const frame of frames) {
  const { sourceBounds: b, sourceFootAnchor: foot } = frame;
  const allowed = Math.min(62 / Math.max(1, foot.x - b.x), 62 / Math.max(1, b.x + b.width - foot.x),
    108 / Math.max(1, foot.y - b.y), 16 / Math.max(1, b.y + b.height - foot.y));
  envelopes.push({ kind, index: frame.index, allowed, bounds: b, foot });
  scale = Math.min(scale, allowed);
}
scale = Math.floor(scale * 1000) / 1000;
assert.ok(scale >= .4, `unexpected artwork envelope: uniform scale ${scale}; ${JSON.stringify(envelopes.filter(frame => frame.allowed < .4))}`);
const assets = [];
async function saveWebp(name, png, width, height) {
  const original = await decode(png);
  for (let offset = 0; offset < original.data.length; offset += 4) {
    if (!original.data[offset + 3]) original.data.fill(0, offset, offset + 3);
  }
  const bytes = await sharp(original.data, { raw: original.info }).webp({ quality: 92, alphaQuality: 100, effort: 6 }).toBuffer();
  const decoded = await decode(bytes);
  assert.equal(decoded.info.width, width);
  assert.equal(decoded.info.height, height);
  assert.ok(decoded.data.some((value, index) => index % 4 === 3 && value === 0), `${name}: transparent background required`);
  let absoluteError = 0, squaredError = 0, channels = 0;
  for (let offset = 0; offset < original.data.length; offset += 4) {
    assert.equal(decoded.data[offset + 3], original.data[offset + 3], `${name}: alpha changed`);
    if (original.data[offset + 3] > 128) for (let channel = 0; channel < 3; channel++) {
      const error = decoded.data[offset + channel] - original.data[offset + channel];
      absoluteError += Math.abs(error); squaredError += error * error; channels++;
    }
  }
  await writeFile(new URL(name, output), bytes);
  assets.push({ name, width, height, bytes: bytes.length, sha256: hash(bytes), alphaExact: true,
    rgbMetricsAlphaThreshold: 128, rgbMAE: absoluteError / channels,
    rgbPSNR: 10 * Math.log10(255 * 255 / (squaredError / channels)) });
  return decoded;
}

for (const [kind, body] of Object.entries(bodies)) {
  const image = images[kind], composites = [];
  for (const frame of body.frames) {
    const source = frame.sourceBounds, foot = frame.sourceFootAnchor;
    const width = Math.max(1, Math.round(source.width * scale));
    const height = Math.max(1, Math.round(source.height * scale));
    const left = Math.round(anchor.x - (foot.x - source.x) * scale);
    const top = Math.round(anchor.y - (foot.y - source.y) * scale);
    assert.ok(left >= 1 && top >= 1 && left + width <= 127 && top + height <= 127,
      `${kind}/${frame.index}: preserve transparent atlas gutters`);
    const cropped = await sharp(image.data, { raw: image.info })
      .extract({ left: source.x, top: source.y, width: source.width, height: source.height })
      .resize(width, height, { kernel: 'nearest', fit: 'fill' }).png().toBuffer();
    composites.push({ input: cropped, left: frame.pose * 128 + left, top: Math.floor(frame.index / 4) * 128 + top });
    frame.destinationBounds = { x: left, y: top, width, height };
    frame.footAnchor = anchor;
  }
  const png = await sharp({ create: { width: 512, height: 768, channels: 4, background: '#00000000' } })
    .composite(composites).png().toBuffer();
  const packed = await saveWebp(`st-knihor-${kind}.webp`, png, 512, 768);
  for (const frame of body.frames) {
    const rect = { x: frame.pose * 128, y: Math.floor(frame.index / 4) * 128, width: 128, height: 128 };
    frame.runtimeOpaqueBounds = bounds(packed, rect, 128);
    const b = frame.runtimeOpaqueBounds;
    assert.ok(b.x > rect.x && b.y > rect.y && b.x + b.width < rect.x + 128 && b.y + b.height < rect.y + 128,
      `${kind}/${frame.index}: opaque pixels touch a cell boundary`);
  }
}

const effectsPng = await sharp(images.effects.data, { raw: images.effects.info }).resize(512, 512, { kernel: 'nearest' }).png().toBuffer();
const effects = await saveWebp('st-knihor-effects.webp', effectsPng, 512, 512);
const effectFrames = Array.from({ length: 16 }, (_, index) => {
  const rect = { x: index % 4 * 128, y: Math.floor(index / 4) * 128, width: 128, height: 128 };
  return { index, rect, groundAnchor: { x: 64, y: 64 }, bounds: bounds(effects, rect, 32) };
});
const portraitPng = await sharp(images.portrait.data, { raw: images.portrait.info }).resize(128, 128, { kernel: 'nearest' }).png().toBuffer();
await saveWebp('st-knihor-portrait.webp', portraitPng, 128, 128);
const totalBytes = assets.reduce((sum, asset) => sum + asset.bytes, 0);
assert.ok(totalBytes <= 512 * 1024, `${totalBytes} exceeds the 512 KiB runtime budget`);
const idleBodyHeight = median(Object.values(bodies).flatMap(body => body.frames.slice(0, 4).map(frame => frame.runtimeOpaqueBounds.height)));
const provenance = {
  version: 1, recipe: 'scripts/prepare-st-knihor-art.mjs', encoding: 'WebP quality 92, exact lossless alpha',
  quality: 92, alphaQuality: 100, clearedFullyTransparentRGB: true,
  resize: 'nearest neighbour, common body scale; no pose-specific rescaling',
  scale, frameSize: 128, anchor, idleBodyHeight, bodyHeight: idleBodyHeight / 128,
  sources, bodies, effectFrames, assets, totalBytes,
};
await writeFile(new URL('provenance.json', output), `${JSON.stringify(provenance, null, 2)}\n`);
console.log(JSON.stringify({ scale, idleBodyHeight, bodyHeight: idleBodyHeight / 128, assets, totalBytes,
  rowCuts: Object.fromEntries(Object.entries(bodies).map(([kind, body]) => [kind, body.rowCuts])) }, null, 2));

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

// Import the already approved/exported artwork unchanged; generated source PNGs stay out of the game bundle.
const source = resolve(process.argv[2] ?? '../brotd-goblin-healer-assets/art/brotd-infinity/level-01/enemies/goblin-healer');
const destination = new URL('../assets/goblin-healer/', import.meta.url);
const body = JSON.parse(await readFile(resolve(source, 'goblin-healer-768.frames.json'), 'utf8'));
const pulse = JSON.parse(await readFile(resolve(source, 'heal-pulse-256.frames.json'), 'utf8'));
assert.equal(body.frames.length, 16);
assert.equal(pulse.frames.length, 4);
await mkdir(destination, { recursive: true });
const assets = [];
for (const [manifest, name] of [[body, 'goblin-healer.webp'], [pulse, 'heal-pulse.webp']]) {
  const file = resolve(source, manifest.image);
  const bytes = await readFile(file);
  const decoded = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(decoded.info.width, manifest.size.width);
  assert.equal(decoded.info.height, manifest.size.height);
  for (const frame of manifest.frames) {
    const { x, y, width, height } = frame.rect;
    const anchor = frame.footAnchor ?? frame.groundAnchor;
    assert.ok(x >= 0 && y >= 0 && x + width <= decoded.info.width && y + height <= decoded.info.height);
    assert.ok(anchor.x >= 0 && anchor.x < width && anchor.y >= 0 && anchor.y < height);
  }
  await copyFile(file, new URL(name, destination));
  assets.push({ name, source: manifest.image, width: decoded.info.width, height: decoded.info.height,
    bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
const geometry = {
  layout: { columns: 4, rows: 4 }, bodyHeight: 144 / 192,
  sourceRects: Object.fromEntries(body.frames.map(frame => [frame.index, frame.rect])),
  // Renderer pivots are relative to nominal cells; source rectangles have nonuniform gutters.
  centers: body.frames.map(({ index, rect, footAnchor }) => (rect.x + footAnchor.x - index % 4 * 192) / 192),
  baselines: body.frames.map(({ index, rect, footAnchor }) => (rect.y + footAnchor.y - Math.floor(index / 4) * 192) / 192),
};
await writeFile(new URL('geometry.mjs', destination),
  `// Derived from the approved healer frame manifests by prepare-goblin-healer-art.mjs.\nexport const GOBLIN_HEALER_GEOMETRY = Object.freeze(${JSON.stringify(geometry, null, 2)});\nexport const GOBLIN_HEAL_PULSE_FRAMES = Object.freeze(${JSON.stringify(pulse.frames.map(({ rect, groundAnchor }) => ({ rect, groundAnchor })), null, 2)});\n`);
await writeFile(new URL('provenance.json', destination), `${JSON.stringify({ source, assets }, null, 2)}\n`);
console.log(JSON.stringify({ assets, totalBytes: assets.reduce((total, asset) => total + asset.bytes, 0) }, null, 2));

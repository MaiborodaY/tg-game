import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const source = new URL('../art/kitchen/dishes-source.png', import.meta.url);
const directory = new URL('../assets/kitchen/', import.meta.url);
const bytes = await readFile(source), metadata = await sharp(bytes).metadata();
assert.equal(metadata.width / metadata.height, 3 / 2, 'six dishes need a 3 by 2 atlas');
assert.ok(metadata.hasAlpha, 'food must have a transparent background');
// 96px cells cover the 44px menu icons at mobile DPR 2 in one cached request.
const atlas = await sharp(bytes).resize(288, 192, { kernel: 'lanczos3' })
  .webp({ quality: 84, alphaQuality: 100, effort: 6 }).toBuffer();
assert.ok(atlas.length <= 20 * 1024, 'six Kitchen icons must fit within 20 KiB');
await mkdir(directory, { recursive: true });
await writeFile(new URL('dishes.webp', directory), atlas);
const hash = data => createHash('sha256').update(data).digest('hex');
await writeFile(new URL('provenance.json', directory), JSON.stringify({
  generator: 'Built-in image_gen', recipe: 'scripts/prepare-kitchen-art.mjs',
  prompt: 'art/kitchen/PROMPT.md', columns: 3, rows: 2, cellSize: 96,
  source: { path: 'art/kitchen/dishes-source.png', bytes: bytes.length, sha256: hash(bytes) },
  output: { path: 'assets/kitchen/dishes.webp', width: 288, height: 192,
    bytes: atlas.length, sha256: hash(atlas), quality: 84 },
}, null, 2) + '\n');
console.log(`Kitchen atlas: 288 x 192, ${atlas.length} bytes`);

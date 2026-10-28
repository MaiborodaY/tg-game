import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = new URL('../art/hero-talents/talents-source.png', import.meta.url);
const output = new URL('../assets/hero-talents/', import.meta.url);
const bytes = await readFile(source);
const metadata = await sharp(bytes).metadata();
assert.equal(metadata.width / metadata.height, 2, 'six columns by three rows must have square cells');
await mkdir(output, { recursive: true });
// 128 px per icon covers the compact tree and its larger detail preview at mobile DPR.
const atlas = await sharp(bytes).resize(768, 384, { kernel: 'lanczos3' })
  .webp({ quality: 84, effort: 6 }).toBuffer();
// Keep one small atlas for the whole menu, without extra runtime filters or textures.
assert.ok(atlas.length <= 64 * 1024, 'hero talent atlas must stay within the 64 KiB download budget');
await writeFile(new URL('talents.webp', output), atlas);
const hash = value => createHash('sha256').update(value).digest('hex');
const provenance = {
  generator: 'Built-in image_gen', recipe: 'scripts/prepare-talent-art.mjs',
  prompt: 'art/hero-talents/PROMPT.md', columns: 6, rows: 3, cellSize: 128,
  source: { path: 'art/hero-talents/talents-source.png', width: metadata.width,
    height: metadata.height, bytes: bytes.length, sha256: hash(bytes) },
  output: { path: 'assets/hero-talents/talents.webp', width: 768, height: 384,
    bytes: atlas.length, sha256: hash(atlas), quality: 84 },
};
await writeFile(new URL('provenance.json', output), JSON.stringify(provenance, null, 2) + '\n');
console.log(JSON.stringify({ file: fileURLToPath(new URL('talents.webp', output)), bytes: atlas.length, width: 768, height: 384 }));

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const directory = new URL('assets/brand/', root);
const sourcePath = 'promo/world-of-connections/woc-handshake.png';
const faviconPath = 'promo/world-of-connections/woc-favicon-source.png';
const source = await readFile(new URL(sourcePath, root));
const favicon = await readFile(new URL(faviconPath, root));
assert.ok((await sharp(source).metadata()).hasAlpha, 'brand source must retain transparency');
assert.ok((await sharp(favicon).metadata()).hasAlpha, 'favicon source must retain transparency');
await mkdir(directory, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const outputs = [];
async function save(name, pipeline, budget) {
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  assert.ok(data.length <= budget, `${name} exceeds its mobile budget`);
  await writeFile(new URL(name, directory), data);
  outputs.push({ path: `assets/brand/${name}`, width: info.width, height: info.height,
    bytes: data.length, sha256: hash(data) });
  console.log(`${name}: ${info.width} x ${info.height}, ${data.length} bytes`);
}
// Trim only transparent margins. One cached image serves 192px loading and 60px Profile art.
await save('woc-handshake.webp', sharp(source).trim().resize({ width: 384 })
  .webp({ quality: 82, alphaQuality: 100, effort: 6 }), 24 * 1024);
// The favicon has its own simplified artwork; it does not shrink the detailed handshake.
for (const size of [32, 16]) {
  await save(`woc-favicon-${size}.png`, sharp(favicon).trim().resize(size, size, {
    fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'nearest',
  }).png({ palette: true, colors: 16, effort: 10 }), 2 * 1024);
}
await writeFile(new URL('provenance.json', directory), JSON.stringify({
  generator: 'Built-in image_gen', recipe: 'scripts/prepare-brand-art.mjs',
  prompt: 'promo/world-of-connections/PROMPT.md',
  sources: [{ path: sourcePath, bytes: source.length, sha256: hash(source) },
    { path: faviconPath, bytes: favicon.length, sha256: hash(favicon) }], outputs,
}, null, 2) + '\n');

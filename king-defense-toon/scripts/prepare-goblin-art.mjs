import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';

for (const type of ['archer', 'chief']) {
  const source = new URL(`../assets/tiny-goblin-${type}-red-v1.png`, import.meta.url);
  const destination = new URL(`../assets/web/goblin-${type}.webp`, import.meta.url);
  const png = await readFile(source);
  const webp = await sharp(png).webp({ lossless: true, effort: 6 }).toBuffer();
  const decode = image => sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const [before, after] = await Promise.all([decode(png), decode(webp)]);
  assert.equal(before.info.width, 1254);
  assert.equal(before.info.height, 1254);
  assert.equal(after.info.width, before.info.width);
  assert.equal(after.info.height, before.info.height);
  // WebP may discard invisible RGB; all visible color and alpha must remain exact.
  for (let i = 0; i < before.data.length; i += 4) {
    if (before.data[i + 3] === 0) before.data.fill(0, i, i + 3);
    if (after.data[i + 3] === 0) after.data.fill(0, i, i + 3);
}
assert.deepEqual(after.data, before.data);
await mkdir(new URL('./', destination), { recursive: true });
await writeFile(destination, webp);
console.log(`Goblin ${type}: ${png.length} -> ${webp.length} bytes; visible RGBA and dimensions unchanged.`);
}

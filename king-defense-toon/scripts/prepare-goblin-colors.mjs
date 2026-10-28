import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const sourceDirectory = 'C:/Unity/Unity Projects/Bro TD/Assets/Sprites/Tiny Swords2/Tiny Swords (Update 010)/Factions/Goblins/Troops/Torch';
const outputDirectory = new URL('../assets/goblin-colors/', import.meta.url);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const decode = bytes => sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const red = await decode(await readFile(new URL('../assets/tiny-swords-torch-red.png', import.meta.url)));
const report = [];

await mkdir(outputDirectory, { recursive: true });
for (const color of ['Blue', 'Purple', 'Yellow']) {
  const sourcePath = `${sourceDirectory}/${color}/Torch_${color}.png`;
  const filename = `torch-${color.toLowerCase()}.webp`;
  const png = await readFile(sourcePath);
  const webp = await sharp(png).webp({ lossless: true, effort: 6 }).toBuffer();
  const [before, after] = await Promise.all([decode(png), decode(webp)]);
  assert.equal(before.info.width, 1344, `${color}: source width`);
  assert.equal(before.info.height, 960, `${color}: source height`);
  assert.equal(after.info.width, before.info.width, `${color}: width changed`);
  assert.equal(after.info.height, before.info.height, `${color}: height changed`);
  assert.equal(before.data.length, red.data.length, `${color}: existing red geometry differs`);
  for (let offset = 0; offset < before.data.length; offset += 4) {
    assert.equal(after.data[offset + 3], before.data[offset + 3], `${color}: alpha changed at ${offset}`);
    assert.equal(before.data[offset + 3], red.data[offset + 3], `${color}: alpha differs from red at ${offset}`);
    // Lossless WebP may drop invisible RGB; every visible pixel and all alpha must remain exact.
    if (before.data[offset + 3] === 0) {
      before.data.fill(0, offset, offset + 3);
      after.data.fill(0, offset, offset + 3);
    }
  }
  assert.deepEqual(after.data, before.data, `${color}: visible RGBA changed`);
  await writeFile(new URL(filename, outputDirectory), webp);
  report.push({ color, filename, sourcePath, sourceBytes: png.length, bytes: webp.length,
    sourceHash: sha256(png), outputHash: sha256(webp) });
  console.log(`${filename}: ${png.length} -> ${webp.length} bytes; dimensions, alpha and visible RGBA unchanged.`);
}

await writeFile(new URL('SOURCES.md', outputDirectory), `# Native Torch goblin colors

Pixel Frog's authored Tiny Swords Blue, Purple and Yellow Torch sheets, converted
to lossless WebP from the user's collection. No recoloring, resizing, cropping or
new artwork is performed. The existing red PNG remains the fourth palette.

Source directory: \`${sourceDirectory}\`.
Each source is \`<Color>/Torch_<Color>.png\` under this directory.

All variants are 1344 × 960 (seven columns and five rows of 192 × 192 cells).
The preparation script verifies their alpha channels against the existing red
sheet and checks every visible RGBA pixel after encoding. RGB under completely
transparent pixels may be discarded by WebP; alpha is always compared exactly.
Existing anchors, silhouettes, attack frames and animation timing are retained.

Campaign palettes follow the allied order: rounds 1–5 Blue, 6–10 Purple,
11–15 Red and 16–20 Yellow. These assets cover the native Torch goblin only;
the custom archer, chief, boar, ogre and Level 2 undead artwork is unchanged.

Recreate with \`node king-defense-toon/scripts/prepare-goblin-colors.mjs\`
from the worktree root. Source files are never modified.

| Runtime file | Source PNG bytes | WebP bytes | Source PNG SHA-256 | WebP SHA-256 |
| --- | ---: | ---: | --- | --- |
${report.map(item => `| ${item.filename} | ${item.sourceBytes} | ${item.bytes} | ${item.sourceHash} | ${item.outputHash} |`).join('\n')}

Total additional runtime art: **${report.reduce((sum, item) => sum + item.bytes, 0)} bytes**.
`);

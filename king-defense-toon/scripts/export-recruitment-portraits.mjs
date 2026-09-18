import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const sourceRoot = new URL('../../art/brotd-infinity/allies/elves/', import.meta.url);
const destination = new URL('../assets/recruitment/', import.meta.url);
const portraits = [
  { name: 'panther-rider', manifest: 'panther-rider/panther-rider-768.frames.json' },
  { name: 'elf-archer', manifest: 'archer/elf-archer-512.frames.json' },
  { name: 'unicorn', manifest: 'battle-unicorn/battle-unicorn-512.frames.json' },
];
const canvasSize = 96;
const padding = 4;
const contentSize = canvasSize - padding * 2;

await mkdir(destination, { recursive: true });
const results = [];
for (const { name, manifest } of portraits) {
  const manifestUrl = new URL(manifest, sourceRoot);
  const body = JSON.parse(await readFile(manifestUrl, 'utf8'));
  const frame = body.frames.find(candidate => candidate.action === 'idle-right' && candidate.pose === 0);
  assert.ok(frame, `${name}: first idle frame is missing`);
  const imageUrl = new URL(body.image, manifestUrl);
  const source = await readFile(imageUrl);
  const metadata = await sharp(source).metadata();
  assert.equal(metadata.width, body.size.width);
  assert.equal(metadata.height, body.size.height);
  const { x, y, width, height } = frame.rect;
  assert.ok(x >= 0 && y >= 0 && x + width <= metadata.width && y + height <= metadata.height);
  const { data, info } = await sharp(source)
    .extract({ left: x, top: y, width, height }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  // Ignore alpha 1 export noise far outside the silhouette; retain a pixel around its antialiased edge.
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      if (data[(row * width + column) * 4 + 3] <= 1) continue;
      left = Math.min(left, column);
      top = Math.min(top, row);
      right = Math.max(right, column);
      bottom = Math.max(bottom, row);
    }
  }
  assert.ok(right >= left && bottom >= top, `${name}: empty idle frame`);
  left = Math.max(0, left - 1);
  top = Math.max(0, top - 1);
  right = Math.min(width - 1, right + 1);
  bottom = Math.min(height - 1, bottom + 1);
  const crop = { left, top, width: right - left + 1, height: bottom - top + 1 };
  const icon = await sharp(data, { raw: info }).extract(crop)
    .resize({ width: contentSize, height: contentSize, fit: 'inside', withoutEnlargement: true, kernel: 'nearest' })
    .png().toBuffer({ resolveWithObject: true });
  const image = await sharp({ create: {
    width: canvasSize, height: canvasSize, channels: 4, background: '#00000000',
  } }).composite([{
    input: icon.data,
    left: Math.floor((canvasSize - icon.info.width) / 2),
    top: Math.floor((canvasSize - icon.info.height) / 2),
  }]).webp({ nearLossless: true, quality: 85, alphaQuality: 100, effort: 6 }).toBuffer();

  const checked = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(checked.info.width, canvasSize);
  assert.equal(checked.info.height, canvasSize);
  for (let row = 0; row < canvasSize; row += 1) {
    for (let column = 0; column < canvasSize; column += 1) {
      if (row >= padding && row < canvasSize - padding && column >= padding && column < canvasSize - padding) continue;
      assert.equal(checked.data[(row * canvasSize + column) * 4 + 3], 0, `${name}: transparent padding lost`);
    }
  }
  results.push({ name, source: imageUrl.pathname, frame: frame.index, crop, bytes: image.length });
  await writeFile(new URL(`${name}.webp`, destination), image);
}
const totalBytes = results.reduce((sum, result) => sum + result.bytes, 0);
assert.ok(totalBytes <= 30_000, `Recruitment portraits exceed 30 KB: ${totalBytes}`);
console.log(JSON.stringify({ portraits: results, totalBytes }, null, 2));

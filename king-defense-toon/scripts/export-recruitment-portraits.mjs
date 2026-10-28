import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const sourceRoot = new URL('../../art/brotd-infinity/allies/elves/', import.meta.url);
const destination = new URL('../assets/recruitment/', import.meta.url);
const riderDestination = new URL('../assets/panther-rider/', import.meta.url);
export const PANTHER_RIDER_PALETTES = Object.freeze([
  { name: 'green', rgb: null },
  { name: 'purple', rgb: [157, 102, 206] },
  { name: 'red', rgb: [204, 79, 73] },
  { name: 'gold', rgb: [216, 181, 66] },
  { name: 'black', rgb: [92, 99, 113] },
]);
export const RECRUITMENT_PORTRAITS = Object.freeze([
  { name: 'panther-rider', manifest: 'panther-rider/glaive-v2/panther-glaive-rider-512.frames.json' },
  { name: 'elf-archer', manifest: 'archer/elf-archer-512.frames.json' },
  { name: 'elf-healer', manifest: 'healer/elf-healer-512.frames.json' },
  { name: 'unicorn', manifest: 'battle-unicorn/battle-unicorn-512.frames.json' },
]);
const canvasSize = 96;
const padding = 4;
const contentSize = canvasSize - padding * 2;

/** Bounds for the new 512px idle pose exclude the face, glaive jewel and mount eyes. */
export function isRiderPortraitClothing(rgba, x, y, frame) {
  const [r, g, b, alpha] = rgba;
  const anchor = frame.footAnchor;
  return alpha > 0 && x >= anchor.x - 28 && x <= anchor.x + 20
    && y >= anchor.y - 67 && y <= anchor.y - 18
    && g > r * 1.12 && g > b * 1.08 && g - Math.min(r, b) >= 8;
}

export async function readPortraitFrame({ name, manifest }) {
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
  return { data, info, frame, imageUrl };
}

export function tintRiderPortrait({ data, info, frame }, rgb) {
  const pixels = Buffer.from(data);
  if (!rgb) return pixels;
  let changed = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const offset = (y * info.width + x) * 4;
    if (!isRiderPortraitClothing(pixels.subarray(offset, offset + 4), x, y, frame)) continue;
    const brightness = pixels[offset + 1] / 170;
    for (let channel = 0; channel < 3; channel++) pixels[offset + channel] = Math.min(255, Math.round(rgb[channel] * brightness));
    changed++;
  }
  assert.ok(changed > 100, 'Rider portrait clothing palette must be visible');
  return pixels;
}

export async function renderPortrait({ data, info }) {
  const { width, height } = info;
  // Ignore alpha 1 export noise far outside the silhouette; keep a pixel around its edge.
  let left = width, top = height, right = -1, bottom = -1;
  for (let row = 0; row < height; row++) for (let column = 0; column < width; column++) {
    if (data[(row * width + column) * 4 + 3] <= 1) continue;
    left = Math.min(left, column); top = Math.min(top, row);
    right = Math.max(right, column); bottom = Math.max(bottom, row);
  }
  assert.ok(right >= left && bottom >= top, 'Empty idle frame');
  left = Math.max(0, left - 1); top = Math.max(0, top - 1);
  right = Math.min(width - 1, right + 1); bottom = Math.min(height - 1, bottom + 1);
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
  for (let row = 0; row < canvasSize; row++) for (let column = 0; column < canvasSize; column++) {
    if (row >= padding && row < canvasSize - padding && column >= padding && column < canvasSize - padding) continue;
    assert.equal(checked.data[(row * canvasSize + column) * 4 + 3], 0, 'Transparent padding lost');
  }
  return { image, crop };
}

export async function exportRecruitmentPortraits() {
  await mkdir(destination, { recursive: true });
  await mkdir(riderDestination, { recursive: true });
  const results = [];
  for (const definition of RECRUITMENT_PORTRAITS) {
    const source = await readPortraitFrame(definition);
    const variants = definition.name === 'panther-rider' ? PANTHER_RIDER_PALETTES : [{ name: '', rgb: null }];
    for (const [index, palette] of variants.entries()) {
      const pixels = definition.name === 'panther-rider' ? tintRiderPortrait(source, palette.rgb) : source.data;
      const { image, crop } = await renderPortrait({ ...source, data: pixels });
      const output = index ? new URL(`panther-rider-${palette.name}-art.webp`, riderDestination) : new URL(`${definition.name}.webp`, destination);
      await writeFile(output, image);
      results.push({ name: definition.name, palette: palette.name, source: source.imageUrl.pathname, frame: source.frame.index, crop, bytes: image.length });
    }
  }
  const totalBytes = results.reduce((sum, result) => sum + result.bytes, 0);
  assert.ok(totalBytes <= 80_000, `Eight recruitment/rank portraits exceed 80 KB: ${totalBytes}`);
  return { portraits: results, totalBytes };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await exportRecruitmentPortraits(), null, 2));
}

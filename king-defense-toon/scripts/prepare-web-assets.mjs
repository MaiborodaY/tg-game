import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const outputDirectory = new URL('assets/web/', root);
const pngOptions = { compressionLevel: 9, adaptiveFiltering: true, palette: false };
const units = {
  king: { file: 'tiny-swords-king-v1.png', columns: 4, rows: 4 },
  swordsman: { file: 'tiny-swords-warrior-blue.png', columns: 6, rows: 8 },
  archer: { file: 'tiny-swords-archer-blue.png', columns: 8, rows: 7 },
  healer: { file: 'tiny-monk/Idle.png', columns: 6, rows: 1 },
};

const sha256 = data => createHash('sha256').update(data).digest('hex');

async function decode(encoded) {
  const { data, info } = await sharp(encoded).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

function visiblePixels(data) {
  const normalized = Buffer.from(data);
  for (let offset = 0; offset < normalized.length; offset += 4) {
    if (!normalized[offset + 3]) normalized.fill(0, offset, offset + 3);
  }
  return normalized;
}

async function assertEquivalent(source, encoded, label) {
  const actual = await decode(encoded);
  assert.equal(actual.width, source.width, `${label}: width changed`);
  assert.equal(actual.height, source.height, `${label}: height changed`);
  assert.deepEqual(visiblePixels(actual.data), visiblePixels(source.data), `${label}: visible RGBA changed`);
}

function imagePipeline(image) {
  return sharp(image.data, { raw: { width: image.width, height: image.height, channels: 4 } });
}

// Match scene's alpha threshold, row boundaries and largest eight-connected component.
function spriteBounds(image, columns, rows) {
  const { data, width, height } = image;
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const visited = new Uint8Array(width * height);
  return Array.from({ length: columns * rows }, (_, index) => {
    const stamp = index + 1;
    const startX = Math.floor((index % columns) * cellWidth);
    const startY = Math.floor(Math.floor(index / columns) * cellHeight);
    const endX = Math.floor(startX + cellWidth);
    const endY = Math.floor(startY + cellHeight);
    const queue = new Int32Array((endX - startX) * (endY - startY));
    let largest = null;
    let largestSize = 0;
    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        const start = y * width + x;
        if (visited[start] === stamp || data[start * 4 + 3] < 40) continue;
        let left = x;
        let right = x;
        let top = y;
        let bottom = y;
        let head = 0;
        let size = 1;
        queue[0] = start;
        visited[start] = stamp;
        while (head < size) {
          const point = queue[head++];
          const pointX = point % width;
          const pointY = Math.floor(point / width);
          left = Math.min(left, pointX);
          right = Math.max(right, pointX);
          top = Math.min(top, pointY);
          bottom = Math.max(bottom, pointY);
          for (let nearY = Math.max(startY, pointY - 1); nearY <= Math.min(endY - 1, pointY + 1); nearY += 1) {
            for (let nearX = Math.max(startX, pointX - 1); nearX <= Math.min(endX - 1, pointX + 1); nearX += 1) {
              const next = nearY * width + nearX;
              if (visited[next] === stamp || data[next * 4 + 3] < 40) continue;
              visited[next] = stamp;
              queue[size++] = next;
            }
          }
        }
        if (size > largestSize) {
          largestSize = size;
          largest = { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
        }
      }
    }
    return largest;
  });
}

function renderUnitImage(source, sprite, kind) {
  const height = kind === 'portrait' ? 128 : 160;
  const maxWidth = kind === 'portrait' ? 120 : 116;
  const maxHeight = kind === 'portrait' ? 122 : 148;
  const feet = kind === 'portrait' ? 125 : 154;
  const scale = Math.min(maxWidth / sprite.width, maxHeight / sprite.height);
  const drawnWidth = sprite.width * scale;
  const drawnHeight = sprite.height * scale;
  const left = (128 - drawnWidth) / 2;
  const top = feet - drawnHeight;
  const data = Buffer.alloc(128 * height * 4);
  // Keep fractional placement from createUnitImages; sample pixel centers with smoothing disabled.
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < 128; x += 1) {
      if (x + 0.5 < left || x + 0.5 >= left + drawnWidth || y + 0.5 < top || y + 0.5 >= feet) continue;
      const sourceX = sprite.x + Math.min(sprite.width - 1, Math.floor((x + 0.5 - left) / scale));
      const sourceY = sprite.y + Math.min(sprite.height - 1, Math.floor((y + 0.5 - top) / scale));
      const offset = (sourceY * source.width + sourceX) * 4;
      source.data.copy(data, (y * 128 + x) * 4, offset, offset + 4);
    }
  }
  return { data, width: 128, height };
}

async function chooseLossless(image, pngCandidate) {
  const webp = await imagePipeline(image).webp({ lossless: true, effort: 6 }).toBuffer();
  await assertEquivalent(image, webp, 'WebP candidate');
  const png = pngCandidate ?? await imagePipeline(image).png(pngOptions).toBuffer();
  await assertEquivalent(image, png, 'PNG candidate');
  return { extension: webp.length < png.length ? 'webp' : 'png', encoded: webp.length < png.length ? webp : png };
}

await mkdir(outputDirectory, { recursive: true });
const sourceHashes = [];
const reports = [];
async function loadSource(file) {
  const encoded = await readFile(new URL(`assets/${file}`, root));
  sourceHashes.push(`${file}: ${sha256(encoded)}`);
  return { encoded, image: await decode(encoded) };
}

const king = await loadSource(units.king.file);
const kingOutput = await chooseLossless(king.image, king.encoded);
await writeFile(new URL(`king.${kingOutput.extension}`, outputDirectory), kingOutput.encoded);
reports.push({ asset: 'king', before: king.encoded.length, after: kingOutput.encoded.length, dimensions: `${king.image.width}x${king.image.height}`, sha256: sha256(kingOutput.encoded) });

const specialists = await loadSource('goblin-specialists-v1.png');
const cleanSpecialists = { ...specialists.image, data: Buffer.from(specialists.image.data) };
for (let offset = 0; offset < cleanSpecialists.data.length; offset += 4) {
  const red = cleanSpecialists.data[offset];
  const green = cleanSpecialists.data[offset + 1];
  const blue = cleanSpecialists.data[offset + 2];
  if (red > 90 && blue > 90 && green < 100 && Math.min(red, blue) > green + 55) cleanSpecialists.data[offset + 3] = 0;
}
const specialistBounds = spriteBounds(cleanSpecialists, 4, 2);
assert.ok(specialistBounds.every(Boolean), 'All eight specialist frames must be present');
const specialistOutput = await chooseLossless(cleanSpecialists);
await writeFile(new URL(`specialists.${specialistOutput.extension}`, outputDirectory), specialistOutput.encoded);
assert.deepEqual(spriteBounds(await decode(specialistOutput.encoded), 4, 2), specialistBounds);
reports.push({ asset: 'specialists', before: specialists.encoded.length, after: specialistOutput.encoded.length, dimensions: `${cleanSpecialists.width}x${cleanSpecialists.height}`, sha256: sha256(specialistOutput.encoded) });

for (const [type, config] of Object.entries(units)) {
  const source = type === 'king' ? king : await loadSource(config.file);
  const sprite = spriteBounds(source.image, config.columns, config.rows)[0];
  assert.ok(sprite, `${type}: first frame must be present`);
  for (const kind of ['portrait', 'art']) {
    const rendered = renderUnitImage(source.image, sprite, kind);
    const encoded = await imagePipeline(rendered).png(pngOptions).toBuffer();
    await assertEquivalent(rendered, encoded, `${type} ${kind}`);
    await writeFile(new URL(`${type}-${kind}.png`, outputDirectory), encoded);
    reports.push({ asset: `${type}-${kind}`, before: 0, after: encoded.length, dimensions: `${rendered.width}x${rendered.height}`, sha256: sha256(encoded) });
  }
}

const manifest = `// Generated by scripts/prepare-web-assets.mjs. Original source assets are retained.\n`
  + sourceHashes.map(hash => `// SHA-256 ${hash}\n`).join('')
  + `export const KING_IMAGE_URL = new URL('./assets/web/king.${kingOutput.extension}', import.meta.url).href;\n`
  + `export const UNIT_IMAGES = new Map([\n`
  + Object.keys(units).map(type => `  ['${type}', { portrait: new URL('./assets/web/${type}-portrait.png', import.meta.url).href, art: new URL('./assets/web/${type}-art.png', import.meta.url).href }],\n`).join('')
  + `]);\n`;
await writeFile(new URL('asset-web.mjs', root), manifest);
console.table(reports.map(({ sha256: hash, ...report }) => ({ ...report, sha256: hash.slice(0, 16) })));
console.log(`Prepared ${reports.length} lossless web assets in ${fileURLToPath(outputDirectory)}; decoded RGBA and specialist bounds verified.`);

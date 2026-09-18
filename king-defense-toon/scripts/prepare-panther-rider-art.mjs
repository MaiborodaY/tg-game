import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const sourceRoot = new URL('../../art/brotd-infinity/allies/elves/panther-rider/', import.meta.url);
const output = new URL('../assets/panther-rider/', import.meta.url);
export const PANTHER_RIDER_PALETTES = Object.freeze([
  { name: 'green', rgb: null },
  { name: 'purple', rgb: [157, 102, 206] },
  { name: 'red', rgb: [204, 79, 73] },
  { name: 'gold', rgb: [216, 181, 66] },
  { name: 'black', rgb: [92, 99, 113] },
]);

/** Limit the hue replacement to the rider's green cloth, away from the mount's eyes. */
export function isPantherRiderClothing(rgba, x, y, frame) {
  const anchorX = frame.rect.x + frame.footAnchor.x;
  const anchorY = frame.rect.y + frame.footAnchor.y;
  const [r, g, b, alpha] = rgba;
  // In the frontal strike row, the panther's green eyes are directly below the rider.
  const bottom = frame.action === 'attack-down' ? 60 : 23;
  return alpha > 0 && x >= anchorX - 30 && x <= anchorX + 28
    && y >= anchorY - 104 && y <= anchorY - bottom
    && g > r * 1.12 && g > b * 1.08 && g - Math.min(r, b) >= 8;
}

export function pantherRiderArtSource(pack) {
  const geometry = {
    layout: { columns: 4, rows: 4 }, bodyHeight: 108 / 192,
    // The pack uses irregular crops and frame-local anchors, not a uniform cell origin.
    baselines: pack.frames.map(({ index, rect, footAnchor }) => (rect.y + footAnchor.y - Math.floor(index / 4) * 192) / 192),
    centers: pack.frames.map(({ index, rect, footAnchor }) => (rect.x + footAnchor.x - index % 4 * 192) / 192),
    sourceRects: Object.fromEntries(pack.frames.map(({ index, rect }) => [index, rect])),
  };
  return `import type { SheetArtUrls, SpriteGeometry } from './art-types.ts';\nimport type { PaletteRank } from './unit-ranks.ts';\n\n// Generated from the supplied frame rectangles/foot anchors; original artwork is untouched.\nexport const PANTHER_RIDER_ASSETS: Readonly<Record<PaletteRank, SheetArtUrls>> = Object.freeze({\n${PANTHER_RIDER_PALETTES.map(({ name }, index) => `  ${index + 1}: { sheet: new URL('./assets/panther-rider/panther-rider-${name}.webp', import.meta.url).href, art: new URL('${index ? `./assets/panther-rider/panther-rider-${name}-art.webp` : './assets/recruitment/panther-rider.webp'}', import.meta.url).href },`).join('\n')}\n});\n\nexport const PANTHER_RIDER_GEOMETRY = ${JSON.stringify(geometry, null, 2)} satisfies SpriteGeometry;\n`;
}

async function prepare() {
  const pack = JSON.parse(await readFile(new URL('panther-rider-768.frames.json', sourceRoot), 'utf8'));
  assert.equal(pack.frames.length, 16);
  assert.equal(pack.anchorSpace, 'frame-pixels');
  assert.equal(pack.impactPose, 2);
  const source = await readFile(new URL(pack.image, sourceRoot));
  const decoded = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.deepEqual([decoded.info.width, decoded.info.height], [768, 768]);
  await mkdir(output, { recursive: true });
  const totals = [];
  for (const { name, rgb } of PANTHER_RIDER_PALETTES) {
    const pixels = Buffer.from(decoded.data);
    let changed = 0;
    if (rgb) for (const frame of pack.frames) {
      const { x: left, y: top, width, height } = frame.rect;
      for (let y = top; y < top + height; y++) for (let x = left; x < left + width; x++) {
        const index = (y * 768 + x) * 4;
        if (!isPantherRiderClothing(pixels.subarray(index, index + 4), x, y, frame)) continue;
        // Preserve green-channel shading while replacing only clothing hue.
        const brightness = pixels[index + 1] / 170;
        for (let channel = 0; channel < 3; channel++) pixels[index + channel] = Math.min(255, Math.round(rgb[channel] * brightness));
        changed++;
      }
    }
    const atlas = rgb ? await sharp(pixels, { raw: decoded.info }).webp({ lossless: true, effort: 6 }).toBuffer() : source;
    await writeFile(new URL(`panther-rider-${name}.webp`, output), atlas);
    let portraitBytes = 0;
    if (rgb) {
      assert.ok(changed > 100, 'Clothing palette must be visible');
      const { x: left, y: top, width, height } = pack.frames[0].rect;
      // Separate passes keep trim from moving the atlas origin before the authored crop.
      const firstFrame = await sharp(atlas).extract({ left, top, width, height }).png().toBuffer();
      const portrait = await sharp(firstFrame).trim({ threshold: 0 })
        .webp({ lossless: true, effort: 6 }).toBuffer();
      portraitBytes = portrait.length;
      await writeFile(new URL(`panther-rider-${name}-art.webp`, output), portrait);
    }
    totals.push({ name, atlas: atlas.length, portrait: portraitBytes, changed });
  }
  await writeFile(new URL('../panther-rider-art.ts', import.meta.url), pantherRiderArtSource(pack));
  await writeFile(new URL('README.md', output), `# Panther rider runtime art\n\nSource: \`art/brotd-infinity/allies/elves/panther-rider/panther-rider-768-lite.webp\` and its \`panther-rider-768.frames.json\`. The original files are untouched.\n\nFour rows: idle right, walk right, side attack, down attack. Each has four poses; pose 2 is the impact. Upward attacks use the side row, west mirrors horizontally, and death uses the normal fade. Explicit crop rectangles and foot anchors retain the entire rider, sword, mount and tail.\n\nBody reference: 108 source pixels rendered at 47 game pixels. Formation is static and uses the same scale. The original green palette covers levels 1–49, purple 50–99, red 100–249, gold 250–499 and black 500+. Palette generation changes only green cloth inside the rider bounds; the panther, skin, hair and weapon pixels and all alpha values are preserved. Palette sheets are lossless WebP. Base menu art reuses the existing recruitment portrait.\n\nRecreate: \`node king-defense-toon/scripts/prepare-panther-rider-art.mjs\`.\n\n| Palette | Atlas bytes | Extra portrait bytes | Cloth pixels changed |\n| --- | ---: | ---: | ---: |\n${totals.map(row => `| ${row.name} | ${row.atlas} | ${row.portrait} | ${row.changed} |`).join('\n')}\n`);
  console.log(JSON.stringify(totals));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await prepare();

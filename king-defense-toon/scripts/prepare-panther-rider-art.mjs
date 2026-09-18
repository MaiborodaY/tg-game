import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { PANTHER_RIDER_PALETTES, exportRecruitmentPortraits } from './export-recruitment-portraits.mjs';
export { PANTHER_RIDER_PALETTES } from './export-recruitment-portraits.mjs';

const sourceRoot = new URL('../../art/brotd-infinity/allies/elves/panther-rider/', import.meta.url);
const output = new URL('../assets/panther-rider/', import.meta.url);

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
    if (rgb) assert.ok(changed > 100, 'Clothing palette must be visible');
    totals.push({ name, atlas: atlas.length, changed });
  }
  // Menu portraits use the newer glaive model; do not replace them with the combat sword pose.
  const portraits = await exportRecruitmentPortraits();
  for (const row of totals) row.portrait = portraits.portraits.find(portrait => portrait.name === 'panther-rider' && portrait.palette === row.name).bytes;
  await writeFile(new URL('../panther-rider-art.ts', import.meta.url), pantherRiderArtSource(pack));
  await writeFile(new URL('README.md', output), `# Panther rider runtime art

Source: \`art/brotd-infinity/allies/elves/panther-rider/panther-rider-768-lite.webp\` and its \`panther-rider-768.frames.json\`. The original files are untouched.

Four rows: idle right, walk right, side attack, down attack. Each has four poses; pose 2 is the impact. Upward attacks use the side row, west mirrors horizontally, and death uses the normal fade. Explicit crop rectangles and foot anchors retain the entire rider, sword, mount and tail.

Body reference: 108 source pixels rendered at 54.05 game pixels (47 × 1.15). Formation is static and uses the same scale. The original green palette covers levels 1–49, purple 50–99, red 100–249, gold 250–499 and black 500+. Palette generation changes only green cloth inside the rider bounds; the panther, skin, hair and weapon pixels and all alpha values are preserved. Palette sheets are lossless WebP.

All five menu portraits use the newer \`glaive-v2/panther-glaive-rider-512-lite.webp\` idle pose at 96 × 96 pixels. The base portrait is in \`../recruitment/panther-rider.webp\`; the four recolored portraits are beside these atlases. Menu palettes preserve the same level bands, but do not change the battle atlas or introduce thrown-glaive combat. See \`../recruitment/README.md\` for the portrait export contract.

Recreate atlases and portraits: \`node king-defense-toon/scripts/prepare-panther-rider-art.mjs\`.
Recreate portraits only: \`node king-defense-toon/scripts/export-recruitment-portraits.mjs\`.

| Palette | Atlas bytes | Portrait bytes | Atlas cloth pixels changed |
| --- | ---: | ---: | ---: |
${totals.map(row => `| ${row.name} | ${row.atlas} | ${row.portrait} | ${row.changed} |`).join('\n')}
`);
  console.log(JSON.stringify(totals));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await prepare();

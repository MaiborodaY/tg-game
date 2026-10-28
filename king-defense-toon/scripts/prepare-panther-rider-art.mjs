import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { PANTHER_RIDER_PALETTES, exportRecruitmentPortraits } from './export-recruitment-portraits.mjs';
export { PANTHER_RIDER_PALETTES } from './export-recruitment-portraits.mjs';

const sourceRoot = new URL('../../art/brotd-infinity/allies/elves/panther-rider/glaive-v2/', import.meta.url);
const output = new URL('../assets/panther-rider/', import.meta.url);

/** Limit the hue replacement to the rider's green cloth, away from the mount's eyes. */
export function isPantherRiderClothing(rgba, x, y, frame) {
  const anchorX = frame.rect.x + frame.footAnchor.x;
  const anchorY = frame.rect.y + frame.footAnchor.y;
  const [r, g, b, alpha] = rgba;
  // In the frontal strike row, the panther's green eyes are directly below the rider.
  const bottom = frame.action === 'throw-down' ? 48 : 18;
  return alpha > 0 && x >= anchorX - 28 && x <= anchorX + 20
    && y >= anchorY - 67 && y <= anchorY - bottom
    && g > r * 1.12 && g > b * 1.08 && g - Math.min(r, b) >= 8;
}

export function pantherRiderArtSource(pack, projectile) {
  const geometry = {
    layout: { columns: 4, rows: 4 }, bodyHeight: 110 / 128,
    // The pack uses irregular crops and frame-local anchors, not a uniform cell origin.
    baselines: pack.frames.map(({ index, rect, footAnchor }) => (rect.y + footAnchor.y - Math.floor(index / 4) * 128) / 128),
    centers: pack.frames.map(({ index, rect, footAnchor }) => (rect.x + footAnchor.x - index % 4 * 128) / 128),
    sourceRects: Object.fromEntries(pack.frames.map(({ index, rect }) => [index, rect])),
  };
  return `import type { SheetArtUrls, SpriteGeometry, SpriteRect } from './art-types.ts';\nimport type { PaletteRank } from './unit-ranks.ts';\nimport type { Point } from './field.ts';\n\n// Generated from approved glaive-v2 rectangles and anchors. Body height excludes the raised weapon.\nexport const PANTHER_RIDER_ASSETS: Readonly<Record<PaletteRank, SheetArtUrls>> = Object.freeze({\n${PANTHER_RIDER_PALETTES.map(({ name }, index) => `  ${index + 1}: { sheet: new URL('./assets/panther-rider/panther-rider-${name}.webp', import.meta.url).href, art: new URL('${index ? `./assets/panther-rider/panther-rider-${name}-art.webp` : './assets/recruitment/panther-rider.webp'}', import.meta.url).href },`).join('\n')}\n});\n\nexport const PANTHER_RIDER_GEOMETRY = ${JSON.stringify(geometry, null, 2)} satisfies SpriteGeometry;\n\nexport const PANTHER_RIDER_RENDER_HEIGHT = 47 * 1.15;\nexport const PANTHER_RIDER_RELEASE_OFFSETS = ${JSON.stringify(Object.fromEntries(pack.frames.filter(frame => frame.projectileAnchor).map(frame => [frame.index, { x: (frame.projectileAnchor.x - frame.footAnchor.x) * 54.05 / 110, y: (frame.projectileAnchor.y - frame.footAnchor.y) * 54.05 / 110 }])), null, 2)} satisfies Record<number, Point>;\nexport const MOON_GLAIVE_IMAGE_URL = new URL('./assets/panther-rider/moon-glaive.webp?no-inline', import.meta.url).href;\nexport const MOON_GLAIVE_FRAMES = ${JSON.stringify(projectile.frames.map(({rect,centerAnchor})=>({rect,centerAnchor})), null, 2)} satisfies readonly { rect: SpriteRect; centerAnchor: Point }[];\n`;
}

async function prepare() {
  const pack = JSON.parse(await readFile(new URL('panther-glaive-rider-512.frames.json', sourceRoot), 'utf8'));
  assert.equal(pack.frames.length, 16);
  assert.equal(pack.anchorSpace, 'frame-pixels');
  assert.equal(pack.releasePose, 2);
  const projectile = JSON.parse(await readFile(new URL('moon-glaive-128.frames.json', sourceRoot), 'utf8'));
  assert.equal(projectile.frames.length, 4);
  const source = await readFile(new URL(pack.image, sourceRoot));
  const decoded = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.deepEqual([decoded.info.width, decoded.info.height], [512, 512]);
  await mkdir(output, { recursive: true });
  const totals = [];
  for (const { name, rgb } of PANTHER_RIDER_PALETTES) {
    const pixels = Buffer.from(decoded.data);
    let changed = 0;
    if (rgb) for (const frame of pack.frames) {
      const { x: left, y: top, width, height } = frame.rect;
      for (let y = top; y < top + height; y++) for (let x = left; x < left + width; x++) {
        const index = (y * 512 + x) * 4;
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
  // Menus and live battle now use the same approved glaive model.
  const portraits = await exportRecruitmentPortraits();
  for (const row of totals) row.portrait = portraits.portraits.find(portrait => portrait.name === 'panther-rider' && portrait.palette === row.name).bytes;
  await writeFile(new URL('../panther-rider-art.ts', import.meta.url), pantherRiderArtSource(pack, projectile));
  await writeFile(new URL('moon-glaive.webp', output), await readFile(new URL(projectile.image, sourceRoot)));
  await writeFile(new URL('README.md', output), `# Panther rider runtime art

Source: approved glaive-v2 512px character and 128px projectile under art/brotd-infinity/allies/elves/panther-rider/glaive-v2. Original artwork is unchanged.

Four character rows: idle, walk, side throw, down throw. Each has four poses; the empty hand at pose 2 releases the separate spinning glaive. West mirrors the side row and launch anchor. Death uses the shared static fade. Individual source rectangles, foot anchors and hand anchors come directly from the manifests.

Body reference: 110 source pixels at 54.05 world units, preserving the two-cell footprint and previously approved 15% enlargement. Formation stays still. Cloth palettes follow levels 50 / 100 / 250 / 500; skin, mount, eyes, weapon and alpha are preserved. Existing 96px portraits already use this same model.

The projectile loads only for a Rider in battle and reuses the ordinary single-target projectile lifecycle. The current attack has no ricochet; the source showcase does not define game balance.

Regenerate: node king-defense-toon/scripts/prepare-panther-rider-art.mjs

| Palette | Atlas bytes | Portrait bytes | Changed cloth pixels |
| --- | ---: | ---: | ---: |
${totals.map(row => `| ${row.name} | ${row.atlas} | ${row.portrait} | ${row.changed} |`).join('\n')}
`);
  console.log(JSON.stringify(totals));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await prepare();

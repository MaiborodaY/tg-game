import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { renderPortrait } from './export-recruitment-portraits.mjs';

const sourceRoot = new URL('../../art/brotd-infinity/allies/elves/archer/', import.meta.url);
const output = new URL('../assets/elf-archer/', import.meta.url);
export const ELF_ARCHER_PALETTES = Object.freeze([
  { name: 'green', rgb: null },
  { name: 'purple', rgb: [157, 102, 206] },
  { name: 'red', rgb: [204, 79, 73] },
  { name: 'gold', rgb: [216, 181, 66] },
  { name: 'black', rgb: [92, 99, 113] },
]);

/** Green/teal cloth below the head; leave face, ponytail, bow and arrow untouched. */
export function isElfArcherClothing(rgba, x, y, frame) {
  const [r, g, b, alpha] = rgba;
  const anchorX = frame.rect.x + frame.footAnchor.x;
  const anchorY = frame.rect.y + frame.footAnchor.y;
  return alpha > 0 && x >= anchorX - 43 && x <= anchorX + 28
    && y >= anchorY - 54 && y <= anchorY - 9
    && g > r * 1.15 && g >= b * .98 && g - r >= 8;
}

export function elfArcherArtSource(pack) {
  const geometry = {
    layout: { columns: 4, rows: 4 }, bodyHeight: 102 / 128,
    baselines: pack.frames.map(({ index, rect, footAnchor }) => (rect.y + footAnchor.y - Math.floor(index / 4) * 128) / 128),
    centers: pack.frames.map(({ index, rect, footAnchor }) => (rect.x + footAnchor.x - index % 4 * 128) / 128),
    sourceRects: Object.fromEntries(pack.frames.map(({ index, rect }) => [index, rect])),
  };
  return `import type { SheetArtUrls, SpriteGeometry } from './art-types.ts';\nimport type { PaletteRank } from './unit-ranks.ts';\n\n// Generated from the approved 512px crops and foot anchors; source artwork is untouched.\nexport const ELF_ARCHER_RENDER_HEIGHT = 38;\nexport const ELF_ARCHER_ASSETS: Readonly<Record<PaletteRank, SheetArtUrls>> = Object.freeze({\n${ELF_ARCHER_PALETTES.map(({ name }, index) => `  ${index + 1}: { sheet: new URL('./assets/elf-archer/elf-archer-${name}.webp', import.meta.url).href, art: new URL('${index ? `./assets/elf-archer/elf-archer-${name}-art.webp` : './assets/recruitment/elf-archer.webp'}', import.meta.url).href },`).join('\n')}\n});\n\nexport const ELF_ARCHER_GEOMETRY = ${JSON.stringify(geometry, null, 2)} satisfies SpriteGeometry;\n`;
}

async function prepare() {
  const pack = JSON.parse(await readFile(new URL('elf-archer-512.frames.json', sourceRoot), 'utf8'));
  assert.equal(pack.frames.length, 16); assert.equal(pack.anchorSpace, 'frame-pixels'); assert.equal(pack.releasePose, 2);
  const source = await readFile(new URL(pack.image, sourceRoot));
  const decoded = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.deepEqual([decoded.info.width, decoded.info.height], [512, 512]);
  await mkdir(output, { recursive: true });
  const totals = [];
  for (const { name, rgb } of ELF_ARCHER_PALETTES) {
    const pixels = Buffer.from(decoded.data); let changed = 0;
    if (rgb) for (const frame of pack.frames) {
      const { x: left, y: top, width, height } = frame.rect;
      for (let y = top; y < top + height; y++) for (let x = left; x < left + width; x++) {
        const index = (y * 512 + x) * 4;
        if (!isElfArcherClothing(pixels.subarray(index, index + 4), x, y, frame)) continue;
        const brightness = pixels[index + 1] / 170;
        for (let channel = 0; channel < 3; channel++) pixels[index + channel] = Math.min(255, Math.round(rgb[channel] * brightness));
        changed++;
      }
    }
    const atlas = rgb ? await sharp(pixels, { raw: decoded.info }).webp({ lossless: true, effort: 6 }).toBuffer() : source;
    await writeFile(new URL(`elf-archer-${name}.webp`, output), atlas);
    let portraitBytes = 0;
    if (rgb) {
      assert.ok(changed > 100, 'Clothing palette must be visible');
      const frame = pack.frames[0], { x, y, width, height } = frame.rect;
      const cropped = await sharp(pixels, { raw: decoded.info }).extract({ left: x, top: y, width, height })
        .raw().toBuffer({ resolveWithObject: true });
      const { image } = await renderPortrait(cropped);
      await writeFile(new URL(`elf-archer-${name}-art.webp`, output), image); portraitBytes = image.length;
    }
    totals.push({ name, atlas: atlas.length, portrait: portraitBytes, changed });
  }
  await writeFile(new URL('../elf-archer-art.ts', import.meta.url), elfArcherArtSource(pack));
  await writeFile(new URL('README.md', output), `# Elven Archer runtime art

Exact base copy: \`art/brotd-infinity/allies/elves/archer/elf-archer-512-lite.webp\`. Geometry comes from its 16 explicit rectangles and frame-local foot anchors in \`elf-archer-512.frames.json\`.

Rows are idle right, walk right, shoot right and shoot down. Release pose 2 (frames 10/14) has no nocked arrow; the existing ordinary arrow effect starts then. West mirrors side poses and upward fire uses the side row. Death uses the normal allied fade. Formation uses a stationary idle frame.

The 102px idle body reference renders at 38 game pixels, matching the human archer. HP offset is 42px. Level palettes: green 1–49, purple 50–99, red 100–249, gold 250–499, black 500+. Technical recoloring affects green/teal cloth below the head only. Skin, hair, wooden bow, arrow, silhouettes and alpha remain unchanged. Recolored atlases use lossless WebP; only the needed sheet loads. Base menu art reuses \`../recruitment/elf-archer.webp\`; other menu variants are 96×96 portraits, separate from the battle sheets.

Recreate: \`node king-defense-toon/scripts/prepare-elf-archer-art.mjs\`.

| Palette | Atlas bytes | Rank portrait bytes | Cloth pixels changed |
| --- | ---: | ---: | ---: |
${totals.map(row => `| ${row.name} | ${row.atlas} | ${row.portrait} | ${row.changed} |`).join('\n')}
`);
  console.log(JSON.stringify(totals));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await prepare();

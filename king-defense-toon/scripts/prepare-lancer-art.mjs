import { lancerArtSource } from './art-catalog-codegen.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const sourceRoot = 'C:/Unity/Unity Projects/Bro TD/Assets/Sprites/Tiny Swords/Units';
const output = new URL('../assets/lancer/', import.meta.url);
const strips = [['Idle', 12], ['Run', 6], ['Right_Attack', 3], ['DownRight_Attack', 3],
  ['Down_Attack', 3], ['UpRight_Attack', 3], ['Up_Attack', 3]];
const colors = ['Blue', 'Purple', 'Red', 'Yellow', 'Black'];
const cellWidth = 168, cellHeight = 160, columns = 6, rows = 6;
const digest = data => createHash('sha256').update(data).digest('hex');
const decode = data => sharp(data).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const rgbaVisible = data => {
  const copy = Buffer.from(data);
  for (let i = 0; i < copy.length; i += 4) if (!copy[i + 3]) copy.fill(0, i, i + 3);
  return copy;
};
const report = [], geometry = [], referenceAlpha = [];
await mkdir(output, { recursive: true });

for (const color of colors) {
  const frames = [], hashes = [];
  let frameIndex = 0;
  for (const [name, count] of strips) {
    const png = await readFile(`${sourceRoot}/${color} Units/Lancer/Lancer_${name}.png`);
    hashes.push({ name, hash: digest(png), bytes: png.length });
    const native = await decode(png);
    assert.equal(native.info.width, count * 320);
    assert.equal(native.info.height, 320);
    for (let index = 0; index < count; index++, frameIndex++) {
      const source = await sharp(png).extract({ left: index * 320, top: 0, width: 320, height: 320 })
        .ensureAlpha().raw().toBuffer();
      const alpha = Buffer.alloc(320 * 320);
      let left = 320, top = 320, right = -1, bottom = -1;
      let shadowLeft = 320, shadowRight = -1, shadowBottom = -1;
      for (let y = 0; y < 320; y++) for (let x = 0; x < 320; x++) {
        const offset = (y * 320 + x) * 4;
        alpha[y * 320 + x] = source[offset + 3];
        if (!source[offset + 3]) continue;
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
        if (source[offset] === 15 && source[offset + 1] === 18 && source[offset + 2] === 26
          && source[offset + 3] === 79) {
          shadowLeft = Math.min(shadowLeft, x); shadowRight = Math.max(shadowRight, x);
          shadowBottom = Math.max(shadowBottom, y);
        }
      }
      assert.ok(shadowBottom >= 0, `${color}/${name}/${index}: no authored ground shadow`);
      const width = right - left + 1, height = bottom - top + 1;
      assert.ok(width <= cellWidth && height <= cellHeight, `${name}: frame exceeds atlas cell`);
      const frameGeometry = { left, top, width, height,
        center: (shadowLeft + shadowRight) / 2, baseline: shadowBottom - 5 };
      if (color === 'Blue') {
        geometry.push(frameGeometry);
        referenceAlpha.push(alpha);
      } else {
        assert.deepEqual(frameGeometry, geometry[frameIndex], `${color}/${name}/${index}: anchors changed`);
        assert.deepEqual(alpha, referenceAlpha[frameIndex], `${color}/${name}/${index}: silhouette changed`);
      }
      const crop = await sharp(source, { raw: { width: 320, height: 320, channels: 4 } })
        .extract({ left, top, width, height }).png().toBuffer();
      frames.push({ input: crop, left: frameIndex % columns * cellWidth,
        top: Math.floor(frameIndex / columns) * cellHeight });
    }
  }
  const atlas = await sharp({ create: { width: cellWidth * columns, height: cellHeight * rows,
    channels: 4, background: '#00000000' } }).composite(frames).png().toBuffer();
  const webp = await sharp(atlas).webp({ lossless: true, effort: 6 }).toBuffer();
  const [before, after] = await Promise.all([decode(atlas), decode(webp)]);
  assert.deepEqual(rgbaVisible(before.data), rgbaVisible(after.data), `${color}: visible atlas pixels changed`);
  // Menus show the body at the same readable size as other troops; only the long upper spear tip is cropped.
  const idlePng = await readFile(`${sourceRoot}/${color} Units/Lancer/Lancer_Idle.png`);
  const portrait = await sharp(idlePng).extract({ left: geometry[0].left, top: 124,
    width: geometry[0].width, height: geometry[0].top + geometry[0].height - 124 })
    .webp({ lossless: true, effort: 6 }).toBuffer();
  const name = color.toLowerCase();
  await writeFile(new URL(`lancer-${name}.webp`, output), webp);
  await writeFile(new URL(`lancer-${name}-art.webp`, output), portrait);
  report.push({ color, hashes, atlasBytes: webp.length, portraitBytes: portrait.length,
    hash: digest(webp), portraitHash: digest(portrait) });
  console.log(`${color}: ${webp.length} atlas + ${portrait.length} portrait bytes; all visible pixels lossless.`);
}

const sourceRects = Object.fromEntries(geometry.map((frame, index) => [index, {
  x: index % columns * cellWidth, y: Math.floor(index / columns) * cellHeight,
  width: frame.width, height: frame.height,
}]));
const compactSourceRects = { 0: { ...sourceRects[0], y: 124 - geometry[0].top,
  height: geometry[0].top + geometry[0].height - 124 } };
const metadata = {
  layout: { columns, rows }, bodyHeight: 68 / cellHeight,
  baselines: geometry.map(frame => (frame.baseline - frame.top) / cellHeight),
  centers: geometry.map(frame => (frame.center - frame.left) / cellWidth),
  sourceRects, compactSourceRects,
};
await writeFile(new URL('../lancer-art.ts', import.meta.url), lancerArtSource(colors, metadata));
await writeFile(new URL('SOURCES.md', output), `# Native Tiny Swords Lancer\n\nSource pack: Pixel Frog, \`${sourceRoot}/<Color> Units/Lancer/\`.\nOriginal assets are never modified. Five palettes cover personal levels 1–49, 50–99, 100–249, 250–499, 500+.\n\nThe runtime atlas contains 12 Idle, 6 Run, then three frames each of Right, DownRight, Down, UpRight and Up Attack. Defence frames are not shipped. Left angles mirror the matching right angle. Each native 320px frame is tightly cropped without resizing and placed into a 168×160 cell in a 6×6 atlas (1008×960px). Crops retain every visible pixel. The last three cells are empty.\n\nThe build verifies matching silhouettes and ground-shadow anchors across all palettes and compares every visible RGBA pixel after lossless WebP encoding. Ground origins follow the native shadow centre/bottom, preventing the body's differing directional padding from moving its feet. The body height is 68 native pixels rendered at 34 game pixels (the same 0.5 source-pixel scale as the other infantry). Battle views retain the whole spear. Menu portraits and the static formation idle crop at native y=124 so the tall upright tip does not cross another row or force the body to half size; they retain the helmet, body, lower shaft and shadow.\n\nRecreate: \`node king-defense-toon/scripts/prepare-lancer-art.mjs\`.\n\n| Palette | Atlas bytes | Portrait bytes | Atlas SHA-256 | Portrait SHA-256 |\n| --- | ---: | ---: | --- | --- |\n${report.map(item => `| ${item.color} | ${item.atlasBytes} | ${item.portraitBytes} | ${item.hash} | ${item.portraitHash} |`).join('\n')}\n\nTotal runtime art: **${report.reduce((sum, item) => sum + item.atlasBytes + item.portraitBytes, 0)} bytes**.\n\n| Source | PNG bytes | SHA-256 |\n| --- | ---: | --- |\n${report.flatMap(item => item.hashes.map(source => `| ${item.color}/Lancer_${source.name}.png | ${source.bytes} | ${source.hash} |`)).join('\n')}\n`);

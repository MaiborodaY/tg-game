import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { UNIT_RANK_ASSETS } from '../rank-art.ts';
import { LANCER_ASSETS } from '../lancer-art.ts';

const knightColors = new Map([
  ['64,78,117', [67, 64, 85]], ['62,134,152', [94, 111, 134]], ['90,179,172', [140, 150, 149]],
]);
const monkColors = new Map([
  ['72,88,132', [67, 64, 85]], ['70,151,172', [94, 111, 134]],
]);
const lancerColors = new Map([...monkColors,
  ['104,140,138', [90, 99, 102]], ['156,190,170', [140, 150, 149]], ['212,237,194', [184, 193, 195]],
]);

test('Black sprites retain every frame alpha pixel and change only the intended authored colors', async () => {
  const pairs = [
    ['swordsman', new URL('../assets/tiny-swords-warrior-blue.png', import.meta.url), UNIT_RANK_ASSETS.swordsman[5].sheet, knightColors],
    ['archer', new URL('../assets/tiny-swords-archer-blue.png', import.meta.url), UNIT_RANK_ASSETS.archer[5].sheet, knightColors],
    ...[['Idle', 'sheet'], ['Run', 'walk'], ['Heal', 'cast']].map(([strip, key]) =>
      [`healer ${strip}`, new URL(`../assets/tiny-monk/${strip}.png`, import.meta.url), UNIT_RANK_ASSETS.healer[5][key], monkColors]),
    ['lancer', new URL(LANCER_ASSETS[1].sheet), LANCER_ASSETS[5].sheet, lancerColors],
    ['lancer portrait', new URL(LANCER_ASSETS[1].art), LANCER_ASSETS[5].art, lancerColors],
  ];
  for (const [label, originalUrl, blackUrl, replacements] of pairs) {
    const [original, black] = await Promise.all([originalUrl, new URL(blackUrl)]
      .map(url => sharp(fileURLToPath(url)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })));
    assert.deepEqual(black.info, original.info, `${label}: unchanged sheet geometry`);
    const expected = Buffer.from(original.data);
    let changed = 0;
    for (let index = 0; index < expected.length; index += 4) {
      if (!expected[index + 3]) {
        // Lossless WebP can canonicalize invisible RGB; alpha and all visible pixels are exact.
        expected.fill(0, index, index + 3);
        black.data.fill(0, index, index + 3);
        continue;
      }
      const color = expected.subarray(index, index + 3).join(',');
      const replacement = replacements.get(color);
      if (replacement) { expected.set(replacement, index); changed++; }
    }
    assert.ok(changed > 100, `${label}: the Black clothing is present`);
    assert.deepEqual(black.data, expected, `${label}: preserve all non-palette pixels, silhouettes and shadows`);
  }
});

test('Black menu art shows the same first-frame colors as its animation sheets', async () => {
  for (const type of ['swordsman', 'archer', 'healer']) {
    const asset = UNIT_RANK_ASSETS[type][5];
    const firstFrame = await sharp(fileURLToPath(asset.sheet))
      .extract({ left: 0, top: 0, width: 192, height: 192 }).png().toBuffer();
    const expected = await sharp(firstFrame).trim({ threshold: 0 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const portrait = await sharp(fileURLToPath(asset.art))
      .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([portrait.info.width, portrait.info.height, portrait.info.channels],
      [expected.info.width, expected.info.height, expected.info.channels], `${type}: portrait crop dimensions`);
    assert.deepEqual(portrait.data, expected.data, `${type}: matching portrait palette`);
  }
});

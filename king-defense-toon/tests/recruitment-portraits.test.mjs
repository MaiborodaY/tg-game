import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { PANTHER_RIDER_ASSETS } from '../panther-rider-art.ts';
import {
  PANTHER_RIDER_PALETTES, RECRUITMENT_PORTRAITS, readPortraitFrame,
  tintRiderPortrait, isRiderPortraitClothing, renderPortrait,
} from '../scripts/export-recruitment-portraits.mjs';

test('all four elf previews use authored idle portraits; every rider rank uses the new glaive model', async () => {
  assert.deepEqual(RECRUITMENT_PORTRAITS.map(portrait => portrait.name), ['panther-rider', 'elf-archer', 'elf-healer', 'unicorn']);
  assert.match(RECRUITMENT_PORTRAITS[0].manifest, /glaive-v2\/panther-glaive-rider-512\.frames\.json$/);
  assert.match(RECRUITMENT_PORTRAITS[2].manifest, /healer\/elf-healer-512\.frames\.json$/);
  let totalBytes = 0;
  for (const definition of RECRUITMENT_PORTRAITS) {
    const source = await readPortraitFrame(definition);
    assert.equal(source.frame.index, 0);
    const palettes = definition.name === 'panther-rider' ? PANTHER_RIDER_PALETTES : [{ rgb: null }];
    let silhouette;
    for (const [index, palette] of palettes.entries()) {
      const expected = await renderPortrait({ ...source, data: palette.rgb ? tintRiderPortrait(source, palette.rgb) : source.data });
      const url = definition.name === 'panther-rider' ? new URL(PANTHER_RIDER_ASSETS[index + 1].art)
        : new URL(`../assets/recruitment/${definition.name}.webp`, import.meta.url);
      const image = await readFile(url);
      assert.deepEqual(image, expected.image, `${definition.name} rank ${index + 1}: checked-in portrait matches its approved source`);
      const { data, info } = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      assert.deepEqual([info.width, info.height], [96, 96]);
      let opaque = 0;
      const alpha = [];
      for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) {
        const value = data[(y * 96 + x) * 4 + 3];
        // Near-lossless WebP may quantize alpha by 1–2, but must not change occupied pixels.
        alpha.push(value > 0);
        if (value > 1) opaque++;
        if (x < 4 || y < 4 || x >= 92 || y >= 92) assert.equal(value, 0, 'No clipping against the portrait edge');
      }
      assert.ok(opaque > 1_000, 'The character is visible, not an empty/failed export');
      if (silhouette) assert.deepEqual(alpha, silhouette, 'Rank colors do not resize, crop or move the model');
      silhouette = alpha;
      totalBytes += image.length;
    }
  }
  assert.ok(totalBytes <= 80_000, `All eight static portraits stay below 80 KB: ${totalBytes}`);
});

test('glaive portrait palettes recolor only clothing and preserve face, weapon, panther and source pixels', async () => {
  const source = await readPortraitFrame(RECRUITMENT_PORTRAITS[0]);
  const original = Buffer.from(source.data);
  for (const { rgb } of PANTHER_RIDER_PALETTES.slice(1)) {
    const recolored = tintRiderPortrait(source, rgb);
    let changed = 0;
    for (let offset = 0; offset < original.length; offset += 4) {
      assert.equal(recolored[offset + 3], original[offset + 3]);
      if (original.subarray(offset, offset + 4).equals(recolored.subarray(offset, offset + 4))) continue;
      const x = offset / 4 % source.info.width, y = Math.floor(offset / 4 / source.info.width);
      assert.ok(isRiderPortraitClothing(original.subarray(offset, offset + 4), x, y, source.frame));
      assert.ok(y >= 58 && y <= 107 && x >= 38 && x <= 86, 'Face/glaive above the cloth and mount eyes to its right remain unchanged');
      changed++;
    }
    assert.ok(changed > 100, 'All rank colors are visible');
  }
  assert.deepEqual(source.data, original, 'Generating palettes never mutates the supplied image');
});

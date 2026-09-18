import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { PANTHER_RIDER_ASSETS, PANTHER_RIDER_GEOMETRY } from '../panther-rider-art.ts';
import { pantherRiderFrame } from '../panther-rider-animation.ts';
import { allyDeathOpacity } from '../ally-animation.ts';
import { isPantherRiderClothing, pantherRiderArtSource } from '../scripts/prepare-panther-rider-art.mjs';

const packUrl = new URL('../../art/brotd-infinity/allies/elves/panther-rider/panther-rider-768.frames.json', import.meta.url);
const pack = JSON.parse(await readFile(packUrl, 'utf8'));

test('rider preserves the supplied irregular crops and foot anchors without inventing frames', async () => {
  const geometry = PANTHER_RIDER_GEOMETRY;
  assert.deepEqual(geometry.layout, { columns: 4, rows: 4 });
  assert.equal(pack.frames.length, 16);
  assert.equal(Object.keys(geometry.sourceRects).length, 16);
  for (const { index, rect, footAnchor } of pack.frames) {
    assert.deepEqual(geometry.sourceRects[index], rect);
    assert.equal(geometry.centers[index] * 192 + index % 4 * 192, rect.x + footAnchor.x);
    assert.equal(geometry.baselines[index] * 192 + Math.floor(index / 4) * 192, rect.y + footAnchor.y);
    assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= 768 && rect.y + rect.height <= 768);
  }
  assert.equal((await readFile(new URL('../panther-rider-art.ts', import.meta.url), 'utf8')).replaceAll('\r\n', '\n'), pantherRiderArtSource(pack));
});

test('rider strike peak follows damage, west mirrors the same poses, and death uses the normal fade', () => {
  assert.equal(pantherRiderFrame(null, 0), 0);
  assert.equal(pantherRiderFrame({ action: 'idle' }, .75), 3);
  assert.equal(pantherRiderFrame({ action: 'walk', walkTime: .5 }), 7);
  for (const [facingX, facingY, start] of [[1, 0, 8], [-1, 0, 8], [0, -1, 8], [0, 1, 12]]) {
    const actor = { action: 'attack', facingX, facingY, actionDuration: 1, impactFraction: .42 };
    assert.equal(pantherRiderFrame({ ...actor, actionTime: 0 }), start);
    assert.equal(pantherRiderFrame({ ...actor, actionTime: .419 }), start + 1);
    assert.equal(pantherRiderFrame({ ...actor, actionTime: .42 }), start + 2);
    assert.equal(pantherRiderFrame({ ...actor, actionTime: .99 }), start + 3);
  }
  assert.equal(pantherRiderFrame({ action: 'dead', deathTime: .5 }, 1), 0);
  assert.ok(allyDeathOpacity({ action: 'dead', deathTime: .5 }) < 1);
  assert.equal(allyDeathOpacity({ action: 'dead', deathTime: 1 }), 0);
});

test('rider palettes preserve mount, skin, weapon, silhouettes and every alpha pixel', async () => {
  const decode = url => sharp(fileURLToPath(new URL(url))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const source = await decode(PANTHER_RIDER_ASSETS[1].sheet);
  const frameByPixel = new Uint8Array(768 * 768);
  for (const frame of pack.frames) for (let y = frame.rect.y; y < frame.rect.y + frame.rect.height; y++) {
    frameByPixel.fill(frame.index, y * 768 + frame.rect.x, y * 768 + frame.rect.x + frame.rect.width);
  }
  for (const rank of [2, 3, 4, 5]) {
    const variant = await decode(PANTHER_RIDER_ASSETS[rank].sheet);
    assert.deepEqual(variant.info, source.info);
    let changed = 0;
    for (let index = 0; index < source.data.length; index += 4) {
      assert.equal(variant.data[index + 3], source.data[index + 3]);
      if (!source.data[index + 3]) continue;
      const original = source.data.subarray(index, index + 4);
      const actual = variant.data.subarray(index, index + 4);
      if (original.equals(actual)) continue;
      const pixel = index / 4, x = pixel % 768, y = Math.floor(pixel / 768);
      const frame = pack.frames[frameByPixel[pixel]];
      assert.ok(isPantherRiderClothing(original, x, y, frame), `rank ${rank}: changed non-clothing pixel ${x},${y}`);
      if (frame.action === 'attack-down') assert.ok(y <= frame.rect.y + frame.footAnchor.y - 60, 'frontal mount and green eyes remain unchanged');
      changed++;
    }
    assert.ok(changed > 100, `rank ${rank}: visibly distinct clothing`);
    const { x: left, y: top, width, height } = pack.frames[0].rect;
    const firstFrame = await sharp(fileURLToPath(new URL(PANTHER_RIDER_ASSETS[rank].sheet)))
      .extract({ left, top, width, height }).png().toBuffer();
    const expected = await sharp(firstFrame).trim({ threshold: 0 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const portrait = await decode(PANTHER_RIDER_ASSETS[rank].art);
    assert.deepEqual([portrait.info.width, portrait.info.height, portrait.info.channels],
      [expected.info.width, expected.info.height, expected.info.channels], 'portrait crop matches the idle frame');
    for (let i = 0; i < expected.data.length; i += 4) {
      assert.equal(portrait.data[i + 3], expected.data[i + 3]);
      if (expected.data[i + 3]) assert.deepEqual(portrait.data.subarray(i, i + 3), expected.data.subarray(i, i + 3));
    }
  }
});

test('rider body fits a compact formation cell at the intended 47px reference size', async () => {
  const { data, info } = await sharp(fileURLToPath(new URL(PANTHER_RIDER_ASSETS[1].sheet))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const frame = pack.frames[0], scale = 47 / (PANTHER_RIDER_GEOMETRY.bodyHeight * 192);
  let left = 768, top = 768, right = 0, bottom = 0;
  for (let y = frame.rect.y; y < frame.rect.y + frame.rect.height; y++) for (let x = frame.rect.x; x < frame.rect.x + frame.rect.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] < 20) continue;
    left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
  }
  const ground = frame.rect.y + frame.footAnchor.y;
  assert.ok((right - left + 1) * scale < 58, 'mounted silhouette stays within one formation column');
  assert.ok((ground - top) * scale < 51, 'HP and level stay above the head and sabre');
  assert.ok((bottom - ground) * scale < 5, 'paws remain in the same cell');
});

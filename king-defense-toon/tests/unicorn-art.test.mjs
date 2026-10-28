import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { UNICORN_ASSETS, UNICORN_GEOMETRY, UNICORN_RENDER_HEIGHT } from '../unicorn-art.ts';
import { unicornFrame } from '../unicorn-animation.ts';
import { isUnicornClothing, unicornArtSource } from '../scripts/prepare-unicorn-art.mjs';

const manifest = new URL('../../art/brotd-infinity/allies/elves/battle-unicorn/battle-unicorn-512.frames.json', import.meta.url);
const pack = JSON.parse(await readFile(manifest, 'utf8'));
const decode = url => sharp(fileURLToPath(new URL(url))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

test('unicorn preserves all approved 512px crops and foot anchors at the mounted body scale', async () => {
  assert.equal(pack.impactPose, 2); assert.equal(pack.anchorSpace, 'frame-pixels');
  assert.equal(UNICORN_RENDER_HEIGHT, 47); assert.equal(pack.frames.length, 16);
  assert.deepEqual(UNICORN_GEOMETRY.layout, { columns: 4, rows: 4 });
  for (const { index, rect, footAnchor } of pack.frames) {
    assert.deepEqual(UNICORN_GEOMETRY.sourceRects[index], rect);
    assert.equal(UNICORN_GEOMETRY.centers[index] * 128 + index % 4 * 128, rect.x + footAnchor.x);
    assert.equal(UNICORN_GEOMETRY.baselines[index] * 128 + Math.floor(index / 4) * 128, rect.y + footAnchor.y);
  }
  assert.deepEqual(await readFile(new URL(UNICORN_ASSETS[1].sheet)), await readFile(new URL(pack.image, manifest)));
  assert.equal((await readFile(new URL('../unicorn-art.ts', import.meta.url), 'utf8')).replaceAll('\r\n', '\n'), unicornArtSource(pack));
  const source = await decode(UNICORN_ASSETS[1].sheet), idle = pack.frames[0];
  let top = 512, left = 512, right = 0;
  for (let y = 0; y < idle.rect.height; y++) for (let x = 0; x < idle.rect.width; x++) {
    if (source.data[(y * 512 + x) * 4 + 3] < 20) continue;
    top = Math.min(top, y); left = Math.min(left, x); right = Math.max(right, x);
  }
  const scale = UNICORN_RENDER_HEIGHT / (UNICORN_GEOMETRY.bodyHeight * 128);
  assert.ok((idle.footAnchor.y - top) * scale <= 49, 'body remains compact for the two-cell mount');
  assert.ok((right - left + 1) * scale < 75, 'entire silhouette fits two formation columns');
  assert.ok((idle.footAnchor.y - top) * scale < 51, 'HP and personal level stay above the horn');
});

test('elf casting reaches the authored release pose exactly on impact in side and down rows', () => {
  assert.equal(unicornFrame(null, 0), 0); assert.equal(unicornFrame({ action: 'idle' }, .75), 3);
  assert.equal(unicornFrame({ action: 'walk', walkTime: 1 / 6 }), 5);
  for (const [facingX, facingY, start] of [[1, 0, 8], [-1, 0, 8], [0, -1, 8], [0, 1, 12]]) {
    const actor = { action: 'attack', facingX, facingY, actionDuration: .8, impactFraction: .5 };
    for (const [actionTime, pose] of [[0, 0], [.199, 0], [.2, 1], [.399, 1], [.4, 2], [.599, 2], [.601, 3], [.8, 3]]) {
      assert.equal(unicornFrame({ ...actor, actionTime }), start + pose);
    }
    assert.equal(unicornFrame({ ...actor, actionDuration: .8 / .85, actionTime: .4 / .85 }), start + 2);
  }
  assert.equal(unicornFrame({ action: 'dead', deathTime: .5 }, 8), 0);
});

test('five elf palettes change cloth only, keeping white coat, mane, armor, horn and every alpha pixel', async () => {
  const source = await decode(UNICORN_ASSETS[1].sheet);
  assert.deepEqual([source.info.width, source.info.height], [512, 512]);
  for (const rank of [2, 3, 4, 5]) {
    const variant = await decode(UNICORN_ASSETS[rank].sheet); assert.deepEqual(variant.info, source.info);
    let changed = 0;
    for (const frame of pack.frames) {
      const { x: left, y: top, width, height } = frame.rect;
      for (let y = top; y < top + height; y++) for (let x = left; x < left + width; x++) {
        const offset = (y * 512 + x) * 4;
        assert.equal(variant.data[offset + 3], source.data[offset + 3]);
        if (!source.data[offset + 3]) continue;
        const original = source.data.subarray(offset, offset + 4), actual = variant.data.subarray(offset, offset + 4);
        if (original.equals(actual)) continue;
        assert.ok(isUnicornClothing(original, x, y, frame), `rank ${rank}: changed non-cloth at ${x},${y}`);
        assert.ok(y >= frame.rect.y + frame.footAnchor.y - 41, 'upper mane remains unchanged'); changed++;
      }
    }
    assert.ok(changed > 1000, `rank ${rank}: visible clothes palette`);
  }
});

test('elf rank portraits are compact transparent icons and base uses the existing approved menu portrait', async () => {
  assert.match(UNICORN_ASSETS[1].art, /assets\/recruitment\/unicorn\.webp$/);
  for (const rank of [1, 2, 3, 4, 5]) {
    const { data, info } = await decode(UNICORN_ASSETS[rank].art);
    assert.deepEqual([info.width, info.height], [96, 96]);
    for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) {
      if (x < 4 || x >= 92 || y < 4 || y >= 92) assert.equal(data[(y * 96 + x) * 4 + 3], 0);
    }
  }
});

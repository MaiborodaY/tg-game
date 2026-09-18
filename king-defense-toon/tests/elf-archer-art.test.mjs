import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { ELF_ARCHER_ASSETS, ELF_ARCHER_GEOMETRY, ELF_ARCHER_RENDER_HEIGHT } from '../elf-archer-art.ts';
import { elfArcherFrame } from '../elf-archer-animation.ts';
import { isElfArcherClothing, elfArcherArtSource } from '../scripts/prepare-elf-archer-art.mjs';

const manifest = new URL('../../art/brotd-infinity/allies/elves/archer/elf-archer-512.frames.json', import.meta.url);
const pack = JSON.parse(await readFile(manifest, 'utf8'));
const decode = url => sharp(fileURLToPath(new URL(url))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

test('elf archer preserves all approved 512px crops and foot anchors at the human archer body scale', async () => {
  assert.equal(pack.releasePose, 2); assert.equal(pack.anchorSpace, 'frame-pixels');
  assert.equal(ELF_ARCHER_RENDER_HEIGHT, 38); assert.equal(pack.frames.length, 16);
  assert.deepEqual(ELF_ARCHER_GEOMETRY.layout, { columns: 4, rows: 4 });
  for (const { index, rect, footAnchor } of pack.frames) {
    assert.deepEqual(ELF_ARCHER_GEOMETRY.sourceRects[index], rect);
    assert.equal(ELF_ARCHER_GEOMETRY.centers[index] * 128 + index % 4 * 128, rect.x + footAnchor.x);
    assert.equal(ELF_ARCHER_GEOMETRY.baselines[index] * 128 + Math.floor(index / 4) * 128, rect.y + footAnchor.y);
  }
  assert.deepEqual(await readFile(new URL(ELF_ARCHER_ASSETS[1].sheet)), await readFile(new URL(pack.image, manifest)));
  assert.equal((await readFile(new URL('../elf-archer-art.ts', import.meta.url), 'utf8')).replaceAll('\r\n', '\n'), elfArcherArtSource(pack));
  const source = await decode(ELF_ARCHER_ASSETS[1].sheet), idle = pack.frames[0];
  let top = 512, left = 512, right = 0;
  for (let y = 0; y < idle.rect.height; y++) for (let x = 0; x < idle.rect.width; x++) {
    if (source.data[(y * 512 + x) * 4 + 3] < 20) continue;
    top = Math.min(top, y); left = Math.min(left, x); right = Math.max(right, x);
  }
  const scale = ELF_ARCHER_RENDER_HEIGHT / (ELF_ARCHER_GEOMETRY.bodyHeight * 128);
  assert.ok((idle.footAnchor.y - top) * scale <= 39, 'body matches ordinary archer scale');
  assert.ok((right - left + 1) * scale < 58, 'entire silhouette fits one formation column');
  assert.ok((idle.footAnchor.y - top) * scale < 42, 'HP and personal level stay above the ponytail');
});

test('elf shooting releases on pose 2 in both authored rows and remains arrow-free through recovery', () => {
  assert.equal(elfArcherFrame(null, 0), 0); assert.equal(elfArcherFrame({ action: 'idle' }, .75), 3);
  assert.equal(elfArcherFrame({ action: 'walk', walkTime: .125 }), 5);
  for (const [facingX, facingY, start] of [[1, 0, 8], [-1, 0, 8], [0, -1, 8], [0, 1, 12]]) {
    const actor = { action: 'shoot', facingX, facingY, actionDuration: .7, impactFraction: .5 };
    for (const [actionTime, pose] of [[0, 0], [.174, 0], [.175, 1], [.349, 1], [.35, 2], [.524, 2], [.526, 3], [.7, 3]]) {
      assert.equal(elfArcherFrame({ ...actor, actionTime }), start + pose);
    }
    assert.equal(elfArcherFrame({ ...actor, actionDuration: .7 / .85, actionTime: .35 / .85 }), start + 2);
  }
  assert.equal(elfArcherFrame({ action: 'dead', deathTime: .5 }, 8), 0);
});

test('five elf palettes change cloth only, keeping skin, hair, wooden bow, arrows and every alpha pixel', async () => {
  const source = await decode(ELF_ARCHER_ASSETS[1].sheet);
  assert.deepEqual([source.info.width, source.info.height], [512, 512]);
  for (const rank of [2, 3, 4, 5]) {
    const variant = await decode(ELF_ARCHER_ASSETS[rank].sheet); assert.deepEqual(variant.info, source.info);
    let changed = 0;
    for (const frame of pack.frames) {
      const { x: left, y: top, width, height } = frame.rect;
      for (let y = top; y < top + height; y++) for (let x = left; x < left + width; x++) {
        const offset = (y * 512 + x) * 4;
        assert.equal(variant.data[offset + 3], source.data[offset + 3]);
        if (!source.data[offset + 3]) continue;
        const original = source.data.subarray(offset, offset + 4), actual = variant.data.subarray(offset, offset + 4);
        if (original.equals(actual)) continue;
        assert.ok(isElfArcherClothing(original, x, y, frame), `rank ${rank}: changed non-cloth at ${x},${y}`);
        assert.ok(y >= frame.rect.y + frame.footAnchor.y - 54, 'face and ponytail remain unchanged'); changed++;
      }
    }
    assert.ok(changed > 1000, `rank ${rank}: visible clothes palette`);
  }
});

test('elf rank portraits are compact transparent icons and base uses the existing approved menu portrait', async () => {
  assert.match(ELF_ARCHER_ASSETS[1].art, /assets\/recruitment\/elf-archer\.webp$/);
  for (const rank of [1, 2, 3, 4, 5]) {
    const { data, info } = await decode(ELF_ARCHER_ASSETS[rank].art);
    assert.deepEqual([info.width, info.height], [96, 96]);
    for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) {
      if (x < 4 || x >= 92 || y < 4 || y >= 92) assert.equal(data[(y * 96 + x) * 4 + 3], 0);
    }
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { ELF_HEALER_ASSETS, ELF_HEALER_GEOMETRY, ELF_HEALER_RENDER_HEIGHT, ELF_HEAL_PULSE_IMAGE_URL, ELF_HEAL_PULSE_FRAMES } from '../elf-healer-art.ts';
import { elfHealerFrame } from '../elf-healer-animation.ts';
import { isElfHealerClothing, elfHealerArtSource } from '../scripts/prepare-elf-healer-art.mjs';

const manifest = new URL('../../art/brotd-infinity/allies/elves/healer/elf-healer-512.frames.json', import.meta.url);
const pack = JSON.parse(await readFile(manifest, 'utf8'));
const pulse = JSON.parse(await readFile(new URL('elf-healer-pulse-128.frames.json', manifest), 'utf8'));
const decode = url => sharp(fileURLToPath(new URL(url))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

test('elf healer preserves all approved 512px crops and foot anchors at the human monk body scale', async () => {
  assert.equal(pack.healPose, 2); assert.equal(pack.anchorSpace, 'frame-pixels');
  assert.equal(ELF_HEALER_RENDER_HEIGHT, 35); assert.equal(pack.frames.length, 16);
  assert.deepEqual(ELF_HEALER_GEOMETRY.layout, { columns: 4, rows: 4 });
  for (const { index, rect, footAnchor } of pack.frames) {
    assert.deepEqual(ELF_HEALER_GEOMETRY.sourceRects[index], rect);
    assert.equal(ELF_HEALER_GEOMETRY.centers[index] * 128 + index % 4 * 128, rect.x + footAnchor.x);
    assert.equal(ELF_HEALER_GEOMETRY.baselines[index] * 128 + Math.floor(index / 4) * 128, rect.y + footAnchor.y);
  }
  assert.deepEqual(await readFile(new URL(ELF_HEALER_ASSETS[1].sheet)), await readFile(new URL(pack.image, manifest)));
  assert.equal((await readFile(new URL('../elf-healer-art.ts', import.meta.url), 'utf8')).replaceAll('\r\n', '\n'), elfHealerArtSource(pack, pulse));
  const source = await decode(ELF_HEALER_ASSETS[1].sheet), idle = pack.frames[0];
  let top = 512, left = 512, right = 0;
  for (let y = 0; y < idle.rect.height; y++) for (let x = 0; x < idle.rect.width; x++) {
    if (source.data[(y * 512 + x) * 4 + 3] < 20) continue;
    top = Math.min(top, y); left = Math.min(left, x); right = Math.max(right, x);
  }
  const scale = ELF_HEALER_RENDER_HEIGHT / (ELF_HEALER_GEOMETRY.bodyHeight * 128);
  assert.ok((idle.footAnchor.y - top) * scale <= 39, 'body matches ordinary archer scale');
  assert.ok((right - left + 1) * scale < 58, 'entire silhouette fits one formation column');
  assert.ok((idle.footAnchor.y - top) * scale < 42, 'HP and personal level stay above the hood');
});

test('elf casting reaches the authored release pose exactly on impact in side and down rows', () => {
  assert.equal(elfHealerFrame(null, 0), 0); assert.equal(elfHealerFrame({ action: 'idle' }, .75), 3);
  assert.equal(elfHealerFrame({ action: 'walk', walkTime: .125 }), 5);
  for (const [facingX, facingY, start] of [[1, 0, 8], [-1, 0, 8], [0, -1, 8], [0, 1, 12]]) {
    const actor = { action: 'heal', facingX, facingY, actionDuration: .8, impactFraction: .5 };
    for (const [actionTime, pose] of [[0, 0], [.199, 0], [.2, 1], [.399, 1], [.4, 2], [.599, 2], [.601, 3], [.8, 3]]) {
      assert.equal(elfHealerFrame({ ...actor, actionTime }), start + pose);
    }
    assert.equal(elfHealerFrame({ ...actor, actionDuration: .8 / .85, actionTime: .4 / .85 }), start + 2);
  }
  assert.equal(elfHealerFrame({ action: 'dead', deathTime: .5 }, 8), 0);
});

test('five elf palettes change cloth only, keeping skin, hood, wooden staff, crystal and every alpha pixel', async () => {
  const source = await decode(ELF_HEALER_ASSETS[1].sheet);
  assert.deepEqual([source.info.width, source.info.height], [512, 512]);
  for (const rank of [2, 3, 4, 5]) {
    const variant = await decode(ELF_HEALER_ASSETS[rank].sheet); assert.deepEqual(variant.info, source.info);
    let changed = 0;
    for (const frame of pack.frames) {
      const { x: left, y: top, width, height } = frame.rect;
      for (let y = top; y < top + height; y++) for (let x = left; x < left + width; x++) {
        const offset = (y * 512 + x) * 4;
        assert.equal(variant.data[offset + 3], source.data[offset + 3]);
        if (!source.data[offset + 3]) continue;
        const original = source.data.subarray(offset, offset + 4), actual = variant.data.subarray(offset, offset + 4);
        if (original.equals(actual)) continue;
        assert.ok(isElfHealerClothing(original, x, y, frame), `rank ${rank}: changed non-cloth at ${x},${y}`);
        assert.ok(y >= frame.rect.y + frame.footAnchor.y - 43, 'face and hood remain unchanged'); changed++;
      }
    }
    assert.ok(changed > 1000, `rank ${rank}: visible clothes palette`);
  }
});

test('elf rank portraits are compact transparent icons and base uses the existing approved menu portrait', async () => {
  assert.match(ELF_HEALER_ASSETS[1].art, /assets\/recruitment\/elf-healer\.webp$/);
  for (const rank of [1, 2, 3, 4, 5]) {
    const { data, info } = await decode(ELF_HEALER_ASSETS[rank].art);
    assert.deepEqual([info.width, info.height], [96, 96]);
    for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) {
      if (x < 4 || x >= 92 || y < 4 || y >= 92) assert.equal(data[(y * 96 + x) * 4 + 3], 0);
    }
  }
});


test('the compact four-frame pulse preserves ground anchors and never enters the startup JavaScript',async()=>{
 assert.match(ELF_HEAL_PULSE_IMAGE_URL,/\?no-inline$/);
 assert.deepEqual(ELF_HEAL_PULSE_FRAMES,pulse.frames.map(({rect,groundAnchor})=>({rect,groundAnchor})));
 const meta=await sharp(fileURLToPath(ELF_HEAL_PULSE_IMAGE_URL)).metadata();
 assert.deepEqual([meta.width,meta.height],[128,128]);
 assert.deepEqual(await readFile(new URL(ELF_HEAL_PULSE_IMAGE_URL)),await readFile(new URL(pulse.image,manifest)));
});

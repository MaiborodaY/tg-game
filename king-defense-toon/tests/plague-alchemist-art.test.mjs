import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { PLAGUE_ALCHEMIST_FRAMES, PLAGUE_ALCHEMIST_METADATA, POISON_BOTTLE_FRAMES, POISON_IMPACT_FRAMES,
  PLAGUE_ALCHEMIST_IMAGE_URL, POISON_BOTTLE_IMAGE_URL, POISON_IMPACT_IMAGE_URL, plagueAlchemistReleasePoint } from '../plague-alchemist-art.ts';
import { plagueAlchemistFrame, poisonBottleFrame, poisonImpactFrame } from '../plague-alchemist-animation.ts';

const sources = new URL('../../art/brotd-infinity/level-02/enemies/plague-alchemist/', import.meta.url);
const pack = async name => JSON.parse(await readFile(new URL(name, sources), 'utf8'));
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

test('alchemist preserves every approved irregular crop, sole anchor and empty-hand release anchor', async () => {
  const source = await pack('plague-alchemist-512.frames.json');
  assert.equal(source.releasePose, 2);
  assert.equal(source.anchorSpace, 'frame-pixels');
  assert.equal(PLAGUE_ALCHEMIST_FRAMES.length, 16);
  assert.equal(PLAGUE_ALCHEMIST_METADATA.renderHeight, 40);
  for (const { index, rect, footAnchor, projectileAnchor } of source.frames) {
    assert.deepEqual(PLAGUE_ALCHEMIST_FRAMES[index], { rect, footAnchor, ...(projectileAnchor ? { projectileAnchor } : {}) });
    assert.deepEqual(PLAGUE_ALCHEMIST_METADATA.sourceRects[index], rect);
    close(PLAGUE_ALCHEMIST_METADATA.centers[index] * 128 + index % 4 * 128, rect.x + footAnchor.x);
    close(PLAGUE_ALCHEMIST_METADATA.baselines[index] * 128 + Math.floor(index / 4) * 128, rect.y + footAnchor.y);
  }
  assert.deepEqual(PLAGUE_ALCHEMIST_FRAMES.flatMap((frame, index) => frame.projectileAnchor ? [index] : []), [10, 14]);
  for (const [name, frames] of [['poison-bottle-128.frames.json', POISON_BOTTLE_FRAMES], ['poison-impact-128.frames.json', POISON_IMPACT_FRAMES]]) {
    const source = await pack(name);
    assert.deepEqual(frames, source.frames.map(({ rect, centerAnchor }) => ({ rect, centerAnchor })));
  }
});

test('the three small runtime atlases are exact copies of the approved exports', async () => {
  let bytes = 0;
  for (const [url, name, size] of [[PLAGUE_ALCHEMIST_IMAGE_URL, 'plague-alchemist-512-lite.webp', 512],
    [POISON_BOTTLE_IMAGE_URL, 'poison-bottle-128-lite.webp', 128], [POISON_IMPACT_IMAGE_URL, 'poison-impact-128-lite.webp', 128]]) {
    const data = await readFile(new URL(url));
    assert.deepEqual(data, await readFile(new URL(name, sources)));
    const metadata = await sharp(fileURLToPath(new URL(url))).metadata();
    assert.equal(metadata.width, size); assert.equal(metadata.height, size); assert.equal(metadata.hasAlpha, true);
    bytes += data.length;
  }
  assert.equal(bytes, 92960);
});

test('throw poses release exactly once at combat impact and keep the hand empty through recovery', () => {
  for (const [facingX, facingY, start] of [[1, 0, 8], [-1, 0, 8], [0, -1, 8], [0, 1, 12]]) {
    const actor = { action: 'shoot', actionDuration: .8, impactFraction: .5, facingX, facingY };
    for (const [time, pose] of [[0, 0], [.199, 0], [.2, 1], [.399, 1], [.4, 2], [.59, 2], [.61, 3], [.8, 3]]) {
      assert.equal(plagueAlchemistFrame({ ...actor, actionTime: time }), start + pose);
    }
    assert.equal(plagueAlchemistFrame({ ...actor, actionDuration: .8 / .85, actionTime: .4 / .85 }), start + 2);
  }
  assert.equal(plagueAlchemistFrame({ action: 'dead' }, 10), 0);
  assert.equal(plagueAlchemistFrame({ action: 'idle' }, .75), 3);
  assert.equal(plagueAlchemistFrame({ action: 'walk', walkTime: .375 }), 7);
  assert.equal(poisonBottleFrame(1 / 12), 1); assert.equal(poisonBottleFrame(4 / 12), 0);
  assert.deepEqual([0, .25, .5, .75, 1, 9].map(poisonImpactFrame), [0, 1, 2, 3, 3, 3], 'impact never loops');
});

test('projectile begins at the authored empty hand in side, mirrored side and down views', () => {
  const feet = { x: 100, y: 150 }, scale = 40 / 104;
  const right = plagueAlchemistReleasePoint(feet, { x: 200, y: 150 });
  close(right.x, 100 + 64 * scale); close(right.y, 150 - 50 * scale);
  const left = plagueAlchemistReleasePoint(feet, { x: 0, y: 150 });
  close(left.x, 100 - 64 * scale); close(left.y, right.y);
  const down = plagueAlchemistReleasePoint(feet, { x: 100, y: 250 }, 1.3);
  close(down.x, 100 + 50 * scale * 1.3); close(down.y, 150 - 55 * scale * 1.3);
});

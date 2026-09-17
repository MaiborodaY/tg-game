import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tinyGoblinHealerFrame, goblinHealPulseFrame } from '../tiny-goblin-healer.mjs';
import { GOBLIN_HEALER_GEOMETRY, GOBLIN_HEAL_PULSE_FRAMES,
  GOBLIN_HEALER_IMAGE_URL, GOBLIN_HEAL_PULSE_IMAGE_URL } from '../goblin-healer-art.mjs';

test('goblin healer loops separate idle/walk rows and reaches the potion pose at healing impact', () => {
  for (let pose = 0; pose < 4; pose++) {
    assert.equal(tinyGoblinHealerFrame({ action: 'idle' }, pose / 4), pose);
    assert.equal(tinyGoblinHealerFrame({ action: 'walk', walkTime: pose / 6 + .001 }), 4 + pose);
  }
  assert.equal(tinyGoblinHealerFrame({ action: 'dead' }, 1), 0);
  for (const [facingX, facingY, row] of [[1, 0, 2], [-1, 0, 2], [0, -1, 2], [0, 1, 3]]) {
    const actor = { action: 'heal', facingX, facingY, actionDuration: 2, impactFraction: .45 };
    for (const [actionTime, pose] of [[0, 0], [.45, 1], [.899, 1], [.9, 2], [1.45, 3], [3, 3]]) {
      assert.equal(tinyGoblinHealerFrame({ ...actor, actionTime }), row * 4 + pose);
    }
  }
  assert.deepEqual([-.1, 0, .25, .5, .75, 1, 2, NaN].map(goblinHealPulseFrame), [0, 0, 1, 2, 3, 3, 3, 0]);
});

test('healer foot and pulse anchors remain inside their full authored source rectangles', () => {
  const { sourceRects, centers, baselines, bodyHeight } = GOBLIN_HEALER_GEOMETRY;
  assert.equal(Object.keys(sourceRects).length, 16);
  assert.equal(centers.length, 16);
  assert.equal(baselines.length, 16);
  for (let index = 0; index < 16; index++) {
    const rect = sourceRects[index];
    const localX = index % 4 * 192 + centers[index] * 192 - rect.x;
    const localY = Math.floor(index / 4) * 192 + baselines[index] * 192 - rect.y;
    assert.ok(rect.x >= 0 && rect.x + rect.width <= 768 && rect.y >= 0 && rect.y + rect.height <= 768);
    assert.ok(localX >= 0 && localX < rect.width && localY >= 0 && localY < rect.height);
    assert.ok(40 / (bodyHeight * 192) * rect.width < 58, 'normal enemy-scale silhouette');
  }
  assert.equal(GOBLIN_HEAL_PULSE_FRAMES.length, 4);
  for (const { rect, groundAnchor } of GOBLIN_HEAL_PULSE_FRAMES) {
    assert.equal(rect.width, 128);
    assert.equal(rect.height, 128);
    assert.ok(groundAnchor.x > 0 && groundAnchor.x < rect.width);
    assert.ok(groundAnchor.y > 0 && groundAnchor.y < rect.height);
  }
});

test('shipped goblin healer and healing pulse are the approved WebP exports under 200 KB total', async () => {
  const provenance = JSON.parse(await readFile(new URL('../assets/goblin-healer/provenance.json', import.meta.url)));
  const urls = [GOBLIN_HEALER_IMAGE_URL, GOBLIN_HEAL_PULSE_IMAGE_URL];
  let total = 0;
  for (let i = 0; i < urls.length; i++) {
    const bytes = await readFile(new URL(urls[i]));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), provenance.assets[i].sha256);
    total += bytes.length;
  }
  assert.ok(total < 200_000, `${total} bytes`);
});

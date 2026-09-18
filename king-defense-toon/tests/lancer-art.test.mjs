import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, stat } from 'node:fs/promises';
import { tinyLancerFrame, TINY_LANCER_LAYOUT } from '../tiny-lancer.mjs';
import { LANCER_ASSETS, LANCER_GEOMETRY } from '../lancer-art.mjs';

test('lancer uses idle, run and five authored thrust angles with damage-synchronous impact', () => {
  assert.deepEqual(TINY_LANCER_LAYOUT, LANCER_GEOMETRY.layout);
  assert.equal(tinyLancerFrame(null, 0), 0);
  assert.equal(tinyLancerFrame({ action: 'idle' }, .8), 8);
  assert.equal(tinyLancerFrame({ action: 'idle' }, 1.2), 0);
  assert.equal(tinyLancerFrame({ action: 'walk', walkTime: .3 }), 15);
  assert.equal(tinyLancerFrame({ action: 'dead' }, .8), 0);
  for (const [x, y, start] of [[1, 0, 18], [1, 1, 21], [0, 1, 24], [1, -1, 27], [0, -1, 30]]) {
    for (const sign of [1, -1]) {
      const actor = { action: 'attack', facingX: x * sign, facingY: y, actionDuration: 1, impactFraction: .42 };
      assert.equal(tinyLancerFrame({ ...actor, actionTime: .419 }), start);
      assert.equal(tinyLancerFrame({ ...actor, actionTime: .42 }), start + 1);
      assert.equal(tinyLancerFrame({ ...actor, actionTime: .99 }), start + 2);
    }
  }
});

test('lancer ground anchors and complete spear frames fit the shipped compact atlas', () => {
  const { layout, sourceRects, baselines, centers, compactSourceRects, bodyHeight } = LANCER_GEOMETRY;
  assert.equal(Object.keys(sourceRects).length, 33);
  assert.equal(baselines.length, 33);
  assert.equal(centers.length, 33);
  for (let i = 0; i < 33; i++) {
    const rect = sourceRects[i];
    assert.ok(rect.x >= 0 && rect.y >= 0 && rect.width > 0 && rect.height > 0);
    assert.ok(rect.x + rect.width <= layout.columns * 168);
    assert.ok(rect.y + rect.height <= layout.rows * 160);
    assert.ok(Number.isFinite(baselines[i]) && Number.isFinite(centers[i]));
    assert.ok(baselines[i] > 0 && baselines[i] < 1);
  }
  const compact = compactSourceRects[0];
  assert.ok(compact.height < sourceRects[0].height, 'only the formation drops the tall spear tip');
  const scale = 34 / (bodyHeight * 160);
  const top = (compact.y - baselines[0] * 160) * scale;
  const bottom = top + compact.height * scale;
  assert.ok(top > -50, 'body fits below formation HP/level label');
  assert.ok(bottom <= 5, 'shadow stays within the formation cell');
  assert.ok(compact.width * scale <= 58, 'body stays inside a formation column');
});

test('all four lancer colors and menu crops are shipped lossless WebP under 85 KB combined', async () => {
  assert.equal(Object.keys(LANCER_ASSETS).length, 4);
  let total = 0;
  for (const asset of Object.values(LANCER_ASSETS)) for (const url of Object.values(asset)) {
    const bytes = await readFile(new URL(url));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    assert.ok(bytes.includes(Buffer.from('VP8L')), 'lossless WebP stream');
    total += (await stat(new URL(url))).size;
  }
  assert.ok(total < 85 * 1024, `runtime art total ${total}`);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  TINY_ST_KNIHOR_LAYOUT, ST_KNIHOR_ANIMATIONS, ST_KNIHOR_EFFECT_TIMINGS,
  tinyStKnihorFrame, stKnihorDirection, stKnihorImpactTime, stKnihorEffectFrame, stKnihorEffectActive,
} from '../tiny-st-knihor.ts';
import {
  ST_KNIHOR_ASSETS, ST_KNIHOR_GEOMETRY, ST_KNIHOR_EFFECTS, ST_KNIHOR_EFFECTS_GEOMETRY,
  ST_KNIHOR_EFFECTS_IMAGE_URL, ST_KNIHOR_PORTRAIT_IMAGE_URL,
} from '../st-knihor-art.ts';

test('St. Knihor uses slow idle and separate walking loops', () => {
  assert.deepEqual(TINY_ST_KNIHOR_LAYOUT, { columns: 4, rows: 6 });
  for (const [action, fps, start] of [['idle', 3, 0], ['walk', 6, 4]]) {
    for (let cycle = 0; cycle < 3; cycle++) for (let pose = 0; pose < 4; pose++) {
      const time = (cycle * 4 + pose + .01) / fps;
      assert.equal(tinyStKnihorFrame({ action, walkTime: time }, time), start + pose);
    }
    assert.equal(tinyStKnihorFrame({ action, walkTime: 0 }, 0), start);
  }
  assert.equal(tinyStKnihorFrame(null), 0);
  assert.equal(tinyStKnihorFrame({ action: 'walk' }, .34), 6);
});

test('attack and cast contact poses begin exactly at the selected impact time', () => {
  for (const action of ['attack', 'cast']) for (const actionDuration of [.4, 1, 2]) {
    for (const impactFraction of [.2, .5, .85]) {
      const actor = { action, actionDuration, impactFraction };
      const start = ST_KNIHOR_ANIMATIONS[action].row * 4;
      const impact = actionDuration * impactFraction;
      assert.equal(stKnihorImpactTime(actor), impact);
      for (const [actionTime, pose] of [
        [0, 0], [impact / 2, 1], [impact - .000001, 1], [impact, 2],
        [impact + (actionDuration - impact) / 2, 3], [actionDuration, 3], [1000, 3],
      ]) assert.equal(tinyStKnihorFrame({ ...actor, actionTime }), start + pose);
    }
  }
  assert.equal(stKnihorImpactTime({ action: 'attack' }), .45);
  assert.equal(stKnihorImpactTime({ action: 'cast' }), .6);
});

test('hit and death never loop, and dead actors retain their final death pose', () => {
  for (const [action, start] of [['hit', 16], ['death', 20]]) {
    for (const [actionTime, pose] of [[0, 0], [.25, 1], [.5, 2], [.75, 3], [1, 3], [10, 3]]) {
      assert.equal(tinyStKnihorFrame({ action, actionTime, actionDuration: 1 }), start + pose);
    }
  }
  for (const time of [0, .2, 1, 1000]) assert.equal(tinyStKnihorFrame({ action: 'dead' }, time), 23);
});

test('three authored directions use horizontal mirroring only for the left side', () => {
  const cases = [
    [1, 0, 'side', false], [-1, 0, 'side', true], [2, -1, 'side', false], [-2, 1, 'side', true],
    [0, 1, 'down', false], [0, -1, 'up', false], [1, 1, 'down', false], [-1, -1, 'up', false],
    [0, 0, 'down', false], [NaN, NaN, 'down', false],
  ];
  for (const [facingX, facingY, direction, flipX] of cases) {
    assert.deepEqual(stKnihorDirection({ facingX, facingY }), { direction, flipX });
  }
  assert.deepEqual(stKnihorDirection(), { direction: 'down', flipX: false });
});

test('all hero frames and foot anchors fit the full 512 by 768 atlases', () => {
  const { layout, frameWidth, frameHeight, sourceRects, centers, baselines, anchor } = ST_KNIHOR_GEOMETRY;
  assert.deepEqual(layout, TINY_ST_KNIHOR_LAYOUT);
  assert.equal(sourceRects.length, 24);
  assert.equal(centers.length, 24);
  assert.equal(baselines.length, 24);
  assert.equal(frameWidth * layout.columns, 512);
  assert.equal(frameHeight * layout.rows, 768);
  for (const [index, rect] of sourceRects.entries()) {
    assert.deepEqual(rect, { x: index % 4 * 128, y: Math.floor(index / 4) * 128, width: 128, height: 128 });
    assert.ok(rect.x + rect.width <= 512 && rect.y + rect.height <= 768);
    assert.equal(centers[index] * frameWidth, anchor.x);
    assert.equal(baselines[index] * frameHeight, anchor.y);
    assert.ok(anchor.x > 0 && anchor.x < rect.width && anchor.y > 0 && anchor.y < rect.height);
  }
});

test('effect frames stay in their own rows and stop at their TTL boundary', () => {
  assert.deepEqual(ST_KNIHOR_EFFECTS_GEOMETRY.layout, { columns: 4, rows: 4 });
  for (const [kind, { row, duration, frames }] of Object.entries(ST_KNIHOR_EFFECTS)) {
    assert.deepEqual({ row, duration }, ST_KNIHOR_EFFECT_TIMINGS[kind]);
    assert.equal(frames.length, 4);
    for (let pose = 0; pose < 4; pose++) {
      assert.equal(stKnihorEffectFrame(kind, duration * (pose + .01) / 4), row * 4 + pose);
      const { rect, groundAnchor } = frames[pose];
      assert.deepEqual(rect, { x: pose * 128, y: row * 128, width: 128, height: 128 });
      assert.ok(rect.x + rect.width <= 512 && rect.y + rect.height <= 512);
      assert.ok(groundAnchor.x >= 0 && groundAnchor.x < 128 && groundAnchor.y >= 0 && groundAnchor.y < 128);
    }
    assert.equal(stKnihorEffectFrame(kind, duration), row * 4 + 3);
    assert.equal(stKnihorEffectFrame(kind, duration * 100), row * 4 + 3);
    assert.equal(stKnihorEffectActive(kind, 0), true);
    assert.equal(stKnihorEffectActive(kind, duration - .000001), true);
    for (const elapsed of [-1, duration, duration + 1, NaN, Infinity]) assert.equal(stKnihorEffectActive(kind, elapsed), false);
  }
});

test('malformed numbers and extreme clocks never produce invalid frame coordinates', () => {
  const numbers = [undefined, null, NaN, Infinity, -Infinity, -100, 0, .5, Number.MAX_VALUE, '1'];
  for (const action of [...Object.keys(ST_KNIHOR_ANIMATIONS), 'dead', 'unknown', 'toString', '__proto__']) {
    for (const value of numbers) {
      const actor = { action, actionTime: value, actionDuration: value, walkTime: value, impactFraction: value };
      const frame = tinyStKnihorFrame(actor, value);
      assert.ok(Number.isInteger(frame) && frame >= 0 && frame < 24, `${action}: ${String(value)} -> ${frame}`);
      assert.ok(Number.isFinite(stKnihorImpactTime(actor)) && stKnihorImpactTime(actor) >= 0);
      for (const kind of [...Object.keys(ST_KNIHOR_EFFECTS), 'unknown', '__proto__']) {
        const effectFrame = stKnihorEffectFrame(kind, value);
        assert.ok(Number.isInteger(effectFrame) && effectFrame >= 0 && effectFrame < 16);
      }
    }
  }
});

function webpDimensions(bytes) {
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const tag = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    assert.ok(start + size <= bytes.length, 'complete WebP chunk');
    if (tag === 'VP8X') return [bytes.readUIntLE(start + 4, 3) + 1, bytes.readUIntLE(start + 7, 3) + 1];
    if (tag === 'VP8L') {
      assert.equal(bytes[start], 0x2f);
      const bits = bytes.readUInt32LE(start + 1);
      return [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
    }
    if (tag === 'VP8 ') return [bytes.readUInt16LE(start + 6) & 0x3fff, bytes.readUInt16LE(start + 8) & 0x3fff];
    offset = start + size + (size % 2);
  }
  assert.fail('WebP has no image dimensions');
}

test('shipped St. Knihor browser assets have the contracted WebP dimensions', async () => {
  const provenance = JSON.parse(await readFile(new URL('../assets/st-knihor/provenance.json', import.meta.url)));
  assert.equal(ST_KNIHOR_GEOMETRY.bodyHeight, provenance.bodyHeight);
  assert.deepEqual(ST_KNIHOR_GEOMETRY.anchor, provenance.anchor);
  assert.equal(provenance.assets.length, 5);
  assert.ok(provenance.totalBytes <= 512 * 1024);
  for (const asset of provenance.assets) {
    const bytes = await readFile(new URL(`../assets/st-knihor/${asset.name}`, import.meta.url));
    assert.equal(bytes.length, asset.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
    assert.equal(asset.alphaExact, true);
  }
  assert.deepEqual(Object.keys(ST_KNIHOR_ASSETS), ['down', 'side', 'up']);
  for (const [direction, url] of Object.entries(ST_KNIHOR_ASSETS)) {
    assert.ok(new URL(url).pathname.endsWith(`/st-knihor/st-knihor-${direction}.webp`));
    assert.deepEqual(webpDimensions(await readFile(new URL(url))), [512, 768]);
  }
  assert.deepEqual(webpDimensions(await readFile(new URL(ST_KNIHOR_EFFECTS_IMAGE_URL))), [512, 512]);
  assert.deepEqual(webpDimensions(await readFile(new URL(ST_KNIHOR_PORTRAIT_IMAGE_URL))), [128, 128]);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { createFramePacer } from '../frame-pacer.mjs';

test('keeps the 30 FPS budget across common display rates without losing elapsed time', () => {
  for (const hz of [30, 59.94, 60, 90, 120, 144]) {
    const pacer = createFramePacer();
    let frames = 0, elapsed = 0, last = 0;
    for (let i = 0; i <= Math.floor(hz * 10); i++) {
      const timestamp = i * 1000 / hz;
      const delta = pacer.sample(timestamp);
      if (delta === null) continue;
      frames++; elapsed += delta; last = timestamp;
    }
    assert.ok(frames >= 300 && frames <= 301, `${hz} Hz: ${frames} frames`);
    assert.ok(Math.abs(elapsed - last / 1000) < 1e-9);
  }
});

test('small RAF jitter does not accumulate into a lower rendering rate', () => {
  const pacer = createFramePacer();
  let count = 0;
  for (let i = 0; i <= 3600; i++) {
    if (pacer.sample(i * 1000 / 60 + Math.sin(i * .9) * .8) !== null) count++;
  }
  assert.ok(count >= 1800 && count <= 1801, `received ${count} frames`);
});

test('a long stall returns actual elapsed time once without a burst of catch-up renders', () => {
  const pacer = createFramePacer();
  assert.equal(pacer.sample(0), 0);
  assert.equal(pacer.sample(5000), 5);
  assert.equal(pacer.sample(5000), null);
  assert.equal(pacer.sample(5010), null);
  assert.ok(Math.abs(pacer.sample(5034) - .034) < 1e-9);
});

test('pause, restart and backward timestamps cannot advance inactive time', () => {
  const pacer = createFramePacer();
  assert.equal(pacer.sample(100), 0);
  assert.equal(pacer.sample(120), null);
  pacer.reset();
  assert.equal(pacer.sample(100000), 0);
  assert.equal(pacer.sample(NaN), null);
  assert.equal(pacer.sample(Infinity), null);
  assert.equal(pacer.sample(10), 0);
  assert.equal(pacer.sample(10), null);
  assert.ok(Math.abs(pacer.sample(44) - .034) < 1e-9);
  for (const fps of [0, -1, NaN, Infinity]) assert.throws(() => createFramePacer(fps), RangeError);
});

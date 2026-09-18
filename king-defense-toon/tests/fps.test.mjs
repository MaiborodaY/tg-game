import assert from 'node:assert/strict';
import test from 'node:test';
import { createFrameRateMeter } from '../fps.ts';

test('measures rendered frames from real timestamps at 30 and 20 FPS', () => {
  for (const fps of [20, 30]) {
    const meter = createFrameRateMeter();
    let reading;
    for (let frame = 0; frame <= fps * 2; frame++) {
      const next = meter.record(frame * 1000 / fps);
      if (next !== null) reading = next;
    }
    assert.equal(reading, fps);
  }
});

test('publishes about three times per second instead of touching the HUD each frame', () => {
  const meter = createFrameRateMeter();
  const publications = [];
  for (let timestamp = 0; timestamp <= 1000; timestamp += 10) {
    if (meter.record(timestamp) !== null) publications.push(timestamp);
  }
  assert.deepEqual(publications, [340, 680]);
});

test('a slow frame lowers the time-weighted estimate', () => {
  const meter = createFrameRateMeter();
  for (const timestamp of [0, 100, 200, 300]) meter.record(timestamp);
  assert.equal(meter.record(400), 10);
  assert.equal(meter.record(800), 6);
});

test('the rolling window recovers after a stall leaves it', () => {
  const meter = createFrameRateMeter();
  meter.record(0);
  assert.equal(meter.record(1000), 1);
  let reading;
  for (let timestamp = 1100; timestamp <= 2500; timestamp += 100) {
    const next = meter.record(timestamp);
    if (next !== null) reading = next;
  }
  assert.equal(reading, 10);
});

test('reset excludes background time and waits for a fresh measurement', () => {
  const meter = createFrameRateMeter();
  for (let timestamp = 0; timestamp <= 400; timestamp += 100) meter.record(timestamp);
  meter.reset();
  assert.equal(meter.record(60000), null);
  for (const timestamp of [60100, 60200, 60300]) assert.equal(meter.record(timestamp), null);
  assert.equal(meter.record(60400), 10);
});

test('duplicate or invalid timestamps do not invent frames', () => {
  const meter = createFrameRateMeter();
  assert.equal(meter.record(NaN), null);
  assert.equal(meter.record(0), null);
  assert.equal(meter.record(0), null);
  assert.equal(meter.record(Infinity), null);
  assert.equal(meter.record(400), 3);
});

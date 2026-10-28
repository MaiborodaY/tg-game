import assert from 'node:assert/strict';
import test from 'node:test';
import { createLoadingIndicator } from '../loading-indicator.ts';

function setup(t) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let elapsed = 0;
  const indicator = createLoadingIndicator(() => { elapsed++; });
  t.after(() => indicator.destroy());
  return { indicator, tick: ms => t.mock.timers.tick(ms), elapsed: () => elapsed };
}

test('quick loads never show an indicator or leave a delayed callback behind', t => {
  const { indicator, tick, elapsed } = setup(t);
  assert.equal(indicator.update(true), false);
  tick(179);
  assert.equal(indicator.update(false), false);
  tick(1000);
  assert.equal(elapsed(), 0);
  assert.equal(indicator.update(false), false);
});

test('long loads show once at the threshold without restarting on repeated updates', t => {
  const { indicator, tick, elapsed } = setup(t);
  assert.equal(indicator.update(true), false);
  tick(100);
  assert.equal(indicator.update(true), false);
  tick(80);
  assert.equal(elapsed(), 1);
  assert.equal(indicator.update(true), true);
  tick(1000);
  assert.equal(elapsed(), 1);
  assert.equal(indicator.update(false), false);
  assert.equal(indicator.update(true), false, 'the next load gets a new grace period');
  tick(180);
  assert.equal(elapsed(), 2);
});

test('errors show immediately and cancel the loading timer; recovery hides them', t => {
  const { indicator, tick, elapsed } = setup(t);
  indicator.update(true);
  tick(20);
  assert.equal(indicator.update(true, true), true);
  tick(1000);
  assert.equal(elapsed(), 0);
  assert.equal(indicator.update(true), true, 'retry keeps an already visible dialog stable');
  assert.equal(indicator.update(false), false);
  assert.equal(indicator.update(true, true), true, 'an error without a prior load is immediate too');
});

test('page suspension resets the grace period and destruction prevents all late notifications', t => {
  const { indicator, tick, elapsed } = setup(t);
  indicator.update(true); tick(100);
  indicator.update(false); tick(200);
  assert.equal(elapsed(), 0);
  indicator.update(true); tick(179);
  assert.equal(elapsed(), 0);
  indicator.destroy(); indicator.destroy(); tick(1000);
  assert.equal(elapsed(), 0);
  assert.equal(indicator.update(true, true), false);
});

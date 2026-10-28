import assert from 'node:assert/strict';
import test from 'node:test';
import { BASE_BATTLE_SPEED, BATTLE_SPEEDS, DEFAULT_BATTLE_SPEED, MAX_REAL_FRAME_DELTA, MAX_BATTLE_FRAME_DELTA, battleFrameDelta, nextBattleSpeed } from '../battle-speed.ts';

test('speed selection cycles through all choices and recovers an unknown selection', () => {
  assert.deepEqual(BATTLE_SPEEDS, [1, 2, 3]);
  assert.equal(DEFAULT_BATTLE_SPEED, 1);
  assert.ok(Object.isFrozen(BATTLE_SPEEDS));
  assert.deepEqual([1, 2, 3, 1.5, 99, NaN].map(nextBattleSpeed), [2, 3, 1, 1, 1, 1]);
});

test('battle time retains its frame cap, base pace and unknown-speed fallback', () => {
  assert.equal(battleFrameDelta(.04), .04 * BASE_BATTLE_SPEED);
  assert.equal(battleFrameDelta(.04, 3), .04 * BASE_BATTLE_SPEED * 3);
  assert.equal(battleFrameDelta(5, 2), .1 * BASE_BATTLE_SPEED * 2);
  for (const speed of [0, -1, 1.5, 4, NaN, Infinity, '1', '1.5', '3', null]) {
    assert.equal(battleFrameDelta(.04, speed), .04 * BASE_BATTLE_SPEED);
    assert.equal(nextBattleSpeed(speed), 1);
  }
});

test('new x1 matches former x1.5 and x2/x3 multiply the new base in a 1:2:3 ratio', () => {
  assert.equal(BASE_BATTLE_SPEED, .85 * 1.5);
  const formerOnePointFiveSeconds = 10 * .85 * 1.5;
  for (const fps of [10, 20, 30, 60, 120]) {
    for (const speed of BATTLE_SPEEDS) {
      let battleSeconds = 0;
      for (let frame = 0; frame < 10 * fps; frame += 1) battleSeconds += battleFrameDelta(1 / fps, speed);
      assert.ok(Math.abs(battleSeconds - formerOnePointFiveSeconds * speed) < 1e-9,
        `${fps} FPS at x${speed} must advance the same amount of combat in ten real seconds`);
    }
  }
});

test('the shared battle cap admits the full capped foreground frame at the fastest speed', () => {
  assert.equal(MAX_REAL_FRAME_DELTA, .1);
  assert.equal(MAX_BATTLE_FRAME_DELTA, MAX_REAL_FRAME_DELTA * BASE_BATTLE_SPEED * 3);
  assert.ok(Math.abs(MAX_BATTLE_FRAME_DELTA - .3825) < 1e-12);
  assert.equal(battleFrameDelta(600, 3), MAX_BATTLE_FRAME_DELTA);
  assert.ok(Number.isFinite(MAX_BATTLE_FRAME_DELTA) && MAX_BATTLE_FRAME_DELTA < .4);
});

test('invalid or nonpositive frame durations never advance battle time', () => {
  for (const delta of [0, -1, NaN, Infinity, -Infinity, '0.1', null, undefined]) {
    assert.equal(battleFrameDelta(delta, 3), 0);
  }
});

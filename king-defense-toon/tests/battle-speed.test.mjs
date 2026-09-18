import assert from 'node:assert/strict';
import test from 'node:test';
import { BASE_BATTLE_SPEED, BATTLE_SPEEDS, DEFAULT_BATTLE_SPEED, battleFrameDelta, nextBattleSpeed } from '../battle-speed.ts';

test('speed selection cycles through all choices and recovers an unknown selection', () => {
  assert.deepEqual(BATTLE_SPEEDS, [1.5, 2, 3]);
  assert.equal(DEFAULT_BATTLE_SPEED, 1.5);
  assert.ok(Object.isFrozen(BATTLE_SPEEDS));
  assert.deepEqual([1.5, 2, 3, 1, 99, NaN].map(nextBattleSpeed), [2, 3, 1.5, 1.5, 1.5, 1.5]);
});

test('battle time retains its frame cap, base pace and unknown-speed fallback', () => {
  assert.equal(battleFrameDelta(.04), .04 * BASE_BATTLE_SPEED * 1.5);
  assert.equal(battleFrameDelta(.04, 3), .04 * BASE_BATTLE_SPEED * 3);
  assert.equal(battleFrameDelta(5, 2), .1 * BASE_BATTLE_SPEED * 2);
  for (const speed of [0, -1, 1, 4, NaN, Infinity, '1.5', '3', null]) {
    assert.equal(battleFrameDelta(.04, speed), .04 * BASE_BATTLE_SPEED * 1.5);
    assert.equal(nextBattleSpeed(speed), 1.5);
  }
});

test('the new default advances combat 50 percent faster while x2 and x3 retain their pace', () => {
  assert.equal(BASE_BATTLE_SPEED, .85, 'the global base pace must not also accelerate the faster choices');
  const oldDefaultBattleSeconds = 10 * .85;
  for (const fps of [20, 30, 60, 120]) {
    for (const speed of BATTLE_SPEEDS) {
      let battleSeconds = 0;
      for (let frame = 0; frame < 10 * fps; frame += 1) battleSeconds += battleFrameDelta(1 / fps, speed);
      assert.ok(Math.abs(battleSeconds - oldDefaultBattleSeconds * speed) < 1e-9,
        `${fps} FPS at x${speed} must advance the same amount of combat in ten real seconds`);
    }
  }
});

test('invalid or nonpositive frame durations never advance battle time', () => {
  for (const delta of [0, -1, NaN, Infinity, -Infinity, '0.1', null, undefined]) {
    assert.equal(battleFrameDelta(delta, 3), 0);
  }
});

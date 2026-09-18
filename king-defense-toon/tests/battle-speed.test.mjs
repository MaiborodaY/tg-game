import assert from 'node:assert/strict';
import test from 'node:test';
import { BASE_BATTLE_SPEED, BATTLE_SPEEDS, battleFrameDelta, nextBattleSpeed } from '../battle-speed.mjs';

test('speed selection cycles through all choices and recovers an unknown selection', () => {
  assert.deepEqual(BATTLE_SPEEDS, [1, 2, 3]);
  assert.ok(Object.isFrozen(BATTLE_SPEEDS));
  assert.deepEqual([1, 2, 3, 99, NaN].map(nextBattleSpeed), [2, 3, 1, 1, 1]);
});

test('battle time retains its frame cap, base pace and unknown-speed fallback', () => {
  assert.equal(battleFrameDelta(.04), .04 * BASE_BATTLE_SPEED);
  assert.equal(battleFrameDelta(.04, 3), .04 * BASE_BATTLE_SPEED * 3);
  assert.equal(battleFrameDelta(5, 2), .1 * BASE_BATTLE_SPEED * 2);
  for (const speed of [0, -1, 4, NaN, Infinity, '3', null]) {
    assert.equal(battleFrameDelta(.04, speed), .04 * BASE_BATTLE_SPEED);
    assert.equal(nextBattleSpeed(speed), 1);
  }
});

test('invalid or nonpositive frame durations never advance battle time', () => {
  for (const delta of [0, -1, NaN, Infinity, -Infinity, '0.1', null, undefined]) {
    assert.equal(battleFrameDelta(delta, 3), 0);
  }
});

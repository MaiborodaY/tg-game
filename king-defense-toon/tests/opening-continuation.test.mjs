import assert from 'node:assert/strict';
import test from 'node:test';
import { loadCombatEngine, makeFormation, simulateCombat } from '../scripts/combat-balance.mjs';

const engine = await loadCombatEngine();
function result(wave, level, healer = 1) {
  return simulateCombat(engine, { wave,
    formation: makeFormation({ swordsman: 6 - healer, archer: 2, healer, level }) });
}

test('the smaller first-chief escort does not introduce relief in the following wave', () => {
  // Wave 10 was deliberately reduced. Keep the same armies on either side so
  // this check cannot hide a softer wave 11 behind invented recruitment growth.
  for (const healer of [0, 1, 2]) {
    for (const level of [3, 4]) {
      for (const wave of [9, 10, 11]) {
        const observed = result(wave, level, healer);
        assert.equal(observed.outcome, wave === 11 ? 'defeat' : 'victory',
          `wave ${wave}, level ${level}, ${healer} healers`);
        assert.equal(observed.enraged, false);
      }
    }
    for (const wave of [9, 10, 11]) {
      assert.equal(result(wave, 5, healer).outcome,
        wave === 11 && healer === 2 ? 'defeat' : 'victory',
        `wave ${wave}, level 5, ${healer} healers`);
    }
  }
});

test('the second chief and the following wave both require further growth in the same formation', () => {
  assert.equal(result(19, 11).outcome, 'victory');
  assert.equal(result(20, 11).outcome, 'defeat');
  assert.equal(result(20, 12).outcome, 'victory');
  assert.equal(result(21, 12).outcome, 'defeat');
  assert.equal(result(21, 13).outcome, 'victory');
});

test('zero- and two-healer formations retain their required level across the second chief boundary', () => {
  // Over-tuning the chief's damage produced a two-healer Lv14 defeat at 20 but
  // a victory at 21. Check the win/lose threshold, not just total enemy HP.
  for (const [healers, requiredLevel] of [[0, 13], [2, 14]]) {
    for (const wave of [20, 21]) {
      assert.equal(result(wave, requiredLevel - 1, healers).outcome, 'defeat');
      assert.equal(result(wave, requiredLevel, healers).outcome, 'victory');
    }
  }
});

test('the third chief is harder than wave twenty-nine for the unchanged no-healer army', () => {
  assert.equal(result(29, 19, 0).outcome, 'victory');
  assert.equal(result(30, 19, 0).outcome, 'defeat');
  const upgraded = result(30, 20, 0);
  assert.equal(upgraded.outcome, 'victory');
  assert.equal(upgraded.enraged, false);
});

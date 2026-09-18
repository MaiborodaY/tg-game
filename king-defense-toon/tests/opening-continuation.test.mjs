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
  // this check cannot hide relief behind recruitment growth. The hero stays Lv1.
  for (const [healer, level] of [[0, 2], [1, 2], [2, 3]]) {
    for (const wave of [9, 10, 11]) {
      const observed = result(wave, level, healer);
      assert.equal(observed.outcome, wave === 11 ? 'defeat' : 'victory',
        `wave ${wave}, level ${level}, ${healer} healers`);
      assert.equal(observed.enraged, false);
    }
    const upgraded = result(11, level + 1, healer);
    assert.equal(upgraded.outcome, 'victory', `wave 11, level ${level + 1}, ${healer} healers`);
    assert.equal(upgraded.enraged, false);
  }
});

test('the second chief requires growth and the following wave retains that requirement with a level-one hero', () => {
  assert.equal(result(19, 9).outcome, 'victory');
  for (const wave of [20, 21]) {
    assert.equal(result(wave, 9).outcome, 'defeat');
    const upgraded = result(wave, 10);
    assert.equal(upgraded.outcome, 'victory');
    assert.equal(upgraded.enraged, false);
  }
});

test('zero- and two-healer formations retain their required level across the second chief boundary', () => {
  // Hero support changed the thresholds; the two-healer army must still need
  // the same level after the chief instead of receiving an easier wave 21.
  for (const [healers, requiredLevel] of [[0, 10], [2, 13]]) {
    for (const wave of [20, 21]) {
      assert.equal(result(wave, requiredLevel - 1, healers).outcome, 'defeat');
      assert.equal(result(wave, requiredLevel, healers).outcome, 'victory');
    }
  }
});

test('the third chief is harder than wave twenty-nine for the unchanged no-healer army', () => {
  assert.equal(result(29, 18, 0).outcome, 'victory');
  assert.equal(result(30, 18, 0).outcome, 'defeat');
  const upgraded = result(30, 19, 0);
  assert.equal(upgraded.outcome, 'victory');
  assert.equal(upgraded.enraged, false);
});

test('the narrow post-chief correction keeps the two-healer threshold through wave twenty-eight', () => {
  for (let wave = 21; wave <= 28; wave += 1) {
    assert.equal(result(wave, 12, 2).outcome, 'defeat', `wave ${wave} must not introduce another relief pocket`);
    const upgraded = result(wave, 13, 2);
    assert.equal(upgraded.outcome, 'victory', `wave ${wave} must not introduce a new wall`);
    assert.equal(upgraded.enraged, false);
  }
});

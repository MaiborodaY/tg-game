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
  // this check cannot hide relief behind recruitment growth. The hero stays Lv1,
  // with melee only. Reference outcomes include the restored second archer.
  for (const [healer, level, nextLevel] of [[0, 3, 5], [1, 3, 6]]) {
    for (const wave of [9, 10, 11]) {
      const observed = result(wave, level, healer);
      assert.equal(observed.outcome, wave === 11 ? 'defeat' : 'victory',
        `wave ${wave}, level ${level}, ${healer} healers`);
      assert.equal(observed.enraged, false);
    }
    const upgraded = result(11, nextLevel, healer);
    assert.equal(upgraded.outcome, 'victory', `wave 11, level ${nextLevel}, ${healer} healers`);
    assert.equal(upgraded.enraged, false);
  }
  // With two healers, the restored archer raises the first-chief requirement to
  // Lv4; the next wave retains that threshold rather than allowing a weaker army.
  assert.equal(result(9, 3, 2).outcome, 'victory');
  for (const wave of [10, 11]) {
    assert.equal(result(wave, 3, 2).outcome, 'defeat', `wave ${wave}, two healers at Lv3`);
    const upgraded = result(wave, 4, 2);
    assert.equal(upgraded.outcome, 'victory', `wave ${wave}, two healers at Lv4`);
    assert.equal(upgraded.enraged, false);
  }
});

test('the second chief requires growth and the following wave retains that requirement with a level-one hero', () => {
  assert.equal(result(19, 11).outcome, 'victory');
  for (const wave of [20, 21]) {
    // Earlier hero engagement after the crowd fix makes Lv12 sufficient for the
    // chief, while Lv11 still demonstrates the need to grow across the boundary.
    assert.equal(result(wave, 11).outcome, 'defeat');
    const upgraded = result(wave, 15);
    assert.equal(upgraded.outcome, 'victory');
    assert.equal(upgraded.enraged, false);
  }
});

test('different army compositions stay within a narrow upgrade band across the second chief boundary', () => {
  // A healer supports a concentrated boss differently from a spread-out squad.
  // Compare weak/strong reference armies without claiming identical win thresholds.
  for (const [healers, weakLevel, strongLevel] of [[0, 10, 13], [2, 12, 15]]) {
    for (const wave of [20, 21]) {
      assert.equal(result(wave, weakLevel, healers).outcome, 'defeat');
      const upgraded = result(wave, strongLevel, healers);
      assert.equal(upgraded.outcome, 'victory');
      assert.equal(upgraded.enraged, false);
    }
  }
});

test('the third chief is harder than wave twenty-nine for the unchanged no-healer army', () => {
  assert.equal(result(29, 20, 0).outcome, 'victory');
  assert.equal(result(30, 20, 0).outcome, 'defeat');
  const upgraded = result(30, 23, 0);
  assert.equal(upgraded.outcome, 'victory');
  assert.equal(upgraded.enraged, false);
});

test('the following ordinary waves require upgrades without a sudden wall for the two-healer army', () => {
  for (let wave = 21; wave <= 28; wave += 1) {
    assert.equal(result(wave, 12, 2).outcome, 'defeat', `wave ${wave} must not introduce another relief pocket`);
    const upgraded = result(wave, 15, 2);
    assert.equal(upgraded.outcome, 'victory', `wave ${wave} must not introduce a new wall`);
    assert.equal(upgraded.enraged, false);
  }
});

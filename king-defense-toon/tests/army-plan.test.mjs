import assert from 'node:assert/strict';
import test from 'node:test';
import { createArmyPlan, armyPlanWallet, commitArmyPlan } from '../army-plan.ts';
import { createProgression } from '../progression.ts';
import { createEconomy } from '../economy.ts';

const guard = (id = 1, col = 2, row = 0, level = 1) => ({ id, col, row, level, type: 'swordsman' });

test('army plans isolate formation and unlock edits from their original state', () => {
  const units = [guard()], progression = createProgression({ firstClears: [1] });
  const plan = createArmyPlan(units, 2, progression);
  plan.units[0].level = 2; plan.progression.unlockedCells.push('1:0');
  plan.goldDelta = -25; plan.slaveDelta = -1;
  assert.equal(units[0].level, 1);
  assert.equal(progression.unlockedCells.includes('1:0'), false);
  assert.deepEqual(armyPlanWallet(plan, 100, 3), { gold: 75, slaves: 2 });
  assert.deepEqual(plan.progression.firstClears, [1]);
});

test('committing an army plan retains rewards earned after planning and copies committed fields', () => {
  const progression = createProgression({ firstClears: [1] }), economy = createEconomy({ slaves: 4 });
  const plan = createArmyPlan([{ ...guard(), nickname: 'First' }], 7, progression);
  plan.goldDelta = -25; plan.slaveDelta = -2; plan.progression.unlockedCells.push('1:0');
  progression.firstClears.push(2); economy.slaves += 3; economy.captures = 8;
  const result = commitArmyPlan(plan, 150, economy, progression);
  assert.deepEqual(result, { gold: 125, units: [{ ...guard(), nickname: 'First' }], nextId: 7 });
  assert.equal(economy.slaves, 5);
  assert.equal(economy.captures, 8);
  assert.deepEqual(progression.firstClears, [1, 2]);
  assert.deepEqual(progression.unlockedCells, ['2:0', '2:1', '2:2', '1:0']);
  assert.notEqual(result.units, plan.units);
  assert.notEqual(result.units[0], plan.units[0]);
  assert.notEqual(progression.unlockedCells, plan.progression.unlockedCells);
});

test('failed army commits leave wallets and progression untouched', () => {
  for (const edit of [
    plan => { plan.units = []; }, plan => { plan.goldDelta = -101; }, plan => { plan.slaveDelta = -5; },
    plan => { plan.units.push(guard(2)); }, plan => { plan.units.push(guard(1, 2, 1)); },
    plan => { plan.units[0].col = 9; }, plan => { plan.units[0].col = 0; },
    plan => { plan.units[0].type = 'unknown'; }, plan => { plan.units[0].level = 1.5; },
    plan => { plan.units[0].level = 0; }, plan => { plan.units[0].level = 5; },
  ]) {
    const economy = createEconomy({ slaves: 4 }), progression = createProgression({ firstClears: [1] });
    const before = structuredClone({ economy, progression });
    const plan = createArmyPlan([guard()], 2, progression); edit(plan);
    assert.equal(typeof commitArmyPlan(plan, 100, economy, progression).error, 'string');
    assert.deepEqual({ economy, progression }, before);
  }
});

test('the legacy plan level range remains one through four with inclusive zero wallet', () => {
  const economy = createEconomy({ slaves: 2 }), progression = createProgression();
  const plan = createArmyPlan([guard(1, 2, 0, 4)], 2, progression);
  plan.goldDelta = -100; plan.slaveDelta = -2;
  assert.equal(commitArmyPlan(plan, 100, economy, progression).gold, 0);
  assert.equal(economy.slaves, 0);
});

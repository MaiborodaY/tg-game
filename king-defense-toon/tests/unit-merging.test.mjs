import assert from 'node:assert/strict';
import test from 'node:test';
import { getMergeResult } from '../unit-merging.ts';
import { RECRUIT_LEVEL_CAP, UNIT_LEVEL_STAT_BONUS, getUnitStats } from '../recruitment.ts';
import { UNIT_TYPES } from '../units.ts';

const fighter = (id, level = 1, type = 'swordsman') => ({ id, type, level });
const deployed = (id, level = 1, type = 'swordsman', col = 2, row = 0) => ({ ...fighter(id, level, type), col, row });

function freezeRoster(roster) {
  return Object.freeze(roster.map(unit => Object.freeze(unit)));
}

test('reserve merge sums personal levels, retains target identity and position, and removes only its source', () => {
  const units = freezeRoster([deployed(1, 4), deployed(2, 2, 'healer', 2, 1)]);
  const reserve = freezeRoster([fighter(3, 3), fighter(4, 5, 'archer')]);
  const before = JSON.stringify({ units, reserve });
  const result = getMergeResult(units, reserve, { location: 'reserve', id: 3 }, 1);
  assert.equal(result.ok, true);
  assert.equal(result.reason, null);
  assert.deepEqual(result.units, [deployed(1, 7), deployed(2, 2, 'healer', 2, 1)]);
  assert.deepEqual(result.reserve, [fighter(4, 5, 'archer')]);
  assert.deepEqual(result.source, fighter(3, 3));
  assert.deepEqual(result.target, deployed(1, 7));
  assert.equal(before, JSON.stringify({ units, reserve }));
  assert.notEqual(result.units, units);
  assert.notEqual(result.reserve, reserve);
  assert.notEqual(result.units[1], units[1]);
  assert.notEqual(result.reserve[0], reserve[1]);
});

test('army merge frees the source cell and retains unrelated reserve fighters', () => {
  const units = freezeRoster([deployed(1, 3), deployed(2, 4, 'swordsman', 3, 1)]);
  const reserve = freezeRoster([fighter(3, 2, 'healer')]);
  const result = getMergeResult(units, reserve, { location: 'army', id: 1 }, 2);
  assert.equal(result.ok, true);
  assert.deepEqual(result.units, [deployed(2, 7, 'swordsman', 3, 1)]);
  assert.deepEqual(result.reserve, reserve);
  assert.equal(units.length, 2);
  assert.equal(units[1].level, 4);
});

test('all unit types can merge independently of their combat role', () => {
  for (const { id: type } of UNIT_TYPES) {
    const result = getMergeResult([deployed(1, 2, type)], [fighter(2, 1, type)], { location: 'reserve', id: 2 }, 1);
    assert.equal(result.ok, true, type);
    assert.equal(result.target.level, 3, type);
  }
});

test('same unit, different type, stale source and absent targets never consume fighters', () => {
  const units = freezeRoster([deployed(1, 3), deployed(2, 4, 'archer', 3, 1)]);
  const reserve = freezeRoster([fighter(3, 2)]);
  const before = JSON.stringify({ units, reserve });
  for (const [source, target, reason] of [
    [{ location: 'army', id: 1 }, 1, 'same-unit'],
    [{ location: 'reserve', id: 3 }, 2, 'different-type'],
    [{ location: 'reserve', id: 4 }, 1, 'source-missing'],
    [{ location: 'army', id: 3 }, 1, 'source-missing'],
    [{ location: 'reserve', id: 3 }, 3, 'target-missing'],
    [{ location: 'reserve', id: 3 }, 99, 'target-missing'],
    [{ location: 'reserve', id: 3 }, '1', 'target-missing'],
    [{ location: 'reserve', id: 3 }, null, 'target-missing'],
    [{ location: 'inventory', id: 3 }, 1, 'invalid-source'],
    [{ location: 'reserve', id: '3' }, 1, 'invalid-source'],
    [{ location: 'reserve', id: 0 }, 1, 'invalid-source'],
    [null, 1, 'invalid-source'],
  ]) {
    const result = getMergeResult(units, reserve, source, target);
    assert.equal(result.ok, false);
    assert.equal(result.reason, reason);
    assert.equal(result.units, units);
    assert.equal(result.reserve, reserve);
    assert.equal(JSON.stringify({ units, reserve }), before);
  }
});

test('cap is inclusive and overflow preserves every level and both fighters', () => {
  assert.equal(RECRUIT_LEVEL_CAP, 100);
  const exact = getMergeResult([deployed(1, 70)], [fighter(2, 30)], { location: 'reserve', id: 2 }, 1);
  assert.equal(exact.ok, true);
  assert.equal(exact.target.level, 100);
  const units = freezeRoster([deployed(1, 70)]);
  const reserve = freezeRoster([fighter(2, 31)]);
  const over = getMergeResult(units, reserve, { location: 'reserve', id: 2 }, 1);
  assert.equal(over.ok, false);
  assert.equal(over.reason, 'level-cap');
  assert.equal(over.units, units);
  assert.equal(over.reserve, reserve);
  assert.equal(units[0].level, 70);
  assert.equal(reserve[0].level, 31);
});

test('replaying a completed merge cannot duplicate transferred levels, including after save reload', () => {
  for (const location of ['reserve', 'army']) {
    const source = { location, id: 2 };
    const first = getMergeResult(
      [deployed(1, 3), ...(location === 'army' ? [deployed(2, 2, 'swordsman', 3, 0)] : [])],
      location === 'reserve' ? [fighter(2, 2)] : [], source, 1,
    );
    assert.equal(first.ok, true);
    const saved = JSON.parse(JSON.stringify({ units: first.units, reserve: first.reserve }));
    const replay = getMergeResult(saved.units, saved.reserve, source, 1);
    assert.equal(replay.ok, false);
    assert.equal(replay.reason, 'source-missing');
    assert.equal(replay.units[0].level, 5);
    assert.equal(replay.units.length + replay.reserve.length, 1);
  }
});

test('malformed roster data fails safely without guessing levels or choosing duplicate identities', () => {
  const units = [deployed(1)];
  const reserve = [fighter(2)];
  for (const [invalidUnits, invalidReserve] of [
    [null, reserve], [units, {}], [[null], reserve],
    [[deployed('1')], reserve], [[deployed(-1)], reserve],
    [units, [fighter(1)]], [units, [fighter(2), fighter(2)]],
    [units, [fighter(2, 0)]], [units, [fighter(2, 101)]],
    [units, [fighter(2, NaN)]], [units, [fighter(2, '2')]],
    [units, [fighter(2, 1.5)]], [units, [fighter(2, 2, 'unknown')]],
    [units, [{ id: 2, type: 'swordsman' }]],
  ]) {
    const result = getMergeResult(invalidUnits, invalidReserve, { location: 'reserve', id: 2 }, 1);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'invalid-state');
    assert.equal(result.units, invalidUnits);
    assert.equal(result.reserve, invalidReserve);
  }
});

test('personal stats grow by five percent of level-one base per level with integer rounding', () => {
  assert.equal(UNIT_LEVEL_STAT_BONUS, .05);
  for (const unit of UNIT_TYPES) {
    for (let level = 1; level <= RECRUIT_LEVEL_CAP; level += 1) {
      const result = getUnitStats(unit.id, level);
      assert.deepEqual(result, {
        level,
        hp: Math.round(unit.hp * (1 + .05 * (level - 1))),
        damage: Math.round(unit.damage * (1 + .05 * (level - 1))),
        heal: Math.round((unit.heal ?? 0) * (1 + .05 * (level - 1))),
      });
    }
  }
  assert.deepEqual(getUnitStats('swordsman', 1), { level: 1, hp: 60, damage: 6, heal: 0 });
  assert.deepEqual(getUnitStats('swordsman', 4), { level: 4, hp: 69, damage: 7, heal: 0 });
});

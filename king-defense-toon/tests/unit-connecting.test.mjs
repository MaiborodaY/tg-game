import assert from 'node:assert/strict';
import test from 'node:test';
import { getConnectResult, getMergeResult } from '../unit-merging.ts';
import { UNIT_TYPES } from '../units.ts';
import { createBattle } from '../combat.ts';

const fighter = (id, level = 1, type = 'swordsman') => ({ id, type, level });
const deployed = (id, level = 1, type = 'swordsman', col = 2, row = 0) => ({ ...fighter(id, level, type), col, row });
const army = id => ({ location: 'army', id });
const stored = id => ({ location: 'reserve', id });
const freezeRoster = entries => Object.freeze(entries.map(entry => Object.freeze(entry)));

function assertRejected(units, reserve, recipient, donors, reason, options) {
  const before = structuredClone({ units, reserve, recipient, donors, options });
  const result = getConnectResult(units, reserve, recipient, donors, options);
  assert.equal(result.ok, false);
  assert.equal(result.reason, reason);
  assert.strictEqual(result.units, units);
  assert.strictEqual(result.reserve, reserve);
  assert.deepEqual({ units, reserve, recipient, donors, options }, before);
}

test('batch Connect adds reserve and army donors into the open reserve recipient without moving survivors', () => {
  const units = freezeRoster([deployed(1, 7), { ...deployed(2, 9, 'healer', 3, 2), nickname: 'Kept guard' }]);
  const reserve = freezeRoster([{ ...fighter(3, 101), nickname: 'Recipient' }, fighter(4, 250), fighter(5, 6, 'archer')]);
  const before = structuredClone({ units, reserve });
  const donors = Object.freeze([Object.freeze(stored(4)), Object.freeze(army(1))]);
  const result = getConnectResult(units, reserve, stored(3), donors, { minArmyUnits: 1 });
  assert.equal(result.ok, true);
  assert.equal(result.reason, null);
  assert.equal(result.addedLevels, 257);
  assert.deepEqual(result.units, [units[1]]);
  assert.deepEqual(result.reserve, [{ ...reserve[0], level: 358 }, reserve[2]]);
  assert.strictEqual(result.recipient, result.reserve[0]);
  assert.deepEqual(result.consumed, [reserve[1], units[0]]);
  assert.notStrictEqual(result.consumed[0], reserve[1]);
  assert.notStrictEqual(result.consumed[1], units[0]);
  assert.notStrictEqual(result.units[0], units[1]);
  assert.notStrictEqual(result.reserve[1], reserve[2]);
  assert.deepEqual({ units, reserve }, before);
});

test('an army recipient keeps its anchor, ID and custom fields while donors disappear exactly once', () => {
  const units = freezeRoster([deployed(1, 50, 'pantherRider', 0),
    { ...deployed(2, 100, 'pantherRider', 2, 2), nickname: 'Mounted recipient' },
    deployed(3, 2, 'archer', 4, 1)]);
  const reserve = freezeRoster([fighter(4, 250, 'pantherRider'), fighter(5, 8, 'healer')]);
  const result = getConnectResult(units, reserve, army(2), [army(1), stored(4)], { minArmyUnits: 1 });
  assert.equal(result.ok, true);
  assert.equal(result.recipient.level, 400);
  assert.equal(result.addedLevels, 300);
  assert.deepEqual(result.units, [{ ...units[1], level: 400 }, units[2]]);
  assert.deepEqual(result.reserve, [reserve[1]]);
  assert.strictEqual(result.recipient, result.units[0]);
  assert.deepEqual(result.consumed.map(unit => unit.id), [1, 4]);
  assert.equal(result.units.length + result.reserve.length, units.length + reserve.length - 2);
});

test('every unit type connects across all four army/reserve location combinations', () => {
  for (const { id: type } of UNIT_TYPES) for (const recipientLocation of ['army', 'reserve']) {
    for (const donorLocation of ['army', 'reserve']) {
      const units = [], reserve = [];
      (recipientLocation === 'army' ? units : reserve).push(recipientLocation === 'army'
        ? deployed(1, 3, type, 0) : fighter(1, 3, type));
      (donorLocation === 'army' ? units : reserve).push(donorLocation === 'army'
        ? deployed(2, 4, type, 3) : fighter(2, 4, type));
      const result = getConnectResult(units, reserve, { location: recipientLocation, id: 1 }, [{ location: donorLocation, id: 2 }]);
      assert.equal(result.ok, true, `${type}: ${donorLocation} → ${recipientLocation}`);
      assert.equal(result.recipient.level, 7);
      assert.equal(result.units.length + result.reserve.length, 1);
      assert.equal((recipientLocation === 'army' ? result.units : result.reserve)[0].id, 1);
    }
  }
});

test('a stale or invalid donor anywhere in the batch rejects the entire connection', () => {
  const units = freezeRoster([deployed(1, 3), deployed(2, 5, 'archer')]);
  const reserve = freezeRoster([fighter(3, 7), fighter(4, 11)]);
  for (const [donors, reason] of [
    [[], 'no-donors'], [null, 'invalid-donors'], [{}, 'invalid-donors'],
    [[stored(3), null], 'invalid-donor'], [[stored(3), { location: 'inventory', id: 4 }], 'invalid-donor'],
    [[stored(3), { location: 'reserve', id: '4' }], 'invalid-donor'],
    [[stored(3), { location: 'reserve', id: 0 }], 'invalid-donor'],
    [[stored(3), stored(99)], 'donor-missing'], [[stored(3), army(4)], 'donor-missing'],
    [[stored(3), stored(3)], 'duplicate-donor'], [[stored(3), army(3)], 'duplicate-donor'],
    [[stored(3), army(1)], 'same-unit'], [[stored(3), army(2)], 'different-type'],
  ]) assertRejected(units, reserve, army(1), donors, reason);
});

test('recipient identity and location are explicit and never inferred from another collection', () => {
  const units = freezeRoster([deployed(1, 3)]), reserve = freezeRoster([fighter(2, 4)]);
  for (const recipient of [null, undefined, [], 1, { location: 'unknown', id: 1 }, army('1'), army(-1), army(Infinity)]) {
    assertRejected(units, reserve, recipient, [stored(2)], 'invalid-recipient');
  }
  for (const recipient of [army(99), stored(1), army(2)]) {
    assertRejected(units, reserve, recipient, [stored(2)], 'recipient-missing');
  }
});

test('invalid roster entries anywhere fail before a connection can consume or normalize fighters', () => {
  const units = [deployed(1)], reserve = [fighter(2)];
  const malformed = [null, fighter(3, 0), fighter(3, -1), fighter(3, 1.5), fighter(3, '2'),
    fighter(3, NaN), fighter(3, Infinity), fighter(3, Number.MAX_SAFE_INTEGER + 1),
    fighter(3, 2, 'unknown'), fighter(3, 2, 'toString'), fighter('3'), fighter(0),
    fighter(-1), fighter(1.5), { id: 3, type: 'swordsman' }, Object.assign([], fighter(3))];
  for (const invalid of malformed) {
    assertRejected(units, [...reserve, invalid], army(1), [stored(2)], 'invalid-state');
  }
  for (const [invalidUnits, invalidReserve] of [[null, reserve], [units, {}],
    [units, [fighter(1)]], [units, [fighter(2), fighter(2)]], [[deployed(1), deployed(1)], reserve]]) {
    assertRejected(invalidUnits, invalidReserve, army(1), [stored(2)], 'invalid-state');
  }
});

test('the optional army minimum prevents consuming the last deployed fighter atomically', () => {
  const units = freezeRoster([deployed(1, 5)]), reserve = freezeRoster([fighter(2, 7), fighter(3, 2)]);
  assertRejected(units, reserve, stored(2), [stored(3), army(1)], 'army-minimum', { minArmyUnits: 1 });
  const planning = getConnectResult(units, reserve, stored(2), [stored(3), army(1)], { minArmyUnits: 0 });
  assert.equal(planning.ok, true);
  assert.deepEqual(planning.units, []);
  assert.deepEqual(planning.reserve, [fighter(2, 14)]);
  const armyRecipient = getConnectResult(units, reserve, army(1), [stored(2), stored(3)], { minArmyUnits: 1 });
  assert.equal(armyRecipient.ok, true);
  assert.deepEqual(armyRecipient.units, [deployed(1, 14)]);
  const reserveOnly = getConnectResult([], reserve, stored(2), [stored(3)]);
  assert.equal(reserveOnly.ok, true);
});

test('invalid army minimum options do not silently permit consumption', () => {
  const units = [deployed(1)], reserve = [fighter(2)];
  for (const options of [null, false, 1, [], { minArmyUnits: null }, { minArmyUnits: -1 }, { minArmyUnits: 1.5 },
    { minArmyUnits: NaN }, { minArmyUnits: Infinity }, { minArmyUnits: '1' }, { minArmyUnits: Number.MAX_SAFE_INTEGER + 1 }]) {
    assertRejected(units, reserve, army(1), [stored(2)], 'invalid-options', options);
  }
});

test('batch levels pass 100/250/500 and reach the safe boundary without silently discarding a donor', () => {
  const result = getConnectResult([], [fighter(1, 90), fighter(2, 20), fighter(3, 200), fighter(4, 250)],
    stored(1), [stored(2), stored(3), stored(4)]);
  assert.equal(result.ok, true);
  assert.equal(result.recipient.level, 560);
  assert.equal(result.addedLevels, 470);
  const units = freezeRoster([deployed(1, Number.MAX_SAFE_INTEGER - 30)]);
  const reserve = freezeRoster([fighter(2, 10), fighter(3, 20), fighter(4)]);
  const exact = getConnectResult(units, reserve, army(1), [stored(2), stored(3)]);
  assert.equal(exact.ok, true);
  assert.equal(exact.recipient.level, Number.MAX_SAFE_INTEGER);
  assert.equal(exact.addedLevels, 30);
  assertRejected(units, reserve, army(1), [stored(2), stored(3), stored(4)], 'level-overflow');
});

test('a completed batch cannot repeat after serialization and does not change an ongoing battle snapshot', () => {
  const units = freezeRoster([deployed(1, 3), deployed(2, 4, 'swordsman', 3, 0)]);
  const reserve = freezeRoster([fighter(3, 2)]);
  const battle = createBattle(units, 1);
  const before = structuredClone(battle);
  const recipient = army(1), donors = [army(2), stored(3)];
  const result = getConnectResult(units, reserve, recipient, donors);
  assert.equal(result.ok, true);
  assert.deepEqual(battle, before);
  assert.equal(result.recipient.level, 9);
  const saved = JSON.parse(JSON.stringify({ units: result.units, reserve: result.reserve }));
  assertRejected(saved.units, saved.reserve, recipient, donors, 'donor-missing');
  assert.equal(saved.units[0].level, 9);
  result.units[0].col = 0;
  result.units[0].level = 25;
  result.consumed[0].level = 26;
  assert.equal(units[0].col, 2);
  assert.equal(units[0].level, 3);
  assert.equal(units[1].level, 4);
  assert.deepEqual(battle, before);
});

test('source-first dragging still consumes its original source into the army target', () => {
  const units = freezeRoster([deployed(1, 7)]), reserve = freezeRoster([fighter(2, 5)]);
  const result = getMergeResult(units, reserve, stored(2), 1);
  assert.equal(result.ok, true);
  assert.equal(result.target.id, 1);
  assert.equal(result.target.level, 12);
  assert.equal(result.source.id, 2);
  assert.deepEqual(result.reserve, []);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { loadCombatEngine, makeFormation, simulateCombat } from '../scripts/combat-balance.mjs';

const engine = await loadCombatEngine();

test('combat harness uses the three starting cells and legal distinct expanded placements', () => {
  const starter = makeFormation({ swordsman: 1, archer: 1, healer: 1 });
  assert.deepEqual(starter.map(({ col, row }) => [col, row]), [[2, 0], [2, 1], [2, 2]]);
  const expanded = makeFormation({ swordsman: 9, archer: 4, healer: 2, level: 100 });
  assert.equal(new Set(expanded.map(unit => `${unit.col}:${unit.row}`)).size, 15);
  assert.ok(expanded.every(unit => unit.col >= 0 && unit.col < 5 && unit.row >= 0 && unit.row < 3));
  assert.throws(() => makeFormation({ swordsman: 16 }), RangeError);
});

test('combat harness retains high personal levels and rejects invalid numeric representations', () => {
  for (const level of [101, 500, Number.MAX_SAFE_INTEGER]) {
    const formation = makeFormation({ swordsman: 1, archer: 1, healer: 1, level });
    assert.deepEqual(formation.map(unit => unit.level), [level, level, level]);
  }
  for (const level of [0, -1, 1.5, '500', NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => makeFormation({ swordsman: 1, level }), RangeError);
  }
});

test('a real complete combat is deterministic and reports actual damage without mutating saved fighters', () => {
  const formation = makeFormation({ swordsman: 9, archer: 4, healer: 2, level: 100 });
  for (const unit of formation) Object.freeze(unit);
  Object.freeze(formation);
  const result = simulateCombat(engine, { wave: 1, formation });
  assert.equal(result.outcome, 'victory');
  assert.equal(result.kills, result.totalEnemies);
  assert.equal(result.damageToEnemies, result.initialEnemyHp);
  assert.equal(result.damageToKing, engine.KING_MAX_HP - result.kingHp);
  assert.deepEqual(simulateCombat(engine, { wave: 1, formation }), result);
});

test('the combat deadline reports timeout without inventing a loss or omitting unspawned enemies', () => {
  const result = simulateCombat(engine, { wave: 1, formation: [], maxSeconds: .1 });
  assert.equal(result.outcome, 'timeout');
  assert.equal(result.battleSeconds, .1);
  assert.equal(result.spawned, 0);
  assert.equal(result.enemyRemaining, result.totalEnemies);
  assert.equal(result.kingHp, engine.KING_MAX_HP);
  assert.equal(result.casualties, 0);
});

test('the harness does not feed oversized or invalid time steps to the real combat engine', () => {
  for (const dt of [0, -1, NaN, Infinity, .05]) {
    assert.throws(() => simulateCombat(engine, { dt }), RangeError);
  }
  assert.throws(() => simulateCombat(engine, { maxSeconds: 0 }), RangeError);
});

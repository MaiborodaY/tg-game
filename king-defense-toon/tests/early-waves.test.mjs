import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { loadCombatEngine, makeFormation, simulateCombat } from '../scripts/combat-balance.mjs';

const engine = await loadCombatEngine();
const snapshot = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('opening rebalance preserves the first three waves and the established ninth wave', () => {
  assert.equal(snapshot(engine.WAVE_DEFINITIONS.slice(0, 3)),
    '28e3aaae9436bb385d84ebfe7728e41732f18536b8637a23da20148280397403');
  assert.equal(snapshot(engine.WAVE_DEFINITIONS[8]),
    'abbcf6865e106be4f8dee2b748a2bd6a14d1479a2b4559c9f48199cc2b3ddf7c');
});

test('four level-two fighters can pass wave four with either zero or one healer', () => {
  for (const healer of [0, 1]) {
    const formation = makeFormation({ swordsman: 3 - healer, archer: 1, healer, level: 2 });
    const result = simulateCombat(engine, { wave: 4, formation });
    assert.equal(result.outcome, 'victory', `${healer} healer`);
    assert.equal(result.kingHp, engine.KING_MAX_HP, `${healer} healer: army protects the king`);
    assert.ok(result.survivors > 0, `${healer} healer: no king-only cleanup`);
    assert.equal(result.enraged, false);
  }
});

test('opening health grows except for the requested wave-ten escort removal, with at most four per arrival', () => {
  let previousHp = 0;
  for (const wave of engine.WAVE_DEFINITIONS.slice(0, 10)) {
    const hp = wave.spawns.reduce((sum, spawn) => sum + spawn.hp, 0);
    if (wave.number === 10) assert.equal(hp, 750, 'one 94-HP escort was removed without buffing the chief');
    else assert.ok(hp > previousHp, `wave ${wave.number}: no health-budget plateau or reset`);
    assert.ok(wave.total <= 9, `wave ${wave.number}: no crowd inflation`);
    const arrivals = new Map();
    for (const spawn of wave.spawns) arrivals.set(spawn.at, (arrivals.get(spawn.at) ?? 0) + 1);
    assert.ok([...arrivals.values()].every(count => count <= 4));
    previousHp = hp;
  }
});

test('one fixed eight-fighter level-three formation can clear the first chief after the escort removal', () => {
  // Each case starts with full HP. These are explicit formations, not a forecast of
  // how many recruits, unlocked cells, or merges a player will have earned.
  const formation = makeFormation({ swordsman: 5, archer: 2, healer: 1, level: 3 });
  for (let wave = 1; wave <= 9; wave += 1) {
    const result = simulateCombat(engine, { wave, formation });
    assert.equal(result.outcome, 'victory', `wave ${wave}`);
    assert.equal(result.kingHp, engine.KING_MAX_HP, `wave ${wave}: army protects the king`);
    assert.equal(result.enraged, false, `wave ${wave}: no overtime damage cliff`);
  }
  const chief = simulateCombat(engine, { wave: 10, formation });
  assert.equal(chief.outcome, 'victory');
  assert.equal(chief.survivors, 3);
  assert.equal(chief.kingHp, engine.KING_MAX_HP);
  assert.equal(chief.enraged, false, 'the encounter must not rely on overtime damage');
});

test('upgrading eight fighters to level five makes the opening chief beatable with zero or one healer', () => {
  for (const healer of [0, 1]) {
    const formation = makeFormation({ swordsman: 6 - healer, archer: 2, healer, level: 5 });
    const result = simulateCombat(engine, { wave: 10, formation });
    assert.equal(result.outcome, 'victory', `${healer} healer`);
    assert.equal(result.kingHp, engine.KING_MAX_HP, `${healer} healer: army protects the king`);
    assert.ok(result.survivors > 0, `${healer} healer: no king-only cleanup`);
    assert.equal(result.enraged, false);
  }
});

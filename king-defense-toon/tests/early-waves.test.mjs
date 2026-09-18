import assert from 'node:assert/strict';
import test from 'node:test';
import { loadCombatEngine, makeFormation, simulateCombat } from '../scripts/combat-balance.mjs';
import { createHero, awardHeroXp, getHeroProgress, spendHeroTalent } from '../hero.ts';

const engine = await loadCombatEngine();
test('the opening gains modest durability without extra bodies or faster arrivals', () => {
  const expectedHealth = [198, 202, 290, 337, 403, 469, 557, 682, 869, 825];
  const expectedCounts = [3, 4, 5, 5, 6, 6, 7, 8, 9, 5];
  for (const [index, wave] of engine.WAVE_DEFINITIONS.slice(0, 10).entries()) {
    assert.equal(wave.spawns.reduce((sum, spawn) => sum + spawn.hp, 0), expectedHealth[index], `wave ${wave.number}`);
    assert.equal(wave.total, expectedCounts[index], `wave ${wave.number}`);
  }
  assert.deepEqual(engine.WAVE_DEFINITIONS[0].spawns.map(spawn => [spawn.at, spawn.type, spawn.hp, spawn.damage]),
    [[.8, 'goblin', 66, 7.35], [.8, 'goblin', 66, 7.35], [6.8, 'goblin', 66, 7.35]]);
  assert.deepEqual([...new Set(engine.WAVE_DEFINITIONS[8].spawns.map(spawn => spawn.at))], [.8, 14.8, 28.8]);
});

test('four level-two fighters can pass wave four with any first skill and zero or one healer', () => {
  for (const healer of [0, 1]) for (const skill of ['heal_unlock', 'aura_unlock', 'hammer_unlock']) {
    const heroState = createHero();
    // The actual first three clears earn the first talent point before wave four.
    for (const wave of engine.WAVE_DEFINITIONS.slice(0, 3)) {
      awardHeroXp(heroState, { waveNumber: wave.number, kills: wave.total, total: wave.total, won: true });
    }
    assert.equal(getHeroProgress(heroState).level, 2);
    assert.equal(spendHeroTalent(heroState, skill).spent, true);
    const formation = makeFormation({ swordsman: 3 - healer, archer: 1, healer, level: 2 });
    const result = simulateCombat(engine, { wave: 4, formation, heroState });
    assert.equal(result.outcome, 'victory', `${healer} healer, ${skill}`);
    assert.equal(result.kingHp, engine.KING_MAX_HP, `${healer} healer: army protects the king`);
    assert.ok(result.survivors > 0, `${healer} healer: no king-only cleanup`);
    assert.equal(result.enraged, false);
  }
});

test('opening health grows except for the requested wave-ten escort removal, with at most four per arrival', () => {
  let previousHp = 0;
  for (const wave of engine.WAVE_DEFINITIONS.slice(0, 10)) {
    const hp = wave.spawns.reduce((sum, spawn) => sum + spawn.hp, 0);
    if (wave.number === 10) assert.equal(hp, 825, 'the removed late escort stays removed after the modest stat increase');
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
  // The restored second archer raises casualties; this reference army must still
  // win without relying on the castle or an overtime damage boost.
  assert.ok(chief.survivors > 0, 'the army can finish the chief with his restored archer');
  assert.ok(chief.casualties > 0, 'the chief still inflicts real losses');
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

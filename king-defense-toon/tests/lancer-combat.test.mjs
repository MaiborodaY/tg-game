import assert from 'node:assert/strict';
import test from 'node:test';
import { createBattle, getUnitRange, updateBattle } from '../combat.ts';
import { getUnitStats } from '../recruitment.ts';
import { makeFormation } from '../scripts/combat-balance.mjs';

const DT = 1 / 60;
const fighter = (id, type, col, row, level = 1) => ({ id, type, col, row, level });

function encounter(formation, enemies) {
  const battle = createBattle(formation, 1);
  const spawns = enemies.map(enemy => ({ at: 0, x: 195, y: 180, ...enemy }));
  battle.wave = { ...battle.wave, spawns, total: spawns.length };
  battle.total = spawns.length;
  battle.nextSpawn = 0;
  return battle;
}

function advance(battle, until, limit = 60) {
  while (battle.phase === 'running' && battle.elapsed < limit && !until()) updateBattle(battle, DT);
  assert.ok(until(), `condition not reached before ${battle.phase} at ${battle.elapsed.toFixed(2)}s`);
}

test('lancer has a distinct second-rank range and follows the shared linear personal-level scaling', () => {
  assert.deepEqual(getUnitStats('lancer', 1), { level: 1, hp: 48, damage: 7, heal: 0 });
  assert.deepEqual(getUnitStats('lancer', 11), { level: 11, hp: 72, damage: 11, heal: 0 });
  assert.equal(getUnitRange('lancer'), 75);
  assert.ok(getUnitRange('swordsman') < getUnitRange('lancer'));
  assert.ok(getUnitRange('lancer') < getUnitRange('archer'));
});

test('spear attacks hit a single enemy without launching an arrow', () => {
  const battle = encounter([fighter(1, 'lancer', 2, 0)], [
    { type: 'goblin', x: 175, y: 220, hp: 500, damage: 0 },
    { type: 'goblin', x: 215, y: 220, hp: 500, damage: 0 },
  ]);
  const events = [];
  while (!battle.enemies.some(enemy => enemy.hp < 500) && battle.elapsed < 10) {
    events.push(...updateBattle(battle, DT));
    assert.ok(!battle.projectiles.some(effect => effect.type === 'arrow' && effect.sourceType === 'lancer'));
  }
  assert.equal(battle.enemies.filter(enemy => enemy.hp < 500).length, 1);
  assert.equal(battle.enemies.reduce((damage, enemy) => damage + 500 - enemy.hp, 0), 7);
  assert.ok(battle.effects.some(effect => effect.type === 'slash' && effect.sourceType === 'lancer'));
  assert.ok(!events.some(event => event.type === 'bow-shot'));
});

test('a lancer behind a swordsman reaches the same enemy and attacks from the second rank', () => {
  const battle = encounter([
    fighter(1, 'swordsman', 2, 0), fighter(2, 'lancer', 2, 1),
  ], [{ type: 'goblin', hp: 500, damage: 0 }]);
  const [swordsman, lancer] = battle.allies;
  const strikes = new Set();
  advance(battle, () => {
    for (const effect of battle.effects) if (effect.type === 'slash') strikes.add(effect.sourceId);
    return strikes.has(swordsman.id) && strikes.has(lancer.id);
  }, 15);
  assert.ok(lancer.y - swordsman.y >= 25, 'the spear must reach over a non-overlapping front line');
  assert.ok(battle.enemies[0].hp < 500);
  assert.equal(battle.enraged, false);
});

test('a lone lancer closes on a goblin archer at the entrance and kills it', () => {
  const battle = encounter([fighter(1, 'lancer', 2, 2)], [
    { type: 'goblinArcher', y: 66 },
  ]);
  const lancer = battle.allies[0];
  const startY = lancer.y;
  advance(battle, () => battle.phase === 'victory', 40);
  assert.ok(lancer.y < startY - 150);
  assert.ok(lancer.hp > 0);
  assert.equal(battle.king.hp, battle.king.maxHp);
  assert.equal(battle.enraged, false);
});

test('a mixed army keeps its lancers attacking and retargets archers after melee enemies die', () => {
  for (const wave of [2, 8]) {
    const formation = makeFormation({ swordsman: 5, archer: 2, healer: 1, level: 3 });
    // Replace the rear two melee slots, preserving identical size, level and placements.
    const rearMelee = formation.filter(unit => unit.type === 'swordsman')
      .sort((a, b) => b.row - a.row).slice(0, 2);
    for (const unit of rearMelee) unit.type = 'lancer';
    const battle = createBattle(formation, wave);
    const traces = new Map(battle.allies.filter(unit => unit.type === 'lancer')
      .map(unit => [unit.id, { strikes: 0, archerStrikes: 0, retargets: 0, stalled: 0, longestStall: 0 }]));
    let lastEffect = 0;
    while (battle.phase === 'running' && battle.elapsed < 90) {
      const previous = new Map(battle.allies.map(unit => [unit.id, { x: unit.x, y: unit.y, focusId: unit.focusId }]));
      updateBattle(battle, DT);
      for (const unit of battle.allies) {
        const trace = traces.get(unit.id);
        if (!trace || unit.hp <= 0) continue;
        const before = previous.get(unit.id);
        if (before.focusId && unit.focusId && before.focusId !== unit.focusId) trace.retargets++;
        const target = battle.enemies.find(enemy => enemy.id === unit.focusId);
        const outsideReach = target?.hp > 0 && Math.hypot(target.x - unit.x, target.y - unit.y) > unit.range + 6;
        const motionless = Math.hypot(unit.x - before.x, unit.y - before.y) < .025;
        trace.stalled = outsideReach && motionless && unit.cooldown <= 0 && unit.action !== 'attack'
          ? trace.stalled + DT : 0;
        trace.longestStall = Math.max(trace.longestStall, trace.stalled);
      }
      for (const effect of battle.effects) {
        if (effect.id <= lastEffect || effect.type !== 'slash') continue;
        const trace = traces.get(effect.sourceId);
        if (!trace) continue;
        trace.strikes++;
        const source = battle.allies.find(unit => unit.id === effect.sourceId);
        if (battle.enemies.find(enemy => enemy.id === source.targetId)?.type === 'goblinArcher') trace.archerStrikes++;
      }
      lastEffect = battle.nextEffectId - 1;
    }
    assert.equal(battle.phase, 'victory');
    assert.equal(battle.enraged, false);
    assert.ok([...traces.values()].every(trace => trace.strikes > 0 && trace.retargets > 0 && trace.longestStall < 3));
    assert.ok([...traces.values()].some(trace => trace.archerStrikes > 0));
  }
});

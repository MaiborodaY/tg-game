import assert from 'node:assert/strict';
import test from 'node:test';
import { getSceneAssetPlan } from '../scene-assets.mjs';
import { getWaveDefinition } from '../waves.mjs';

test('an empty initial forest scene has no dependency on another map, enemies or army palettes', () => {
  const battle = getSceneAssetPlan({ units: [] });
  assert.equal(battle.mapKey, 'map:1');
  assert.equal(battle.resources.size, 2);
  assert.deepEqual(battle.allies.map(unit => unit.type), ['king']);
  assert.equal(battle.enemies.length, 0);
  const army = getSceneAssetPlan({ units: [] }, { formationOnly: true });
  assert.deepEqual(army.keys, ['map:1']);
});

test('load only present rank sheets, including placements and fighting units with a different rank', () => {
  const plan = getSceneAssetPlan({
    units: [{ type: 'swordsman', level: 26 }, { type: 'swordsman', level: 26 }],
    battle: { allies: [{ type: 'swordsman', level: 1 }] },
    placementType: 'healer', placementLevel: 76,
  });
  assert.deepEqual(plan.allies.map(unit => `${unit.type}:${unit.rank}`).sort(), ['healer:4', 'king:1', 'swordsman:1', 'swordsman:2']);
  const urls = plan.keys.join(' ');
  assert.match(urls, /swordsman-purple-sheet/);
  assert.match(urls, /tiny-swords-warrior-blue/);
  assert.match(urls, /healer-yellow-walk/);
  assert.match(urls, /healer-yellow-cast/);
  assert.doesNotMatch(urls, /swordsman-(red|yellow)|healer-(purple|red)|archer/);
});

test('a wave loads forthcoming enemies once and only its goblin palette', () => {
  const wave = getWaveDefinition(51);
  const plan = getSceneAssetPlan({ battle: { wave, enemies: [] } });
  assert.deepEqual(plan.enemies.map(enemy => enemy.type).sort(), [...new Set(wave.spawns.map(enemy => enemy.type))].sort());
  assert.match(plan.keys.join(' '), /torch-purple/);
  assert.doesNotMatch(plan.keys.join(' '), /torch-(red|yellow|blue)/);
  assert.equal(plan.mapKey, 'map:1');
  const same = getSceneAssetPlan({ battle: { wave, enemies: [{ type: 'goblin' }] } });
  assert.equal(same.signature, plan.signature, 'spawning an already planned enemy does not restart loading');
});

test('graveyard plans are isolated and Army does not retain battle sprites', () => {
  const state = { battle: { wave: getWaveDefinition(201), enemies: [] }, units: [{ type: 'archer', level: 1 }] };
  const battle = getSceneAssetPlan(state);
  assert.equal(battle.mapKey, 'map:2');
  assert.ok(!battle.keys.includes('map:1'));
  assert.ok(battle.enemies.every(enemy => !enemy.type.startsWith('goblin')));
  const army = getSceneAssetPlan(state, { formationOnly: true });
  assert.deepEqual(army.allies.map(unit => unit.type), ['archer']);
  assert.equal(army.enemies.length, 0);
});

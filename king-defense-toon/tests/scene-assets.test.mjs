import assert from 'node:assert/strict';
import test from 'node:test';
import { getSceneAssetPlan } from '../scene-assets.mjs';
import { getWaveDefinition } from '../waves.mjs';

test('an empty initial forest scene has no dependency on another map, enemies or army palettes', () => {
  const battle = getSceneAssetPlan({ units: [] });
  assert.equal(battle.mapKey, 'map:1');
  assert.equal(battle.resources.size, 5);
  assert.deepEqual(battle.allies, []);
  assert.deepEqual(Object.keys(battle.heroArt).sort(), ['down', 'side', 'up']);
  for (const url of [...Object.values(battle.heroArt), battle.heroEffects]) assert.ok(battle.resources.has(url));
  assert.doesNotMatch(battle.keys.join(' '), /king\.webp|st-knihor-portrait|lancer|goblin-healer/);
  assert.equal(battle.enemies.length, 0);
  const army = getSceneAssetPlan({ units: [] }, { formationOnly: true });
  assert.deepEqual(army.keys, ['map:1']);
  assert.deepEqual(army.heroArt, {});
  assert.equal(army.heroEffects, null);
});

test('load only present rank sheets, including placements and fighting units with a different rank', () => {
  const plan = getSceneAssetPlan({
    units: [{ type: 'swordsman', level: 26 }, { type: 'swordsman', level: 26 }],
    battle: { allies: [{ type: 'swordsman', level: 1 }] },
    placementType: 'healer', placementLevel: 76,
  });
  assert.deepEqual(plan.allies.map(unit => `${unit.type}:${unit.rank}`).sort(), ['healer:4', 'swordsman:1', 'swordsman:2']);
  const urls = plan.keys.join(' ');
  assert.match(urls, /swordsman-purple-sheet/);
  assert.match(urls, /tiny-swords-warrior-blue/);
  assert.match(urls, /healer-yellow-walk/);
  assert.match(urls, /healer-yellow-cast/);
  assert.doesNotMatch(urls, /swordsman-(red|yellow)|healer-(purple|red)|archer/);
});

test('lancer plans retain only displayed palettes across deployment, battle and placement', () => {
  const state = { units: [{ type: 'lancer', level: 26 }, { type: 'lancer', level: 26 }],
    battle: { allies: [{ type: 'lancer', level: 1 }] }, placementType: 'lancer', placementLevel: 76 };
  const battle = getSceneAssetPlan(state);
  assert.deepEqual(battle.allies.map(unit => `${unit.type}:${unit.rank}`).sort(), ['lancer:1', 'lancer:2', 'lancer:4']);
  assert.match(battle.keys.join(' '), /lancer-blue\.webp/);
  assert.match(battle.keys.join(' '), /lancer-purple\.webp/);
  assert.match(battle.keys.join(' '), /lancer-yellow\.webp/);
  assert.doesNotMatch(battle.keys.join(' '), /lancer-red|lancer-\w+-art/);
  const army = getSceneAssetPlan(state, { formationOnly: true });
  assert.deepEqual(army.allies.map(unit => `${unit.type}:${unit.rank}`).sort(), ['lancer:2', 'lancer:4']);
  assert.doesNotMatch(army.keys.join(' '), /lancer-blue|st-knihor/);
});

test('enemy healer body and pulse load for forthcoming or existing healers, never for Army', () => {
  const state = { wave: { levelNumber: 1, roundNumber: 11, spawns: [{ type: 'goblinHealer' }] } };
  const upcoming = getSceneAssetPlan(state);
  assert.deepEqual(upcoming.enemies.map(enemy => enemy.type), ['goblinHealer']);
  assert.match(upcoming.goblinHealPulse, /goblin-healer\/heal-pulse\.webp$/);
  assert.ok(upcoming.resources.has(upcoming.goblinHealPulse));
  const existing = getSceneAssetPlan({ battle: { enemies: [{ type: 'goblinHealer' }] } });
  assert.equal(existing.signature, upcoming.signature);
  const ordinary = getSceneAssetPlan({ wave: { spawns: [{ type: 'goblin' }] } });
  assert.equal(ordinary.goblinHealPulse, null);
  assert.doesNotMatch(ordinary.keys.join(' '), /goblin-healer|heal-pulse/);
  const army = getSceneAssetPlan(state, { formationOnly: true });
  assert.equal(army.goblinHealPulse, null);
  assert.deepEqual(army.keys, ['map:1']);
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

test('battle wave takes precedence and duplicate living enemies do not change the resource signature', () => {
  const wave = getWaveDefinition(201);
  const expected = getSceneAssetPlan({ wave });
  const source = { wave: getWaveDefinition(1), battle: { wave, enemies: [...wave.spawns, ...wave.spawns] } };
  const before = structuredClone(source);
  const actual = getSceneAssetPlan(source);
  assert.equal(actual.signature, expected.signature);
  assert.equal(actual.levelNumber, 2);
  assert.deepEqual(source, before, 'planning must not mutate saved or live combat state');
  assert.equal(getSceneAssetPlan({ ...source, levelNumber: 1 }).mapKey, 'map:1', 'explicit map selection retains precedence');
});

test('unknown ordinary JS identifiers are skipped and null scene parts retain the initial plan', () => {
  const expected = getSceneAssetPlan();
  const actual = getSceneAssetPlan({ units: [{ type: 'removed-unit', level: 100 }],
    placementType: 'unknown-placement', placementLevel: 50,
    wave: { spawns: [{ type: 'removed-enemy' }] }, battle: null });
  assert.deepEqual(actual, expected);
  assert.deepEqual(getSceneAssetPlan({ units: null, wave: null, battle: null, placementType: null }), expected);
});

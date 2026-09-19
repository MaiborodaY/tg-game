import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattle, updateBattle } from '../combat.ts';
import { applyBattleFood, getArmyUnitStats, NO_FOOD } from '../army-food.ts';
import { createForge, getForgedUnitStats } from '../forge.ts';
import { createHero } from '../hero.ts';
import { createDungeonRun, startDungeonBattle, finishDungeonWave, prepareNextDungeonWave } from '../dungeon-run.ts';
import { GOBLIN_CAVE_LEVELS } from '../dungeons.ts';

const formation = ['swordsman', 'healer', 'archer'].map((type, row) => ({ id: row + 1, type, level: 8, col: 2, row }));
const bonuses = { health: 1, attack: 2, attackSpeed: 1 };
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} vs ${expected}`);

test('food multiplies the forged army stats; hero and castle stay unchanged', () => {
  const forge = createForge({ health: 25, attack: 12, attackSpeed: 4 });
  const battle = createBattle(formation, 1, createHero(), forge);
  const hero = structuredClone(battle.hero), castle = structuredClone(battle.castle);
  assert.equal(applyBattleFood(battle, bonuses), true);
  for (const unit of battle.allies) {
    const base = getForgedUnitStats(unit.type, unit.level, forge);
    near(unit.maxHp, base.hp * 1.01); near(unit.damage, base.damage * 1.02);
    near(unit.heal, base.heal * 1.02); near(unit.attackSpeed, base.attackSpeed * 1.01);
    const preview = getArmyUnitStats(unit.type, unit.level, forge, bonuses);
    near(preview.hp, unit.maxHp); near(preview.damage, unit.damage); near(preview.heal, unit.heal);
  }
  assert.deepEqual(battle.hero, hero); assert.deepEqual(battle.castle, castle);
  assert.equal(applyBattleFood(battle, bonuses), false);
});

test('expiry preserves injury fraction, dead units and attack phase; no cumulative stat drift', () => {
  const battle = createBattle(formation), bases = structuredClone(battle.allies);
  battle.allies[0].hp *= .4; battle.allies[1].hp = 0;
  battle.allies[0].cooldown = .75; battle.allies[0].actionTime = .12;
  for (let i = 0; i < 100; i++) { applyBattleFood(battle, bonuses); applyBattleFood(battle, NO_FOOD); }
  for (let i = 0; i < bases.length; i++) {
    near(battle.allies[i].maxHp, bases[i].maxHp);
    near(battle.allies[i].damage, bases[i].damage);
    near(battle.allies[i].attackSpeed, bases[i].attackSpeed);
  }
  near(battle.allies[0].hp, bases[0].hp * .4);
  assert.equal(battle.allies[1].hp, 0);
  assert.equal(battle.allies[0].cooldown, .75); assert.equal(battle.allies[0].actionTime, .12);
});

test('food also applies to dungeon snapshots and never edits saved formation or forge', () => {
  const forge = createForge(), before = structuredClone(formation);
  const run = createDungeonRun(GOBLIN_CAVE_LEVELS[0], { clearedWaves: 50, firstClears: [] }, formation, ['2:0', '2:1', '2:2']);
  assert.equal(startDungeonBattle(run, createHero(), forge), true);
  applyBattleFood(run.battle, bonuses);
  const hp = run.battle.allies[0].maxHp;
  forge.health = 50;
  applyBattleFood(run.battle, NO_FOOD);
  near(run.battle.allies[0].maxHp, hp / 1.01);
  assert.deepEqual(formation, before);
});

test('food expiry never rewrites enemies or already launched gameplay projectiles', () => {
  const battle = createBattle(formation); applyBattleFood(battle, bonuses);
  for (let i = 0; i < 3000 && !battle.projectiles.length; i++) updateBattle(battle, 1 / 60);
  assert.ok(battle.projectiles.length > 0);
  const projectiles = structuredClone(battle.projectiles), enemies = structuredClone(battle.enemies);
  applyBattleFood(battle, NO_FOOD);
  assert.deepEqual(battle.projectiles, projectiles); assert.deepEqual(battle.enemies, enemies);
});

test('three-wave cave retains food bases, injuries and casualties across wave transitions', () => {
  const forge = createForge();
  const run = createDungeonRun(GOBLIN_CAVE_LEVELS[0], { clearedWaves: 50, firstClears: [] }, formation, ['2:0', '2:1', '2:2']);
  startDungeonBattle(run, createHero(), forge);
  const battle = run.battle, baseHp = battle.allies[0].maxHp;
  applyBattleFood(battle, bonuses);
  battle.allies[0].hp *= .4;
  const injuredHp = battle.allies[0].hp, deadId = battle.allies[1].id;
  battle.allies[1].hp = 0; battle.phase = 'victory';
  battle.kills = battle.total;
  assert.equal(finishDungeonWave(run), true);
  const foodBases = battle.food.bases;
  assert.equal(prepareNextDungeonWave(run), true);
  assert.equal(startDungeonBattle(run, createHero(), forge), true);
  assert.equal(run.battle, battle); assert.equal(battle.food.bases, foodBases);
  assert.equal(battle.waveNumber, 2);
  assert.equal(applyBattleFood(battle, bonuses), false);
  assert.equal(battle.allies[0].hp, injuredHp);
  assert.equal(battle.allies.some(unit => unit.id === deadId), false);
  applyBattleFood(battle, NO_FOOD);
  near(battle.allies[0].maxHp, baseHp); near(battle.allies[0].hp, baseHp * .4);
  battle.phase = 'victory';
  battle.kills = battle.total;
  assert.equal(finishDungeonWave(run), true);
  assert.equal(prepareNextDungeonWave(run), true);
  assert.equal(startDungeonBattle(run, createHero(), forge), true);
  assert.equal(battle.waveNumber, 3); assert.equal(battle.wave.bossType, 'goblinChief');
  assert.equal(battle.food.bases, foodBases);
  applyBattleFood(battle, bonuses);
  near(battle.allies[0].hp, injuredHp);
  assert.equal(battle.allies.some(unit => unit.id === deadId), false);
});

test('food retains Forge stat safety bounds at extreme personal levels', () => {
  const forge = createForge({ health: 100, attack: 100, attackSpeed: 100 });
  const stats = getArmyUnitStats('swordsman', Number.MAX_SAFE_INTEGER, forge, bonuses);
  for (const value of [stats.hp, stats.damage, stats.heal, stats.attackSpeed]) {
    assert.ok(Number.isFinite(value) && value <= Number.MAX_SAFE_INTEGER);
  }
});

test('food-enhanced combat retains fixed-step outcomes across rendering FPS and speeds', () => {
  const outcomes = [];
  for (const fps of [15, 30, 60, 120]) for (const speed of [1, 2, 3]) {
    const battle = createBattle(formation); applyBattleFood(battle, bonuses);
    for (let i = 0; i < fps * 120 && battle.phase === 'running'; i++) updateBattle(battle, speed / fps);
    assert.equal(battle.phase, 'victory');
    outcomes.push({ phase: battle.phase, kills: battle.kills, hp: battle.allies.map(unit => Math.round(unit.hp * 1e6)),
      castle: Math.round(battle.castle.hp * 1e6), reward: battle.reward });
  }
  for (const outcome of outcomes) assert.deepEqual(outcome, outcomes[0]);
});

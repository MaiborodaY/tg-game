import assert from "node:assert/strict";
import test from "node:test";

import {
  ENEMY_HERO_ATTACK_PROFILES,
  ENEMY_HERO_BLOCK_COSTS,
  HERO_COMBAT_TIMING,
  HERO_FRONTLINE_RATIOS,
  TOREN_HERO_COMBAT_STATS,
  calculateHeroDamageTaken,
  getEnemyHeroAttackProfile,
  getEnemyHeroBlockCost,
  getEnemyHeroFirstAttackDelayMs,
  getHeroFrontlineProgress,
  getHeroFrontlineRatio,
  getTorenHeroCombatStats,
} from "../src/game/heroCombat.ts";

test("Toren frontline ranks expose the authored durability curve", () => {
  assert.deepEqual(getTorenHeroCombatStats(1), {
    maxHp: 180,
    armor: 0.1,
    blockCapacity: 2,
    regenHpPerSecond: 9,
  });
  assert.deepEqual(getTorenHeroCombatStats(2), {
    maxHp: 270,
    armor: 0.18,
    blockCapacity: 3,
    regenHpPerSecond: 14,
  });
  assert.deepEqual(getTorenHeroCombatStats(3), {
    maxHp: 390,
    armor: 0.25,
    blockCapacity: 3,
    regenHpPerSecond: 20,
  });
  assert.equal(Object.isFrozen(TOREN_HERO_COMBAT_STATS), true);
  assert.equal(Object.isFrozen(getTorenHeroCombatStats(3)), true);
  assert.deepEqual(HERO_COMBAT_TIMING, {
    regenDelayMs: 3_000,
    knockoutDurationMs: 10_000,
    respawnHpRatio: 0.5,
    countdownMoveSpeed: 420,
    respawnMoveSpeed: 180,
    captureDistance: 22,
    meleeRange: 38,
    bossMaximumBlockMs: 3_000,
    bossBlockImmunityMs: 5_000,
  });
});

test("enemy hero attack profiles and their first wind-up are deterministic", () => {
  assert.deepEqual(ENEMY_HERO_ATTACK_PROFILES, {
    raider: { damage: 7, intervalMs: 1_200 },
    swift: { damage: 5, intervalMs: 800 },
    brute: { damage: 16, intervalMs: 1_600 },
    warden: { damage: 10, intervalMs: 1_200 },
    shade: { damage: 7, intervalMs: 750 },
    bulwark: { damage: 18, intervalMs: 1_800 },
    shaman: { damage: 9, intervalMs: 1_400 },
    boss: { damage: 28, intervalMs: 1_600 },
    titan: { damage: 40, intervalMs: 1_800 },
  });
  assert.equal(getEnemyHeroAttackProfile("boss").damage, 28);
  assert.equal(getEnemyHeroFirstAttackDelayMs("swift"), 400);
  assert.equal(getEnemyHeroFirstAttackDelayMs("raider"), 600);
  assert.equal(getEnemyHeroFirstAttackDelayMs("titan"), 600);
});

test("heavy enemies consume additional frontline block capacity", () => {
  assert.deepEqual(ENEMY_HERO_BLOCK_COSTS, {
    raider: 1,
    swift: 1,
    brute: 2,
    warden: 1,
    shade: 1,
    bulwark: 2,
    shaman: 1,
    boss: 3,
    titan: 3,
  });
  assert.equal(getEnemyHeroBlockCost("raider"), 1);
  assert.equal(getEnemyHeroBlockCost("bulwark"), 2);
  assert.equal(getEnemyHeroBlockCost("titan"), 3);
});

test("Forest Gate anchor ids map to stable normalized frontline progress", () => {
  assert.deepEqual(HERO_FRONTLINE_RATIOS, [0.3, 846 / 1_400, 0.84]);
  assert.equal(getHeroFrontlineRatio(0), 0.3);
  assert.equal(getHeroFrontlineRatio(1), 846 / 1_400);
  assert.equal(getHeroFrontlineRatio(2), 0.84);
  assert.equal(getHeroFrontlineProgress(1_400, 0), 420);
  assert.equal(getHeroFrontlineProgress(1_400, 1), 846);
  assert.equal(getHeroFrontlineProgress(1_400, 2), 1_176);
  assert.equal(getHeroFrontlineProgress(700, 1), 423);
  assert.equal(getHeroFrontlineProgress(1_400, 3), null);
  assert.equal(getHeroFrontlineProgress(0, 0), null);
  assert.equal(getHeroFrontlineRatio(1.5), null);
});

test("hero armor applies bounded integer damage without healing on invalid input", () => {
  assert.equal(calculateHeroDamageTaken(16, 0.18), 13);
  assert.equal(calculateHeroDamageTaken(1, 1), 1);
  assert.equal(calculateHeroDamageTaken(10, -1), 10);
  assert.equal(calculateHeroDamageTaken(10, 2), 1);
  assert.equal(calculateHeroDamageTaken(-5, 0.2), 0);
  assert.equal(calculateHeroDamageTaken(Number.NaN, 0.2), 0);
});

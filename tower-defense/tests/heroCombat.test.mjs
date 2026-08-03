import assert from "node:assert/strict";
import test from "node:test";

import {
  ENEMY_HERO_ATTACK_PROFILES,
  ENEMY_HERO_BLOCK_COSTS,
  HERO_COMBAT_RELEASED,
  HERO_COMBAT_STATS,
  HERO_COMBAT_TIMING,
  HERO_FRONTLINE_PASSIVE_POWER,
  HERO_FRONTLINE_RATIOS,
  applyHeroicArmorDamage,
  calculateHeroDamageTaken,
  getEffectiveEnemyHeroBlockCost,
  getEnemyHeroAttackProfile,
  getEnemyHeroBlockCost,
  getEnemyHeroDamageMultiplier,
  getEnemyHeroFirstAttackDelayMs,
  getHeroCombatStats,
  getHeroFrontlineProgress,
  getHeroFrontlineRatio,
} from "../src/game/heroCombat.ts";

const EXPECTED_HERO_STATS = Object.freeze({
  eira: Object.freeze({
    1: { maxHp: 45, maxHeroicArmor: 0, blockCapacity: 1, regenHpPerSecond: 2, attackRange: 120, attackDamage: 4 },
    2: { maxHp: 65, maxHeroicArmor: 2, blockCapacity: 1, regenHpPerSecond: 3, attackRange: 124, attackDamage: 6 },
    3: { maxHp: 90, maxHeroicArmor: 3, blockCapacity: 1, regenHpPerSecond: 4, attackRange: 128, attackDamage: 8 },
  }),
  toren: Object.freeze({
    1: { maxHp: 130, maxHeroicArmor: 6, blockCapacity: 2, regenHpPerSecond: 5, attackRange: 38, attackDamage: 7 },
    2: { maxHp: 190, maxHeroicArmor: 10, blockCapacity: 3, regenHpPerSecond: 8, attackRange: 38, attackDamage: 11 },
    3: { maxHp: 260, maxHeroicArmor: 15, blockCapacity: 3, regenHpPerSecond: 11, attackRange: 38, attackDamage: 17 },
  }),
  grak: Object.freeze({
    1: { maxHp: 90, maxHeroicArmor: 3, blockCapacity: 1, regenHpPerSecond: 4, attackRange: 42, attackDamage: 9 },
    2: { maxHp: 135, maxHeroicArmor: 6, blockCapacity: 1, regenHpPerSecond: 6, attackRange: 44, attackDamage: 14 },
    3: { maxHp: 185, maxHeroicArmor: 9, blockCapacity: 1, regenHpPerSecond: 8, attackRange: 46, attackDamage: 18 },
  }),
});

const EXPECTED_ATTACK_PROFILES = Object.freeze({
  raider: { damage: 7, armorDamage: 1, intervalMs: 1_200 },
  swift: { damage: 5, armorDamage: 1, intervalMs: 800 },
  brute: { damage: 16, armorDamage: 3, intervalMs: 1_600 },
  warden: { damage: 10, armorDamage: 2, intervalMs: 1_200 },
  shade: { damage: 7, armorDamage: 1, intervalMs: 750 },
  bulwark: { damage: 18, armorDamage: 4, intervalMs: 1_800 },
  shaman: { damage: 9, armorDamage: 2, intervalMs: 1_400 },
  boss: { damage: 42, armorDamage: 10, intervalMs: 1_600 },
  titan: { damage: 100, armorDamage: 18, intervalMs: 1_800 },
});

const EXPECTED_BLOCK_COSTS = Object.freeze({
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

test("all heroes expose an immutable three-rank frontline role", () => {
  assert.equal(HERO_COMBAT_RELEASED, true);
  assert.deepEqual(HERO_COMBAT_STATS, EXPECTED_HERO_STATS);
  for (const heroId of Object.keys(EXPECTED_HERO_STATS)) {
    for (const level of [1, 2, 3]) {
      assert.deepEqual(getHeroCombatStats(heroId, level), EXPECTED_HERO_STATS[heroId][level]);
      assert.equal(Object.isFrozen(getHeroCombatStats(heroId, level)), true);
    }
  }

  assert.ok(getHeroCombatStats("eira", 3).maxHp < getHeroCombatStats("grak", 3).maxHp);
  assert.ok(getHeroCombatStats("grak", 3).maxHp < getHeroCombatStats("toren", 3).maxHp);
  assert.ok(getHeroCombatStats("eira", 1).attackRange > getHeroCombatStats("grak", 3).attackRange);
  assert.ok(getHeroCombatStats("eira", 3).attackDamage < getHeroCombatStats("toren", 3).attackDamage);
  assert.equal(Object.isFrozen(HERO_COMBAT_STATS), true);
});

test("enemy attacks define damage, armor chip, and deterministic first wind-up exhaustively", () => {
  assert.deepEqual(ENEMY_HERO_ATTACK_PROFILES, EXPECTED_ATTACK_PROFILES);
  for (const type of Object.keys(EXPECTED_ATTACK_PROFILES)) {
    const expected = EXPECTED_ATTACK_PROFILES[type];
    assert.deepEqual(getEnemyHeroAttackProfile(type), expected);
    assert.equal(Object.isFrozen(getEnemyHeroAttackProfile(type)), true);
    assert.equal(getEnemyHeroFirstAttackDelayMs(type), Math.min(600, expected.intervalMs / 2));
  }
  assert.ok(getEnemyHeroAttackProfile("boss").armorDamage > getEnemyHeroAttackProfile("bulwark").armorDamage);
  assert.ok(getEnemyHeroAttackProfile("titan").armorDamage > getEnemyHeroAttackProfile("boss").armorDamage);
});

test("intact frost armor makes an enemy more dangerous to a frontline hero", () => {
  assert.equal(getEnemyHeroDamageMultiplier(0), 1);
  assert.equal(getEnemyHeroDamageMultiplier(-1), 1);
  assert.equal(getEnemyHeroDamageMultiplier(Number.NaN), 1);
  assert.equal(getEnemyHeroDamageMultiplier(0.01), 1.45);
  assert.equal(getEnemyHeroDamageMultiplier(100), 1.45);
});

test("block costs cover every enemy and major enemies consume the effective capacity", () => {
  assert.deepEqual(ENEMY_HERO_BLOCK_COSTS, EXPECTED_BLOCK_COSTS);
  for (const type of Object.keys(EXPECTED_BLOCK_COSTS)) {
    assert.equal(getEnemyHeroBlockCost(type), EXPECTED_BLOCK_COSTS[type]);
  }
  assert.equal(getEffectiveEnemyHeroBlockCost("raider", 3), 1);
  assert.equal(getEffectiveEnemyHeroBlockCost("brute", 1), 2);
  assert.equal(getEffectiveEnemyHeroBlockCost("boss", 2), 2);
  assert.equal(getEffectiveEnemyHeroBlockCost("titan", 3), 3);
  assert.equal(getEffectiveEnemyHeroBlockCost("boss", 0), 0);
  assert.equal(getEffectiveEnemyHeroBlockCost("boss", Number.NaN), 0);
});

test("current heroic armor mitigates the hit before bounded armor chip is applied", () => {
  assert.equal(calculateHeroDamageTaken(16, 14), 14);
  assert.equal(calculateHeroDamageTaken(28, 20), 22);
  assert.equal(calculateHeroDamageTaken(1, 100), 1);
  assert.equal(calculateHeroDamageTaken(10, -1), 10);
  assert.equal(calculateHeroDamageTaken(10, 200), 1);
  assert.equal(calculateHeroDamageTaken(-5, 20), 0);
  assert.equal(calculateHeroDamageTaken(Number.NaN, 20), 0);

  assert.equal(applyHeroicArmorDamage(20, 6), 14);
  assert.equal(applyHeroicArmorDamage(4, 8), 0);
  assert.equal(applyHeroicArmorDamage(14, -2), 14);
  assert.equal(applyHeroicArmorDamage(150, 8), 92);
  assert.equal(applyHeroicArmorDamage(Number.NaN, 3), 0);
});

test("frontline timing and Forest Gate anchor progress remain stable", () => {
  assert.deepEqual(HERO_COMBAT_TIMING, {
    regenDelayMs: 3_000,
    knockoutDurationMs: 10_000,
    respawnHpRatio: 0.5,
    countdownMoveSpeed: 420,
    respawnMoveSpeed: 180,
    captureDistance: 22,
    meleeRange: 38,
  });
  assert.deepEqual(HERO_FRONTLINE_RATIOS, [0.3, 846 / 1_400, 0.84]);
  assert.deepEqual(HERO_FRONTLINE_PASSIVE_POWER, {
    ready: 1,
    deploying: 0,
    holding: 1,
    fighting: 1,
    knocked_out: 0,
  });
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

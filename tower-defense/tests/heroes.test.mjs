import assert from "node:assert/strict";
import test from "node:test";

import {
  HERO_ABILITY_RECHARGE_KILLS,
  HERO_AWAKENING_WAVE,
  HERO_AWAKENINGS,
  HERO_DEFINITIONS,
  HERO_IDS,
  getHeroAura,
  getHeroAwakening,
  getHeroStats,
  getHeroUpgradeCost,
  getHeroUpgradeWaveGate,
  isHeroId,
  isHeroLevel,
  isHeroAwakened,
} from "../src/game/heroes.ts";

test("hero definitions are exhaustive, immutable, and expose stable upgrade gates", () => {
  assert.deepEqual(HERO_IDS, ["eira", "toren", "grak"]);
  assert.deepEqual(Object.keys(HERO_DEFINITIONS).sort(), [...HERO_IDS].sort());
  assert.ok(Object.isFrozen(HERO_DEFINITIONS));
  for (const id of HERO_IDS) {
    const definition = HERO_DEFINITIONS[id];
    assert.ok(Object.isFrozen(definition));
    assert.ok(Object.isFrozen(definition.upgradeCosts));
    assert.ok([1, 2, 3].every((level) => Object.isFrozen(definition.levels[level])));
  }
  assert.equal(getHeroUpgradeWaveGate(1), 4);
  assert.equal(getHeroUpgradeWaveGate(2), 12);
  assert.equal(getHeroUpgradeWaveGate(3), null);
  assert.equal(getHeroUpgradeCost("eira", 1), 150);
  assert.equal(getHeroUpgradeCost("toren", 2), 500);
  assert.equal(getHeroUpgradeCost("grak", 1), 170);
  assert.equal(getHeroUpgradeCost("eira", 3), null);
  assert.equal(isHeroId("toren"), true);
  assert.equal(isHeroId("missing"), false);
  assert.equal(isHeroLevel(3), true);
  assert.equal(isHeroLevel(4), false);
});

test("heroes keep distinct scaling identities across damage, control, and attack speed", () => {
  const eiraOne = getHeroStats("eira", 1);
  const eiraThree = getHeroStats("eira", 3);
  assert.equal(eiraOne.attackSplashRadius, 0);
  assert.equal(eiraOne.towerDamageMultiplier, 1);
  assert.ok(eiraThree.attackDamage > eiraOne.attackDamage);
  assert.ok(eiraThree.towerDamageAuraRadius > 0);
  assert.ok(eiraThree.markedTowerDamageMultiplier > eiraOne.markedTowerDamageMultiplier);

  const torenOne = getHeroStats("toren", 1);
  const torenThree = getHeroStats("toren", 3);
  assert.ok(torenOne.attackSplashRadius > 0);
  assert.equal(torenOne.slowAuraFactor, 1);
  assert.ok(torenThree.attackSplashRadius > torenOne.attackSplashRadius);
  assert.ok(torenThree.slowAuraFactor < 1);
  assert.equal(torenThree.controlResistancePenetration, 0.35);
  assert.ok(torenThree.abilityDamage > torenOne.abilityDamage);

  const grakOne = getHeroStats("grak", 1);
  const grakThree = getHeroStats("grak", 3);
  assert.ok(grakOne.attackSplashRadius > 0);
  assert.equal(grakOne.towerAttackIntervalMultiplier, 1);
  assert.ok(grakThree.towerAttackIntervalMultiplier < 1);
  assert.ok(grakThree.abilityDurationMs > grakOne.abilityDurationMs);
  assert.ok(grakThree.abilityResistancePenetration > grakOne.abilityResistancePenetration);
});

test("hero aura summaries expose only unlocked passive radii and strengths", () => {
  assert.equal(getHeroAura("eira", 1), null);
  assert.equal(getHeroAura("toren", 1), null);
  assert.equal(getHeroAura("grak", 1), null);
  const eiraAura = getHeroAura("eira", 2);
  const torenAura = getHeroAura("toren", 3);
  const grakAura = getHeroAura("grak", 3);
  assert.deepEqual({ kind: eiraAura?.kind, radius: eiraAura?.radius }, { kind: "tower_damage", radius: 145 });
  assert.deepEqual({ kind: torenAura?.kind, radius: torenAura?.radius }, { kind: "slow", radius: 190 });
  assert.deepEqual({ kind: grakAura?.kind, radius: grakAura?.radius }, { kind: "tower_attack_speed", radius: 160 });
  assert.equal(Math.round((eiraAura?.strength ?? 0) * 100), 12);
  assert.equal(Math.round((eiraAura?.globalStrength ?? 0) * 100), 4);
  assert.equal(Math.round((torenAura?.strength ?? 0) * 100), 22);
  assert.equal(Math.round((grakAura?.strength ?? 0) * 100), 20);
  assert.equal(Math.round((grakAura?.globalStrength ?? 0) * 100), 8);
  assert.ok(Object.isFrozen(eiraAura));
});

test("rank-three heroes awaken only after wave twenty without changing paid ranks", () => {
  assert.equal(HERO_AWAKENING_WAVE, 20);
  assert.equal(HERO_ABILITY_RECHARGE_KILLS, 25);
  assert.equal(isHeroAwakened(2, 24), false);
  assert.equal(isHeroAwakened(3, 19), false);
  assert.equal(isHeroAwakened(3, 20), true);
  assert.equal(getHeroAwakening("eira"), HERO_AWAKENINGS.eira);
  assert.equal(HERO_AWAKENINGS.eira.markedTargetCount, 4);
  assert.equal(HERO_AWAKENINGS.toren.barrierCapacity, 10);
  assert.equal(HERO_AWAKENINGS.toren.abilityDurationMs, 6_000);
  assert.equal(HERO_AWAKENINGS.grak.abilityDurationMs, 10_000);
  assert.ok(Object.isFrozen(HERO_AWAKENINGS));
  assert.ok(Object.isFrozen(HERO_AWAKENINGS.toren));
});

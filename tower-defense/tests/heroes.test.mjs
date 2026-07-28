import assert from "node:assert/strict";
import test from "node:test";

import {
  HERO_DEFINITIONS,
  HERO_IDS,
  getHeroAura,
  getHeroStats,
  getHeroUpgradeCost,
  getHeroUpgradeWaveGate,
  isHeroId,
  isHeroLevel,
} from "../src/game/heroes.ts";

test("hero definitions are exhaustive, immutable, and expose stable upgrade gates", () => {
  assert.deepEqual(HERO_IDS, ["eira", "toren"]);
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
  assert.equal(getHeroUpgradeCost("eira", 3), null);
  assert.equal(isHeroId("toren"), true);
  assert.equal(isHeroId("missing"), false);
  assert.equal(isHeroLevel(3), true);
  assert.equal(isHeroLevel(4), false);
});

test("Eira scales tower support while Toren scales splash and control", () => {
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
  assert.ok(torenThree.abilityDamage > torenOne.abilityDamage);
});

test("hero aura summaries expose only unlocked passive radii and strengths", () => {
  assert.equal(getHeroAura("eira", 1), null);
  assert.equal(getHeroAura("toren", 1), null);
  const eiraAura = getHeroAura("eira", 2);
  const torenAura = getHeroAura("toren", 3);
  assert.deepEqual({ kind: eiraAura?.kind, radius: eiraAura?.radius }, { kind: "tower_damage", radius: 105 });
  assert.deepEqual({ kind: torenAura?.kind, radius: torenAura?.radius }, { kind: "slow", radius: 115 });
  assert.equal(Math.round((eiraAura?.strength ?? 0) * 100), 8);
  assert.equal(Math.round((torenAura?.strength ?? 0) * 100), 14);
  assert.ok(Object.isFrozen(eiraAura));
});

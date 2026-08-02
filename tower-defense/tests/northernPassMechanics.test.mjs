import assert from "node:assert/strict";
import test from "node:test";

import {
  AVALANCHE_BOSS_FROST_ARMOR_REMOVAL_RATIO,
  AVALANCHE_BOSS_STUN_MS,
  AVALANCHE_FROST_ARMOR_REMOVAL_RATIO,
  AVALANCHE_STUN_MS,
  FROST_ARMOR_FIRE_MULTIPLIER,
  NORTHERN_AVALANCHE_ZONES,
  calculateNorthernAvalancheImpact,
  getFrostArmorDamageMultiplier,
  getNorthernAvalancheZoneAtProgress,
  isProgressInsideNorthernAvalancheZone,
} from "../src/game/northernPassMechanics.ts";

test("Northern Pass route is split into three stable avalanche zones", () => {
  assert.deepEqual(NORTHERN_AVALANCHE_ZONES.map((zone) => zone.id), ["upper", "middle", "lower"]);
  assert.equal(getNorthernAvalancheZoneAtProgress(0, 1_000), "upper");
  assert.equal(getNorthernAvalancheZoneAtProgress(359.99, 1_000), "upper");
  assert.equal(getNorthernAvalancheZoneAtProgress(360, 1_000), "middle");
  assert.equal(getNorthernAvalancheZoneAtProgress(700, 1_000), "lower");
  assert.equal(getNorthernAvalancheZoneAtProgress(1_500, 1_000), "lower");
  assert.equal(isProgressInsideNorthernAvalancheZone(500, 1_000, "middle"), true);
  assert.ok(Object.isFrozen(NORTHERN_AVALANCHE_ZONES));
  assert.ok(NORTHERN_AVALANCHE_ZONES.every(Object.isFrozen));
});

test("avalanche removes most regular frost armor and applies a predictable stun", () => {
  const impact = calculateNorthernAvalancheImpact(600, 800, false, true);

  assert.equal(impact.frostArmorRemoved, 600);
  assert.equal(impact.stunDurationMs, AVALANCHE_STUN_MS);
  assert.equal(impact.healingInterrupted, true);
  assert.equal(AVALANCHE_FROST_ARMOR_REMOVAL_RATIO, 1);
});

test("bosses receive a deliberately weaker but still meaningful avalanche impact", () => {
  const impact = calculateNorthernAvalancheImpact(800, 800, true, false);

  assert.equal(impact.frostArmorRemoved, 800 * AVALANCHE_BOSS_FROST_ARMOR_REMOVAL_RATIO);
  assert.equal(impact.stunDurationMs, AVALANCHE_BOSS_STUN_MS);
  assert.ok(impact.stunDurationMs < AVALANCHE_STUN_MS);
  assert.equal(impact.healingInterrupted, false);
});

test("fire keeps its frost-armor role without any signal-fire multiplier", () => {
  assert.equal(getFrostArmorDamageMultiplier("physical"), 1);
  assert.equal(getFrostArmorDamageMultiplier("arcane"), 1);
  assert.equal(getFrostArmorDamageMultiplier("fire"), FROST_ARMOR_FIRE_MULTIPLIER);
});

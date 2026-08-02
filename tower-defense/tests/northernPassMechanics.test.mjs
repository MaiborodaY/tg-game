import assert from "node:assert/strict";
import test from "node:test";

import {
  FROST_ARMOR_FIRE_MULTIPLIER,
  FROST_ARMOR_MAX_MULTIPLIER,
  FROST_ARMOR_WARM_MULTIPLIER,
  NORTHERN_STORM_SECTORS,
  SIGNAL_FIRE_RADIUS,
  getFrostArmorDamageMultiplier,
  getHeroProtectedStormSector,
  getNorthernStormEffect,
  getStormSectorAtProgress,
  isInsideSignalFire,
} from "../src/game/northernPassMechanics.ts";

test("signal fire uses an inclusive deterministic circular warm zone", () => {
  const fire = { x: 100, y: 200 };
  assert.equal(isInsideSignalFire({ x: 100 + SIGNAL_FIRE_RADIUS, y: 200 }, fire), true);
  assert.equal(isInsideSignalFire({ x: 100 + SIGNAL_FIRE_RADIUS + 0.01, y: 200 }, fire), false);
  assert.equal(isInsideSignalFire({ x: 100, y: 200 }, null), false);
});

test("fire and warmth both break frost armor faster without multiplying without bound", () => {
  assert.equal(getFrostArmorDamageMultiplier("physical", false), 1);
  assert.equal(getFrostArmorDamageMultiplier("fire", false), FROST_ARMOR_FIRE_MULTIPLIER);
  assert.equal(getFrostArmorDamageMultiplier("physical", true), FROST_ARMOR_WARM_MULTIPLIER);
  assert.equal(getFrostArmorDamageMultiplier("fire", true), FROST_ARMOR_MAX_MULTIPLIER);
  assert.equal(getFrostArmorDamageMultiplier("arcane", true), FROST_ARMOR_WARM_MULTIPLIER);
});

test("the route is split into three stable storm sectors paired with hero anchors", () => {
  assert.deepEqual(NORTHERN_STORM_SECTORS.map((sector) => sector.id), ["upper", "middle", "lower"]);
  assert.equal(getStormSectorAtProgress(0, 1_000), "upper");
  assert.equal(getStormSectorAtProgress(449.99, 1_000), "upper");
  assert.equal(getStormSectorAtProgress(450, 1_000), "middle");
  assert.equal(getStormSectorAtProgress(730, 1_000), "lower");
  assert.equal(getStormSectorAtProgress(1_500, 1_000), "lower");
  assert.deepEqual([0, 1, 2, 3].map(getHeroProtectedStormSector), ["upper", "middle", "lower", null]);
});

test("an uncovered storm buffs only the matching northern enemy inside its sector", () => {
  const plan = Object.freeze({
    sectorIds: Object.freeze(["middle"]),
    runnerSpeedBonus: 0.25,
    iceboundControlResistanceBonus: 0.2,
  });

  assert.deepEqual(getNorthernStormEffect("snow-runner", 500, 1_000, 0, plan), {
    sectorId: "middle",
    protected: false,
    affected: true,
    speedMultiplier: 1.25,
    controlResistanceBonus: 0,
  });
  assert.equal(getNorthernStormEffect("icebound", 500, 1_000, 0, plan).controlResistanceBonus, 0.2);
  assert.equal(getNorthernStormEffect("standard", 500, 1_000, 0, plan).speedMultiplier, 1);
  assert.equal(getNorthernStormEffect("snow-runner", 100, 1_000, 0, plan).affected, false);

  const protectedRunner = getNorthernStormEffect("snow-runner", 500, 1_000, 1, plan);
  assert.equal(protectedRunner.protected, true);
  assert.equal(protectedRunner.affected, false);
  assert.equal(protectedRunner.speedMultiplier, 1);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  FROST_ARMOR_FIRE_MULTIPLIER,
  FROST_ARMOR_MAX_MULTIPLIER,
  FROST_ARMOR_WARM_MULTIPLIER,
  SIGNAL_FIRE_RADIUS,
  getFrostArmorDamageMultiplier,
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

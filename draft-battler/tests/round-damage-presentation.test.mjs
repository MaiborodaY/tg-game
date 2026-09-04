import assert from "node:assert/strict";
import test from "node:test";

import { createRoundDamagePresentation } from "../src/roundDamagePresentation.ts";

function unitSource(instanceId, cardId, slotIndex, hpDamage, armorDamage, summonedBy) {
  return {
    source: {
      kind: "unit",
      unit: {
        instanceId,
        cardId,
        slotIndex,
        upgradeLevel: 0,
        ...(summonedBy ? { summonedBy } : {}),
      },
    },
    hpDamage,
    armorDamage,
    eventCount: 1,
  };
}

test("every damaging unit remains visible, including summons, and includes removed armor", () => {
  const graveBinderId = "player-0-grave_binder";
  const result = createRoundDamagePresentation(
    "player",
    [
      { slotIndex: 0, cardId: "grave_binder", upgradeLevel: 0 },
      { slotIndex: 1, cardId: "boar_rider", upgradeLevel: 0 },
    ],
    [
      unitSource(graveBinderId, "grave_binder", 0, 2, 1),
      unitSource("player-0-bone_pact_skeleton", "bone_soldier", 0, 3, 2, graveBinderId),
      unitSource("player-1-boar_rider", "boar_rider", 1, 7, 0),
    ],
  );

  assert.deepEqual(
    result.units.map((entry) => [entry.unit.instanceId, entry.amount]),
    [
      ["player-1-boar_rider", 7],
      ["player-0-bone_pact_skeleton", 5],
      [graveBinderId, 3],
    ],
  );
  assert.deepEqual(result.synergies, []);
});

test("all damaging units remain deterministic while zero damage is ignored", () => {
  const result = createRoundDamagePresentation(
    "enemy",
    [],
    [
      unitSource("enemy-2-ember_mage", "ember_mage", 2, 5, 0),
      unitSource("enemy-0-iron_guard", "iron_guard", 0, 3, 2),
      unitSource("enemy-1-field_cleric", "field_cleric", 1, 0, 0),
    ],
  );

  assert.deepEqual(
    result.units.map((entry) => [entry.unit.instanceId, entry.amount]),
    [["enemy-0-iron_guard", 5], ["enemy-2-ember_mage", 5]],
  );
});

test("team synergy damage stays separate and aggregates by tag and threshold", () => {
  const result = createRoundDamagePresentation(
    "player",
    [],
    [
      {
        source: { kind: "synergy", owner: "player", tag: "mage", threshold: 4 },
        hpDamage: 3,
        armorDamage: 1,
        eventCount: 2,
      },
      {
        source: { kind: "synergy", owner: "player", tag: "mage", threshold: 4 },
        hpDamage: 2,
        armorDamage: 0,
        eventCount: 1,
      },
      {
        source: { kind: "synergy", owner: "player", tag: "rogue", threshold: 2 },
        hpDamage: 0,
        armorDamage: 0,
        eventCount: 1,
      },
    ],
  );

  assert.deepEqual(result.units, []);
  assert.deepEqual(result.synergies, [{ tag: "mage", threshold: 4, amount: 6 }]);
});

import assert from "node:assert/strict";
import test from "node:test";
import { getCardDefinition } from "../src/game/cards.ts";
import {
  SYNERGY_THRESHOLD,
  getBoardSynergyProgress,
  getBoardUnitInspection,
} from "../src/draftPresentation.ts";

function slot(slotIndex, cardId, upgradeLevel = 0) {
  return { slotIndex, cardId, upgradeLevel };
}

test("draft synergy progress shows only tags represented on the board", () => {
  const progress = getBoardSynergyProgress([
    slot(0, "iron_guard"),
    slot(1, "boar_rider"),
    slot(2, null),
  ]);

  assert.equal(SYNERGY_THRESHOLD, 2);
  assert.deepEqual(progress, [
    { tag: "warrior", count: 2, threshold: 2, active: true, effect: { stat: "attack", value: 1 } },
    { tag: "beast", count: 1, threshold: 2, active: false, effect: { stat: "attack", value: 1 } },
    { tag: "guardian", count: 1, threshold: 2, active: false, effect: { stat: "hp", value: 2 } },
  ]);
});

test("draft synergy effects mirror the current attack and health rules", () => {
  const progress = getBoardSynergyProgress([
    slot(0, "iron_guard"),
    slot(1, "shieldbearer"),
    slot(2, "ember_mage"),
    slot(3, "frost_acolyte"),
    slot(4, "grave_binder"),
    slot(5, "bone_soldier"),
  ]);
  const byTag = Object.fromEntries(progress.map((synergy) => [synergy.tag, synergy]));

  assert.deepEqual(byTag.guardian.effect, { stat: "hp", value: 2 });
  assert.deepEqual(byTag.undead.effect, { stat: "hp", value: 2 });
  assert.deepEqual(byTag.mage.effect, { stat: "attack", value: 1 });
  assert.equal(byTag.guardian.active, true);
  assert.equal(byTag.undead.active, true);
  assert.equal(byTag.mage.active, true);
});

test("upgrades do not count as extra units for synergy progress", () => {
  assert.deepEqual(getBoardSynergyProgress([slot(0, "iron_guard", 1)]), [
    { tag: "warrior", count: 1, threshold: 2, active: false, effect: { stat: "attack", value: 1 } },
    { tag: "guardian", count: 1, threshold: 2, active: false, effect: { stat: "hp", value: 2 } },
  ]);
});

test("rogue synergy reports the current attack bonus", () => {
  const rogue = getBoardSynergyProgress([
    slot(0, "sneakblade"),
    slot(1, "longbow_hunter"),
  ]).find((synergy) => synergy.tag === "rogue");

  assert.deepEqual(rogue, {
    tag: "rogue",
    count: 2,
    threshold: 2,
    active: true,
    effect: { stat: "attack", value: 1 },
  });
});

test("board inspection resolves the exact duplicate slot and its upgraded stats", () => {
  const slots = [
    slot(1, "iron_guard", 0),
    slot(4, "iron_guard", 1),
  ];
  const base = getBoardUnitInspection(slots, 1);
  const upgraded = getBoardUnitInspection(slots, 4);
  const card = getCardDefinition("iron_guard");

  assert.deepEqual(base, {
    slotIndex: 1,
    cardId: "iron_guard",
    upgradeLevel: 0,
    stats: card.stats,
  });
  assert.deepEqual(upgraded, {
    slotIndex: 4,
    cardId: "iron_guard",
    upgradeLevel: 1,
    stats: {
      ...card.stats,
      attack: card.stats.attack * 2,
      hp: card.stats.hp * 2,
    },
  });
  assert.equal(getBoardUnitInspection(slots, 0), undefined);
});

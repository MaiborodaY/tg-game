import assert from "node:assert/strict";
import test from "node:test";
import { getCardDefinition } from "../src/game/cards.ts";
import { createEmptyBoardSlots } from "../src/game/draft.ts";
import {
  SYNERGY_THRESHOLD,
  getBoardSynergyProgress,
  getBoardUnitInspection,
  getDraftOptionPlacementSynergyForecast,
  getDraftOptionSynergyPresentation,
  getLastKnownEnemyArmy,
} from "../src/draftPresentation.ts";

function slot(slotIndex, cardId, upgradeLevel = 0) {
  return { slotIndex, cardId, upgradeLevel };
}

function board(...occupiedSlots) {
  const slots = createEmptyBoardSlots();
  occupiedSlots.forEach((occupiedSlot) => {
    slots[occupiedSlot.slotIndex] = occupiedSlot;
  });
  return slots;
}

function option(cardId, optionId = `option-${cardId}`) {
  return { optionId, cardId };
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

test("last known enemy army preserves all six positions and resolves upgraded stats", () => {
  const enemyBoardSlots = board(
    slot(1, "boar_rider"),
    slot(4, "iron_guard", 1),
  );
  const originalSlots = enemyBoardSlots.map((enemySlot) => ({ ...enemySlot }));
  const army = getLastKnownEnemyArmy({ enemyBoardSlots });
  const ironGuard = getCardDefinition("iron_guard");

  assert.equal(army.length, 6);
  assert.deepEqual(army[0], { slotIndex: 0, cardId: null, upgradeLevel: 0 });
  assert.deepEqual(army[1], {
    slotIndex: 1,
    cardId: "boar_rider",
    upgradeLevel: 0,
    stats: getCardDefinition("boar_rider").stats,
  });
  assert.deepEqual(army[4], {
    slotIndex: 4,
    cardId: "iron_guard",
    upgradeLevel: 1,
    stats: {
      ...ironGuard.stats,
      attack: ironGuard.stats.attack * 2,
      hp: ironGuard.stats.hp * 2,
    },
  });
  assert.deepEqual(enemyBoardSlots, originalSlots);
  assert.notStrictEqual(army[1].stats, getCardDefinition("boar_rider").stats);
});

test("last known enemy army fails closed for an illegal persisted formation", () => {
  const enemyBoardSlots = board(slot(4, "shieldbearer"));

  assert.deepEqual(getLastKnownEnemyArmy({ enemyBoardSlots }), []);
});

test("draft option presentation exposes card tags and every legal placement forecast", () => {
  const slots = board(slot(0, "iron_guard"));
  const presentation = getDraftOptionSynergyPresentation(option("banner_knight", "offer-2"), slots);

  assert.equal(presentation.optionId, "offer-2");
  assert.equal(presentation.cardId, "banner_knight");
  assert.deepEqual(presentation.tags, ["warrior", "guardian"]);
  assert.deepEqual(presentation.placements.map((placement) => placement.targetSlotIndex), [1, 2, 3, 4, 5]);
  assert.ok(presentation.placements.every((placement) => placement.placementKind === "place"));
  assert.deepEqual(presentation.placements[0].synergies, [
    {
      tag: "warrior",
      beforeCount: 1,
      afterCount: 2,
      threshold: 2,
      activatesThreshold: true,
      effect: { stat: "attack", value: 1 },
    },
    {
      tag: "guardian",
      beforeCount: 1,
      afterCount: 2,
      threshold: 2,
      activatesThreshold: true,
      effect: { stat: "hp", value: 2 },
    },
  ]);
});

test("duplicate upgrade forecast keeps unit tag counts unchanged", () => {
  const slots = board(slot(2, "iron_guard"));
  const presentation = getDraftOptionSynergyPresentation(option("iron_guard"), slots);

  assert.equal(presentation.placements.length, 1);
  assert.equal(presentation.placements[0].targetSlotIndex, 2);
  assert.equal(presentation.placements[0].placementKind, "upgrade");
  assert.deepEqual(presentation.placements[0].synergies, [
    {
      tag: "warrior",
      beforeCount: 1,
      afterCount: 1,
      threshold: 2,
      activatesThreshold: false,
      effect: { stat: "attack", value: 1 },
    },
    {
      tag: "guardian",
      beforeCount: 1,
      afterCount: 1,
      threshold: 2,
      activatesThreshold: false,
      effect: { stat: "hp", value: 2 },
    },
  ]);
});

test("full-board replacement forecasts both gained and lost tag counts", () => {
  const slots = board(
    slot(0, "iron_guard"),
    slot(1, "shieldbearer"),
    slot(2, "boar_rider"),
    slot(3, "longbow_hunter"),
    slot(4, "ember_mage"),
    slot(5, "bone_soldier"),
  );
  const originalSlots = slots.map((boardSlot) => ({ ...boardSlot }));
  const forecast = getDraftOptionPlacementSynergyForecast(option("sneakblade"), slots, 1);

  assert.deepEqual(forecast, {
    targetSlotIndex: 1,
    placementKind: "replace",
    synergies: [
      {
        tag: "rogue",
        beforeCount: 1,
        afterCount: 2,
        threshold: 2,
        activatesThreshold: true,
        effect: { stat: "attack", value: 1 },
      },
      {
        tag: "guardian",
        beforeCount: 2,
        afterCount: 1,
        threshold: 2,
        activatesThreshold: false,
        effect: { stat: "hp", value: 2 },
      },
    ],
  });
  assert.deepEqual(slots, originalSlots);
});

test("replacement forecast includes unchanged tags carried by both fighters", () => {
  const slots = board(
    slot(0, "spear_recruit"),
    slot(1, "iron_guard"),
    slot(2, "boar_rider"),
    slot(3, "longbow_hunter"),
    slot(4, "ember_mage"),
    slot(5, "bone_soldier"),
  );
  const forecast = getDraftOptionPlacementSynergyForecast(option("banner_knight"), slots, 1);
  const byTag = Object.fromEntries(forecast.synergies.map((synergy) => [synergy.tag, synergy]));

  assert.equal(byTag.warrior.beforeCount, 4);
  assert.equal(byTag.warrior.afterCount, 4);
  assert.equal(byTag.guardian.beforeCount, 1);
  assert.equal(byTag.guardian.afterCount, 1);
  assert.equal(byTag.warrior.activatesThreshold, false);
  assert.equal(byTag.guardian.activatesThreshold, false);
});

test("placement forecast fails closed for invalid boards and illegal targets", () => {
  const malformedBoard = createEmptyBoardSlots().slice(0, 5);
  const shieldbearer = option("shieldbearer");

  assert.equal(getDraftOptionPlacementSynergyForecast(shieldbearer, malformedBoard, 0), undefined);
  assert.deepEqual(getDraftOptionSynergyPresentation(shieldbearer, malformedBoard).placements, []);
  assert.equal(getDraftOptionPlacementSynergyForecast(shieldbearer, createEmptyBoardSlots(), 3), undefined);
  assert.equal(getDraftOptionPlacementSynergyForecast(shieldbearer, createEmptyBoardSlots(), -1), undefined);
  assert.deepEqual(
    getDraftOptionSynergyPresentation(shieldbearer, createEmptyBoardSlots()).placements.map(
      (placement) => placement.targetSlotIndex,
    ),
    [0, 1, 2],
  );
});

test("max-level duplicate target is excluded while legal full-board replacements remain", () => {
  const slots = board(
    slot(0, "iron_guard"),
    slot(1, "boar_rider"),
    slot(2, "spear_recruit"),
    slot(3, "sneakblade", 1),
    slot(4, "ember_mage"),
    slot(5, "bone_soldier"),
  );
  const presentation = getDraftOptionSynergyPresentation(option("sneakblade"), slots);

  assert.equal(getDraftOptionPlacementSynergyForecast(option("sneakblade"), slots, 3), undefined);
  assert.deepEqual(presentation.placements.map((placement) => placement.targetSlotIndex), [0, 1, 2, 4, 5]);
  assert.ok(presentation.placements.every((placement) => placement.placementKind === "replace"));
});

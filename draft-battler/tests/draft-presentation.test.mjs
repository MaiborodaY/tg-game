import assert from "node:assert/strict";
import test from "node:test";
import { getCardDefinition } from "../src/game/cards.ts";
import { createEmptyBoardSlots } from "../src/game/draft.ts";
import {
  getBoardSynergyProgress,
  getBoardUnitInspection,
  getDraftOptionBoardStatus,
  getDraftOptionPlacementSynergyForecast,
  getDraftOptionSynergyPresentation,
  getLastKnownEnemyArmy,
  summarizeDraftOptionSynergyPresentation,
} from "../src/draftPresentation.ts";
import {
  SYNERGY_MASTERY_THRESHOLD,
  SYNERGY_RULES,
  SYNERGY_THRESHOLD,
} from "../src/game/synergies.ts";

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

function expectedProgress(tag, count) {
  return {
    tag,
    count,
    tiers: SYNERGY_RULES[tag].tiers.map((tier) => ({
      threshold: tier.threshold,
      active: count >= tier.threshold,
      effect: { ...tier.effect },
    })),
  };
}

function expectedForecast(tag, beforeCount, afterCount) {
  const tiers = SYNERGY_RULES[tag].tiers.map((tier) => ({
    threshold: tier.threshold,
    effect: { ...tier.effect },
    activeBefore: beforeCount >= tier.threshold,
    activeAfter: afterCount >= tier.threshold,
  }));
  return {
    tag,
    beforeCount,
    afterCount,
    tiers,
    activatedThresholds: tiers
      .filter((tier) => !tier.activeBefore && tier.activeAfter)
      .map((tier) => tier.threshold),
    deactivatedThresholds: tiers
      .filter((tier) => tier.activeBefore && !tier.activeAfter)
      .map((tier) => tier.threshold),
  };
}

test("draft synergy progress shows only tags represented on the board", () => {
  const progress = getBoardSynergyProgress([
    slot(0, "iron_guard"),
    slot(1, "boar_rider"),
    slot(2, null),
  ]);

  assert.deepEqual([SYNERGY_THRESHOLD, SYNERGY_MASTERY_THRESHOLD], [2, 4]);
  assert.deepEqual(progress, [
    expectedProgress("warrior", 2),
    expectedProgress("beast", 1),
    expectedProgress("guardian", 1),
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

  assert.deepEqual(byTag.guardian.tiers, expectedProgress("guardian", 2).tiers);
  assert.deepEqual(byTag.undead.tiers, expectedProgress("undead", 2).tiers);
  assert.deepEqual(byTag.mage.tiers, expectedProgress("mage", 2).tiers);
  assert.equal(byTag.guardian.tiers[0].active, true);
  assert.equal(byTag.guardian.tiers[1].active, false);
});

test("upgrades do not count as extra units for synergy progress", () => {
  assert.deepEqual(getBoardSynergyProgress([slot(0, "iron_guard", 1)]), [
    expectedProgress("warrior", 1),
    expectedProgress("guardian", 1),
  ]);
});

test("rogue synergy reports the current attack bonus", () => {
  const rogue = getBoardSynergyProgress([
    slot(0, "sneakblade"),
    slot(1, "longbow_hunter"),
  ]).find((synergy) => synergy.tag === "rogue");

  assert.deepEqual(rogue, expectedProgress("rogue", 2));
});

test("mastery progress exposes both 2/4 tiers and the fourth-unit crossing", () => {
  const slots = board(
    slot(0, "iron_guard"),
    slot(1, "boar_rider"),
    slot(2, "spear_recruit"),
  );
  const warrior = getBoardSynergyProgress(slots).find((synergy) => synergy.tag === "warrior");
  const forecast = getDraftOptionPlacementSynergyForecast(option("war_chaplain"), slots, 3);
  const warriorForecast = forecast.synergies.find((synergy) => synergy.tag === "warrior");

  assert.deepEqual(warrior, expectedProgress("warrior", 3));
  assert.deepEqual(warrior.tiers.map((tier) => tier.active), [true, false]);
  assert.deepEqual(warriorForecast, expectedForecast("warrior", 3, 4));
  assert.deepEqual(warriorForecast.activatedThresholds, [4]);
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

test("draft options distinguish an available upgrade from an already fielded max-level copy", () => {
  assert.equal(getDraftOptionBoardStatus("iron_guard", board()), undefined);
  assert.equal(getDraftOptionBoardStatus("iron_guard", board(slot(0, "iron_guard", 0))), "upgrade");
  assert.equal(getDraftOptionBoardStatus("iron_guard", board(slot(0, "iron_guard", 1))), "maxed");
  assert.equal(
    getDraftOptionBoardStatus("iron_guard", board(slot(0, "iron_guard", 1), slot(1, "iron_guard", 0))),
    "upgrade",
  );
  assert.equal(getDraftOptionBoardStatus("iron_guard", [slot(0, "iron_guard", 0)]), undefined);
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
    expectedForecast("warrior", 1, 2),
    expectedForecast("guardian", 1, 2),
  ]);
  assert.deepEqual(summarizeDraftOptionSynergyPresentation(presentation), {
    placementKind: "place",
    outcomes: [
      {
        kind: "activates",
        tag: "warrior",
        beforeCount: 1,
        afterCount: 2,
        threshold: 2,
        effect: { ...SYNERGY_RULES.warrior.tiers[0].effect },
        guaranteed: true,
      },
      {
        kind: "activates",
        tag: "guardian",
        beforeCount: 1,
        afterCount: 2,
        threshold: 2,
        effect: { ...SYNERGY_RULES.guardian.tiers[0].effect },
        guaranteed: true,
      },
    ],
  });
});

test("duplicate upgrade forecast keeps unit tag counts unchanged", () => {
  const slots = board(slot(2, "iron_guard"));
  const presentation = getDraftOptionSynergyPresentation(option("iron_guard"), slots);

  assert.equal(presentation.placements.length, 1);
  assert.equal(presentation.placements[0].targetSlotIndex, 2);
  assert.equal(presentation.placements[0].placementKind, "upgrade");
  assert.deepEqual(presentation.placements[0].synergies, [
    expectedForecast("warrior", 1, 1),
    expectedForecast("guardian", 1, 1),
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
      expectedForecast("rogue", 1, 2),
      expectedForecast("guardian", 2, 1),
    ],
  });
  const summary = summarizeDraftOptionSynergyPresentation(
    getDraftOptionSynergyPresentation(option("sneakblade"), slots),
  );
  assert.equal(summary.placementKind, "replace");
  assert.ok(summary.outcomes.some((outcome) =>
    outcome.kind === "activates" && outcome.tag === "rogue" && outcome.threshold === 2 && !outcome.guaranteed));
  assert.ok(summary.outcomes.some((outcome) =>
    outcome.kind === "loses" && outcome.tag === "guardian" && outcome.threshold === 2 && !outcome.guaranteed));
  assert.ok(summary.outcomes.some((outcome) =>
    outcome.kind === "loses_tag" && outcome.tag === "beast" && outcome.beforeCount === 1 && outcome.afterCount === 0));
  assert.deepEqual(slots, originalSlots);
});

test("upgrade-only forecasts stay quiet because unit counts do not change", () => {
  const presentation = getDraftOptionSynergyPresentation(
    option("iron_guard"),
    board(slot(0, "iron_guard")),
  );

  assert.equal(summarizeDraftOptionSynergyPresentation(presentation), undefined);
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
  assert.deepEqual(byTag.warrior.activatedThresholds, []);
  assert.deepEqual(byTag.guardian.activatedThresholds, []);
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

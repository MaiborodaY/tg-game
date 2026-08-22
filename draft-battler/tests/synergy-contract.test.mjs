import assert from "node:assert/strict";
import test from "node:test";
import { getBoardSynergyProgress } from "../src/draftPresentation.ts";
import { CARD_DEFINITIONS } from "../src/game/cards.ts";
import { resolveCombat } from "../src/game/combat.ts";
import { SYNERGY_RULES, SYNERGY_TAG_ORDER } from "../src/game/synergies.ts";

function createTagBoard(tag, count) {
  const matchingCards = CARD_DEFINITIONS.filter((card) => card.tags.includes(tag));
  assert.ok(matchingCards.length >= count, `${tag} needs ${count} cards for its synergy contract`);

  return matchingCards.slice(0, count).map((card, slotIndex) => ({
    slotIndex,
    cardId: card.id,
    upgradeLevel: 0,
  }));
}

function getEventEffect(event) {
  if (event.effectKind !== "stat") {
    return { kind: event.effectKind, value: event.value };
  }

  if (event.attackBonus !== undefined) {
    return { kind: "stat", stat: "attack", value: event.attackBonus };
  }

  if (event.hpBonus !== undefined) {
    return { kind: "stat", stat: "hp", value: event.hpBonus };
  }

  if (event.speedBonus !== undefined) {
    return { kind: "stat", stat: "speed", value: event.speedBonus };
  }

  assert.notEqual(event.shieldBonus, undefined);
  return { kind: "stat", stat: "armor", value: event.shieldBonus };
}

test("draft synergy progression matches every real combat tier for every tag", () => {
  SYNERGY_TAG_ORDER.forEach((tag) => {
    const rule = SYNERGY_RULES[tag];

    rule.tiers.forEach((tier) => {
      const inactiveBoard = createTagBoard(tag, tier.threshold - 1);
      const inactiveProgress = getBoardSynergyProgress(inactiveBoard).find((entry) => entry.tag === tag);
      const inactiveTier = inactiveProgress?.tiers.find((entry) => entry.threshold === tier.threshold);
      const inactiveEvent = resolveCombat(inactiveBoard, [], 1).events.find(
        (event) =>
          event.type === "synergy_applied" &&
          event.owner === "player" &&
          event.tag === tag &&
          event.threshold === tier.threshold,
      );

      assert.equal(inactiveTier?.active, false, `${tag}/${tier.threshold} UI activates below combat threshold`);
      assert.equal(inactiveEvent, undefined, `${tag}/${tier.threshold} combat activates below UI threshold`);

      const activeBoard = createTagBoard(tag, tier.threshold);
      const activeProgress = getBoardSynergyProgress(activeBoard).find((entry) => entry.tag === tag);
      const activeTier = activeProgress?.tiers.find((entry) => entry.threshold === tier.threshold);
      const activeEvent = resolveCombat(activeBoard, [], 1).events.find(
        (event) =>
          event.type === "synergy_applied" &&
          event.owner === "player" &&
          event.tag === tag &&
          event.threshold === tier.threshold,
      );

      assert.ok(activeTier, `${tag}/${tier.threshold} is missing from the draft projection`);
      assert.equal(activeTier.active, true, `${tag}/${tier.threshold} UI does not activate at combat threshold`);
      assert.ok(activeEvent, `${tag}/${tier.threshold} combat event is missing at UI threshold`);
      assert.deepEqual(activeTier.effect, getEventEffect(activeEvent));
    });
  });
});

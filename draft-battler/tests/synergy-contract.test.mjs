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
  if (event.attackBonus !== undefined) {
    assert.equal(event.hpBonus, undefined);
    return { stat: "attack", value: event.attackBonus };
  }

  assert.notEqual(event.hpBonus, undefined);
  return { stat: "hp", value: event.hpBonus };
}

test("draft synergy progression matches the real combat effect for every tag", () => {
  SYNERGY_TAG_ORDER.forEach((tag) => {
    const rule = SYNERGY_RULES[tag];
    const inactiveBoard = createTagBoard(tag, rule.threshold - 1);
    const inactiveProgress = getBoardSynergyProgress(inactiveBoard).find((entry) => entry.tag === tag);
    const inactiveEvent = resolveCombat(inactiveBoard, [], 1).events.find(
      (event) => event.type === "synergy_applied" && event.owner === "player" && event.tag === tag,
    );

    assert.equal(inactiveProgress?.active, false, `${tag} UI activates below its combat threshold`);
    assert.equal(inactiveEvent, undefined, `${tag} combat activates below its UI threshold`);

    const activeBoard = createTagBoard(tag, rule.threshold);
    const activeProgress = getBoardSynergyProgress(activeBoard).find((entry) => entry.tag === tag);
    const activeEvent = resolveCombat(activeBoard, [], 1).events.find(
      (event) => event.type === "synergy_applied" && event.owner === "player" && event.tag === tag,
    );

    assert.ok(activeProgress, `${tag} is missing from the draft projection`);
    assert.equal(activeProgress.threshold, rule.threshold);
    assert.equal(activeProgress.active, true, `${tag} UI does not activate at its combat threshold`);
    assert.ok(activeEvent, `${tag} combat event is missing at its UI threshold`);
    assert.deepEqual(activeProgress.effect, getEventEffect(activeEvent));
  });
});

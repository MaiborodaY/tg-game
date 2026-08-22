import assert from "node:assert/strict";
import test from "node:test";

import { createCompendiumPresentation } from "../src/compendiumPresentation.ts";
import { CARD_DEFINITIONS, getCardStatsForUpgrade } from "../src/game/cards.ts";
import { SYNERGY_RULES, SYNERGY_TAG_ORDER } from "../src/game/synergies.ts";
import { MAX_UPGRADE_LEVEL } from "../src/game/types.ts";

test("compendium exposes every card in canonical order with base and upgraded stats", () => {
  const { cards } = createCompendiumPresentation();

  assert.equal(cards.length, CARD_DEFINITIONS.length);
  assert.deepEqual(cards.map((card) => card.id), CARD_DEFINITIONS.map((card) => card.id));
  assert.equal(new Set(cards.map((card) => card.id)).size, cards.length);

  cards.forEach((card, index) => {
    const definition = CARD_DEFINITIONS[index];
    assert.equal(card.name, definition.name);
    assert.equal(card.role, definition.role);
    assert.deepEqual(card.tags, definition.tags);
    assert.equal(card.abilityId, definition.abilityId);
    assert.deepEqual(card.baseStats, getCardStatsForUpgrade(definition, 0));
    assert.deepEqual(card.upgradedStats, getCardStatsForUpgrade(definition, MAX_UPGRADE_LEVEL));
  });
});

test("compendium derives display rarity from the canonical card tier", () => {
  const { cards } = createCompendiumPresentation();
  const expectedRarityByTier = new Map([
    [1, "common"],
    [2, "uncommon"],
    [3, "rare"],
  ]);

  cards.forEach((card, index) => {
    assert.equal(card.rarity, expectedRarityByTier.get(CARD_DEFINITIONS[index].tier));
  });
});

test("compendium exposes every synergy in canonical order with relevant cards and roles", () => {
  const { synergies } = createCompendiumPresentation();

  assert.equal(synergies.length, 6);
  assert.deepEqual(synergies.map((synergy) => synergy.tag), [...SYNERGY_TAG_ORDER]);

  synergies.forEach((synergy) => {
    const rule = SYNERGY_RULES[synergy.tag];
    assert.equal(synergy.tiers.length, 2);
    assert.deepEqual(synergy.tiers.map((tier) => tier.threshold), [2, 4]);
    synergy.tiers.forEach((tier, tierIndex) => {
      const sourceTier = rule.tiers[tierIndex];
      const contributors = CARD_DEFINITIONS.filter((card) => card.tags.includes(synergy.tag));

      assert.deepEqual(tier.effect, sourceTier.effect);
      assert.deepEqual(tier.contributorCardIds, contributors.map((card) => card.id));
      assert.deepEqual(tier.contributorRoles, [...new Set(contributors.map((card) => card.role))]);
    });
  });
});

test("compendium lists tag contributors independently for both effect tiers", () => {
  const { synergies } = createCompendiumPresentation();
  const mage = synergies.find((synergy) => synergy.tag === "mage");
  const allMageCards = CARD_DEFINITIONS.filter((card) => card.tags.includes("mage")).map((card) => card.id);

  assert.deepEqual(mage.tiers[0].contributorCardIds, allMageCards);
  assert.deepEqual(mage.tiers[1].contributorCardIds, allMageCards);
});

test("compendium returns detached card tags, stats, and synergy effects", () => {
  const first = createCompendiumPresentation();
  const second = createCompendiumPresentation();

  assert.notEqual(first.cards, second.cards);
  assert.notEqual(first.cards[0].tags, CARD_DEFINITIONS[0].tags);
  assert.notEqual(first.cards[0].baseStats, CARD_DEFINITIONS[0].stats);
  assert.notEqual(first.cards[0].tags, second.cards[0].tags);
  assert.notEqual(first.synergies[0].tiers, SYNERGY_RULES[first.synergies[0].tag].tiers);
  assert.notEqual(first.synergies[0].tiers, second.synergies[0].tiers);
  assert.notEqual(first.synergies[0].tiers[0].effect, SYNERGY_RULES[first.synergies[0].tag].tiers[0].effect);
  assert.notEqual(first.synergies[0].tiers[0].effect, second.synergies[0].tiers[0].effect);
});

import assert from "node:assert/strict";
import test from "node:test";

import { CARD_DEFINITIONS, getCardStatsForUpgrade } from "../src/game/cards.ts";
import { SUPPORTED_LOCALES, getLocalizedCard } from "../src/i18n.ts";

const EXPECTED_NEW_CARDS = [
  ["bone_archer", 1, "ranged", ["undead", "rogue"], [3, 6, 5, 3], "snipe"],
  ["plague_rat", 1, "striker", ["beast", "undead"], [3, 7, 8, 1], "poison_bite"],
  ["rune_warden", 1, "caster", ["mage", "guardian"], [2, 9, 4, 3], "shield_wall"],
  ["forest_skirmisher", 1, "ranged", ["beast"], [3, 7, 7, 3], "charge"],
  ["marsh_stalker", 2, "ranged", ["beast", "rogue"], [3, 8, 6, 2], "backstab"],
  ["crypt_keeper", 2, "support", ["undead", "guardian"], [1, 11, 4, 2], "heal_only"],
  ["battle_alchemist", 2, "support", ["warrior", "mage"], [3, 8, 5, 2], "armor_corrosion"],
  ["night_warden", 2, "tank", ["rogue", "guardian"], [3, 12, 5, 1], "bodyguard"],
  ["grave_raider", 3, "striker", ["undead", "warrior"], [5, 11, 5, 1], "charge"],
  ["frost_wraith", 3, "caster", ["undead", "rogue"], [3, 9, 6, 3], "frost_delay"],
  ["ironhide_bear", 3, "tank", ["beast"], [3, 18, 3, 1], "thorn_guard"],
  ["soul_hunter", 3, "ranged", ["undead"], [5, 9, 5, 3], "backstab"],
];

const EXPECTED_SECOND_EXPANSION = [
  ["city_crossbowman", 1, "ranged", ["guardian"], [3, 8, 4, 3], "snipe"],
  ["harpy_scout", 1, "ranged", ["beast", "rogue"], [3, 6, 8, 3], "pack_hunter"],
  ["smoke_trickster", 1, "caster", ["rogue", "mage"], [2, 7, 7, 2], "frost_hex"],
  ["war_mastiff", 1, "tank", ["beast", "warrior"], [2, 13, 6, 1], "shield_wall"],
  ["grave_bellringer", 2, "support", ["undead", "guardian"], [2, 10, 3, 2], "battle_banner"],
  ["moon_priestess", 2, "support", ["mage", "guardian"], [2, 8, 5, 3], "moon_chorus"],
  ["phantom_duelist", 2, "striker", ["undead", "rogue"], [3, 9, 7, 1], "phantom_parry"],
  ["siege_engineer", 2, "ranged", ["warrior", "rogue"], [3, 8, 3, 3], "piercing_bolt"],
  ["bronze_minotaur", 3, "tank", ["beast"], [3, 18, 3, 1], "stone_skin"],
  ["headless_knight", 3, "striker", ["undead"], [6, 10, 6, 1], "charge"],
  ["star_seer", 3, "caster", ["mage"], [4, 10, 4, 3], "threat_sight"],
  ["war_chaplain", 3, "support", ["warrior"], [2, 13, 3, 2], "thorn_guard"],
];

test("the twelve-card expansion keeps the reviewed roles, tiers, stats, tags, and redesigned abilities", () => {
  const cardsById = new Map(CARD_DEFINITIONS.map((card) => [card.id, card]));

  EXPECTED_NEW_CARDS.forEach(([id, tier, role, tags, stats, abilityId]) => {
    const card = cardsById.get(id);
    assert.ok(card, id);
    assert.equal(card.tier, tier, `${id}:tier`);
    assert.equal(card.role, role, `${id}:role`);
    assert.deepEqual(card.tags, tags, `${id}:tags`);
    assert.deepEqual(
      [card.stats.attack, card.stats.hp, card.stats.speed, card.stats.range],
      stats,
      `${id}:stats`,
    );
    assert.equal(card.abilityId, abilityId, `${id}:ability`);
  });
});

test("the 42-card roster balances tags, roles, and tiers", () => {
  const tagCounts = Object.fromEntries(
    ["warrior", "beast", "mage", "undead", "rogue", "guardian"].map((tag) => [
      tag,
      CARD_DEFINITIONS.filter((card) => card.tags.includes(tag)).length,
    ]),
  );
  const roleCounts = Object.fromEntries(
    ["tank", "striker", "ranged", "caster", "support"].map((role) => [
      role,
      CARD_DEFINITIONS.filter((card) => card.role === role).length,
    ]),
  );
  const tierCounts = Object.fromEntries(
    [1, 2, 3].map((tier) => [
      tier,
      CARD_DEFINITIONS.filter((card) => card.tier === tier).length,
    ]),
  );

  assert.deepEqual(tagCounts, {
    warrior: 11,
    beast: 11,
    mage: 11,
    undead: 11,
    rogue: 11,
    guardian: 11,
  });
  assert.deepEqual(roleCounts, {
    tank: 8,
    striker: 9,
    ranged: 8,
    caster: 8,
    support: 9,
  });
  assert.deepEqual(tierCounts, { 1: 18, 2: 14, 3: 10 });
});

test("the second twelve-card expansion keeps the reviewed roles, tiers, stats, tags, and redesigned abilities", () => {
  const cardsById = new Map(CARD_DEFINITIONS.map((card) => [card.id, card]));

  EXPECTED_SECOND_EXPANSION.forEach(([id, tier, role, tags, stats, abilityId]) => {
    const card = cardsById.get(id);
    assert.ok(card, id);
    assert.equal(card.tier, tier, `${id}:tier`);
    assert.equal(card.role, role, `${id}:role`);
    assert.deepEqual(card.tags, tags, `${id}:tags`);
    assert.deepEqual(
      [card.stats.attack, card.stats.hp, card.stats.speed, card.stats.range],
      stats,
      `${id}:stats`,
    );
    assert.equal(card.abilityId, abilityId, `${id}:ability`);
  });
});

test("every new card has complete RU, UK, and EN mechanical copy", () => {
  const cardsById = new Map(CARD_DEFINITIONS.map((card) => [card.id, card]));

  for (const [id] of [...EXPECTED_NEW_CARDS, ...EXPECTED_SECOND_EXPANSION]) {
    const card = cardsById.get(id);
    assert.ok(card, id);

    for (const locale of SUPPORTED_LOCALES) {
      const localized = getLocalizedCard(locale, card);
      assert.match(localized.name, /\S/, `${locale}:${id}:name`);
      assert.ok(localized.text.length >= 12, `${locale}:${id}:mechanical text`);
      assert.ok(localized.summary.length >= 12, `${locale}:${id}:summary`);
    }
  }
});

test("the redesigned cards add eight distinct abilities and preserve the upgrade stat contract", () => {
  const abilityIds = new Set([
    "poison_bite", "armor_corrosion", "bodyguard", "phantom_parry",
    "piercing_bolt", "frost_delay", "moon_chorus", "threat_sight",
  ]);
  const redesigned = CARD_DEFINITIONS.filter((card) => abilityIds.has(card.abilityId));
  assert.equal(redesigned.length, 8);
  assert.equal(new Set(redesigned.map((card) => card.abilityId)).size, 8);

  for (const card of redesigned) {
    const upgraded = getCardStatsForUpgrade(card, 1);
    assert.deepEqual(upgraded, { ...card.stats, attack: card.stats.attack * 2, hp: card.stats.hp * 2 });
    assert.notStrictEqual(getCardStatsForUpgrade(card, 0), card.stats);
  }
});

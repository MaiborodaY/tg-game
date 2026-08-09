import assert from "node:assert/strict";
import test from "node:test";
import { CARD_DEFINITIONS } from "../src/game/cards.ts";
import {
  HOW_TO_SEEN_STORAGE_KEY,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  formatMessage,
  getArchetypeLabel,
  getCombatEventLabel,
  getLocalizedCard,
  getRarityLabel,
  getTagLabel,
  getUiCopy,
  hasSeenHowTo,
  markHowToSeen,
  normalizeLocale,
  readStoredLocale,
  resolveInitialLocale,
  saveLocale,
} from "../src/i18n.ts";

const ARCHETYPES = ["tank", "damage", "support"];
const RARITIES = ["common", "uncommon", "rare"];
const TAGS = ["warrior", "beast", "mage", "undead", "rogue", "guardian"];
const COMBAT_EVENTS = [
  "unit_attacked",
  "unit_blocked",
  "unit_damaged",
  "unit_healed",
  "unit_died",
  "synergy_applied",
];

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    values,
  };
}

test("locale resolution prefers saved choice and maps navigator language", () => {
  assert.deepEqual(SUPPORTED_LOCALES, ["ru", "uk", "en"]);
  assert.equal(normalizeLocale("RU-ru"), "ru");
  assert.equal(normalizeLocale("uk_UA"), "uk");
  assert.equal(normalizeLocale("de-DE"), undefined);
  assert.equal(resolveInitialLocale("uk", "ru-RU"), "uk");
  assert.equal(resolveInitialLocale(undefined, "ru-RU"), "ru");
  assert.equal(resolveInitialLocale(undefined, "uk-UA"), "uk");
  assert.equal(resolveInitialLocale(undefined, "en-GB"), "en");
  assert.equal(resolveInitialLocale(undefined, "pl-PL"), "en");
});

test("language and one-time tutorial preferences tolerate unavailable storage", () => {
  const storage = createStorage();
  assert.equal(readStoredLocale(storage), undefined);
  saveLocale(storage, "uk");
  assert.equal(storage.values.get(LOCALE_STORAGE_KEY), "uk");
  assert.equal(readStoredLocale(storage), "uk");
  assert.equal(hasSeenHowTo(storage), false);
  markHowToSeen(storage);
  assert.equal(storage.values.get(HOW_TO_SEEN_STORAGE_KEY), "1");
  assert.equal(hasSeenHowTo(storage), true);

  const unavailableStorage = {
    getItem: () => { throw new Error("blocked"); },
    setItem: () => { throw new Error("blocked"); },
  };
  assert.doesNotThrow(() => saveLocale(unavailableStorage, "ru"));
  assert.doesNotThrow(() => markHowToSeen(unavailableStorage));
  assert.equal(readStoredLocale(unavailableStorage), undefined);
  assert.equal(hasSeenHowTo(unavailableStorage), false);
});

test("all locales provide complete UI, taxonomy, and combat-log copy", () => {
  const referenceKeys = Object.keys(getUiCopy("en")).sort();

  SUPPORTED_LOCALES.forEach((locale) => {
    const copy = getUiCopy(locale);
    assert.deepEqual(Object.keys(copy).sort(), referenceKeys);
    Object.values(copy).forEach((value) => assert.match(value, /\S/));
    ARCHETYPES.forEach((archetype) => assert.match(getArchetypeLabel(locale, archetype), /\S/));
    RARITIES.forEach((rarity) => assert.match(getRarityLabel(locale, rarity), /\S/));
    TAGS.forEach((tag) => assert.match(getTagLabel(locale, tag), /\S/));
    COMBAT_EVENTS.forEach((event) => assert.match(getCombatEventLabel(locale, event), /\S/));
  });
});

test("all 18 core cards have complete presentation text in every locale", () => {
  assert.equal(CARD_DEFINITIONS.length, 18);

  SUPPORTED_LOCALES.forEach((locale) => {
    CARD_DEFINITIONS.forEach((card) => {
      const localized = getLocalizedCard(locale, card);
      assert.match(localized.name, /\S/, `${locale}:${card.id}:name`);
      assert.match(localized.text, /\S/, `${locale}:${card.id}:text`);
      assert.match(localized.summary, /\S/, `${locale}:${card.id}:summary`);
      if (locale === "en") {
        assert.equal(localized.name, card.name);
        assert.equal(localized.text, card.cardText ?? card.summary);
        assert.equal(localized.summary, card.summary);
      }
    });
  });
});

test("message formatter replaces known values and preserves unknown placeholders", () => {
  assert.equal(formatMessage("Round {round}: {card}", { round: 4, card: "Mage" }), "Round 4: Mage");
  assert.equal(formatMessage("{known} {unknown}", { known: "ok" }), "ok {unknown}");
});

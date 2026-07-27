import assert from "node:assert/strict";
import test from "node:test";

import {
  BRIDGE_LOCALE_STORAGE_KEY,
  BRIDGE_LOCALES,
  getBridgeCardNoun,
  normalizeBridgeLocale,
  readStoredBridgeLocale,
  resolveBridgeLocale,
  translateBridge,
  writeStoredBridgeLocale,
} from "../src/i18n.ts";

test("Bridge locales normalize Telegram and browser language variants", () => {
  assert.equal(normalizeBridgeLocale("ru-RU"), "ru");
  assert.equal(normalizeBridgeLocale("uk-UA"), "uk");
  assert.equal(normalizeBridgeLocale("UA"), "uk");
  assert.equal(normalizeBridgeLocale("en_US"), "en");
  assert.equal(normalizeBridgeLocale("pl-PL"), null);
  assert.equal(normalizeBridgeLocale(null), null);
});

test("manual locale wins over Telegram and browser preferences", () => {
  assert.equal(resolveBridgeLocale({
    storedLocale: "en",
    telegramLanguageCode: "uk",
    browserLanguages: ["ru-RU"],
  }), "en");
  assert.equal(resolveBridgeLocale({
    storedLocale: "broken",
    telegramLanguageCode: "uk-UA",
    browserLanguages: ["en-US"],
  }), "uk");
  assert.equal(resolveBridgeLocale({
    browserLanguages: ["pl-PL", "en-GB"],
  }), "en");
  assert.equal(resolveBridgeLocale(), "ru");
});

test("locale storage is persistent and fails closed", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };

  assert.equal(readStoredBridgeLocale(storage), null);
  assert.equal(writeStoredBridgeLocale(storage, "uk"), true);
  assert.equal(values.get(BRIDGE_LOCALE_STORAGE_KEY), "uk");
  assert.equal(readStoredBridgeLocale(storage), "uk");

  const brokenStorage = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
  };
  assert.equal(readStoredBridgeLocale(brokenStorage), null);
  assert.equal(writeStoredBridgeLocale(brokenStorage, "en"), false);
});

test("all locales explain the new penalty threshold and contextual jack value", () => {
  assert.deepEqual(BRIDGE_LOCALES, ["ru", "uk", "en"]);
  for (const locale of BRIDGE_LOCALES) {
    assert.match(translateBridge(locale, "scoreJacks"), /20/);
    assert.match(translateBridge(locale, "scoreJacks"), /10/);
    assert.match(translateBridge(locale, "penaltyRuleNote"), /125/);
    assert.match(translateBridge(locale, "matchLossThreshold", { target: 125 }), /125/);
    assert.doesNotMatch(translateBridge(locale, "penaltyReset", { target: 125 }), /\{target\}/);
  }
});

test("card nouns cover singular, few, many and teen forms", () => {
  assert.equal(getBridgeCardNoun("ru", 1), "карта");
  assert.equal(getBridgeCardNoun("ru", 1, "accusative"), "карту");
  assert.equal(getBridgeCardNoun("ru", 2), "карты");
  assert.equal(getBridgeCardNoun("ru", 5), "карт");
  assert.equal(getBridgeCardNoun("ru", 11), "карт");
  assert.equal(getBridgeCardNoun("ru", 21), "карта");
  assert.equal(getBridgeCardNoun("uk", 2), "карти");
  assert.equal(getBridgeCardNoun("en", 1), "card");
  assert.equal(getBridgeCardNoun("en", 5), "cards");
});

test("single-card action summaries remain grammatical in Russian and Ukrainian", () => {
  assert.equal(
    translateBridge("ru", "drawnCards", { count: 1, cards: getBridgeCardNoun("ru", 1) }),
    "Взято: 1 карта",
  );
  assert.equal(
    translateBridge("uk", "cardsPlayed", { count: 1, cards: getBridgeCardNoun("uk", 1) }),
    "Зіграно: 1 карта",
  );
});

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

const DUEL_COPY_EXPECTATIONS = {
  ru: {
    intro: ["обе крепости", "20 HP", "по одной карте"],
    draft: ["вы и соперник", "по одной карте"],
    win: ["выжившие", "HP обеих крепостей сохраняется", "0 HP", "15-го раунда", "при равенстве", "ничья"],
  },
  uk: {
    intro: ["обидві фортеці", "20 HP", "по одній карті"],
    draft: ["ви та суперник", "по одній карті"],
    win: ["що вижили", "HP обох фортець зберігається", "0 HP", "15-го раунду", "за рівності", "нічия"],
  },
  en: {
    intro: ["both keeps", "20 HP", "one card per round"],
    draft: ["You and your rival", "one card per round"],
    win: ["survivors", "Both keeps retain their HP", "0 HP", "round 15", "equal HP", "draw"],
  },
};

const RANGE_COPY_EXPECTATIONS = {
  ru: ["Передний ряд", "задний", "ДАЛ 1", "ДАЛ 2", "ДАЛ 3", "Щитоносец", "одновременно"],
  uk: ["Передній ряд", "задній", "ДАЛ 1", "ДАЛ 2", "ДАЛ 3", "Щитоносець", "одночасно"],
  en: ["front row", "back", "RNG 1", "RNG 2", "RNG 3", "Shieldbearer", "simultaneously"],
};

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

test("solo copy fully explains the symmetric fifteen-round keep duel", () => {
  SUPPORTED_LOCALES.forEach((locale) => {
    const copy = getUiCopy(locale);
    const expected = DUEL_COPY_EXPECTATIONS[locale];

    assert.match(copy.menuSubtitle, /15/, `${locale}:menuSubtitle:round limit`);
    expected.intro.forEach((fragment) => assert.ok(copy.howToIntro.includes(fragment), `${locale}:howToIntro:${fragment}`));
    expected.draft.forEach((fragment) => assert.ok(copy.howToDraftBody.includes(fragment), `${locale}:howToDraftBody:${fragment}`));
    expected.win.forEach((fragment) => assert.ok(copy.howToWinBody.includes(fragment), `${locale}:howToWinBody:${fragment}`));

    const resultValues = { round: 15, playerHp: 7, enemyHp: 3 };
    [copy.victoryDetail, copy.defeatDetail, copy.drawDetail].forEach((template) => {
      const result = formatMessage(template, resultValues);
      assert.match(result, /15/, `${locale}:result:round`);
      assert.match(result, /7/, `${locale}:result:playerHp`);
      assert.match(result, /3/, `${locale}:result:enemyHp`);
      assert.doesNotMatch(result, /\{[^}]+\}/, `${locale}:result:unresolved placeholder`);
    });
  });
});

test("placement tutorial explains localized front, back, and range rules", () => {
  SUPPORTED_LOCALES.forEach((locale) => {
    const copy = getUiCopy(locale);
    RANGE_COPY_EXPECTATIONS[locale].forEach((fragment) => {
      assert.ok(copy.howToPlaceBody.includes(fragment), `${locale}:howToPlaceBody:${fragment}`);
    });
  });
});

test("synergy status templates expose progress, activation, and localized effects", () => {
  SUPPORTED_LOCALES.forEach((locale) => {
    const copy = getUiCopy(locale);
    const values = {
      tag: getTagLabel(locale, "warrior"),
      count: 2,
      threshold: 2,
      remaining: 0,
      effect: `+1 ${copy.attack}`,
    };

    [copy.synergyActive, copy.synergyProgress].forEach((template) => {
      const result = formatMessage(template, values);
      assert.ok(result.includes(values.tag), `${locale}:synergy:tag`);
      assert.ok(result.includes("2/2"), `${locale}:synergy:count`);
      assert.ok(result.includes(values.effect), `${locale}:synergy:effect`);
      assert.doesNotMatch(result, /\{[^}]+\}/, `${locale}:synergy:unresolved placeholder`);
    });
  });
});

test("battle HUD, spatial positions, and draft forecasts are complete in every locale", () => {
  SUPPORTED_LOCALES.forEach((locale) => {
    const copy = getUiCopy(locale);
    const position = formatMessage(copy.fieldPosition, {
      row: copy.frontRow,
      column: copy.leftColumn,
    });
    const forecast = formatMessage(copy.synergyWillActivate, {
      tag: getTagLabel(locale, "guardian"),
      before: 1,
      after: 2,
    });
    const result = formatMessage(copy.roundResultDetail, {
      yourHp: copy.yourHp,
      playerHp: 17,
      playerLoss: 3,
      enemyHp: copy.enemyHp,
      enemyHpValue: 14,
      enemyLoss: 6,
    });

    [position, forecast, result].forEach((value) => {
      assert.match(value, /\S/, `${locale}:new HUD copy is non-empty`);
      assert.doesNotMatch(value, /\{[^}]+\}/, `${locale}:new HUD copy has no unresolved placeholders`);
    });
    [copy.enemyArmy, copy.enemyArmyHint, copy.moveUnit, copy.chooseMoveTarget, copy.battleSpeed, copy.skipBattle]
      .forEach((value) => assert.match(value, /\S/, `${locale}:new control copy`));
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

import assert from "node:assert/strict";
import test from "node:test";
import { CARD_DEFINITIONS } from "../src/game/cards.ts";
import { SYNERGY_RULES, SYNERGY_TAG_ORDER } from "../src/game/synergies.ts";
import {
  HOW_TO_SEEN_STORAGE_KEY,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  formatMessage,
  getArchetypeLabel,
  getCombatEventLabel,
  getLocalizedCard,
  getRarityLabel,
  getSynergyEffectLabel,
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

test("bot difficulty choices are explicit in every locale", () => {
  const expectations = {
    ru: ["Сложность", "Обычный", "Сильный", "три карты"],
    uk: ["Складність", "Звичайний", "Сильний", "три карти"],
    en: ["difficulty", "Normal", "Strong", "three cards"],
  };

  SUPPORTED_LOCALES.forEach((locale) => {
    const copy = getUiCopy(locale);
    const combined = [
      copy.botDifficulty,
      copy.botDifficultyStandard,
      copy.botDifficultyStrong,
      copy.botDifficultyStrongHint,
    ].join(" ");
    expectations[locale].forEach((fragment) => {
      assert.ok(combined.includes(fragment), `${locale}:botDifficulty:${fragment}`);
    });
  });
});

test("main menu utility copy stays short without changing modal copy", () => {
  const expectations = {
    ru: { rules: "Правила", cards: "Карты", history: "История · {count}" },
    uk: { rules: "Правила", cards: "Карти", history: "Історія · {count}" },
    en: { rules: "Rules", cards: "Cards", history: "History · {count}" },
  };

  SUPPORTED_LOCALES.forEach((locale) => {
    const copy = getUiCopy(locale);
    assert.equal(copy.howToPlay, expectations[locale].rules, `${locale}:howToPlay`);
    assert.equal(copy.compendium, expectations[locale].cards, `${locale}:compendium`);
    assert.equal(copy.runHistoryButton, expectations[locale].history, `${locale}:runHistoryButton`);
    assert.match(copy.howToTitle, /\S/, `${locale}:howToTitle`);
    assert.match(copy.compendiumTitle, /\S/, `${locale}:compendiumTitle`);
    assert.match(copy.compendiumIntro, /\S/, `${locale}:compendiumIntro`);
    assert.match(copy.runHistoryIntro, /\{limit\}/, `${locale}:runHistoryIntro limit`);
  });
});

test("daily challenge, local history, replay, and sharing copy is complete", () => {
  const retentionKeys = [
    "dailyChallengeTitle",
    "dailyChallengeHint",
    "dailyChallengeShortHint",
    "dailyChallengePlay",
    "runHistoryButton",
    "runHistoryTitle",
    "runHistoryIntro",
    "runHistoryEmpty",
    "runHistoryReplay",
    "runHistoryReplayCurrentRules",
    "runHistorySaveFailed",
    "runHistoryDiscardConfirm",
    "closeRunHistory",
    "runSourceStandard",
    "runSourceDaily",
    "newLayout",
    "sameLayout",
    "shareResult",
    "shareCopied",
    "shareFailed",
    "shareResultText",
  ];
  const dailyExpectations = {
    ru: { full: ["сегодня", "сильный бот", "00:00 UTC"], short: "Сегодня · сильный бот" },
    uk: { full: ["сьогодні", "сильний бот", "00:00 UTC"], short: "Сьогодні · сильний бот" },
    en: { full: ["today", "strong bot", "00:00 UTC"], short: "Today · strong bot" },
  };
  const sharePlaceholders = [
    "difficulty",
    "enemyHp",
    "maxRounds",
    "outcome",
    "playerHp",
    "round",
  ];

  SUPPORTED_LOCALES.forEach((locale) => {
    const copy = getUiCopy(locale);
    retentionKeys.forEach((key) => assert.match(copy[key], /\S/, `${locale}:${key}`));
    dailyExpectations[locale].full.forEach((fragment) => {
      assert.ok(copy.dailyChallengeHint.includes(fragment), `${locale}:dailyChallengeHint:${fragment}`);
    });
    assert.equal(copy.dailyChallengeShortHint, dailyExpectations[locale].short, `${locale}:dailyChallengeShortHint`);
    assert.deepEqual(
      [...copy.shareResultText.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]).sort(),
      sharePlaceholders,
      `${locale}:shareResultText placeholders`,
    );
    assert.deepEqual(
      [...copy.runHistoryButton.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]),
      ["count"],
      `${locale}:runHistoryButton placeholders`,
    );
    assert.match(copy.runHistoryIntro, /\{limit\}/, `${locale}:runHistoryIntro limit`);

    const formattedShare = formatMessage(copy.shareResultText, {
      outcome: copy.victory,
      difficulty: copy.botDifficultyStrong,
      round: 15,
      maxRounds: 15,
      playerHp: 9,
      enemyHp: 0,
    });
    assert.match(formattedShare, /^⚔️ BroBattler\n/);
    assert.match(formattedShare, /15\/15/);
    assert.match(formattedShare, /9:0/);
    assert.doesNotMatch(formattedShare, /\{[^}]+\}/, `${locale}:shareResultText unresolved placeholder`);
  });
});

test("PvP lobby and match controls are localized completely", () => {
  const pvpKeys = [
    "onlineMode",
    "pvpLobbyTitle",
    "pvpLobbySubtitle",
    "pvpCreateRoom",
    "pvpJoinRoom",
    "pvpRoomCode",
    "pvpRoomCodePlaceholder",
    "pvpCopyCode",
    "pvpCodeCopied",
    "pvpInviteHint",
    "pvpReady",
    "pvpCancelReady",
    "pvpWaitingForOpponent",
    "pvpWaitingForOpponentReady",
    "pvpReconnect",
    "pvpReconnecting",
    "pvpLeaveRoom",
    "pvpLeaveRoomConfirm",
    "pvpForfeit",
    "pvpForfeitConfirm",
    "pvpReadyForNextRound",
    "pvpWaitingForNextRound",
    "pvpRematch",
    "pvpRematchRequested",
    "pvpWaitingForRematch",
    "pvpPlayer",
    "pvpOpponent",
    "pvpSpectator",
    "pvpStatusIdle",
    "pvpStatusConnecting",
    "pvpStatusConnected",
    "pvpStatusError",
    "pvpSlotOpen",
    "pvpSlotJoined",
    "pvpSlotReady",
    "pvpCloseLobby",
    "pvpErrorInvalidCode",
    "pvpErrorConnectionClosed",
    "pvpErrorConnectionFailed",
    "pvpErrorBadMessage",
    "pvpErrorRoom",
    "pvpErrorRoomFull",
    "pvpErrorRoomNotFound",
    "pvpErrorStaleMatch",
    "pvpErrorActionRejected",
    "pvpErrorReconnectFailed",
    "pvpErrorCopyFailed",
    "pvpErrorInvalidToken",
    "pvpErrorRateLimited",
    "pvpErrorDisabled",
    "pvpErrorOriginForbidden",
    "pvpErrorInternal",
    "pvpErrorBadRequest",
  ];
  const expectations = {
    ru: {
      pvpLobbyTitle: "Дуэль с игроком",
      pvpCreateRoom: "Создать комнату",
      pvpReadyForNextRound: "Готов к следующему раунду",
      pvpSpectator: "Наблюдатель",
      pvpErrorRoomFull: "В комнате уже два игрока.",
    },
    uk: {
      pvpLobbyTitle: "Дуель із гравцем",
      pvpCreateRoom: "Створити кімнату",
      pvpReadyForNextRound: "Готовий до наступного раунду",
      pvpSpectator: "Спостерігач",
      pvpErrorRoomFull: "У кімнаті вже два гравці.",
    },
    en: {
      pvpLobbyTitle: "Player duel",
      pvpCreateRoom: "Create room",
      pvpReadyForNextRound: "Ready for next round",
      pvpSpectator: "Spectator",
      pvpErrorRoomFull: "The room already has two players.",
    },
  };

  SUPPORTED_LOCALES.forEach((locale) => {
    const copy = getUiCopy(locale);
    pvpKeys.forEach((key) => assert.match(copy[key], /\S/, `${locale}:${key}`));
    Object.entries(expectations[locale]).forEach(([key, value]) => {
      assert.equal(copy[key], value, `${locale}:${key}`);
    });
  });
});

test("all locales warn that ending a run removes saved progress", () => {
  const expectations = {
    ru: ["Завершить", "прогресс", "удалён"],
    uk: ["Завершити", "прогрес", "видалено"],
    en: ["End", "progress", "deleted"],
  };

  SUPPORTED_LOCALES.forEach((locale) => {
    const copy = getUiCopy(locale);
    assert.match(copy.abandonRun, /\S/, `${locale}:abandonRun`);
    expectations[locale].forEach((fragment) => {
      assert.ok(copy.abandonRunConfirm.includes(fragment), `${locale}:abandonRunConfirm:${fragment}`);
    });
  });
});

test("draft skip and battle block feedback are explicit in every locale", () => {
  const expectations = {
    ru: { skip: "Без карты", block: "БЛОК" },
    uk: { skip: "Без карти", block: "БЛОК" },
    en: { skip: "Skip card", block: "BLOCK" },
  };

  SUPPORTED_LOCALES.forEach((locale) => {
    const copy = getUiCopy(locale);
    assert.ok(copy.skipPickAndFight.includes(expectations[locale].skip), `${locale}:skipPickAndFight`);
    assert.equal(copy.blockFeedback, expectations[locale].block, `${locale}:blockFeedback`);
  });
});

test("draft controls explain the single refresh and card-choice toggle", () => {
  const expectations = {
    ru: ["Обновление", "Свернуть", "Развернуть"],
    uk: ["Оновлення", "Згорнути", "Розгорнути"],
    en: ["Refresh", "Collapse", "Expand"],
  };

  SUPPORTED_LOCALES.forEach((locale) => {
    const copy = getUiCopy(locale);
    assert.equal(formatMessage(copy.rerollCounter, { remaining: 1 }).endsWith("1/1"), true);
    assert.equal(formatMessage(copy.rerollCounter, { remaining: 0 }).endsWith("0/1"), true);
    assert.ok(copy.rerollCounter.includes(expectations[locale][0]), `${locale}:rerollCounter`);
    assert.ok(copy.collapseDraftChoices.includes(expectations[locale][1]), `${locale}:collapseDraftChoices`);
    assert.ok(copy.expandDraftChoices.includes(expectations[locale][2]), `${locale}:expandDraftChoices`);
  });
});

test("draft-card field markers distinguish an upgrade from an already maxed copy", () => {
  const expectedLabels = {
    ru: ["Улучшить", "На поле"],
    uk: ["Покращити", "На полі"],
    en: ["Upgrade", "On field"],
  };

  SUPPORTED_LOCALES.forEach((locale) => {
    const copy = getUiCopy(locale);
    assert.deepEqual(
      [copy.draftUpgradeAvailable, copy.draftAlreadyOnField],
      expectedLabels[locale],
      `${locale}:draft-card status labels`,
    );
    assert.ok(copy.draftUpgradeAvailableDescription.includes("{card}"), `${locale}:upgrade description`);
    assert.ok(copy.draftAlreadyOnFieldDescription.includes("{card}"), `${locale}:maxed description`);
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

test("armor-granting abilities expose exact values in every locale", () => {
  const expectedArmorTerms = {
    ru: "брон",
    uk: "брон",
    en: "armor",
  };
  const expectedAmounts = {
    iron_guard: "3",
    thorn_druid: "1",
    stone_golem: "5",
    duelist: "2",
    rune_warden: "3",
    night_warden: "2",
    ironhide_bear: "1",
  };

  SUPPORTED_LOCALES.forEach((locale) => {
    Object.entries(expectedAmounts).forEach(([cardId, amount]) => {
      const card = CARD_DEFINITIONS.find((definition) => definition.id === cardId);
      assert.ok(card, cardId);
      const localized = getLocalizedCard(locale, card);
      assert.ok(localized.text.toLowerCase().includes(expectedArmorTerms[locale]), `${locale}:${cardId}:armor`);
      assert.ok(localized.text.includes(amount), `${locale}:${cardId}:amount`);
    });
  });
});

test("Grave Binder copy explains both skeleton strength levels in every locale", () => {
  const graveBinder = CARD_DEFINITIONS.find((definition) => definition.id === "grave_binder");
  assert.ok(graveBinder);

  SUPPORTED_LOCALES.forEach((locale) => {
    const localized = getLocalizedCard(locale, graveBinder);
    assert.ok(localized.text.includes("2/4"), `${locale}:grave_binder:base`);
    assert.ok(localized.text.includes("3/6"), `${locale}:grave_binder:upgraded`);
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

test("both synergy tiers have truthful localized effect and forecast copy", () => {
  const expectedScopeCopy = {
    ru: { contributor: "Карты синергии", mage: "заклинателям и поддержке", enemy: "каждому врагу", allies: "всем союзникам" },
    uk: { contributor: "Карти синергії", mage: "заклиначам і підтримці", enemy: "кожному ворогу", allies: "всім союзникам" },
    en: { contributor: "Synergy cards", mage: "casters and supports", enemy: "every enemy", allies: "all allies" },
  };
  SUPPORTED_LOCALES.forEach((locale) => {
    const copy = getUiCopy(locale);
    SYNERGY_TAG_ORDER.forEach((tag) => {
      SYNERGY_RULES[tag].tiers.forEach((tier) => {
        const effect = getSynergyEffectLabel(locale, tag, tier.effect);
        const compactEffect = getSynergyEffectLabel(locale, tag, tier.effect, "compact");
        const status = formatMessage(copy.synergyTierProgress, {
          threshold: tier.threshold,
          remaining: tier.threshold,
          effect,
        });
        const tierLabel = tier.threshold === 2 ? copy.synergyForecastBonus : copy.synergyForecastMastery;
        const forecast = formatMessage(copy.synergyForecastActivates, {
          tag: getTagLabel(locale, tag),
          tier: tierLabel,
          effect,
        });
        const visibleForecast = `${tier.threshold === 2 ? "✓" : "★"} ${compactEffect}`;

        assert.match(effect, new RegExp(String(tier.effect.value)), `${locale}:${tag}:${tier.threshold}:value`);
        assert.match(compactEffect, new RegExp(String(tier.effect.value)), `${locale}:${tag}:${tier.threshold}:compact-value`);
        assert.doesNotMatch(compactEffect, /\{[^}]+\}/, `${locale}:${tag}:${tier.threshold}:compact-resolved`);
        assert.ok(status.includes(`${tier.threshold}/4`), `${locale}:${tag}:${tier.threshold}:status`);
        assert.ok(status.includes(effect), `${locale}:${tag}:${tier.threshold}:status-effect`);
        assert.ok(forecast.includes(effect), `${locale}:${tag}:${tier.threshold}:forecast-effect`);
        assert.ok(forecast.includes(tierLabel), `${locale}:${tag}:${tier.threshold}:forecast-tier`);
        assert.doesNotMatch(visibleForecast, /→|\d\s*\/\s*\d/, `${locale}:${tag}:${tier.threshold}:visual-counts`);
        assert.doesNotMatch(`${status} ${forecast}`, /\{[^}]+\}/, `${locale}:${tag}:${tier.threshold}:resolved`);
      });
    });
    assert.ok(copy.compendiumSynergyCards.includes(expectedScopeCopy[locale].contributor), `${locale}:contributors`);
    assert.ok(getSynergyEffectLabel(locale, "mage", SYNERGY_RULES.mage.tiers[0].effect)
      .includes(expectedScopeCopy[locale].mage), `${locale}:mage-recipients`);
    assert.ok(getSynergyEffectLabel(locale, "mage", SYNERGY_RULES.mage.tiers[1].effect)
      .includes(expectedScopeCopy[locale].enemy), `${locale}:mage-enemy-targets`);
    assert.ok(getSynergyEffectLabel(locale, "guardian", SYNERGY_RULES.guardian.tiers[1].effect)
      .includes(expectedScopeCopy[locale].allies), `${locale}:guardian-allies`);
  });
});

test("undead mastery battle feedback is explicit in every locale", () => {
  const expected = {
    ru: ["НЕЖИТЬ", "4/4", "АТК"],
    uk: ["НЕЖИТЬ", "4/4", "АТК"],
    en: ["UNDEAD", "4/4", "ATK"],
  };

  SUPPORTED_LOCALES.forEach((locale) => {
    const label = formatMessage(getUiCopy(locale).battleCalloutUndeadMastery, { amount: 1 });
    expected[locale].forEach((fragment) => {
      assert.ok(label.includes(fragment), `${locale}:undead-mastery:${fragment}`);
    });
    assert.ok(label.includes("1"), `${locale}:undead-mastery:amount`);
    assert.doesNotMatch(label, /\{[^}]+\}/, `${locale}:undead-mastery:resolved`);
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
    [
      copy.enemyArmy,
      copy.enemyArmyHint,
      copy.frontRowShort,
      copy.backRowShort,
      copy.moveUnit,
      copy.chooseMoveTarget,
      copy.battleSpeed,
      copy.skipBattle,
    ]
      .forEach((value) => assert.match(value, /\S/, `${locale}:new control copy`));
  });
});

test("all 42 core cards have complete presentation text in every locale", () => {
  assert.equal(CARD_DEFINITIONS.length, 42);

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

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { SUPPORTED_LOCALES, getUiCopy } from "../src/i18n.ts";

const mainSource = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
const damagePresentationSource = await readFile(new URL("../src/roundDamagePresentation.ts", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const rendererSource = await readFile(new URL("../src/rendering/phaserBattleScene.ts", import.meta.url), "utf8");

test("main menu exposes an accessible cards and synergies compendium", () => {
  assert.match(mainSource, /createCompendiumPresentation\(\)/);
  assert.match(mainSource, /compendiumButton\.textContent = copy\.compendium/);
  assert.match(mainSource, /panel\.setAttribute\("aria-modal", "true"\)/);
  assert.match(mainSource, /compendiumOpen && uiState\.mode === "menu"/);
  assert.match(
    mainSource,
    /telegram\.setBackHandler\([\s\S]*?uiState\.mode !== "menu" \|\| howToOpen \|\| compendiumOpen \|\| runHistoryOpen/,
  );
  assert.match(styles, /\.compendium-panel\s*\{[^}]*grid-template-rows:\s*auto minmax\(0, 1fr\)[^}]*overflow:\s*hidden/s);
  assert.match(styles, /\.compendium-panel__content\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(mainSource, /content\.tabIndex = 0/);
  assert.match(mainSource, /metaLine\.append\(tier, rarity, archetype\)/);
  assert.match(styles, /\.compendium-card-list,[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(styles, /\.compendium-card__stats\s*\{[^}]*grid-template-columns:\s*repeat\(4,/s);
  assert.match(mainSource, /synergy\.tiers\.forEach\(\(tier\) =>/);
  assert.match(mainSource, /copy\.compendiumSynergyTier/);
  assert.match(styles, /\.compendium-synergy__tiers\s*\{/);
  assert.match(styles, /\.compendium-synergy__tier:nth-child\(2\)/);
});

test("round result highlights attributable combat damage instead of obvious outcome metrics", () => {
  assert.match(mainSource, /createRoundInsights\(record\)/);
  assert.match(mainSource, /insights\.sides\[owner\]\.damageDealt\.bySource/);
  assert.match(mainSource, /createRoundDamagePresentation\(owner, slots, sources\)/);
  assert.match(damagePresentationSource, /entry\.hpDamage \+ entry\.armorDamage/);
  assert.match(damagePresentationSource, /entry\.source\.unit\.summonedBy \?\? entry\.source\.unit\.instanceId/);
  assert.match(damagePresentationSource, /entry\.source\.kind === "unit"/);
  assert.doesNotMatch(mainSource, /copy\.roundInsightCastleDamage/);
  assert.doesNotMatch(mainSource, /copy\.roundInsightSurvivors/);
  assert.match(styles, /\.round-result-damage__row\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto/s);
  assert.match(styles, /\.round-result-damage__label > span\s*\{[^}]*text-overflow:\s*ellipsis[^}]*white-space:\s*nowrap/s);
  assert.match(styles, /\.round-result-damage__value\s*\{[^}]*text-align:\s*right/s);
});

test("round result omits zero HP deltas and describes zero or tied damage", () => {
  assert.match(mainSource, /playerLoss:\s*formatRoundHpLoss\(snapshot\.playerHpLoss\)/);
  assert.match(mainSource, /enemyLoss:\s*formatRoundHpLoss\(snapshot\.enemyHpLoss\)/);
  assert.match(mainSource, /return loss > 0 \? ` \(\u2212\$\{loss\}\)` : ""/);
  assert.match(mainSource, /!unitRow && synergyRows\.length === 0[\s\S]*?copy\.roundDamageNone/);
  assert.match(mainSource, /leaders\.length === 0[\s\S]*?return undefined/);
  assert.match(mainSource, /formatMessage\(copy\.roundDamageMore, \{ name: names\[0\], count: names\.length - 1 \}\)/);
  assert.match(mainSource, /names\.join\(", "\)/);
});

test("battle renderer receives localized ability callouts without changing combat rules", () => {
  assert.match(mainSource, /abilityCalloutLabels:\s*createBattleAbilityCalloutLabels\(\)/);
  for (const key of [
    "battleCalloutArmor",
    "battleCalloutBanner",
    "battleCalloutThorns",
    "battleCalloutPack",
    "battleCalloutFrost",
    "battleCalloutUndeadMastery",
    "battleCalloutBonePact",
  ]) {
    assert.match(mainSource, new RegExp(`copy\\.${key}\\b`), `main.ts uses ${key}`);
  }
  assert.match(rendererSource, /createBattleAbilityCalloutPlan\(events, timelineUnits\)/);
  assert.match(rendererSource, /this\.emitBattleAbilityCallouts\(visibleResultEvents\)/);
});

test("learning UI copy is complete and explicit in all locales", () => {
  const keys = [
    "compendium",
    "compendiumTitle",
    "compendiumIntro",
    "compendiumUpgradeNote",
    "compendiumSynergyTier",
    "synergyTierActive",
    "synergyTierProgress",
    "roundInsightsTitle",
    "roundDamageEnemy",
    "roundDamageNone",
    "roundDamageMore",
    "roundDamageSynergy",
    "roundDamageAccessible",
    "roundDamageUnknownUnit",
    "battleCalloutArmor",
    "battleCalloutBanner",
    "battleCalloutUndeadMastery",
    "battleCalloutBonePact",
  ];

  SUPPORTED_LOCALES.forEach((locale) => {
    const copy = getUiCopy(locale);
    keys.forEach((key) => assert.match(copy[key], /\S/, `${locale}:${key}`));
    assert.match(copy.compendiumUpgradeNote, /(?:АТК|ATK)/, `${locale}:upgrade attack`);
    assert.match(copy.compendiumUpgradeNote, /HP/, `${locale}:upgrade hp`);
    assert.match(copy.roundDamageMore, /\{name\}/, `${locale}:leader name placeholder`);
    assert.match(copy.roundDamageMore, /\{count\}/, `${locale}:tied leaders placeholder`);
    assert.match(copy.roundDamageSynergy, /\{tag\}/, `${locale}:synergy tag placeholder`);
    for (const placeholder of ["owner", "sources", "amount"]) {
      assert.match(copy.roundDamageAccessible, new RegExp(`\\{${placeholder}\\}`), `${locale}:${placeholder} placeholder`);
    }
  });
});

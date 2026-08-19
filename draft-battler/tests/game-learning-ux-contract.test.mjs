import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { SUPPORTED_LOCALES, getUiCopy } from "../src/i18n.ts";

const mainSource = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
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
});

test("round result uses factual insight data and keeps the summary compact", () => {
  assert.match(mainSource, /createRoundInsights\(record\)/);
  assert.match(mainSource, /insights\.castles\.enemy\.damageTaken/);
  assert.match(mainSource, /insights\.sides\.player\.survivors\.length/);
  assert.match(mainSource, /\.filter\(\(row\) => row\.total > 0\)[\s\S]*?\.slice\(0, 2\)/);
  assert.match(styles, /\.round-result-insights__grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s);
});

test("battle renderer receives localized ability callouts without changing combat rules", () => {
  assert.match(mainSource, /abilityCalloutLabels:\s*createBattleAbilityCalloutLabels\(\)/);
  for (const key of [
    "battleCalloutArmor",
    "battleCalloutBanner",
    "battleCalloutThorns",
    "battleCalloutPack",
    "battleCalloutFrost",
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
    "roundInsightsTitle",
    "roundInsightCastleDamage",
    "roundInsightSurvivors",
    "battleCalloutArmor",
    "battleCalloutBanner",
    "battleCalloutBonePact",
  ];

  SUPPORTED_LOCALES.forEach((locale) => {
    const copy = getUiCopy(locale);
    keys.forEach((key) => assert.match(copy[key], /\S/, `${locale}:${key}`));
    assert.match(copy.compendiumUpgradeNote, /(?:АТК|ATK)/, `${locale}:upgrade attack`);
    assert.match(copy.compendiumUpgradeNote, /HP/, `${locale}:upgrade hp`);
    assert.match(copy.roundInsightCastleDamage, /\{player\}/, `${locale}:player placeholder`);
    assert.match(copy.roundInsightCastleDamage, /\{enemy\}/, `${locale}:enemy placeholder`);
  });
});

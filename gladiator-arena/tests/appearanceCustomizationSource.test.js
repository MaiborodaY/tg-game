import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const arenaSceneSource = readFileSync(resolve(currentDir, "../src/ArenaScene.ts"), "utf8");
const cityHeroUiSource = readFileSync(resolve(currentDir, "../src/cityHeroUi.ts"), "utf8");
const debugMainSource = readFileSync(resolve(currentDir, "../src/debugMain.ts"), "utf8");
const heroSource = readFileSync(resolve(currentDir, "../src/hero.ts"), "utf8");
const indexSource = readFileSync(resolve(currentDir, "../index.html"), "utf8");
const mainSource = readFileSync(resolve(currentDir, "../src/main.ts"), "utf8");
const registrySource = readFileSync(resolve(currentDir, "../src/appearanceAssetRegistry.ts"), "utf8");
const optimizeAssetsSource = readFileSync(resolve(currentDir, "../scripts/optimize-assets.mjs"), "utf8");
const stylesSource = readFileSync(resolve(currentDir, "../src/styles.css"), "utf8");

test("appearance registry discovers hair and beard assets without low variants", () => {
  assert.match(registrySource, /assets\/fighters\/appearance\/\*\*\/\*\.webp/);
  assert.match(registrySource, /assets\/fighters\/appearance\/\*\*\/\*\.png/);
  assert.match(registrySource, /HERO_APPEARANCE_ASSETS_BY_SLOT/);
  assert.match(registrySource, /assetPath\.includes\("\/appearance\/hair\/"\)/);
  assert.match(registrySource, /assetPath\.includes\("\/appearance\/beard\/"\)/);
  assert.match(registrySource, /resolveHeroAppearanceAssetUrl/);
  assert.match(optimizeAssetsSource, /pattern: \/\^fighters\\\/appearance\\\//);
  assert.doesNotMatch(registrySource, /assets-low\/fighters\/appearance/);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/fighters/appearance/hair/hair-01.png")), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/fighters/appearance/hair/hair-01.webp")), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/fighters/appearance/beard/beard-short-01.png")), true);
  assert.equal(existsSync(resolve(currentDir, "../src/assets/fighters/appearance/beard/beard-short-01.webp")), true);
});

test("profile portrait opens the appearance menu and saves hero appearance", () => {
  assert.match(heroSource, /appearance: HeroAppearance;/);
  assert.match(heroSource, /hairId: "hair-01"/);
  assert.match(heroSource, /beardId: "beard-short-01"/);
  assert.match(heroSource, /export function updateHeroAppearance\(hero: HeroState, appearance: Partial<HeroAppearance>/);
  assert.match(indexSource, /<button id="heroProfilePortrait" class="city-profile__portrait" type="button"/);
  assert.match(cityHeroUiSource, /export function mountCityHeroAppearanceMenu/);
  assert.match(cityHeroUiSource, /profilePortrait\?\.addEventListener\("click", handleProfilePortraitClick\)/);
  assert.match(cityHeroUiSource, /HERO_APPEARANCE_ASSETS_BY_SLOT\[activeSlot\]/);
  assert.match(cityHeroUiSource, /data-hero-appearance-option/);
  assert.match(mainSource, /const cityHeroAppearanceMenu = mountCityHeroAppearanceMenu/);
  assert.match(mainSource, /function handleProfileAppearanceChange\(appearance: Partial<HeroAppearance>\): void/);
  assert.match(mainSource, /updateHeroAppearance\(hero, appearance\)/);
  assert.match(mainSource, /setPlayerAppearance\(hero\.appearance\)/);
});

test("paper doll and portrait previews sync appearance asset keys", () => {
  assert.match(arenaSceneSource, /const PLAYER_APPEARANCE_CHANGE_EVENT = "gladiator-player-appearance-change"/);
  assert.match(arenaSceneSource, /export function setPlayerAppearance\(appearance: HeroAppearance\): void/);
  assert.match(arenaSceneSource, /function createPlayerAppearanceAssetKeys/);
  assert.match(arenaSceneSource, /function shouldUsePaperDollAppearanceAssets/);
  assert.match(arenaSceneSource, /return \(bodyPresetKey \?\? debugTuning\.paperDollBodyPreset\) === "dummy-v2"/);
  assert.match(arenaSceneSource, /createPlayerAppearanceAssetKeys\(appearance, bodyPresetKey\)/);
  assert.match(arenaSceneSource, /createPlayerAppearanceAssetKeys\(appearance, rig\.bodyPresetKey\)/);
  assert.match(arenaSceneSource, /Object\.values\(appearanceLayers\)\.forEach\(\(layer\) => setFighterPartVisible\(layer, false\)\)/);
  assert.match(arenaSceneSource, /function ensurePaperDollAppearanceAssetsLoaded/);
  assert.match(arenaSceneSource, /function addPaperDollAppearanceLayers/);
  assert.match(arenaSceneSource, /function syncPaperDollAppearanceState/);
  assert.match(arenaSceneSource, /APPEARANCE_LAYER_KEYS\.forEach/);
  assert.match(arenaSceneSource, /function applyAppearanceLayerTransform/);
  assert.match(arenaSceneSource, /getHeroPortraitSnapshotKey\(equipment, appearance\)/);
  assert.match(arenaSceneSource, /setAppearance: \(appearance: HeroAppearance\) => void/);
  assert.match(debugMainSource, /let hero: HeroState = createDefaultHero\(\)/);
  assert.match(debugMainSource, /setPlayerAppearance\(hero\.appearance\)/);
  assert.match(stylesSource, /\.city-appearance-menu/);
  assert.match(stylesSource, /\.city-profile__portrait:hover/);
});

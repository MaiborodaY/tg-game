import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mainSource = readFileSync(join(root, "src", "main.ts"), "utf8");
const stylesSource = readFileSync(join(root, "src", "styles.css"), "utf8");

test("arena button waits for the city zoom transition before starting combat", () => {
  assert.match(mainSource, /async function startGameWithCityTransition/);
  assert.match(mainSource, /isArenaTransitionRunning/);
  assert.match(mainSource, /prewarmArenaAssetsForBrowserCache/);
  assert.match(mainSource, /void prewarmArenaAssetsForBrowserCache\(\)/);
  assert.match(mainSource, /cityMenu\?\.classList\.add\("city-menu--arena-transition"\)/);
  assert.match(mainSource, /await \(cityScene\?\.focusArenaTransition\(\) \?\? Promise\.resolve\(\)\)/);
  assert.match(mainSource, /startGame\(\)/);
  assert.match(mainSource, /cityMenu\?\.classList\.remove\("city-menu--arena-transition"\)/);
});

test("city arena transition darkens the whole city UI", () => {
  assert.match(stylesSource, /\.city-menu--arena-transition::after/);
  assert.match(stylesSource, /z-index: 23/);
  assert.match(stylesSource, /background: rgba\(10, 3, 0, 0\.9\)/);
  assert.match(stylesSource, /760ms cubic-bezier/);
});

test("city shop curtain holds while the shop layout settles", () => {
  assert.match(mainSource, /const CITY_CURTAIN_CLOSE_MS = 100/);
  assert.match(mainSource, /const CITY_CURTAIN_HOLD_MS = 250/);
  assert.match(mainSource, /const CITY_CURTAIN_REVEAL_MS = 300/);
  assert.match(mainSource, /const CITY_CURTAIN_SWITCH_MS = CITY_CURTAIN_CLOSE_MS/);
  assert.match(mainSource, /cityMenu\.classList\.add\("city-menu--curtain-cover"\)/);
  assert.match(mainSource, /cityMenu\.classList\.add\("city-menu--curtain-hold"\)/);
  assert.match(mainSource, /cityMenu\.classList\.add\("city-menu--curtain-reveal"\)/);
  assert.match(stylesSource, /\.city-menu--curtain-hold \.city-menu__curtain::before,/);
  assert.match(stylesSource, /@keyframes city-curtain-left-cover/);
  assert.match(stylesSource, /@keyframes city-curtain-left-reveal/);
  assert.doesNotMatch(mainSource, /city-menu--curtain-play/);
  assert.doesNotMatch(stylesSource, /armory-shop-rise/);
});

test("battle screen starts dark while the arena entry camera pulls back", () => {
  assert.match(mainSource, /dom\.gameScreen\.classList\.add\("battle-screen--arena-entry"\)/);
  assert.match(mainSource, /const entryToken = beginArenaEntryGate\(\)/);
  assert.match(mainSource, /void runArenaEntry\(scene, entryToken\)/);
  assert.match(mainSource, /await scene\.prepareEntry\(state\)/);
  assert.match(mainSource, /finishArenaEntryGate\(entryToken\)/);
  assert.match(mainSource, /await scene\.playEntryTransition\(state\)/);
  assert.match(stylesSource, /\.battle-screen::after/);
  assert.match(stylesSource, /\.battle-screen--arena-entry::after/);
  assert.match(stylesSource, /opacity: 1/);
  assert.match(stylesSource, /transition: opacity 760ms cubic-bezier/);
});

test("arena entry shows a delayed coin loader while equipment assets finish loading", () => {
  assert.match(mainSource, /const ARENA_ENTRY_LOADER_DELAY_MS = 240/);
  assert.match(mainSource, /function ensureArenaEntryLoader/);
  assert.match(mainSource, /arena-entry-loader/);
  assert.match(mainSource, /city-return-transition__coin/);
  assert.match(mainSource, /window\.setTimeout\(\(\) => \{[\s\S]*setArenaEntryLoaderVisible\(true\);[\s\S]*\}, ARENA_ENTRY_LOADER_DELAY_MS\)/);
  assert.match(mainSource, /isTurnAnimationLocked \|\| isArenaEntryLoading/);
  assert.match(mainSource, /isTurnAnimationLocked \|\| isArenaEntryLoading\) \{/);
  assert.match(stylesSource, /\.arena-entry-loader/);
  assert.match(stylesSource, /\.arena-entry-loader \.city-return-transition__coin/);
  assert.match(stylesSource, /\.battle-screen--arena-entry \.action-arc/);
  assert.match(stylesSource, /\.battle-screen--arena-entry \.classic-action-bar/);
});

test("battle result waits briefly for city prewarm before enabling return", () => {
  assert.match(mainSource, /prewarmCityAssetsForBrowserCache/);
  assert.match(mainSource, /CITY_RETURN_MIN_READY_MS = 1800/);
  assert.match(mainSource, /CITY_RETURN_PREWARM_TIMEOUT_MS = 3000/);
  assert.match(mainSource, /CITY_RETURN_WAITING_LABEL = "Preparing City\.\.\."/);
  assert.match(mainSource, /startBattleResultReturnGate\(\)/);
  assert.match(mainSource, /waitForCityPrewarmWithTimeout/);
  assert.match(mainSource, /resultReturn:/);
  assert.match(stylesSource, /\.battle-result__button--waiting/);
  assert.match(stylesSource, /@keyframes battle-result-button-wait/);
});

test("return to city uses a coin fade until the city preview is ready", () => {
  assert.match(mainSource, /function createCityReturnTransition/);
  assert.match(mainSource, /city-return-transition__coin/);
  assert.match(mainSource, /async function returnToCity/);
  assert.match(mainSource, /showCityReturnTransition\(\)/);
  assert.match(mainSource, /await mountCityPreviews\(\)/);
  assert.match(mainSource, /await waitForCityReady\(\)/);
  assert.match(mainSource, /hideCityReturnTransition\(\)/);
  assert.match(mainSource, /cityScene\?\.ready/);
  assert.match(mainSource, /waitForCityFirstPaint/);
  assert.match(stylesSource, /\.city-return-transition/);
  assert.match(stylesSource, /gold-coin\.webp/);
  assert.match(stylesSource, /@keyframes city-return-coin-flip/);
});

test("arena entry keeps the cached hero portrait snapshot alive", () => {
  assert.match(mainSource, /function unmountCityScenePreview/);
  assert.match(mainSource, /heroPortraitPreview\?\.setEquipment\(hero\.equipment\)/);
  assert.doesNotMatch(mainSource, /heroPortraitPreview\?\.destroy\(\)/);
  assert.doesNotMatch(mainSource, /heroPortraitPreview = undefined/);
});

test("first city entry uses the same coin fade until the city preview is ready", () => {
  assert.match(mainSource, /city-return-transition city-return-transition--active/);
  assert.match(mainSource, /async function finishInitialCityEntry/);
  assert.match(mainSource, /await mountCityPreviews\(\)/);
  assert.match(mainSource, /await waitForCityReady\(\)/);
  assert.match(mainSource, /hideCityReturnTransition\(\)/);
  assert.match(mainSource, /void finishInitialCityEntry\(\)/);
});

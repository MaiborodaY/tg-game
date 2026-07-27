import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new globalThis.URL("../index.html", import.meta.url), "utf8");
const mainSource = readFileSync(new globalThis.URL("../src/main.ts", import.meta.url), "utf8");

test("Tower Defense opens its own intro without a game chooser", () => {
  assert.match(html, /id="intro-overlay" class="modal-layer">/);
  assert.doesNotMatch(html, /game-choice-overlay|choose-bridge|intro-back-to-games/);
  assert.match(mainSource, /if \(!elements\.introOverlay\.hidden\) elements\.introStart\.focus\(\);/);
});

test("Tower Defense has no client-side route into the separate Bridge app", () => {
  assert.doesNotMatch(mainSource, /gameChoice\.ts|buildBridgeLaunchUrl|VITE_BRIDGE_APP_URL|location\.assign/);
  assert.doesNotMatch(html, /Дворовый Бридж|Tavern Bridge/);
});

test("removing Bridge navigation keeps unfinished reward protection", () => {
  assert.match(mainSource, /reward\.mode === "server" && !finishSettled/);
  assert.match(mainSource, /telegram\.setClosingConfirmation\(reward\.mode === "server" && !finishSettled\)/);
});

test("manual language controls are available before and during a match", () => {
  assert.equal(html.match(/data-role="language"/g)?.length, 2);
  assert.match(mainSource, /readStoredLocale\(storage\) \?\? detectLocale/);
  assert.match(mainSource, /writeStoredLocale\(storage, locale\)/);
  assert.match(mainSource, /renderedPreviewWave = -1;/);
  assert.match(mainSource, /if \(latestUi\) renderUi\(latestUi\);/);
});

test("fullscreen remains an explicit player choice", () => {
  assert.match(html, /id="fullscreen-button" class="fullscreen-button"[^>]*aria-pressed="false"[^>]*hidden/);
  assert.equal(mainSource.match(/telegram\.requestFullscreen\(\)/g)?.length, 1);
  assert.equal(mainSource.match(/telegram\.exitFullscreen\(\)/g)?.length, 1);
  assert.doesNotMatch(mainSource, /restorePendingFinish\(\);\s*if \(elements\.introOverlay\.hidden\) telegram\.requestFullscreen\(\);/);
  assert.doesNotMatch(mainSource, /function dismissIntro\(\): void \{[\s\S]*telegram\.requestFullscreen\(\);/);
  assert.match(mainSource, /elements\.fullscreenButton\.addEventListener\("click", \(\) => \{\s*if \(telegram\.isFullscreen\) telegram\.exitFullscreen\(\);\s*else telegram\.requestFullscreen\(\);/);
});

test("fullscreen control follows Telegram support and confirmed state", () => {
  assert.match(mainSource, /telegram\.onFullscreenChange\(syncFullscreenUi\);/);
  assert.match(mainSource, /document\.documentElement\.classList\.toggle\("is-telegram-fullscreen", isFullscreen\);/);
  assert.match(mainSource, /elements\.buildPanel\.classList\.toggle\("has-fullscreen-control", supportsFullscreen\);/);
  assert.match(mainSource, /elements\.fullscreenButton\.hidden = !supportsFullscreen;/);
  assert.match(mainSource, /elements\.fullscreenButton\.setAttribute\("aria-pressed", String\(isFullscreen\)\);/);
  assert.match(mainSource, /text\(isFullscreen \? "fullscreen_exit" : "fullscreen_enter"\)/);
  assert.match(mainSource, /function applyStaticTranslations\(\): void \{[\s\S]*syncFullscreenUi\(telegram\.isFullscreen\);/);
});

test("practice exposes content selection while rewarded runs stay pinned", () => {
  assert.match(html, /id="session-picker"/);
  assert.match(html, /id="level-select"/);
  assert.match(html, /id="mode-select"/);
  assert.match(mainSource, /readSessionSelection\(storage, reward\.mode\)/);
  assert.match(mainSource, /loadCampaign\(storage, saveKey, selectedSession\.selection\)/);
  assert.match(mainSource, /elements\.sessionPicker\.hidden = selectedSession\.locked/);
  assert.match(mainSource, /if \(reward\.mode === "server" \|\| elements\.introOverlay\.hidden \|\| sessionSwitching\) return/);
  assert.match(mainSource, /elements\.sessionMenuButton\.addEventListener\("click", openSessionMenu\)/);
});

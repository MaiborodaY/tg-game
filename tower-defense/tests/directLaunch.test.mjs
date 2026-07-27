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

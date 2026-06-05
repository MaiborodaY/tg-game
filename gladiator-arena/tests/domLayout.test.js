import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(resolve(currentDir, "../index.html"), "utf8");

test("fighter stats are mounted inside the battle overlay", () => {
  const statusStripIndex = html.indexOf('<section class="status-strip"');
  const battleOverlayIndex = html.indexOf('<div class="battle-ui"');
  const statsIndex = html.indexOf('class="fighters-strip arena-fighters-strip"');
  const resultBannerIndex = html.indexOf('<div id="resultBanner"');

  assert.ok(statusStripIndex > 0, "status strip should exist");
  assert.ok(battleOverlayIndex > 0, "battle overlay should exist");
  assert.ok(statsIndex > battleOverlayIndex, "fighter stats should be inside the battle overlay area");
  assert.ok(statsIndex < resultBannerIndex, "fighter stats should stay inside the stage panel before the result banner");
  assert.equal(html.slice(0, statusStripIndex).includes("fighters-strip"), false, "fighter stats should not take a top-level row above status");
});

test("bottom action panel is removed", () => {
  assert.equal(html.includes('class="action-cluster"'), false);
  assert.equal(html.includes('id="actions"'), false);
});

test("arena background is mounted as the battle screen backdrop", () => {
  const gameScreenIndex = html.indexOf('id="gameScreen" class="game-screen battle-screen"');
  const backgroundIndex = html.indexOf('class="stage-bg"');
  const topHudIndex = html.indexOf('class="top-hud"');
  const gameFrameIndex = html.indexOf('id="game" class="game-frame"');

  assert.ok(gameScreenIndex > 0, "battle screen should exist");
  assert.ok(backgroundIndex > gameScreenIndex, "stage background should be inside the battle screen");
  assert.ok(backgroundIndex < topHudIndex, "stage background should be the first battle screen layer");
  assert.ok(backgroundIndex < gameFrameIndex, "stage background should not be nested inside the Phaser frame");
  assert.equal(html.includes('src="./assets/arena/arena-bg-01.png"'), true);
});
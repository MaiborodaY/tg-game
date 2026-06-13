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
  const statsIndex = html.indexOf('class="fighters-strip arena-fighters-strip flask-hud"');
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

test("battle result panel exposes rewards and xp progress", () => {
  assert.equal(html.includes('id="resultEyebrow"'), true);
  assert.equal(html.includes('id="resultTitle"'), true);
  assert.equal(html.includes('id="resultGoldReward"'), true);
  assert.equal(html.includes('id="resultXpReward"'), true);
  assert.equal(html.includes('id="resultXpProgressFill"'), true);
  assert.equal(html.includes('id="cityButton"'), true);
});

test("city hero widget exposes skill point allocation controls", () => {
  assert.equal(html.includes('id="heroInfoSkillPoints"'), true);

  for (const attribute of ["strength", "agility", "vitality"]) {
    assert.equal(html.includes(`data-hero-attribute-value="${attribute}"`), true);
    assert.equal(html.includes(`data-hero-attribute-button="${attribute}"`), true);
  }
});

test("fighter resources use flask HUD while preserving stat ids", () => {
  assert.equal(html.includes('class="fighters-strip arena-fighters-strip flask-hud"'), true);
  assert.equal(html.includes('class="resource-flask flask--hp"'), true);
  assert.equal(html.includes('class="resource-flask flask--armor"'), true);
  assert.equal(html.includes('class="resource-flask flask--stamina"'), true);

  for (const id of [
    "playerHpText",
    "playerArmorText",
    "playerStaText",
    "playerHpFill",
    "playerArmorFill",
    "playerStaFill",
    "enemyHpText",
    "enemyArmorText",
    "enemyStaText",
    "enemyHpFill",
    "enemyArmorFill",
    "enemyStaFill",
  ]) {
    assert.equal(html.includes(`id="${id}"`), true, `${id} should remain available for combat rendering`);
  }
});

test("arena background is rendered inside the Phaser battle scene", () => {
  const gameScreenIndex = html.indexOf('id="gameScreen" class="game-screen battle-screen"');
  const gameFrameIndex = html.indexOf('id="game" class="game-frame"');

  assert.ok(gameScreenIndex > 0, "battle screen should exist");
  assert.ok(gameFrameIndex > gameScreenIndex, "Phaser frame should be inside the battle screen");
  assert.equal(html.includes('class="stage-bg"'), false);
  assert.equal(html.includes('src="./assets/arena/arena-bg-01.webp"'), false);
});

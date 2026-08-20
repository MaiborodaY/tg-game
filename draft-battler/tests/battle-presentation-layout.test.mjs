import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createFieldLayout, getUnitPerspectiveScale } from "../src/fieldLayout.ts";
import {
  BATTLE_CAMERA_CLOSE_ZOOM,
  BATTLE_CAMERA_ZOOM,
  BATTLE_UNIT_PRESENTATION_SCALE,
  DRAFT_UNIT_PRESENTATION_SCALE,
  fitStaticUnitArtSize,
  getUnitPresentationScale,
} from "../src/rendering/battlePresentationLayout.ts";

const sceneSource = await readFile(new URL("../src/rendering/phaserBattleScene.ts", import.meta.url), "utf8");

test("battle presentation improves central unit readability without changing draft scale", () => {
  const layout = createFieldLayout(390, 720);
  const y = layout.centerY;
  const perspectiveScale = getUnitPerspectiveScale(layout, y);

  assert.equal(getUnitPresentationScale(layout, y, "draft"), perspectiveScale * DRAFT_UNIT_PRESENTATION_SCALE);
  assert.equal(getUnitPresentationScale(layout, y, "battle"), perspectiveScale * BATTLE_UNIT_PRESENTATION_SCALE);

  const previousBattleScreenScale = perspectiveScale * 0.86 * 1.18;
  const currentBattleScreenScale = getUnitPresentationScale(layout, y, "battle") * BATTLE_CAMERA_ZOOM;
  const readabilityGain = currentBattleScreenScale / previousBattleScreenScale;

  assert.ok(readabilityGain >= 1.15 && readabilityGain <= 1.2);
});

test("close combat remains focused without over-zooming units", () => {
  const previousCloseScreenScale = 0.86 * 1.32;
  const currentCloseScreenScale = BATTLE_UNIT_PRESENTATION_SCALE * BATTLE_CAMERA_CLOSE_ZOOM;
  const readabilityGain = currentCloseScreenScale / previousCloseScreenScale;

  assert.ok(readabilityGain >= 1.14 && readabilityGain <= 1.18);
  assert.ok(BATTLE_CAMERA_CLOSE_ZOOM > BATTLE_CAMERA_ZOOM);
});

test("battlefield renderer no longer exposes the temporary CLASH label", () => {
  assert.doesNotMatch(sceneSource, /["']CLASH["']/);
});

test("static unit art preserves square and humanoid aspect ratios inside the visual box", () => {
  assert.deepEqual(fitStaticUnitArtSize(384, 384, 56, 68), { width: 56, height: 56 });

  const humanoid = fitStaticUnitArtSize(384, 576, 56, 68);
  assert.equal(humanoid.height, 68);
  assert.ok(Math.abs(humanoid.width - 45.333333333333336) < 1e-9);
});

test("renderer aspect-fits only static art and keeps animated atlas sizing unchanged", () => {
  assert.match(
    sceneSource,
    /fitStaticUnitArtSize\(\s*sprite\.width,\s*sprite\.height,\s*UNIT_SPRITE_DISPLAY_WIDTH,\s*UNIT_SPRITE_DISPLAY_HEIGHT,?\s*\)/,
  );
  assert.match(sceneSource, /sprite\.setDisplaySize\(displaySize\.width, displaySize\.height\)/);
  assert.match(
    sceneSource,
    /\.sprite\(0, UNIT_SPRITE_SHEET_Y, asset\.spriteSheet\.key, frame\)[\s\S]*?\.setDisplaySize\(UNIT_SPRITE_SHEET_DISPLAY_SIZE, UNIT_SPRITE_SHEET_DISPLAY_SIZE\)/,
  );
});

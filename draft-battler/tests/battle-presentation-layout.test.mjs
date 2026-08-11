import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createFieldLayout, getUnitPerspectiveScale } from "../src/fieldLayout.ts";
import {
  BATTLE_CAMERA_CLOSE_ZOOM,
  BATTLE_CAMERA_ZOOM,
  BATTLE_UNIT_PRESENTATION_SCALE,
  DRAFT_UNIT_PRESENTATION_SCALE,
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

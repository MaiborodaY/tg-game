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
  BATTLE_UNIT_VISUAL_BOUNDS,
  getBattleCameraFrame,
  getBattleFormationPosition,
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

  assert.ok(readabilityGain >= 1.2 && readabilityGain <= 1.25);
});

test("close combat does not repeatedly reframe or zoom on each hit", () => {
  assert.ok(BATTLE_CAMERA_CLOSE_ZOOM > BATTLE_CAMERA_ZOOM);
  assert.match(sceneSource, /if \(zoom === BATTLE_CAMERA_CLOSE_ZOOM\) return;/);
  assert.match(sceneSource, /getBattleCameraFrame\(this\.layout\)/);
});

for (const [width, height] of [[320, 568], [390, 844], [430, 932]]) {
  test(`all twelve unit atlases and vitals fit the stable camera at ${width}x${height}`, () => {
    const layout = createFieldLayout(width, height);
    const original = JSON.parse(JSON.stringify(layout));
    const frame = getBattleCameraFrame(layout);
    const rectangles = [];
    for (const owner of ["player", "enemy"]) {
      for (let slot = 0; slot < 6; slot += 1) {
        const point = getBattleFormationPosition(layout, owner, slot);
        const scale = getUnitPresentationScale(layout, point.y, "battle");
        const rectangle = {
          left: (point.x + BATTLE_UNIT_VISUAL_BOUNDS.left * scale - frame.x) * frame.zoom + width / 2,
          right: (point.x + BATTLE_UNIT_VISUAL_BOUNDS.right * scale - frame.x) * frame.zoom + width / 2,
          top: (point.y + BATTLE_UNIT_VISUAL_BOUNDS.top * scale - frame.y) * frame.zoom + height / 2,
          bottom: (point.y + BATTLE_UNIT_VISUAL_BOUNDS.bottom * scale - frame.y) * frame.zoom + height / 2,
        };
        assert.ok(rectangle.left >= 12 - 1e-9 && rectangle.right <= width - 12 + 1e-9, `${owner} ${slot}: horizontal safe margin`);
        assert.ok(rectangle.top >= 116 - 1e-9 && rectangle.bottom <= height - 54 + 1e-9, `${owner} ${slot}: header and controls safe margin`);
        rectangles.push(rectangle);
      }
    }
    for (let index = 0; index < rectangles.length; index += 1) {
      for (const other of rectangles.slice(index + 1)) {
        const box = rectangles[index];
        assert.ok(box.right <= other.left || other.right <= box.left || box.bottom <= other.top || other.bottom <= box.top, "units and vitals must not overlap in a full formation");
      }
    }
    assert.deepEqual(layout, original, "draft field geometry remains unchanged");
  });
}

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

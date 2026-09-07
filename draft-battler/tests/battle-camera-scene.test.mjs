import assert from "node:assert/strict";
import test from "node:test";
import { createFieldLayout } from "../src/fieldLayout.ts";
import {
  BATTLE_CAMERA_CLOSE_ZOOM, BATTLE_CAMERA_ZOOM, BATTLE_UNIT_VISUAL_BOUNDS,
  getBattleCameraFrame, getBattleFormationPosition, getUnitPresentationScale,
} from "../src/rendering/battlePresentationLayout.ts";
import { HeadlessBattleScene } from "./headless-battle-scene.mjs";

for (const [width, height] of [[320, 568], [390, 400], [568, 320]]) {
  test(`the real camera preserves the fitted twelve-unit frame at ${width}x${height}`, () => {
    const { scene, moves } = setup(width, height);
    const frame = getBattleCameraFrame(scene.layout);
    scene.focusCameraOnPoint(width / 2, height / 2, 360, BATTLE_CAMERA_ZOOM);
    const target = moves.at(-1);
    close(target.x, width / 2 - frame.x * frame.zoom);
    close(target.y, height / 2 - frame.y * frame.zoom);
    close(target.scaleX, frame.zoom);
    close(target.scaleY, frame.zoom);
    for (const owner of ["player", "enemy"]) {
      for (let slot = 0; slot < 6; slot += 1) {
        const point = getBattleFormationPosition(scene.layout, owner, slot);
        const scale = getUnitPresentationScale(scene.layout, point.y, "battle");
        const top = (point.y + BATTLE_UNIT_VISUAL_BOUNDS.top * scale) * target.scaleY + target.y;
        const bottom = (point.y + BATTLE_UNIT_VISUAL_BOUNDS.bottom * scale) * target.scaleY + target.y;
        assert.ok(top >= 116 - 1e-9 && bottom <= height - 54 + 1e-9, `${owner} ${slot}: real camera keeps both control margins`);
      }
    }
  });
}

test("castle/manual camera points retain their legacy clamp, while hit zooms remain quiet", () => {
  const { scene, moves } = setup(390, 400);
  const zoom = 1.14;
  scene.focusCameraOnPoint(-1000, -1000, 100, zoom);
  close(moves[0].x, 195 - 390 * 0.12 * zoom);
  close(moves[0].y, 200 - Math.max(82, 108 / zoom) * zoom);
  scene.focusCameraOnPoint(1000, 1000, 100, zoom);
  close(moves[1].x, 195 - (390 - 390 * 0.12) * zoom);
  close(moves[1].y, 200 - (400 - Math.max(82, 108 / zoom)) * zoom);
  scene.focusCameraOnPoint(100, 100, 100, BATTLE_CAMERA_CLOSE_ZOOM);
  assert.equal(moves.length, 2);
});

function setup(width, height) {
  const scene = new HeadlessBattleScene();
  const moves = [];
  scene.layout = createFieldLayout(width, height);
  scene.presentationLayer = {};
  scene.resetPhaserCamera = () => {};
  scene.tweens = { killTweensOf() {}, add(config) { moves.push(config); } };
  return { scene, moves };
}

function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} should equal ${expected}`);
}

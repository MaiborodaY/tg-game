import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { UnitPoseState } from "../src/rendering/unitPoseState.ts";

test("a dead redrawn atlas unit cannot return to a living pose when pending callbacks finish", () => {
  const state = new UnitPoseState(true);
  let displayedPose = "idle";
  const applyPose = (pose) => {
    if (state.accept(pose)) displayedPose = pose;
  };

  applyPose("attack");
  assert.equal(displayedPose, "attack");
  applyPose("dead");
  for (const latePose of ["idle", "walkA", "walkB", "attack"]) {
    applyPose(latePose);
    assert.equal(displayedPose, "dead", `late ${latePose} must not revive the fallen artwork`);
  }
  assert.equal(state.accept("dead"), true);
});

test("each fresh unit view starts alive even when a previous view died", () => {
  const previousView = new UnitPoseState(true);
  previousView.accept("dead");
  assert.equal(previousView.accept("idle"), false);

  const freshView = new UnitPoseState(true);
  for (const pose of ["idle", "walkA", "walkB", "attack", "idle"]) {
    assert.equal(freshView.accept(pose), true);
  }
  assert.equal(previousView.accept("attack"), false);
});

test("older units and static fallbacks retain their existing pose transition behavior", () => {
  for (const state of [new UnitPoseState(), new UnitPoseState(false)]) {
    for (const pose of ["attack", "dead", "idle", "walkA", "walkB", "attack", "dead"]) {
      assert.equal(state.accept(pose), true);
    }
  }
});

test("the scene protects grounded atlas units and summons before changing frames", async () => {
  const source = await readFile(new URL("../src/rendering/phaserBattleScene.ts", import.meta.url), "utf8");
  const createUnit = source.slice(source.indexOf("private createUnit("), source.indexOf("private createUnitArt("));
  const setPose = source.slice(source.indexOf("private setUnitPose("), source.indexOf("private updateUnitSpatialStyle("));

  assert.match(createUnit, /const protectAnimation = Boolean\(unit\.summonedBy \|\| \(unitArt\.sprite && getGroundedUnitArtBounds\(unit\.cardId\)\)\);/);
  assert.match(createUnit, /poseState: new UnitPoseState\(protectAnimation\)/);
  assert.match(setPose, /if \(!view\.poseState\.accept\(pose\)\) \{\s*return;\s*\}\s*view\.facing = facing;/);
  assert.ok(setPose.indexOf("view.poseState.accept(pose)") < setPose.indexOf("view.sprite.setFrame(frame)"));
});

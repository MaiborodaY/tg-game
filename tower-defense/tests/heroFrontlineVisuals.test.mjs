import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createPathMetrics } from "../src/game/pathing.ts";
import {
  createHeroFrontlineRouteFrame,
  createHeroFrontlineRouteFrameAtPoint,
  getHeroFrontlineBypassPose,
  getHeroFrontlineBypassSide,
  getHeroFrontlineContactPose,
  HERO_FRONTLINE_VISUAL_BOUNDS,
} from "../src/rendering/heroFrontlineVisuals.ts";

const sceneSource = readFileSync(new URL("../src/rendering/TowerDefenseScene.ts", import.meta.url), "utf8");

test("held enemies occupy unique, bounded contact positions in front of the hero", () => {
  const frame = createHeroFrontlineRouteFrameAtPoint({ x: 120, y: 180 }, 0);
  const poses = Array.from({ length: 3 }, (_, slotIndex) => (
    getHeroFrontlineContactPose(frame, "raider", slotIndex, 3)
  ));

  assert.equal(new Set(poses.map(({ x, y }) => `${x}:${y}`)).size, poses.length);
  for (const pose of poses) {
    assert.ok(pose.forwardOffset < 0);
    assert.ok(Math.abs(pose.forwardOffset) <= HERO_FRONTLINE_VISUAL_BOUNDS.maxContactForward);
    assert.ok(Math.abs(pose.lateralOffset) <= HERO_FRONTLINE_VISUAL_BOUNDS.maxContactLateral);
    assert.equal(Number.isFinite(pose.x) && Number.isFinite(pose.y), true);
  }
  assert.deepEqual(poses.map(({ lateralOffset }) => lateralOffset), [-24, 0, 24]);
});

test("frontline layout is deterministic and sanitizes malformed visual input", () => {
  const path = createPathMetrics([{ x: 10, y: 20 }, { x: 210, y: 20 }]);
  const frame = createHeroFrontlineRouteFrame(path, 100);
  const input = { kind: "overflow", progress: 0.45 };
  const first = getHeroFrontlineBypassPose(frame, 847, "bulwark", input);
  const repeated = getHeroFrontlineBypassPose(frame, 847, "bulwark", input);
  assert.deepEqual(first, repeated);

  const malformed = getHeroFrontlineBypassPose(frame, Number.NaN, "swift", {
    kind: "overflow",
    progress: Number.POSITIVE_INFINITY,
  });
  assert.equal(malformed.progress, 0);
  assert.equal(Number.isFinite(malformed.x) && Number.isFinite(malformed.y), true);
  assert.ok(Math.abs(malformed.forwardOffset) <= HERO_FRONTLINE_VISUAL_BOUNDS.maxBypassForward);
  assert.ok(Math.abs(malformed.lateralOffset) <= HERO_FRONTLINE_VISUAL_BOUNDS.maxBypassLateral);
});

test("overflow arcs around the hero and rejoins the route after passing", () => {
  const frame = createHeroFrontlineRouteFrameAtPoint({ x: 200, y: 240 }, Math.PI / 2);
  const side = getHeroFrontlineBypassSide(18, "brute");
  const before = getHeroFrontlineBypassPose(frame, 18, "brute", { kind: "overflow", progress: 0 });
  const beside = getHeroFrontlineBypassPose(frame, 18, "brute", { kind: "overflow", progress: 0.5 });
  const after = getHeroFrontlineBypassPose(frame, 18, "brute", { kind: "overflow", progress: 1 });

  assert.ok(before.forwardOffset < 0);
  assert.equal(before.lateralOffset, 0);
  assert.equal(Math.sign(beside.lateralOffset), side);
  assert.ok(Math.abs(beside.lateralOffset) > 30);
  assert.ok(after.forwardOffset > 0);
  assert.ok(Math.abs(after.lateralOffset) < 1e-8);
});

test("major enemies use a stable bounded side when walking around a defeated hero", () => {
  const frame = createHeroFrontlineRouteFrameAtPoint({ x: 0, y: 0 }, -0.7);
  for (const type of ["boss", "titan"]) {
    const side = getHeroFrontlineBypassSide(1_002, type);
    assert.ok(side === -1 || side === 1);
    assert.equal(side, getHeroFrontlineBypassSide(1_002, type));
    for (let step = 0; step <= 20; step += 1) {
      const pose = getHeroFrontlineBypassPose(frame, 1_002, type, {
        kind: "overflow",
        progress: step / 20,
      });
      assert.ok(Math.abs(pose.forwardOffset) <= HERO_FRONTLINE_VISUAL_BOUNDS.maxBypassForward);
      assert.ok(Math.abs(pose.lateralOffset) <= HERO_FRONTLINE_VISUAL_BOUNDS.maxBypassLateral);
    }
  }
});

test("the scene renders contacts and overflow without mutating gameplay positions", () => {
  assert.match(sceneSource, /blockedSlots[\s\S]*getHeroFrontlineContactPose/);
  assert.match(sceneSource, /getEffectiveEnemyHeroBlockCost\(enemy\.type, frontline\.blockCapacity\) > remainingCapacity/);
  assert.match(sceneSource, /kind: "overflow"[\s\S]*enemy\.progress - bypassStart/);
  assert.match(sceneSource, /!enemy\.stunned && !enemy\.blocked/);
  assert.doesNotMatch(sceneSource, /hero_frontline_broken|heroFrontlineBreakthrough/);
  assert.doesNotMatch(sceneSource, /enemy\.(?:x|y|progress)\s*=/);
});

test("combat VFX and projectiles follow visual enemy positions during a bypass", () => {
  assert.match(sceneSource, /private getEnemyRenderPoint\(enemyId: number, fallback: Point\)/);
  assert.match(sceneSource, /event\.type === "enemy_damaged"[\s\S]*getEnemyRenderPoint\(event\.enemyId, event\)/);
  assert.match(sceneSource, /event\.type === "projectile_hit"[\s\S]*getEnemyRenderPoint\(event\.targetId, event\)/);
  assert.match(sceneSource, /event\.type === "lightning"[\s\S]*getEnemyRenderPoint\(event\.fromId, event\.from\)[\s\S]*getEnemyRenderPoint\(event\.toId, event\.to\)/);
  assert.match(sceneSource, /const visualBlend = target && targetArt\?\.visible[\s\S]*distanceToTarget \/ 90/);
});

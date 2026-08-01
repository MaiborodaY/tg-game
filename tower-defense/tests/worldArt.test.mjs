import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { BUILD_PADS, GAME_HEIGHT, GAME_WIDTH, ROUTE_POINTS } from "../src/game/config.ts";
import { CLASSIC_CAMPAIGN_LEVEL, NORTHERN_PASS_LEVEL } from "../src/game/content.ts";
import {
  FOREST_GATE_LANDMARKS,
  WORLD_VISUAL_THEMES,
  createNorthernLandmarkLayout,
  createWorldDecorationLayout,
  distanceToWorldRoute,
  getActVisualProfile,
  getWorldVisualTheme,
} from "../src/rendering/worldThemes.ts";

const worldArtSource = readFileSync(new URL("../src/rendering/worldArt.ts", import.meta.url), "utf8");
const northernWorldArtSource = readFileSync(new URL("../src/rendering/northernWorldArt.ts", import.meta.url), "utf8");
const sceneSource = readFileSync(new URL("../src/rendering/TowerDefenseScene.ts", import.meta.url), "utf8");

test("each shipped level resolves to a stable and distinct visual theme", () => {
  assert.deepEqual(Object.keys(WORLD_VISUAL_THEMES).sort(), ["forest-gate", "northern-pass"]);
  assert.equal(getWorldVisualTheme("forest-gate").id, "forest-gate");
  assert.equal(getWorldVisualTheme("northern-pass").id, "northern-pass");
  assert.notEqual(getWorldVisualTheme("forest-gate").seed, getWorldVisualTheme("northern-pass").seed);
  assert.equal(getWorldVisualTheme("unknown-level").id, "forest-gate");
});

test("campaign acts escalate lighting without changing world geometry", () => {
  const acts = [1, 2, 3].map((act) => getActVisualProfile(act));
  const northernActs = [1, 2, 3].map((act) => getActVisualProfile(act, "northern-pass"));
  assert.deepEqual(acts.map((profile) => profile.veilAlpha), [0, 0.08, 0.14]);
  assert.deepEqual(northernActs.map((profile) => profile.veilAlpha), [0.025, 0.1, 0.08]);
  assert.equal(new Set(acts.map((profile) => profile.portal)).size, 3);
  assert.equal(northernActs[0].portal, WORLD_VISUAL_THEMES["northern-pass"].portal);
  assert.notEqual(northernActs[0].portal, acts[0].portal);
  assert.equal(new Set(acts.map((profile) => profile.gateWard)).size, 3);
  assert.deepEqual(northernActs.map((profile) => profile.snowAlpha), [0.18, 0.54, 0.32]);
  assert.deepEqual(northernActs.map((profile) => profile.auroraAlpha), [0, 0, 0.3]);
  assert.deepEqual(northernActs.map((profile) => profile.stormAlpha), [0, 0.18, 0.06]);
  assert.ok(acts.every((profile) => profile.snowAlpha === 0 && profile.auroraAlpha === 0));
  assert.ok(acts.every(Object.isFrozen));
  assert.ok(northernActs.every(Object.isFrozen));
  assert.match(worldArtSource, /getActVisualProfile\(act, art\.themeId\)/);
  assert.match(worldArtSource, /art\.portalGlow\.setFillStyle\(profile\.portal/);
  assert.match(worldArtSource, /art\.gateWard\.setFillStyle\(profile\.gateWard/);
});

test("Northern Pass decoration remains sparse, deterministic, and visibly wintry", () => {
  const theme = getWorldVisualTheme("northern-pass");
  const reserved = [...NORTHERN_PASS_LEVEL.buildPads, ...NORTHERN_PASS_LEVEL.heroAnchors];
  const first = createWorldDecorationLayout(
    theme,
    NORTHERN_PASS_LEVEL.route,
    NORTHERN_PASS_LEVEL.width,
    NORTHERN_PASS_LEVEL.height,
    reserved,
  );
  const second = createWorldDecorationLayout(
    theme,
    NORTHERN_PASS_LEVEL.route,
    NORTHERN_PASS_LEVEL.width,
    NORTHERN_PASS_LEVEL.height,
    reserved,
  );

  assert.deepEqual(first, second);
  assert.ok(first.groundDetails.length <= 58);
  assert.ok(first.shrubs.length <= 21);
  assert.ok(first.trees.length <= 8);
  assert.ok(first.fireflies.length > 0 && first.fireflies.length <= 12);
  assert.ok(first.groundDetails.length < 78);
});

test("forest decoration is deterministic and keeps interactive zones legible", () => {
  const theme = getWorldVisualTheme("forest-gate");
  const reserved = [...BUILD_PADS, ...CLASSIC_CAMPAIGN_LEVEL.heroAnchors];
  const first = createWorldDecorationLayout(theme, ROUTE_POINTS, GAME_WIDTH, GAME_HEIGHT, reserved);
  const second = createWorldDecorationLayout(theme, ROUTE_POINTS, GAME_WIDTH, GAME_HEIGHT, reserved);

  assert.deepEqual(first, second);
  assert.ok(first.groundDetails.length >= 50);
  assert.ok(first.shrubs.length >= 20);
  assert.ok(first.trees.length <= 10);
  assert.ok(first.fireflies.length <= 6);

  assertPointsClear(first.clearings, 48, 50, reserved);
  assertPointsClear(first.groundDetails, 29, 22, reserved);
  assertPointsClear(first.shrubs, 38, 30, reserved);
  assertPointsClear(first.trees, 40, 38, reserved);
  assertPointsClear(first.fireflies, 31, 24, reserved);
});

test("every level keeps its route profile and generated art clear of interaction centers", () => {
  for (const level of [CLASSIC_CAMPAIGN_LEVEL, NORTHERN_PASS_LEVEL]) {
    const theme = getWorldVisualTheme(level.id);
    const reserved = [...level.buildPads, ...level.heroAnchors];
    const layout = createWorldDecorationLayout(theme, level.route, level.width, level.height, reserved);
    const routeRadius = theme.routeWidths[0] / 2;

    for (const pad of level.buildPads) {
      assert.ok(distanceToWorldRoute(pad, level.route) >= routeRadius - 1e-9);
    }
    for (const points of Object.values(layout)) {
      for (const point of points) {
        assert.ok(distanceToWorldRoute(point, level.route) >= 21);
      }
    }
  }
});

test("authored Forest Gate landmarks stay outside the route and interaction footprints", () => {
  const routeRadius = getWorldVisualTheme(CLASSIC_CAMPAIGN_LEVEL.id).routeWidths[0] / 2;
  const reserved = [...CLASSIC_CAMPAIGN_LEVEL.buildPads, ...CLASSIC_CAMPAIGN_LEVEL.heroAnchors];
  for (const landmark of FOREST_GATE_LANDMARKS) {
    assert.ok(distanceToWorldRoute(landmark, CLASSIC_CAMPAIGN_LEVEL.route) >= routeRadius + landmark.radius);
    for (const point of reserved) {
      assert.ok(Math.hypot(landmark.x - point.x, landmark.y - point.y) >= landmark.radius + 20);
    }
  }
});

test("Northern Pass landmarks adapt to the route without covering interaction points", () => {
  const level = NORTHERN_PASS_LEVEL;
  const reserved = [...level.buildPads, ...level.heroAnchors];
  const theme = getWorldVisualTheme(level.id);
  const layout = createWorldDecorationLayout(theme, level.route, level.width, level.height, reserved);
  const landmarks = createNorthernLandmarkLayout(level.route, level.width, level.height, layout.clearings);
  const repeated = createNorthernLandmarkLayout(level.route, level.width, level.height, layout.clearings);

  assert.deepEqual(landmarks, repeated);
  assert.ok(distanceToWorldRoute(landmarks.caravan, level.route) >= 48 - 1e-9);
  for (const point of reserved) {
    assert.ok(Math.hypot(landmarks.caravan.x - point.x, landmarks.caravan.y - point.y) >= 50 - 1e-9);
  }
  assert.ok(distanceToWorldRoute(landmarks.iceBridge, level.route) < 1e-9);
  assert.ok(landmarks.iceBridge.length >= 54 && landmarks.iceBridge.length <= 104);
  assert.ok(Number.isFinite(landmarks.iceBridge.rotation));
});

test("world rendering stays code-native and uses a bounded ambient animation budget", () => {
  assert.doesNotMatch(worldArtSource, /\.load\.(?:image|spritesheet|atlas)|new Image\(|\.png|\.webp|\.jpg/);
  assert.doesNotMatch(northernWorldArtSource, /\.load\.(?:image|spritesheet|atlas)|new Image\(|\.png|\.webp|\.jpg/);
  assert.match(worldArtSource, /createWorldDecorationLayout\(theme, route, width, height, reservedPoints\)/);
  assert.match(worldArtSource, /drawNorthernIceBridgeUnderlay\(scene, northernLandmarks\.iceBridge, theme\)/);
  assert.match(worldArtSource, /drawBrokenCaravan\(scene, northernLandmarks\.caravan\)/);
  assert.match(worldArtSource, /drawNorthernCitadel\(scene, route\[route\.length - 1\], height, theme\)/);
  assert.match(worldArtSource, /for \(const fireflyPoint of layout\.fireflies\)/);
  assert.match(northernWorldArtSource, /layout\.fireflies\.map\(\(point, index\) =>/);
  assert.match(northernWorldArtSource, /drawNorthernEntrance/);
  assert.match(northernWorldArtSource, /drawNorthernMountainFrame/);
  assert.match(worldArtSource, /profile\.snowAlpha/);
  assert.match(worldArtSource, /profile\.auroraAlpha/);
  assert.doesNotMatch(worldArtSource, /Shader|WebGLPipeline|postFX/);
  assert.doesNotMatch(northernWorldArtSource, /Shader|WebGLPipeline|postFX/);
});

test("the map polish does not change gameplay geometry or touch targets", () => {
  assert.match(worldArtSource, /route: ROUTE_POINTS/);
  assert.match(sceneSource, /this\.level\.buildPads\.forEach\(\(point, padId\) =>/);
  assert.match(sceneSource, /this\.add\.zone\(point\.x, point\.y, BUILD_PAD_HIT_SIZE, BUILD_PAD_HIT_SIZE\)/);
  assert.match(sceneSource, /foundation\.fillStyle[\s\S]*view\.ring\.setFillStyle\(selected \? 0x57472b/);
});

function assertPointsClear(points, routeClearance, reservedClearance, reserved) {
  for (const point of points) {
    assert.ok(distanceToWorldRoute(point, ROUTE_POINTS) >= routeClearance - 1e-9);
    for (const target of reserved) {
      assert.ok(Math.hypot(point.x - target.x, point.y - target.y) >= reservedClearance - 1e-9);
    }
  }
}

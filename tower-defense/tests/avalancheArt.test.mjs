import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  NORTHERN_PASS_BUILD_PADS,
  NORTHERN_PASS_HERO_ANCHORS,
  NORTHERN_PASS_ROUTE_VARIANTS,
} from "../src/game/northernPassContent.ts";

import {
  getAvalancheActVisualProfile,
  getAvalancheZoneVisualProfile,
  sampleAvalancheRouteSegment,
  selectAvalancheMarkerPoint,
} from "../src/rendering/avalancheVisuals.ts";

const artSource = readFileSync(new URL("../src/rendering/avalancheArt.ts", import.meta.url), "utf8");

test("avalanche zones remain readable without relying on color alone", () => {
  const available = getAvalancheZoneVisualProfile("available");
  const armed = getAvalancheZoneVisualProfile("armed");
  const spent = getAvalancheZoneVisualProfile("spent");

  assert.ok(Object.isFrozen(available));
  assert.ok(Object.isFrozen(armed));
  assert.ok(Object.isFrozen(spent));
  assert.notEqual(available.marker, armed.marker);
  assert.ok(armed.pulseAlpha > available.pulseAlpha);
  assert.equal(spent.pulseAlpha, 0);
  assert.ok(spent.rubbleAlpha > armed.rubbleAlpha);
  assert.match(artSource, /state === "spent"\) drawSpentMark/);
  assert.match(artSource, /else drawAvalancheChevrons/);
});

test("the three acts give the active route visibly different avalanche terrain", () => {
  const acts = [1, 2, 3].map(getAvalancheActVisualProfile);
  assert.ok(acts.every(Object.isFrozen));
  assert.equal(new Set(acts.map(({ route }) => route)).size, 3);
  assert.ok(acts[1].routeAlpha > acts[0].routeAlpha);
  assert.notEqual(acts[2].accent, acts[1].accent);
  assert.match(artSource, /setAvalancheZoneAct\(art: AvalancheZoneArt, act: CampaignAct\)/);
});

test("avalanche interaction and collapse VFX stay touch-safe and bounded", () => {
  assert.match(artSource, /AVALANCHE_ZONE_HIT_SIZE = 78/);
  assert.match(artSource, /setData\("avalancheZoneState", state\)/);
  assert.match(artSource, /Array\.from\(\{ length: 12 \}/);
  assert.match(artSource, /burst\.destroy\(true\)/);
  assert.doesNotMatch(artSource, /\.load\.(?:image|spritesheet|atlas)|new Image\(|\.png|\.webp|\.jpg/);
  assert.doesNotMatch(artSource, /Shader|WebGLPipeline|postFX/);
});

test("the forecast shows its full route section and keeps the tap marker clear", () => {
  const zones = [[0, 0.36], [0.36, 0.7], [0.7, 1]];
  const reserved = [...NORTHERN_PASS_BUILD_PADS, ...NORTHERN_PASS_HERO_ANCHORS];
  for (const route of Object.values(NORTHERN_PASS_ROUTE_VARIANTS)) {
    for (const [startRatio, endRatio] of zones) {
      const samples = sampleAvalancheRouteSegment(route, startRatio, endRatio);
      assert.ok(samples.length >= 10);
      const marker = selectAvalancheMarkerPoint(route, startRatio, endRatio, reserved, 390, 552);
      const nearestInteraction = Math.min(...reserved.map((point) => (
        Math.hypot(marker.x - point.x, marker.y - point.y)
      )));
      assert.ok(nearestInteraction >= 70, `marker clearance ${nearestInteraction.toFixed(1)}px is too small`);
      assert.ok(marker.x >= 39 && marker.x <= 351 && marker.y >= 39 && marker.y <= 513);
    }
  }
});

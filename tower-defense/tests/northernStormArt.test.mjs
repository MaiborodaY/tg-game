import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getNorthernStormVisualProfile } from "../src/rendering/northernStormVisuals.ts";

const source = readFileSync(new URL("../src/rendering/northernStormArt.ts", import.meta.url), "utf8");

test("storm sectors have distinct calm, threatened, and protected visual language", () => {
  const calm = getNorthernStormVisualProfile("calm");
  const threatened = getNorthernStormVisualProfile("threatened");
  const protectedState = getNorthernStormVisualProfile("protected");
  assert.ok([calm, threatened, protectedState].every(Object.isFrozen));
  assert.equal(new Set([calm.route, threatened.route, protectedState.route]).size, 3);
  assert.equal(new Set([calm.badge, threatened.badge, protectedState.badge]).size, 3);
  assert.ok(threatened.routeAlpha > calm.routeAlpha * 5);
  assert.ok(protectedState.edgeAlpha > threatened.edgeAlpha);
});

test("storm rendering follows route geometry with a bounded object and tween budget", () => {
  assert.match(source, /sampleSectorPoints\(path, sector\.startRatio, sector\.endRatio\)/);
  assert.match(source, /Math\.ceil\(\(end - start\) \/ 18\)/);
  assert.match(source, /setData\("stormState", state\)/);
  assert.match(source, /drawThreatenedMark/);
  assert.match(source, /drawProtectedMark/);
  assert.equal((source.match(/scene\.tweens\.add\(/g) ?? []).length, 1);
  assert.doesNotMatch(source, /\.load\.(?:image|spritesheet|atlas)|\.png|\.webp|\.jpg|Shader|postFX/);
});

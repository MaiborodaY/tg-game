import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  SIGNAL_FIRE_RADIUS,
  getSignalFireVisualProfile,
} from "../src/rendering/signalFireVisuals.ts";

const source = readFileSync(new URL("../src/rendering/signalFireArt.ts", import.meta.url), "utf8");

test("signal fires expose a stable warm-zone radius and five immutable visual states", () => {
  assert.equal(SIGNAL_FIRE_RADIUS, 124);
  assert.ok(SIGNAL_FIRE_RADIUS >= 118 && SIGNAL_FIRE_RADIUS <= 130);

  const idle = getSignalFireVisualProfile("idle");
  const available = getSignalFireVisualProfile("available");
  const active = getSignalFireVisualProfile("active");
  const protectedState = getSignalFireVisualProfile("protected");
  const threatened = getSignalFireVisualProfile("threatened");
  assert.ok([idle, available, active, protectedState, threatened].every(Object.isFrozen));
  assert.equal(new Set([idle.zone, available.zone, active.zone, protectedState.zone, threatened.zone]).size, 5);
  assert.ok(idle.flameAlpha < available.flameAlpha && available.flameAlpha < active.flameAlpha);
  assert.ok(idle.zoneStrokeAlpha < available.zoneStrokeAlpha && available.zoneStrokeAlpha < active.zoneStrokeAlpha);
  assert.ok(active.zoneAlpha > available.zoneAlpha * 2);
  assert.ok(protectedState.zoneAlpha > active.zoneAlpha);
  assert.ok(threatened.zoneStrokeAlpha > idle.zoneStrokeAlpha * 3);
  assert.ok(available.pointerAlpha > active.pointerAlpha);
});

test("signal fire art stays code-native, bounded, and state-driven", () => {
  assert.match(source, /createSignalFireArt\(/);
  assert.match(source, /setSignalFireState\(art, active \? "active" : "idle"\)/);
  assert.match(source, /setSignalFireState\(art: SignalFireArt, state: SignalFireState\)/);
  assert.match(source, /setData\("signalFireState", state\)/);
  assert.match(source, /choiceRing/);
  assert.match(source, /pointer/);
  assert.match(source, /targets: \[halo, flame\]/);
  assert.doesNotMatch(source, /\.load\.(?:image|spritesheet|atlas)|\.png|\.webp|\.jpg|Shader|postFX/);
  assert.equal((source.match(/scene\.tweens\.add\(/g) ?? []).length, 1);
});

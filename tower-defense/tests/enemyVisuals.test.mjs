import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ENEMY_DEFINITIONS, ENEMY_PREVIEW_ORDER } from "../src/game/config.ts";
import {
  createEnemyMotionPose,
  ENEMY_VISUAL_PROFILES,
  sampleEnemyMotion,
} from "../src/rendering/enemyVisuals.ts";

const enemyTypes = Object.keys(ENEMY_DEFINITIONS);

test("enemy visual profiles exhaustively cover every gameplay enemy", () => {
  assert.deepEqual(Object.keys(ENEMY_VISUAL_PROFILES), enemyTypes);
  assert.deepEqual([...ENEMY_PREVIEW_ORDER].sort(), [...enemyTypes].sort());
  assert.equal(new Set(ENEMY_PREVIEW_ORDER).size, enemyTypes.length);

  for (const type of enemyTypes) {
    const visual = ENEMY_VISUAL_PROFILES[type];
    assert.ok(visual.shadowWidth >= 28);
    assert.ok(visual.healthBarWidth >= 30);
    assert.ok(visual.healthBarY <= -29);
    assert.ok(visual.statusRadius >= 18);
  }
  assert.ok(ENEMY_VISUAL_PROFILES.boss.shadowWidth > ENEMY_VISUAL_PROFILES.brute.shadowWidth);
  assert.ok(ENEMY_VISUAL_PROFILES.titan.healthBarWidth > ENEMY_VISUAL_PROFILES.boss.healthBarWidth);
});

test("enemy motion is deterministic, bounded, and stops walking while stunned", () => {
  for (const type of enemyTypes) {
    const first = sampleEnemyMotion(type, 12_345, 278.4, 17, true, type === "boss", createEnemyMotionPose());
    const repeated = sampleEnemyMotion(type, 12_345, 278.4, 17, true, type === "boss", createEnemyMotionPose());
    assert.deepEqual(first, repeated);
    for (const value of Object.values(first)) assert.equal(Number.isFinite(value), true);
    assert.ok(first.bodyScaleX > 0.9 && first.bodyScaleX < 1.1);
    assert.ok(first.bodyScaleY > 0.9 && first.bodyScaleY < 1.1);
    assert.ok(first.glowAlpha >= 0.68 && first.glowAlpha <= 0.96);

    const stopped = sampleEnemyMotion(type, 12_345, 278.4, 17, false, false, createEnemyMotionPose());
    assert.equal(stopped.leftFootLift, 0);
    assert.equal(stopped.rightFootLift, 0);
    assert.ok(Math.abs(stopped.limbSwing) <= ENEMY_VISUAL_PROFILES[type].limbSwing * 0.12 + Number.EPSILON);
  }
});

test("wave preview uses accessible enemy silhouettes instead of geometric text glyphs", () => {
  const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  const config = readFileSync(new URL("../src/game/config.ts", import.meta.url), "utf8");

  assert.match(main, /chip\.setAttribute\("aria-label", `\$\{enemyName\(enemy\.type\)\}: \$\{enemy\.count\}`\)/);
  assert.match(main, /glyph\.setAttribute\("aria-hidden", "true"\)/);
  assert.doesNotMatch(main, /ENEMY_DEFINITIONS\[type\]\.glyph/);
  assert.doesNotMatch(config, /glyph:\s*["']/);
  for (const type of enemyTypes) {
    assert.match(css, new RegExp(`\\.enemy-glyph\\.${type}::before`));
  }
});

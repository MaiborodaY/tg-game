import assert from "node:assert/strict";
import test from "node:test";

import {
  applyControlResistance,
  crossedSummonThresholds,
  isEnemyAbilityReady,
  mergeBurnEffect,
  mergeSlowEffect,
  selectHealingTargets,
} from "../src/game/enemyAbilities.ts";

test("control resistance weakens both slow strength and duration", () => {
  assert.deepEqual(applyControlResistance(0.5, 2_000, 0), { slowFactor: 0.5, durationMs: 2_000 });
  const resistant = applyControlResistance(0.5, 2_000, 0.7);
  assert.ok(resistant.slowFactor > 0.8);
  assert.ok(resistant.durationMs < 1_000);
});

test("stun blocks a shaman cast until control expires", () => {
  assert.equal(isEnemyAbilityReady(2_000, 2_400, 1_500), false);
  assert.equal(isEnemyAbilityReady(2_400, 2_400, 1_500), true);
  assert.equal(isEnemyAbilityReady(1_400, 1_000, 1_500), false);
});

test("shamans heal the two most wounded eligible allies in range", () => {
  const source = { id: 1, x: 0, y: 0 };
  const candidates = [
    candidate(2, "raider", 10, 0, 80, 100),
    candidate(3, "brute", 20, 0, 20, 100),
    candidate(4, "warden", 30, 0, 40, 100),
    candidate(5, "shaman", 5, 0, 1, 100),
    candidate(6, "raider", 200, 0, 1, 100),
  ];
  assert.deepEqual(selectHealingTargets(source, candidates, 50).map(({ id }) => id), [3, 4]);
});

test("titan summon thresholds trigger once even when one hit crosses several", () => {
  const thresholds = [0.75, 0.5, 0.25];
  assert.deepEqual(crossedSummonThresholds(0.8, 0.2, thresholds, new Set()), thresholds);
  assert.deepEqual(crossedSummonThresholds(0.8, 0.2, thresholds, new Set([0.75, 0.5])), [0.25]);
});

test("weaker effects cannot extend mastery strength indefinitely", () => {
  const strongSlow = mergeSlowEffect(
    { factor: 1, untilMs: 0 },
    { factor: 0.52, durationMs: 2_200 },
    1_000,
  );
  assert.deepEqual(mergeSlowEffect(strongSlow, { factor: 0.62, durationMs: 1_900 }, 2_000), strongSlow);
  assert.deepEqual(
    mergeSlowEffect(strongSlow, { factor: 0.62, durationMs: 1_900 }, 3_201),
    { factor: 0.62, untilMs: 5_101 },
  );

  const strongBurn = mergeBurnEffect(
    { damagePerSecond: 0, untilMs: 0 },
    { damagePerSecond: 13, durationMs: 2_400 },
    1_000,
  );
  assert.deepEqual(mergeBurnEffect(strongBurn, { damagePerSecond: 4, durationMs: 2_400 }, 2_000), strongBurn);
});

function candidate(id, type, x, y, hp, maxHp) {
  return { id, type, x, y, hp, maxHp, dead: false };
}

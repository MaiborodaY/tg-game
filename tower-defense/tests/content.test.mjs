import assert from "node:assert/strict";
import test from "node:test";

import { BUILD_PADS, ROUTE_POINTS } from "../src/game/config.ts";
import {
  CAMPAIGN_MODE_ID,
  CAMPAIGN_RULESET,
  CLASSIC_CAMPAIGN_LEVEL,
  CLASSIC_CAMPAIGN_LEVEL_ID,
  CONTENT_CATALOG,
  CONTENT_VERSION,
  ENDLESS_MODE_ID,
  ENDLESS_RULESET,
  MAX_ENDLESS_WAVE,
  NORTHERN_PASS_LEVEL,
  NORTHERN_PASS_LEVEL_ID,
  assertValidContentCatalog,
  createClassicCampaignWave,
  getLevelDefinition,
  getModeRuleset,
  validateContentCatalog,
} from "../src/game/content.ts";
import { createWavePlan } from "../src/game/waves.ts";

test("content catalog is runtime-valid, immutable, and addressable by stable ids", () => {
  assert.equal(CONTENT_VERSION, 2);
  assert.deepEqual(validateContentCatalog(CONTENT_CATALOG), []);
  assert.doesNotThrow(() => assertValidContentCatalog(CONTENT_CATALOG));
  assert.equal(getLevelDefinition(CLASSIC_CAMPAIGN_LEVEL_ID), CLASSIC_CAMPAIGN_LEVEL);
  assert.equal(getLevelDefinition(NORTHERN_PASS_LEVEL_ID), NORTHERN_PASS_LEVEL);
  assert.equal(getModeRuleset(CAMPAIGN_MODE_ID), CAMPAIGN_RULESET);
  assert.equal(getModeRuleset(ENDLESS_MODE_ID), ENDLESS_RULESET);
  assert.equal(getLevelDefinition("missing"), null);
  assert.equal(getLevelDefinition("__proto__"), null);
  assert.equal(getModeRuleset("toString"), null);
  assert.ok(Object.isFrozen(CONTENT_CATALOG));
  assert.ok(Object.isFrozen(CONTENT_CATALOG.levels));
  assert.ok(Object.isFrozen(CONTENT_CATALOG.modes));
});

test("classic level adapts the existing route, pads, and all campaign wave semantics", () => {
  assert.deepEqual(CLASSIC_CAMPAIGN_LEVEL.route, ROUTE_POINTS);
  assert.deepEqual(CLASSIC_CAMPAIGN_LEVEL.buildPads, BUILD_PADS);
  assert.notEqual(CLASSIC_CAMPAIGN_LEVEL.route, ROUTE_POINTS, "catalog owns an immutable geometry copy");
  assert.ok(Object.isFrozen(CLASSIC_CAMPAIGN_LEVEL.route[0]));
  assert.equal(CLASSIC_CAMPAIGN_LEVEL.waves.finalWave, 24);

  for (const wave of [1, 12, 24]) {
    assert.deepEqual(createClassicCampaignWave(wave), createWavePlan(wave));
    assert.deepEqual(CLASSIC_CAMPAIGN_LEVEL.waves.createWave(wave), createWavePlan(wave));
  }
  assert.throws(() => CLASSIC_CAMPAIGN_LEVEL.waves.createWave(0), RangeError);
  assert.throws(() => CLASSIC_CAMPAIGN_LEVEL.waves.createWave(25), RangeError);
});

test("northern pass is a distinct finite PvE level with its own difficulty curve", () => {
  assert.notDeepEqual(NORTHERN_PASS_LEVEL.route, CLASSIC_CAMPAIGN_LEVEL.route);
  assert.notDeepEqual(NORTHERN_PASS_LEVEL.buildPads, CLASSIC_CAMPAIGN_LEVEL.buildPads);
  assert.notEqual(NORTHERN_PASS_LEVEL.startingGold, CLASSIC_CAMPAIGN_LEVEL.startingGold);
  assert.notEqual(NORTHERN_PASS_LEVEL.startingLives, CLASSIC_CAMPAIGN_LEVEL.startingLives);
  assert.equal(NORTHERN_PASS_LEVEL.waves.finalWave, 18);

  const first = NORTHERN_PASS_LEVEL.waves.createWave(1);
  assert.notDeepEqual(first, createWavePlan(1));
  assert.ok(first.spawns[0].magicResistance > createWavePlan(1).spawns[0].magicResistance);
  assert.deepEqual([6, 12, 18].map((wave) => NORTHERN_PASS_LEVEL.waves.createWave(wave).hasBoss), [true, true, true]);
  assert.deepEqual(NORTHERN_PASS_LEVEL.waves.createWave(18), NORTHERN_PASS_LEVEL.waves.createWave(18));
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.spawns));
  assert.ok(first.spawns.every(Object.isFrozen));
});

test("every level exposes three immutable hero anchors clear of tower tap zones", () => {
  for (const level of Object.values(CONTENT_CATALOG.levels)) {
    assert.equal(level.heroAnchors.length, 3);
    assert.ok(Object.isFrozen(level.heroAnchors));
    assert.ok(level.heroAnchors.every(Object.isFrozen));
    for (const anchor of level.heroAnchors) {
      const closestPadDistance = Math.min(...level.buildPads.map((pad) => Math.hypot(anchor.x - pad.x, anchor.y - pad.y)));
      assert.ok(closestPadDistance >= 64, `${level.id} hero anchor overlaps a tower touch zone`);
    }
  }
});

test("campaign ruleset delegates waves and completion to the selected level", () => {
  assert.equal(CAMPAIGN_RULESET.getFinalWave(CLASSIC_CAMPAIGN_LEVEL), 24);
  assert.equal(CAMPAIGN_RULESET.getFinalWave(NORTHERN_PASS_LEVEL), 18);
  assert.equal(CAMPAIGN_RULESET.isComplete(NORTHERN_PASS_LEVEL, 17), false);
  assert.equal(CAMPAIGN_RULESET.isComplete(NORTHERN_PASS_LEVEL, 18), true);
  assert.equal(CAMPAIGN_RULESET.calculateScore(24), 72);
  assert.deepEqual(
    CAMPAIGN_RULESET.createWave(NORTHERN_PASS_LEVEL, 12),
    NORTHERN_PASS_LEVEL.waves.createWave(12),
  );
});

test("endless ruleset cycles level content with deterministic bounded escalation", () => {
  assert.equal(ENDLESS_RULESET.getFinalWave(CLASSIC_CAMPAIGN_LEVEL), null);
  assert.equal(ENDLESS_RULESET.isComplete(CLASSIC_CAMPAIGN_LEVEL, 10_000), false);
  assert.equal(ENDLESS_RULESET.isComplete(CLASSIC_CAMPAIGN_LEVEL, MAX_ENDLESS_WAVE), true);
  assert.equal(ENDLESS_RULESET.calculateScore(127), 127);

  const base = ENDLESS_RULESET.createWave(CLASSIC_CAMPAIGN_LEVEL, 1);
  const nextCycle = ENDLESS_RULESET.createWave(CLASSIC_CAMPAIGN_LEVEL, 25);
  const repeated = ENDLESS_RULESET.createWave(CLASSIC_CAMPAIGN_LEVEL, 25);
  assert.equal(nextCycle.wave, 25);
  assert.equal(nextCycle.spawns.length, base.spawns.length);
  assert.ok(nextCycle.spawns[0].maxHp > base.spawns[0].maxHp);
  assert.notEqual(nextCycle.spawns[0].id, base.spawns[0].id);
  assert.deepEqual(nextCycle, repeated);
  assert.ok(Object.isFrozen(nextCycle));
  assert.ok(Object.isFrozen(nextCycle.spawns));
  const totalHealth = (plan) => plan.spawns.reduce(
    (total, spawn) => total + spawn.maxHp * (1 + spawn.shieldRatio),
    0,
  );
  const finalBaseWave = ENDLESS_RULESET.createWave(CLASSIC_CAMPAIGN_LEVEL, 24);
  const finalSecondCycle = ENDLESS_RULESET.createWave(CLASSIC_CAMPAIGN_LEVEL, 48);
  const thirdCycleStart = ENDLESS_RULESET.createWave(CLASSIC_CAMPAIGN_LEVEL, 49);
  assert.ok(totalHealth(nextCycle) >= totalHealth(finalBaseWave) * 0.98);
  assert.ok(totalHealth(thirdCycleStart) >= totalHealth(finalSecondCycle) * 0.98);
  assert.throws(() => ENDLESS_RULESET.createWave(CLASSIC_CAMPAIGN_LEVEL, 0), RangeError);
  assert.throws(() => ENDLESS_RULESET.createWave(CLASSIC_CAMPAIGN_LEVEL, MAX_ENDLESS_WAVE + 1), RangeError);
});

test("runtime validation rejects malformed or mutable catalog entries", () => {
  const broken = {
    contentVersion: CONTENT_VERSION,
    levels: {
      wrongKey: { ...CLASSIC_CAMPAIGN_LEVEL, id: "broken id", route: [{ x: Number.NaN, y: 0 }] },
    },
    modes: CONTENT_CATALOG.modes,
  };
  const errors = validateContentCatalog(broken);
  assert.ok(errors.some((error) => error.includes("catalog must be frozen")));
  assert.ok(errors.some((error) => error.includes("stable lowercase identifier")));
  assert.ok(errors.some((error) => error.includes("route")));
  assert.throws(() => assertValidContentCatalog(broken), /Invalid Tower Defense content catalog/);
});

test("runtime validation executes wave adapters and rejects malformed spawn data", () => {
  const source = Object.freeze({
    ...CLASSIC_CAMPAIGN_LEVEL.waves,
    createWave: () => Object.freeze({
      ...createWavePlan(1),
      wave: 99,
      spawns: Object.freeze([
        Object.freeze({ ...createWavePlan(1).spawns[0], type: "unknown", maxHp: -1 }),
      ]),
    }),
  });
  const level = Object.freeze({ ...CLASSIC_CAMPAIGN_LEVEL, waves: source });
  const broken = Object.freeze({
    contentVersion: CONTENT_VERSION,
    levels: Object.freeze({ [CLASSIC_CAMPAIGN_LEVEL_ID]: level }),
    modes: CONTENT_CATALOG.modes,
  });

  const errors = validateContentCatalog(broken);
  assert.ok(errors.some((error) => error.includes("wave must equal")));
  assert.ok(errors.some((error) => error.includes("unknown type")));
  assert.ok(errors.some((error) => error.includes("positive maxHp")));
});

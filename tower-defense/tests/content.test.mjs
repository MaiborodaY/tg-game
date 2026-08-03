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
  LEGACY_NORTHERN_PASS_LEVEL_ID,
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
import {
  NORTHERN_PASS_BUILD_PADS,
  NORTHERN_PASS_FINAL_WAVE,
  NORTHERN_PASS_HERO_ANCHORS,
  NORTHERN_PASS_RAVINE_ROUTE,
  NORTHERN_PASS_PROGRESSION,
  NORTHERN_PASS_ROUTE,
  NORTHERN_PASS_ROUTE_VARIANTS,
  NORTHERN_PASS_SUMMIT_ROUTE,
  createNorthernPassMechanicPlan,
} from "../src/game/northernPassContent.ts";

test("content catalog is runtime-valid, immutable, and addressable by stable ids", () => {
  assert.equal(CONTENT_VERSION, 2);
  assert.deepEqual(validateContentCatalog(CONTENT_CATALOG), []);
  assert.doesNotThrow(() => assertValidContentCatalog(CONTENT_CATALOG));
  assert.equal(getLevelDefinition(CLASSIC_CAMPAIGN_LEVEL_ID), CLASSIC_CAMPAIGN_LEVEL);
  assert.equal(getLevelDefinition(NORTHERN_PASS_LEVEL_ID), NORTHERN_PASS_LEVEL);
  assert.equal(getLevelDefinition(LEGACY_NORTHERN_PASS_LEVEL_ID), null, "legacy v2 is rejected, not playable");
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

test("Northern Pass v3 owns an authored 24-wave campaign split into three eight-wave acts", () => {
  assert.notDeepEqual(NORTHERN_PASS_LEVEL.route, CLASSIC_CAMPAIGN_LEVEL.route);
  assert.notDeepEqual(NORTHERN_PASS_LEVEL.buildPads, CLASSIC_CAMPAIGN_LEVEL.buildPads);
  assert.equal(NORTHERN_PASS_LEVEL.startingGold, 190);
  assert.notEqual(NORTHERN_PASS_LEVEL.startingLives, CLASSIC_CAMPAIGN_LEVEL.startingLives);
  assert.equal(NORTHERN_PASS_LEVEL.waves.finalWave, NORTHERN_PASS_FINAL_WAVE);

  const first = NORTHERN_PASS_LEVEL.waves.createWave(1);
  assert.notDeepEqual(first, createWavePlan(1));
  assert.deepEqual([1, 8, 9, 16, 17, 24].map((wave) => NORTHERN_PASS_LEVEL.waves.createWave(wave).act), [1, 1, 2, 2, 3, 3]);
  assert.deepEqual([8, 16, 24].map((wave) => NORTHERN_PASS_LEVEL.waves.createWave(wave).hasBoss), [true, true, true]);
  assert.deepEqual(
    Array.from({ length: 24 }, (_, index) => index + 1).filter((wave) => NORTHERN_PASS_LEVEL.waves.createWave(wave).hasBoss),
    [8, 16, 24],
  );
  const allSpawns = Array.from({ length: 24 }, (_, index) => NORTHERN_PASS_LEVEL.waves.createWave(index + 1).spawns).flat();
  assert.ok(allSpawns.every((spawn) => ["standard", "snow-runner", "icebound"].includes(spawn.variant)));
  assert.ok(allSpawns.every((spawn) => Number.isFinite(spawn.frostArmorRatio)));
  assert.ok(allSpawns.some((spawn) => spawn.variant === "snow-runner"));
  assert.ok(allSpawns.some((spawn) => spawn.variant === "icebound" && spawn.frostArmorRatio > 0));
  assert.ok(allSpawns.filter((spawn) => spawn.variant !== "icebound").every((spawn) => spawn.frostArmorRatio === 0));
  const actThreeIcebound = Array.from({ length: 8 }, (_, index) => NORTHERN_PASS_LEVEL.waves.createWave(index + 17).spawns)
    .flat()
    .filter((spawn) => spawn.variant === "icebound");
  assert.ok(actThreeIcebound.length > 0);
  assert.ok(actThreeIcebound.every((spawn) => spawn.frostArmorRatio >= 0.64));
  const finalTitan = NORTHERN_PASS_LEVEL.waves.createWave(24).spawns.find((spawn) => spawn.type === "titan");
  assert.equal(finalTitan?.frostArmorRatio, 0.72);
  assert.equal(finalTitan?.leakDamage, 11);
  assert.deepEqual(NORTHERN_PASS_LEVEL.waves.createWave(24), NORTHERN_PASS_LEVEL.waves.createWave(24));
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.spawns));
  assert.ok(first.spawns.every(Object.isFrozen));
});

test("Northern Pass v3 forecasts one avalanche zone and changes route deterministically by act", () => {
  const plans = Array.from({ length: 24 }, (_, index) => createNorthernPassMechanicPlan(index + 1));
  assert.deepEqual([plans[0].routeVariantId, plans[8].routeVariantId, plans[16].routeVariantId], ["ridge", "ravine", "summit"]);
  assert.deepEqual(plans.slice(0, 8).map((plan) => plan.dangerZoneId), [
    "upper", "upper", "middle", "lower", "upper", "middle", "lower", "middle",
  ]);
  assert.ok(plans.every((plan) => ["upper", "middle", "lower"].includes(plan.dangerZoneId)));
  assert.deepEqual(plans.map((plan) => plan.avalancheCharges).filter((charges) => charges === 2).length, 3);
  assert.deepEqual([plans[7].avalancheCharges, plans[15].avalancheCharges, plans[23].avalancheCharges], [2, 2, 2]);
  assert.ok(plans.every(Object.isFrozen));
  assert.ok(plans.every((plan) => Object.isFrozen(plan.routePoints) && Object.isFrozen(plan.zones)));
  assert.deepEqual(createNorthernPassMechanicPlan(24), createNorthernPassMechanicPlan(24));

  const actHealth = [0, 1, 2].map((actIndex) => Array.from({ length: 8 }, (_, offset) => (
    NORTHERN_PASS_LEVEL.waves.createWave(actIndex * 8 + offset + 1).spawns
      .reduce((total, spawn) => total + spawn.maxHp * (1 + spawn.frostArmorRatio), 0)
  )).reduce((sum, value) => sum + value, 0));
  assert.ok(actHealth[1] > actHealth[0] * 4);
  assert.ok(actHealth[2] > actHealth[1] * 2.5);
});

test("mixed northern formations send bosses with an escort instead of as a final cleanup target", () => {
  for (const waveValue of [8, 16, 24]) {
    const wave = NORTHERN_PASS_LEVEL.waves.createWave(waveValue);
    const bossIndex = wave.spawns.findIndex((spawn) => spawn.type === "boss" || spawn.type === "titan");
    assert.ok(bossIndex >= 0 && bossIndex < wave.spawns.length / 3, `wave ${waveValue} boss spawned too late`);
    assert.ok(wave.spawns.slice(bossIndex + 1).length >= 5, `wave ${waveValue} boss has no escort`);
  }
});

test("Northern Pass route variants materially shorten and reshape the road between acts", () => {
  assert.deepEqual(NORTHERN_PASS_LEVEL.route, NORTHERN_PASS_ROUTE);
  assert.deepEqual(NORTHERN_PASS_LEVEL.buildPads, NORTHERN_PASS_BUILD_PADS);
  assert.deepEqual(NORTHERN_PASS_LEVEL.heroAnchors, NORTHERN_PASS_HERO_ANCHORS);
  assert.deepEqual(NORTHERN_PASS_LEVEL.signalFires, []);
  assert.equal(NORTHERN_PASS_LEVEL.buildPads.length, 13);
  assert.equal(NORTHERN_PASS_LEVEL.heroAnchors.length, 3);
  assert.ok(NORTHERN_PASS_LEVEL.route.some((point, index, route) => index > 0 && point.x !== route[index - 1].x && point.y !== route[index - 1].y));

  const lengths = Object.fromEntries(Object.entries(NORTHERN_PASS_ROUTE_VARIANTS)
    .map(([id, route]) => [id, routeLength(route)]));
  assert.ok(lengths.ravine < lengths.ridge * 0.96, "Act II must be more than a cosmetic route nudge");
  assert.ok(lengths.summit < lengths.ravine * 0.78, "Act III must materially reduce firing time");
  assert.deepEqual(NORTHERN_PASS_RAVINE_ROUTE.slice(0, 3), NORTHERN_PASS_ROUTE.slice(0, 3));
  assert.deepEqual(NORTHERN_PASS_SUMMIT_ROUTE.slice(0, 3), NORTHERN_PASS_ROUTE.slice(0, 3));
  assert.deepEqual(NORTHERN_PASS_RAVINE_ROUTE.slice(-3), NORTHERN_PASS_ROUTE.slice(-3));
  assert.deepEqual(NORTHERN_PASS_SUMMIT_ROUTE.slice(-3), NORTHERN_PASS_ROUTE.slice(-3));
  assert.ok(maxNearestVertexDistance(NORTHERN_PASS_ROUTE, NORTHERN_PASS_SUMMIT_ROUTE) >= 90);

  for (const [variantId, route] of Object.entries(NORTHERN_PASS_ROUTE_VARIANTS)) {
    for (const bridgePoint of [{ x: 149, y: 280 }, { x: 201, y: 280 }, { x: 253, y: 280 }]) {
      assert.ok(
        minimumDistanceToRoute(bridgePoint, route) <= 2,
        `${variantId} route detaches from the authored ice bridge`,
      );
    }
    for (const [padId, pad] of NORTHERN_PASS_BUILD_PADS.entries()) {
      assert.ok(
        minimumDistanceToRoute(pad, route) >= 40,
        `${variantId} route crosses tower pad ${padId}`,
      );
    }
    for (const [anchorId, anchor] of NORTHERN_PASS_HERO_ANCHORS.entries()) {
      assert.ok(
        minimumDistanceToRoute(anchor, route) >= 40,
        `${variantId} route crosses hero anchor ${anchorId}`,
      );
    }
  }

  for (const pad of NORTHERN_PASS_LEVEL.buildPads) {
    const nearestOtherPad = Math.min(...NORTHERN_PASS_LEVEL.buildPads
      .filter((candidate) => candidate !== pad)
      .map((candidate) => Math.hypot(candidate.x - pad.x, candidate.y - pad.y)));
    assert.ok(nearestOtherPad >= 70, "tower pads must keep independent tap targets");
  }
});

test("each level owns immutable progression milestones matching its campaign length", () => {
  assert.deepEqual(CLASSIC_CAMPAIGN_LEVEL.progression, {
    heroUpgradeWaves: [4, 12],
    masteryWave: 12,
    awakeningWave: 20,
    actSize: 8,
  });
  assert.deepEqual(NORTHERN_PASS_LEVEL.progression, NORTHERN_PASS_PROGRESSION);
  assert.deepEqual(NORTHERN_PASS_LEVEL.progression, {
    heroUpgradeWaves: [4, 12],
    masteryWave: 14,
    awakeningWave: 20,
    actSize: 8,
  });
  for (const level of Object.values(CONTENT_CATALOG.levels)) {
    assert.equal(level.progression.actSize * 3, level.waves.finalWave);
    assert.ok(Object.isFrozen(level.progression));
    assert.ok(Object.isFrozen(level.progression.heroUpgradeWaves));
  }
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
  assert.equal(CAMPAIGN_RULESET.getFinalWave(NORTHERN_PASS_LEVEL), 24);
  assert.equal(CAMPAIGN_RULESET.isComplete(NORTHERN_PASS_LEVEL, 23), false);
  assert.equal(CAMPAIGN_RULESET.isComplete(NORTHERN_PASS_LEVEL, 24), true);
  assert.equal(CAMPAIGN_RULESET.calculateScore(24), 72);
  assert.deepEqual(
    CAMPAIGN_RULESET.createWave(NORTHERN_PASS_LEVEL, 16),
    NORTHERN_PASS_LEVEL.waves.createWave(16),
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
  const totalReward = (plan) => plan.clearBonus + plan.spawns.reduce(
    (total, spawn) => total + spawn.reward,
    0,
  );
  const finalBaseWave = ENDLESS_RULESET.createWave(CLASSIC_CAMPAIGN_LEVEL, 24);
  const finalSecondCycle = ENDLESS_RULESET.createWave(CLASSIC_CAMPAIGN_LEVEL, 48);
  const thirdCycleStart = ENDLESS_RULESET.createWave(CLASSIC_CAMPAIGN_LEVEL, 49);
  assert.ok(totalHealth(nextCycle) >= totalHealth(finalBaseWave) * 0.98);
  assert.ok(totalHealth(thirdCycleStart) >= totalHealth(finalSecondCycle) * 0.98);
  assert.ok(totalReward(nextCycle) >= totalReward(finalBaseWave));
  assert.ok(totalReward(thirdCycleStart) >= totalReward(finalSecondCycle));
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

function routeLength(route) {
  return route.slice(1).reduce((total, point, index) => (
    total + Math.hypot(point.x - route[index].x, point.y - route[index].y)
  ), 0);
}

function maxNearestVertexDistance(route, comparison) {
  return Math.max(...route.map((point) => Math.min(...comparison.map((candidate) => (
    Math.hypot(point.x - candidate.x, point.y - candidate.y)
  )))));
}

function minimumDistanceToRoute(point, route) {
  return Math.min(...route.slice(1).map((end, index) => pointToSegmentDistance(point, route[index], end)));
}

function pointToSegmentDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const denominator = dx * dx + dy * dy;
  const projection = denominator > 0
    ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / denominator))
    : 0;
  return Math.hypot(
    point.x - (start.x + projection * dx),
    point.y - (start.y + projection * dy),
  );
}

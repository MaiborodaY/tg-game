import assert from "node:assert/strict";
import test from "node:test";

import {
  aggregateWaveEnemies,
  deriveNorthernAvalanchePreview,
  deriveResultAdvice,
  recommendWaveTowers,
} from "../src/game/gameplayIntel.ts";

function spawn(type, overrides = {}) {
  return Object.freeze({
    id: overrides.id ?? 1,
    type,
    variant: overrides.variant ?? "standard",
    atMs: overrides.atMs ?? 0,
    maxHp: overrides.maxHp ?? 100,
    speed: overrides.speed ?? 50,
    reward: overrides.reward ?? 10,
    leakDamage: overrides.leakDamage ?? 1,
    physicalResistance: overrides.physicalResistance ?? 0,
    magicResistance: overrides.magicResistance ?? 0,
    shieldRatio: overrides.shieldRatio ?? 0,
    frostArmorRatio: overrides.frostArmorRatio ?? 0,
    controlResistance: overrides.controlResistance ?? 0,
    healingRadius: overrides.healingRadius ?? 0,
    healingRatio: overrides.healingRatio ?? 0,
    elite: overrides.elite ?? false,
    bossTier: overrides.bossTier ?? 1,
    summonThresholds: overrides.summonThresholds ?? Object.freeze([]),
    summonCount: overrides.summonCount ?? 0,
  });
}

test("Northern Pass preview follows live avalanche charges without changing the authored wave", () => {
  const northernPlan = Object.freeze({
    ...plan([spawn("raider")]),
    northernPass: Object.freeze({
      avalancheCharges: 2,
      dangerZoneId: "upper",
      routeVariantId: "lower-outpost",
      routePoints: Object.freeze([]),
      zones: Object.freeze([]),
    }),
  });

  assert.deepEqual(deriveNorthernAvalanchePreview(northernPlan), { charges: 2, status: "ready" });
  assert.deepEqual(deriveNorthernAvalanchePreview(northernPlan, 1), { charges: 1, status: "ready" });
  assert.deepEqual(deriveNorthernAvalanchePreview(northernPlan, 0), { charges: 0, status: "spent" });
  assert.equal(deriveNorthernAvalanchePreview(plan([spawn("raider")]), 0), null);
});

function plan(spawns, overrides = {}) {
  return Object.freeze({
    wave: overrides.wave ?? 1,
    spawns: Object.freeze(spawns),
    clearBonus: overrides.clearBonus ?? 10,
    hasBoss: overrides.hasBoss ?? false,
    act: overrides.act ?? 1,
    threat: overrides.threat ?? 1,
  });
}

test("wave aggregation follows preview order and preserves exact spawn variants", () => {
  const wave = plan([
    spawn("shaman", { id: 1, maxHp: 88, speed: 43, leakDamage: 2, magicResistance: 0.27, healingRadius: 92, healingRatio: 0.035 }),
    spawn("swift", { id: 2, maxHp: 31, speed: 86, magicResistance: 0.08, controlResistance: 0.08 }),
    spawn("swift", { id: 3, maxHp: 31, speed: 86, magicResistance: 0.08, controlResistance: 0.08 }),
    spawn("swift", { id: 4, maxHp: 45, speed: 91.16, leakDamage: 2, physicalResistance: 0.06, magicResistance: 0.14, controlResistance: 0.2, shieldRatio: 0.12, elite: true }),
    spawn("boss", { id: 5, maxHp: 812, speed: 31, leakDamage: 5, physicalResistance: 0.18, magicResistance: 0.2, controlResistance: 0.48, shieldRatio: 0.15 }),
  ], { wave: 12, hasBoss: true, threat: 4 });

  const aggregated = aggregateWaveEnemies(wave);
  assert.deepEqual(aggregated.map(({ type }) => type), ["swift", "shaman", "boss"]);
  assert.deepEqual(aggregated[0], {
    type: "swift",
    count: 3,
    eliteCount: 1,
    variants: [
      {
        count: 2,
        variant: "standard",
        maxHp: 31,
        speed: 86,
        leakDamage: 1,
        physicalResistance: 0,
        magicResistance: 0.08,
        controlResistance: 0.08,
        shieldRatio: 0,
        frostArmorRatio: 0,
        healingRadius: 0,
        healingRatio: 0,
        elite: false,
      },
      {
        count: 1,
        variant: "standard",
        maxHp: 45,
        speed: 91.16,
        leakDamage: 2,
        physicalResistance: 0.06,
        magicResistance: 0.14,
        controlResistance: 0.2,
        shieldRatio: 0.12,
        frostArmorRatio: 0,
        healingRadius: 0,
        healingRatio: 0,
        elite: true,
      },
    ],
  });
  assert.equal(aggregated[1].variants[0].healingRadius, 92);
  assert.equal(aggregated[1].variants[0].healingRatio, 0.035);
  assert.ok(Object.isFrozen(aggregated));
  assert.ok(Object.isFrozen(aggregated[0].variants));
});

test("tower recommendations use actual speed, resistance, shield, healing, and elite data", () => {
  const fast = plan(Array.from({ length: 4 }, (_, id) => spawn("swift", { id, speed: 84 })));
  assert.deepEqual(recommendWaveTowers(fast), ["frost", "ranger"]);

  const armored = plan(Array.from({ length: 3 }, (_, id) => spawn("bulwark", {
    id,
    physicalResistance: 0.4,
    magicResistance: 0.1,
    shieldRatio: 0.35,
  })));
  assert.deepEqual(recommendWaveTowers(armored), ["storm", "ember"]);

  const support = plan([spawn("shaman", { magicResistance: 0.28, healingRadius: 92, healingRatio: 0.04 })]);
  assert.deepEqual(recommendWaveTowers(support), ["storm", "ranger"]);
  assert.deepEqual(recommendWaveTowers(support, 1), ["storm"]);
  assert.deepEqual(recommendWaveTowers(support, 0), []);

  const frostArmored = plan(Array.from({ length: 3 }, (_, id) => spawn("warden", {
    id,
    variant: "icebound",
    frostArmorRatio: 0.35,
  })));
  assert.equal(recommendWaveTowers(frostArmored)[0], "ember");
  assert.equal(aggregateWaveEnemies(frostArmored)[0].variants[0].frostArmorRatio, 0.35);
});

test("result advice returns only safe categories and a bounded tower shortlist", () => {
  const boss = plan([spawn("boss")], { hasBoss: true });
  const support = plan([spawn("shaman", { healingRadius: 80, healingRatio: 0.04 })]);
  const armor = plan([spawn("brute", { physicalResistance: 0.25 })]);
  const frostArmor = plan([spawn("warden", { frostArmorRatio: 0.3 })]);
  const swift = plan([spawn("swift", { speed: 80 })]);
  const control = plan(Array.from({ length: 10 }, (_, id) => spawn("raider", { id })));
  const mixed = plan([spawn("raider")]);

  assert.equal(deriveResultAdvice(boss, "defeat").category, "boss");
  assert.equal(deriveResultAdvice(boss, "defeat").recommendedTowers[0], "ranger");
  assert.equal(deriveResultAdvice(support, "defeat").category, "support");
  assert.equal(deriveResultAdvice(armor, "defeat").category, "armor");
  assert.equal(deriveResultAdvice(frostArmor, "defeat").category, "armor");
  assert.equal(deriveResultAdvice(swift, "defeat").category, "swift");
  assert.equal(deriveResultAdvice(control, "defeat").category, "control");
  assert.equal(deriveResultAdvice(mixed, "defeat").category, "mixed");
  assert.equal(deriveResultAdvice(boss, "victory").category, "victory");
  assert.equal(deriveResultAdvice(boss, "victory").recommendedTowers.length, 2);

  const safeCategories = new Set(["victory", "boss", "support", "control", "armor", "swift", "mixed"]);
  for (const candidate of [boss, support, armor, swift, control, mixed]) {
    const advice = deriveResultAdvice(candidate, "defeat");
    assert.ok(safeCategories.has(advice.category));
    assert.ok(advice.recommendedTowers.length <= 2);
    assert.ok(Object.isFrozen(advice));
    assert.ok(Object.isFrozen(advice.recommendedTowers));
  }
});

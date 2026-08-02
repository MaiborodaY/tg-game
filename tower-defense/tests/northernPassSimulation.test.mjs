import assert from "node:assert/strict";
import test from "node:test";

import { getHeroUpgradeWaveGate, isHeroAwakened } from "../src/game/heroes.ts";
import { NORTHERN_AVALANCHE_ZONES } from "../src/game/northernPassMechanics.ts";
import { GameSimulation } from "../src/game/simulation.ts";
import { createCampaignState } from "../src/game/state.ts";

function createFrostArmorRules({
  frostArmorRatio = 0.2,
  heroAwakeningWave = 20,
  variant = frostArmorRatio > 0 ? "icebound" : "standard",
  type = "raider",
  northernPass = null,
} = {}) {
  return Object.freeze({
    id: `northern-pass-v3:test:${frostArmorRatio}:${type}`,
    routePoints: Object.freeze([Object.freeze({ x: 0, y: 20 }), Object.freeze({ x: 120, y: 20 })]),
    buildPads: Object.freeze([]),
    heroAnchors: Object.freeze([
      Object.freeze({ x: 1_000, y: 1_000 }),
      Object.freeze({ x: 1_020, y: 1_000 }),
      Object.freeze({ x: 1_040, y: 1_000 }),
    ]),
    heroAwakeningWave,
    finalWave: null,
    isComplete: () => false,
    createWavePlan: (wave) => Object.freeze({
      wave,
      spawns: Object.freeze([Object.freeze({
        id: wave * 1_000,
        type,
        variant,
        atMs: 0,
        maxHp: 1_000,
        speed: 0.001,
        reward: 5,
        leakDamage: 1,
        physicalResistance: 0,
        magicResistance: 0,
        shieldRatio: 0,
        frostArmorRatio,
        controlResistance: 0,
        healingRadius: type === "shaman" ? 100 : 0,
        healingRatio: type === "shaman" ? 0.1 : 0,
        elite: false,
        bossTier: 1,
        summonThresholds: Object.freeze([]),
        summonCount: 0,
      })]),
      clearBonus: 0,
      hasBoss: type === "boss" || type === "titan",
      act: 1,
      threat: 1,
      ...(northernPass ? { northernPass } : {}),
    }),
    getBossRepair: () => 0,
    getWaveHealthMultiplier: () => 1,
  });
}

function avalanchePlan({ dangerZoneId = "upper", charges = 1 } = {}) {
  return Object.freeze({
    routeVariantId: "ridge",
    routePoints: Object.freeze([Object.freeze({ x: 0, y: 20 }), Object.freeze({ x: 120, y: 20 })]),
    avalancheCharges: charges,
    zones: NORTHERN_AVALANCHE_ZONES,
    dangerZoneId,
  });
}

function createLiveEnemy(options = {}) {
  const simulation = new GameSimulation(createCampaignState(), createFrostArmorRules(options));
  assert.equal(simulation.startWave(), true);
  for (let index = 0; index < 20 && simulation.readView().enemies.length === 0; index += 1) simulation.advance(250);
  assert.equal(simulation.readView().phase, "wave");
  assert.equal(simulation.readView().enemies.length, 1);
  simulation.drainEvents();
  return simulation;
}

function dealDirectDamage(simulation, amount, kind) {
  const enemy = simulation.readView().enemies[0];
  assert.ok(enemy);
  // This runtime call isolates the canonical armor-resolution path from tower timing.
  simulation.damageEnemy(enemy, amount, kind, true);
  return simulation.readView().enemies[0];
}

test("frost armor absorbs ordinary damage before health", () => {
  const enemy = dealDirectDamage(createLiveEnemy(), 100, "physical");
  assert.equal(enemy.maxFrostArmor, 200);
  assert.equal(enemy.frostArmor, 100);
  assert.equal(enemy.hp, 1_000);
  assert.equal("insideWarmZone" in enemy, false);
});

test("fire strips frost armor faster than ordinary damage", () => {
  const afterPhysical = dealDirectDamage(createLiveEnemy(), 100, "physical");
  const afterFire = dealDirectDamage(createLiveEnemy(), 100, "fire");
  assert.equal(afterPhysical.frostArmor, 100);
  assert.equal(afterFire.frostArmor, 30);
  assert.ok(afterFire.frostArmor < afterPhysical.frostArmor);
});

test("breaking frost armor emits exactly one armor-break event", () => {
  const simulation = createLiveEnemy();
  dealDirectDamage(simulation, 200, "physical");
  dealDirectDamage(simulation, 20, "physical");
  assert.equal(simulation.drainEvents().filter((event) => event.type === "frost_armor_broken").length, 1);
});

test("Forest-style spawns retain the original direct-damage flow", () => {
  const simulation = createLiveEnemy({ frostArmorRatio: 0, variant: "standard" });
  const enemy = dealDirectDamage(simulation, 100, "physical");
  assert.equal(enemy.maxFrostArmor, 0);
  assert.equal(enemy.hp, 900);
  assert.equal(simulation.drainEvents().some((event) => event.type === "frost_armor_broken"), false);
});

test("Northern Pass v3 uses 4/12 hero ranks and wave 20 awakening", () => {
  assert.equal(getHeroUpgradeWaveGate(1, [4, 12]), 4);
  assert.equal(getHeroUpgradeWaveGate(2, [4, 12]), 12);
  assert.equal(isHeroAwakened(3, 19, 20), false);
  assert.equal(isHeroAwakened(3, 20, 20), true);
});

test("only the forecast danger zone is armed and a valid avalanche consumes one charge", () => {
  const simulation = createLiveEnemy({ northernPass: avalanchePlan({ dangerZoneId: "upper" }) });
  const view = simulation.readView();
  assert.equal(view.northernPass.forecastDangerZoneId, "upper");
  assert.equal(view.northernPass.avalanche.zones.find((zone) => zone.id === "upper").canTrigger, true);
  assert.equal(view.northernPass.avalanche.zones.find((zone) => zone.id === "middle").canTrigger, false);
  assert.deepEqual(simulation.triggerNorthernAvalanche("middle"), { ok: false, error: "avalanche_unavailable" });

  assert.deepEqual(simulation.triggerNorthernAvalanche("upper"), { ok: true, error: null });
  const after = simulation.readView();
  assert.equal(after.northernPass.avalanche.chargesRemaining, 0);
  assert.equal(after.enemies[0].frostArmor, 0);
  assert.equal(after.enemies[0].stunned, false, "stun state is refreshed on the following fixed step");
  simulation.advance(20);
  assert.equal(simulation.readView().enemies[0].stunned, true);
  const event = simulation.drainEvents().find((candidate) => candidate.type === "northern_avalanche");
  assert.equal(event.zoneId, "upper");
  assert.equal(event.impacts.length, 1);
  assert.equal(event.impacts[0].frostArmorRemoved, 200);
});

test("an avalanche cannot be spent before a target reaches the armed zone", () => {
  const simulation = createLiveEnemy({ northernPass: avalanchePlan({ dangerZoneId: "middle" }) });
  assert.deepEqual(simulation.triggerNorthernAvalanche("middle"), { ok: false, error: "avalanche_empty_zone" });
  assert.equal(simulation.readView().northernPass.avalanche.chargesRemaining, 1);
});

test("boss waves expose two charges and route changes are replay-visible domain events", () => {
  const simulation = new GameSimulation(
    createCampaignState(),
    createFrostArmorRules({ type: "boss", northernPass: avalanchePlan({ charges: 2 }) }),
  );
  assert.equal(simulation.startWave(), true);
  assert.equal(simulation.readView().northernPass.avalanche.maxCharges, 2);
  const event = simulation.drainEvents().find((candidate) => candidate.type === "northern_route_changed");
  assert.equal(event.routeVariantId, "ridge");
  assert.equal(event.wave, 1);
});

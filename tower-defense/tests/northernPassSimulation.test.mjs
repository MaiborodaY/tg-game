import assert from "node:assert/strict";
import test from "node:test";

import { getHeroUpgradeWaveGate, isHeroAwakened } from "../src/game/heroes.ts";
import { GameSimulation } from "../src/game/simulation.ts";
import { createCampaignState } from "../src/game/state.ts";

function createFrostArmorRules({
  frostArmorRatio = 0.2,
  signalFireActive = false,
  heroAwakeningWave = 14,
} = {}) {
  return Object.freeze({
    id: `northern-pass:test:${frostArmorRatio}:${signalFireActive}`,
    routePoints: Object.freeze([
      Object.freeze({ x: 0, y: 20 }),
      Object.freeze({ x: 120, y: 20 }),
    ]),
    buildPads: Object.freeze([]),
    // Keep the hero outside combat range so these tests isolate frost armor.
    heroAnchors: Object.freeze([Object.freeze({ x: 1_000, y: 1_000 })]),
    signalFires: signalFireActive
      ? Object.freeze([Object.freeze({ x: 0, y: 20 })])
      : Object.freeze([]),
    heroAwakeningWave,
    finalWave: null,
    isComplete: () => false,
    createWavePlan: (wave) => Object.freeze({
      wave,
      spawns: Object.freeze([Object.freeze({
        id: wave * 1_000,
        type: "raider",
        variant: frostArmorRatio > 0 ? "icebound" : "standard",
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
        healingRadius: 0,
        healingRatio: 0,
        elite: false,
        bossTier: 1,
        summonThresholds: Object.freeze([]),
        summonCount: 0,
      })]),
      clearBonus: 0,
      hasBoss: false,
      act: 1,
      threat: 1,
    }),
    getBossRepair: () => 0,
    getWaveHealthMultiplier: () => 1,
  });
}

function createLiveEnemy(options = {}) {
  const simulation = new GameSimulation(createCampaignState(), createFrostArmorRules(options));
  assert.equal(simulation.startWave(), true);
  for (let index = 0; index < 20 && simulation.readView().enemies.length === 0; index += 1) {
    simulation.advance(250);
  }
  assert.equal(simulation.readView().phase, "wave");
  assert.equal(simulation.readView().enemies.length, 1);
  simulation.drainEvents();
  return simulation;
}

function dealDirectDamage(simulation, amount, kind) {
  const enemy = simulation.readView().enemies[0];
  assert.ok(enemy);
  // TypeScript private methods are runtime methods; invoking this one keeps the
  // test focused on the canonical armor-resolution path without tower timing.
  simulation.damageEnemy(enemy, amount, kind, true);
  return simulation.readView().enemies[0];
}

test("frost armor absorbs ordinary damage before health", () => {
  const simulation = createLiveEnemy();
  const enemy = dealDirectDamage(simulation, 100, "physical");

  assert.equal(enemy.maxFrostArmor, 200);
  assert.equal(enemy.frostArmor, 100);
  assert.equal(enemy.hp, 1_000);
  assert.equal(enemy.insideWarmZone, false);
});

test("fire strips frost armor faster than ordinary damage", () => {
  const physical = createLiveEnemy();
  const fire = createLiveEnemy();

  const afterPhysical = dealDirectDamage(physical, 100, "physical");
  const afterFire = dealDirectDamage(fire, 100, "fire");

  assert.equal(afterPhysical.frostArmor, 100);
  assert.equal(afterFire.frostArmor, 30);
  assert.ok(afterFire.frostArmor < afterPhysical.frostArmor);
  assert.equal(afterFire.hp, 1_000);
});

test("the signal fire selected by the active hero anchor boosts armor breaking", () => {
  const cold = createLiveEnemy({ signalFireActive: false });
  const warm = createLiveEnemy({ signalFireActive: true });

  const coldEnemy = dealDirectDamage(cold, 100, "fire");
  const warmEnemy = dealDirectDamage(warm, 100, "fire");

  assert.equal(coldEnemy.insideWarmZone, false);
  assert.equal(warmEnemy.insideWarmZone, true);
  assert.equal(coldEnemy.frostArmor, 30);
  assert.equal(warmEnemy.frostArmor, 0);
  assert.ok(warmEnemy.hp < coldEnemy.hp, "surplus warm fire damage should reach health");
});

test("breaking frost armor emits one armor-break event", () => {
  const simulation = createLiveEnemy();

  dealDirectDamage(simulation, 200, "physical");
  dealDirectDamage(simulation, 20, "physical");

  const breakEvents = simulation.drainEvents().filter((event) => event.type === "frost_armor_broken");
  assert.equal(breakEvents.length, 1);
  assert.equal(breakEvents[0].enemyId, 1_000);
});

test("a Forest-style spawn without frost armor keeps the original direct-damage flow", () => {
  const simulation = createLiveEnemy({ frostArmorRatio: 0, signalFireActive: false });
  const enemy = dealDirectDamage(simulation, 100, "physical");
  const events = simulation.drainEvents();

  assert.equal(enemy.maxFrostArmor, 0);
  assert.equal(enemy.frostArmor, 0);
  assert.equal(enemy.hp, 900);
  assert.equal(events.some((event) => event.type === "frost_armor_broken"), false);
  assert.ok(events.some((event) => event.type === "enemy_damaged" && event.frostAbsorbed === 0));
});

test("Northern Pass can use its own hero upgrade and awakening wave gates", () => {
  const northernUpgradeWaves = Object.freeze([3, 9]);

  assert.equal(getHeroUpgradeWaveGate(1, northernUpgradeWaves), 3);
  assert.equal(getHeroUpgradeWaveGate(2, northernUpgradeWaves), 9);
  assert.equal(getHeroUpgradeWaveGate(3, northernUpgradeWaves), null);
  assert.equal(isHeroAwakened(3, 13, 14), false);
  assert.equal(isHeroAwakened(3, 14, 14), true);
});

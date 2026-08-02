import assert from "node:assert/strict";
import test from "node:test";

import { GameSimulation, replaySimulation } from "../src/game/simulation.ts";
import { createCampaignState } from "../src/game/state.ts";

function createFrontlineRules({
  enemyTypes = ["raider"],
  enemySpeed = 100,
  enemyHp = 10_000,
} = {}) {
  return Object.freeze({
    id: "test:forest:hero-combat-v1",
    routePoints: Object.freeze([
      Object.freeze({ x: 0, y: 20 }),
      Object.freeze({ x: 1_400, y: 20 }),
    ]),
    buildPads: Object.freeze([Object.freeze({ x: 0, y: 100 })]),
    heroAnchors: Object.freeze([
      Object.freeze({ x: 420, y: 20 }),
      Object.freeze({ x: 846, y: 20 }),
      Object.freeze({ x: 1_176, y: 20 }),
    ]),
    heroCombat: "toren-frontline-v1",
    heroAwakeningWave: 20,
    finalWave: null,
    isComplete: () => false,
    createWavePlan: (wave) => Object.freeze({
      wave,
      spawns: Object.freeze(enemyTypes.map((type, index) => Object.freeze({
        id: wave * 1_000 + index,
        type,
        atMs: 0,
        maxHp: enemyHp,
        speed: enemySpeed,
        reward: 0,
        leakDamage: 1,
        physicalResistance: 0,
        magicResistance: 0,
        shieldRatio: 0,
        controlResistance: 0,
        healingRadius: 0,
        healingRatio: 0,
        elite: false,
        bossTier: 1,
        summonThresholds: Object.freeze([]),
        summonCount: 0,
      }))),
      clearBonus: 0,
      hasBoss: enemyTypes.some((type) => type === "boss" || type === "titan"),
      act: 1,
      threat: 1,
    }),
    getBossRepair: () => 0,
    getWaveHealthMultiplier: () => 1,
  });
}

function createTorenCampaign(level = 1) {
  const initial = createCampaignState({ heroId: "toren" });
  return Object.freeze({
    ...initial,
    hero: Object.freeze({ id: "toren", level, anchorId: 0 }),
  });
}

function advanceUntil(simulation, predicate, maxMs, stepMs = 100) {
  let elapsedMs = 0;
  while (!predicate(simulation.readView()) && elapsedMs < maxMs) {
    simulation.advance(stepMs);
    elapsedMs += stepMs;
  }
  assert.equal(predicate(simulation.readView()), true, `condition was not reached after ${maxMs}ms`);
}

function advanceFor(simulation, totalMs, stepMs = 100) {
  for (let elapsedMs = 0; elapsedMs < totalMs; elapsedMs += stepMs) {
    simulation.advance(Math.min(stepMs, totalMs - elapsedMs));
  }
}

test("frontline Toren deploys deterministically and blocks only his rank capacity", () => {
  const rules = createFrontlineRules({ enemyTypes: ["raider", "raider", "raider"] });
  const simulation = new GameSimulation(createTorenCampaign(1), rules);
  assert.deepEqual(simulation.readView().hero.frontline, {
    status: "ready",
    progress: 420,
    targetProgress: 420,
    hp: 180,
    maxHp: 180,
    regenActive: false,
    knockoutRemainingMs: 0,
    blockUsed: 0,
    blockCapacity: 2,
    blockedEnemyIds: [],
  });

  assert.equal(simulation.startWave(), true);
  advanceUntil(simulation, (view) => view.phase === "wave", 3_000);
  assert.equal(simulation.readView().hero.frontline.status, "holding");
  assert.equal(Math.round(simulation.readView().hero.frontline.progress), 420);

  advanceUntil(simulation, (view) => view.hero.frontline.blockUsed === 2, 6_000);
  const blocked = simulation.readView().hero.frontline.blockedEnemyIds;
  assert.deepEqual(blocked, [1_000, 1_001]);
  assert.equal(simulation.readView().enemies.find((enemy) => enemy.id === 1_002).blocked, false);
  simulation.advance(500);
  assert.ok(
    simulation.readView().enemies.find((enemy) => enemy.id === 1_002).progress
      > simulation.readView().enemies.find((enemy) => enemy.id === 1_000).progress,
  );

  advanceUntil(simulation, (view) => view.hero.frontline.hp < 180, 1_000);
  assert.ok(simulation.drainEvents().some((event) => event.type === "enemy_attacked_hero"));
});

test("bosses are released after three seconds and Toren regenerates only out of combat", () => {
  const simulation = new GameSimulation(
    createTorenCampaign(2),
    createFrontlineRules({ enemyTypes: ["boss"], enemySpeed: 100 }),
  );
  simulation.startWave();
  advanceUntil(simulation, (view) => view.hero.frontline.blockUsed === 3, 9_000);
  const hpAtEngage = simulation.readView().hero.frontline.hp;
  advanceFor(simulation, 2_600);
  assert.ok(simulation.readView().hero.frontline.hp < hpAtEngage);
  assert.equal(simulation.readView().hero.frontline.regenActive, false);

  advanceUntil(simulation, (view) => view.hero.frontline.blockUsed === 0, 1_000);
  const hpAfterRelease = simulation.readView().hero.frontline.hp;
  const bossProgress = simulation.readView().enemies[0].progress;
  advanceFor(simulation, 3_200);
  assert.ok(simulation.readView().enemies[0].progress > bossProgress);
  assert.ok(simulation.readView().hero.frontline.hp > hpAfterRelease);
});

test("knockout frees enemies, disables the ability, then returns Toren at half HP", () => {
  const rules = createFrontlineRules({
    enemyTypes: ["raider", "raider"],
    enemySpeed: 10,
  });
  const simulation = new GameSimulation(createTorenCampaign(1), rules);
  simulation.startWave();
  advanceUntil(simulation, (view) => view.hero.frontline.status === "knocked_out", 70_000, 250);

  const knockedOut = simulation.readView();
  assert.equal(knockedOut.hero.frontline.hp, 0);
  assert.equal(knockedOut.hero.frontline.blockUsed, 0);
  assert.equal(knockedOut.heroAbilityAvailable, false);
  assert.ok(knockedOut.enemies.every((enemy) => enemy.blocked === false));
  assert.ok(simulation.drainEvents().some((event) => event.type === "hero_knocked_out"));

  advanceUntil(simulation, (view) => view.hero.frontline.status === "deploying", 11_000);
  assert.equal(simulation.readView().hero.frontline.hp, 90);
  advanceUntil(simulation, (view) => view.hero.frontline.status === "holding", 7_000);

  const replay = simulation.exportReplay();
  const restored = replaySimulation(replay, rules);
  assert.deepEqual(restored.createSnapshot(), simulation.createSnapshot());
});

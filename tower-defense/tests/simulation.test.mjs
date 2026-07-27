import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import test from "node:test";

import {
  CAMPAIGN_RULESET,
  ENDLESS_RULESET,
  NORTHERN_PASS_LEVEL,
} from "../src/game/content.ts";
import {
  FIXED_STEP_MS,
  GameSimulation,
  createSimulationRules,
  replaySimulation,
} from "../src/game/simulation.ts";
import { createCampaignState } from "../src/game/state.ts";

function createTestRules({ finalWave = 1, enemyHp = 1, enemySpeed = 8 } = {}) {
  return Object.freeze({
    id: "test:campaign:v1",
    routePoints: Object.freeze([
      Object.freeze({ x: 0, y: 20 }),
      Object.freeze({ x: 120, y: 20 }),
    ]),
    buildPads: Object.freeze([Object.freeze({ x: 0, y: 0 })]),
    finalWave,
    isComplete: (completedWave) => finalWave !== null && completedWave >= finalWave,
    createWavePlan: (wave) => Object.freeze({
      wave,
      spawns: Object.freeze([Object.freeze({
        id: wave * 1_000,
        type: "raider",
        atMs: 0,
        maxHp: enemyHp,
        speed: enemySpeed,
        reward: 5,
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
      })]),
      clearBonus: 10,
      hasBoss: false,
      act: 1,
      threat: 1,
    }),
    getBossRepair: () => 0,
    getWaveHealthMultiplier: () => 1,
  });
}

test("headless simulation owns combat and reaches a deterministic terminal result", () => {
  const simulation = new GameSimulation(createCampaignState(), createTestRules());
  assert.deepEqual(simulation.build(0, "ranger"), { ok: true, error: null });
  assert.equal(simulation.startWave(), true);

  const events = [...simulation.drainEvents()];
  for (let index = 0; index < 100 && simulation.readView().phase !== "victory"; index += 1) {
    simulation.advance(100);
    events.push(...simulation.drainEvents());
  }

  assert.equal(simulation.readView().phase, "victory");
  assert.equal(simulation.getCampaign().completedWave, 1);
  assert.equal(simulation.getCampaign().totalKills, 1);
  assert.ok(events.some((event) => event.type === "enemy_killed"));
  assert.ok(events.some((event) => event.type === "wave_cleared"));
  assert.ok(events.some((event) => event.type === "terminal" && event.outcome === "victory"));
});

test("fixed-step state is independent from supported render-frame chunking", () => {
  const rules = createTestRules({ finalWave: null, enemyHp: 10_000, enemySpeed: 12 });
  const coarse = new GameSimulation(createCampaignState(), rules);
  const fine = new GameSimulation(createCampaignState(), rules);
  coarse.startWave();
  fine.startWave();
  coarse.drainEvents();
  fine.drainEvents();

  for (let index = 0; index < 15; index += 1) coarse.advance(200);
  for (let index = 0; index < 120; index += 1) fine.advance(25);

  assert.deepEqual(coarse.createSnapshot(), fine.createSnapshot());
  assert.equal(coarse.readView().phase, "wave");
  assert.equal(coarse.readView().enemies.length, 1);
  assert.ok(Math.abs(coarse.readView().enemies[0].progress - 7.2) <= 12 * (FIXED_STEP_MS / 1_000));
});

test("pausing stops both the fixed-step world and active run duration", () => {
  const simulation = new GameSimulation(createCampaignState(), createTestRules({ finalWave: null }));
  simulation.startWave();
  simulation.drainEvents();
  simulation.setPaused(true);
  const before = simulation.createSnapshot();

  for (let index = 0; index < 20; index += 1) simulation.advance(100);

  assert.deepEqual(simulation.createSnapshot(), before);
  assert.equal(simulation.getCampaign().activeDurationMs, 0);
});

test("content levels and modes adapt into simulation rules without Phaser", () => {
  const campaign = createSimulationRules(NORTHERN_PASS_LEVEL, CAMPAIGN_RULESET);
  const endless = createSimulationRules(NORTHERN_PASS_LEVEL, ENDLESS_RULESET);

  assert.equal(campaign.finalWave, 18);
  assert.equal(campaign.buildPads.length, 13);
  assert.equal(campaign.createWavePlan(18).wave, 18);
  assert.equal(endless.finalWave, null);
  assert.equal(endless.createWavePlan(19).wave, 19);
  assert.match(campaign.id, /northern-pass:campaign/);
});

test("an exported command log replays to the same terminal snapshot", () => {
  const trace = [
    { type: "build", padId: 0, towerType: "ranger" },
    { type: "upgrade", padId: 0 },
    { type: "start_wave" },
    ...Array.from({ length: 100 }, () => ({ type: "advance", deltaMs: 100 })),
  ];

  const rules = createTestRules();
  const simulation = new GameSimulation(createCampaignState(), rules);
  for (const command of trace) {
    if (command.type === "build") simulation.build(command.padId, command.towerType);
    if (command.type === "upgrade") simulation.upgrade(command.padId);
    if (command.type === "start_wave") simulation.startWave();
    if (command.type === "advance") simulation.advance(command.deltaMs);
    simulation.drainEvents();
  }

  const replay = simulation.exportReplay();
  const restored = replaySimulation(replay, rules);
  assert.equal(simulation.createSnapshot().phase, "victory");
  assert.deepEqual(restored.createSnapshot(), simulation.createSnapshot());
  assert.deepEqual(replay.commands.map((entry) => entry.command.type), ["build", "upgrade", "start_wave"]);
  assert.ok(Object.isFrozen(replay.commands));
  assert.throws(() => replaySimulation({ ...replay, rulesId: "wrong" }, rules), /rules do not match/);
});

test("a 36-wave endless soak remains bounded and completes within a generous budget", () => {
  const initial = {
    ...createCampaignState({ level: NORTHERN_PASS_LEVEL, mode: ENDLESS_RULESET }),
    lives: 100_000,
  };
  const simulation = new GameSimulation(
    initial,
    createSimulationRules(NORTHERN_PASS_LEVEL, ENDLESS_RULESET),
  );
  const startedAt = performance.now();
  let advanceCalls = 0;
  let peakEnemies = 0;

  while (simulation.getCampaign().completedWave < 36) {
    if (simulation.readView().phase === "setup") assert.equal(simulation.startWave(), true);
    simulation.advance(100);
    simulation.drainEvents();
    advanceCalls += 1;
    peakEnemies = Math.max(peakEnemies, simulation.readView().enemies.length);
    assert.ok(advanceCalls < 100_000, "endless soak stalled");
  }

  assert.ok(performance.now() - startedAt < 10_000, "headless endless soak exceeded its regression budget");
  assert.ok(peakEnemies < 200, `enemy population grew unexpectedly: ${peakEnemies}`);
  assert.equal(simulation.readView().projectiles.length, 0);
  assert.equal(simulation.getCampaign().completedWave, 36);
});

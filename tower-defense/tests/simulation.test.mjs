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

function createTestRules({
  finalWave = 1,
  enemyHp = 1,
  enemyHps = null,
  enemySpeed = 8,
  controlResistance = 0,
  physicalResistance = 0,
  magicResistance = 0,
} = {}) {
  const healthValues = enemyHps ?? [enemyHp];
  return Object.freeze({
    id: "test:campaign:v1",
    routePoints: Object.freeze([
      Object.freeze({ x: 0, y: 20 }),
      Object.freeze({ x: 120, y: 20 }),
    ]),
    buildPads: Object.freeze([Object.freeze({ x: 0, y: 0 })]),
    heroAnchors: Object.freeze([
      Object.freeze({ x: 0, y: 0 }),
      Object.freeze({ x: 60, y: 0 }),
      Object.freeze({ x: 110, y: 0 }),
    ]),
    finalWave,
    isComplete: (completedWave) => finalWave !== null && completedWave >= finalWave,
    createWavePlan: (wave) => Object.freeze({
      wave,
      spawns: Object.freeze(healthValues.map((maxHp, index) => Object.freeze({
        id: wave * 1_000 + index,
        type: "raider",
        atMs: 0,
        maxHp,
        speed: enemySpeed,
        reward: 5,
        leakDamage: 1,
        physicalResistance,
        magicResistance,
        shieldRatio: 0,
        controlResistance,
        healingRadius: 0,
        healingRatio: 0,
        elite: false,
        bossTier: 1,
        summonThresholds: Object.freeze([]),
        summonCount: 0,
      }))),
      clearBonus: 10,
      hasBoss: false,
      act: 1,
      threat: 1,
    }),
    getBossRepair: () => 0,
    getWaveHealthMultiplier: () => 1,
  });
}

function advanceToLiveWave(simulation) {
  for (let index = 0; index < 20 && simulation.readView().phase !== "wave"; index += 1) simulation.advance(250);
  assert.equal(simulation.readView().phase, "wave");
  assert.ok(simulation.readView().enemies.length > 0);
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
  assert.match(campaign.id, /northern-pass:campaign.*heroes-v2/);
});

test("hero movement and upgrades are setup-only deterministic commands", () => {
  const campaign = {
    ...createCampaignState(),
    completedWave: 4,
    gold: 1_000,
  };
  const simulation = new GameSimulation(campaign, createTestRules({ finalWave: null, enemyHp: 10_000 }));
  assert.deepEqual(simulation.moveHero(1), { ok: true, error: null });
  assert.equal(simulation.readView().hero.anchorId, 1);
  assert.deepEqual(simulation.upgradeHero(), { ok: true, error: null });
  assert.equal(simulation.getCampaign().hero.level, 2);
  assert.equal(simulation.getCampaign().gold, 850);
  const events = simulation.drainEvents();
  assert.ok(events.some((event) => event.type === "hero_moved" && event.anchorId === 1));
  assert.ok(events.some((event) => event.type === "hero_upgraded" && event.level === 2));

  assert.equal(simulation.startWave(), true);
  assert.equal(simulation.moveHero(2).error, "invalid_phase");
  assert.equal(simulation.upgradeHero().error, "invalid_phase");
  assert.deepEqual(
    simulation.exportReplay().commands.map((entry) => entry.command.type),
    ["move_hero", "upgrade_hero", "start_wave"],
  );
});

test("Eira marks the strongest enemy once per wave for tower damage", () => {
  const campaign = {
    ...createCampaignState({ heroId: "eira" }),
    hero: { id: "eira", level: 2, anchorId: 0 },
  };
  const simulation = new GameSimulation(
    campaign,
    createTestRules({ finalWave: null, enemyHps: [500, 1_000], enemySpeed: 2 }),
  );
  assert.equal(simulation.useHeroAbility().error, "invalid_phase");
  simulation.startWave();
  advanceToLiveWave(simulation);
  simulation.drainEvents();

  assert.deepEqual(simulation.useHeroAbility(), { ok: true, error: null });
  assert.equal(simulation.readView().hero.markedEnemyId, 1_001);
  assert.equal(simulation.readView().heroAbilityAvailable, false);
  assert.equal(simulation.readView().pulseAvailable, false);
  assert.equal(simulation.useHeroAbility().error, "hero_ability_unavailable");
  assert.ok(simulation.drainEvents().some((event) => (
    event.type === "hero_ability" && event.heroId === "eira" && event.targetId === 1_001
  )));
});

test("Eira rank-two aura increases damage from nearby towers", () => {
  const baseRules = createTestRules({ finalWave: null, enemyHp: 5_000, enemySpeed: 0.01 });
  const rules = Object.freeze({
    ...baseRules,
    routePoints: Object.freeze([
      Object.freeze({ x: 55, y: 20 }),
      Object.freeze({ x: 56, y: 20 }),
    ]),
  });
  const remainingHp = (anchorId) => {
    const campaign = {
      ...createCampaignState({ heroId: "eira" }),
      hero: { id: "eira", level: 2, anchorId },
    };
    const simulation = new GameSimulation(campaign, rules);
    simulation.build(0, "ranger");
    simulation.startWave();
    for (let index = 0; index < 20; index += 1) simulation.advance(250);
    return simulation.readView().enemies[0].hp;
  };

  assert.ok(remainingHp(0) < remainingHp(2));
});

test("Toren shock damages and stuns enemies inside his local aura", () => {
  const campaign = {
    ...createCampaignState({ heroId: "toren" }),
    hero: { id: "toren", level: 2, anchorId: 0 },
  };
  const simulation = new GameSimulation(
    campaign,
    createTestRules({ finalWave: null, enemyHps: [500, 500], enemySpeed: 2 }),
  );
  simulation.startWave();
  advanceToLiveWave(simulation);
  simulation.drainEvents();
  const beforeHp = simulation.readView().enemies.map((enemy) => enemy.hp);

  assert.deepEqual(simulation.executeCommand({ type: "use_hero_ability" }), { ok: true, error: null });
  assert.ok(simulation.readView().enemies.every((enemy, index) => enemy.hp < beforeHp[index]));
  simulation.advance(FIXED_STEP_MS);
  assert.ok(simulation.readView().enemies.every((enemy) => enemy.stunned));
  assert.ok(simulation.readView().enemies.every((enemy) => enemy.slowed));
  assert.equal(simulation.executeCommand({ type: "use_hero_ability" }).error, "hero_ability_unavailable");
  assert.ok(simulation.drainEvents().some((event) => (
    event.type === "hero_ability" && event.heroId === "toren" && event.radius > 0
  )));
});

test("Toren auto-attacks clustered enemies with deterministic short splash", () => {
  const simulation = new GameSimulation(
    createCampaignState({ heroId: "toren" }),
    createTestRules({ finalWave: null, enemyHps: [200, 200], enemySpeed: 2 }),
  );
  simulation.startWave();
  advanceToLiveWave(simulation);
  simulation.drainEvents();
  for (let index = 0; index < 6; index += 1) simulation.advance(100);

  assert.ok(simulation.readView().enemies.every((enemy) => enemy.hp < 200));
  assert.ok(simulation.drainEvents().some((event) => (
    event.type === "hero_attack" && event.heroId === "toren" && event.radius > 0
  )));
});

test("Grak rank-two passive speeds up nearby towers", () => {
  const rules = createTestRules({ finalWave: null, enemyHp: 50_000, enemySpeed: 0.01 });
  const remainingHp = (anchorId) => {
    const campaign = {
      ...createCampaignState({ heroId: "grak" }),
      hero: { id: "grak", level: 2, anchorId },
    };
    const simulation = new GameSimulation(campaign, rules);
    simulation.build(0, "ranger");
    simulation.startWave();
    advanceToLiveWave(simulation);
    for (let index = 0; index < 100; index += 1) simulation.advance(100);
    return simulation.readView().enemies[0].hp;
  };

  assert.ok(remainingHp(0) < remainingHp(2));
});

test("Grak banner is once per wave, boosts nearby towers, and expires deterministically", () => {
  const rules = createTestRules({
    finalWave: null,
    enemyHp: 50_000,
    enemySpeed: 0.01,
    physicalResistance: 0.5,
  });
  const createGrakSimulation = () => {
    const simulation = new GameSimulation(createCampaignState({ heroId: "grak" }), rules);
    simulation.build(0, "ranger");
    simulation.startWave();
    advanceToLiveWave(simulation);
    simulation.drainEvents();
    return simulation;
  };
  const baseline = createGrakSimulation();
  const boosted = createGrakSimulation();

  assert.deepEqual(boosted.useHeroAbility(), { ok: true, error: null });
  assert.equal(boosted.readView().hero.bannerActive, true);
  assert.equal(boosted.readView().hero.bannerRemainingMs, 6_000);
  assert.equal(boosted.useHeroAbility().error, "hero_ability_unavailable");
  assert.ok(boosted.drainEvents().some((event) => (
    event.type === "hero_ability"
    && event.heroId === "grak"
    && event.durationMs === 6_000
  )));

  for (let index = 0; index < 50; index += 1) {
    baseline.advance(100);
    boosted.advance(100);
  }
  assert.ok(boosted.readView().enemies[0].hp < baseline.readView().enemies[0].hp);
  assert.equal(boosted.readView().hero.bannerActive, true);

  for (let index = 0; index < 11; index += 1) boosted.advance(100);
  assert.equal(boosted.readView().hero.bannerActive, false);
  assert.equal(boosted.readView().hero.bannerRemainingMs, 0);
});

test("hero ability commands replay to the same transient combat snapshot", () => {
  const campaign = {
    ...createCampaignState({ heroId: "toren" }),
    hero: { id: "toren", level: 3, anchorId: 0 },
  };
  const rules = createTestRules({ finalWave: null, enemyHps: [2_000, 2_000], enemySpeed: 2 });
  const simulation = new GameSimulation(campaign, rules);
  simulation.startWave();
  advanceToLiveWave(simulation);
  simulation.useHeroAbility();
  for (let index = 0; index < 12; index += 1) simulation.advance(100);

  const replay = simulation.exportReplay();
  const restored = replaySimulation(replay, rules);
  assert.deepEqual(restored.createSnapshot(), simulation.createSnapshot());
  assert.ok(replay.commands.some((entry) => entry.command.type === "use_hero_ability"));
});

test("wave checkpoints keep hero build state but reset transient ability use on reopen", () => {
  const campaign = {
    ...createCampaignState({ heroId: "toren" }),
    hero: { id: "toren", level: 2, anchorId: 1 },
  };
  const rules = createTestRules({ finalWave: null, enemyHp: 10_000, enemySpeed: 2 });
  const simulation = new GameSimulation(campaign, rules);
  simulation.startWave();
  advanceToLiveWave(simulation);
  simulation.useHeroAbility();
  simulation.drainEvents();
  for (let index = 0; index < 12; index += 1) simulation.advance(100);
  const checkpoint = simulation.drainEvents()
    .filter((event) => event.type === "persist")
    .at(-1)?.campaign;
  assert.ok(checkpoint);
  assert.deepEqual(checkpoint.hero, campaign.hero);

  const restored = new GameSimulation(checkpoint, rules);
  assert.equal(restored.readView().phase, "setup");
  assert.equal(restored.readView().heroAbilityAvailable, true);
  assert.deepEqual(restored.readView().hero, {
    id: "toren",
    level: 2,
    anchorId: 1,
    x: 60,
    y: 0,
    attackCooldownMs: 180,
    abilityAvailable: true,
    markedEnemyId: null,
    bannerActive: false,
    bannerRemainingMs: 0,
  });
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

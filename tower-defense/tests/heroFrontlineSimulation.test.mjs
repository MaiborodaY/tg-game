import assert from "node:assert/strict";
import test from "node:test";

import { GameSimulation, replaySimulation } from "../src/game/simulation.ts";
import { createCampaignState } from "../src/game/state.ts";

function createFrontlineRules({
  enemyTypes = ["raider"],
  enemySpeed = 100,
  enemyHp = 10_000,
  spawnSpacingMs = 0,
  routeLength = 1_400,
} = {}) {
  return Object.freeze({
    id: "test:forest:hero-combat-v2",
    routePoints: Object.freeze([
      Object.freeze({ x: 0, y: 20 }),
      Object.freeze({ x: routeLength, y: 20 }),
    ]),
    buildPads: Object.freeze([Object.freeze({ x: 0, y: 100 })]),
    heroAnchors: Object.freeze([
      Object.freeze({ x: routeLength * (420 / 1_400), y: 20 }),
      Object.freeze({ x: routeLength * (846 / 1_400), y: 20 }),
      Object.freeze({ x: routeLength * (1_176 / 1_400), y: 20 }),
    ]),
    heroCombat: "hero-frontline-v2",
    heroAwakeningWave: 20,
    finalWave: null,
    isComplete: () => false,
    createWavePlan: (wave) => Object.freeze({
      wave,
      spawns: Object.freeze(enemyTypes.map((type, index) => Object.freeze({
        id: wave * 1_000 + index,
        type,
        atMs: index * spawnSpacingMs,
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

function createHeroCampaign(heroId = "toren", level = 1) {
  const initial = createCampaignState({ heroId });
  return Object.freeze({
    ...initial,
    hero: Object.freeze({ id: heroId, level, anchorId: 0 }),
  });
}

function createTorenCampaign(level = 1) {
  return createHeroCampaign("toren", level);
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
    hp: 130,
    maxHp: 130,
    heroicArmor: 6,
    maxHeroicArmor: 6,
    passivePower: 1,
    regenActive: false,
    knockoutRemainingMs: 0,
    blockUsed: 0,
    blockCapacity: 2,
    blockedEnemyIds: [],
  });

  assert.equal(simulation.startWave(), true);
  advanceUntil(simulation, (view) => view.phase === "wave", 3_000);
  assert.equal(simulation.readView().hero.frontline.status, "holding");
  assert.equal(simulation.readView().hero.frontline.passivePower, 1);
  assert.equal(Math.round(simulation.readView().hero.frontline.progress), 420);

  advanceUntil(simulation, (view) => view.hero.frontline.blockUsed === 2, 6_000);
  const blocked = simulation.readView().hero.frontline.blockedEnemyIds;
  assert.deepEqual(blocked, [1_000, 1_001]);
  assert.equal(simulation.readView().hero.frontline.passivePower, 1);
  assert.equal(simulation.readView().enemies.find((enemy) => enemy.id === 1_002).blocked, false);
  simulation.advance(500);
  assert.ok(
    simulation.readView().enemies.find((enemy) => enemy.id === 1_002).progress
      > simulation.readView().enemies.find((enemy) => enemy.id === 1_000).progress,
  );

  advanceUntil(simulation, (view) => view.hero.frontline.heroicArmor < 6, 2_500);
  assert.ok(simulation.readView().hero.frontline.hp < 130);
  assert.ok(simulation.drainEvents().some((event) => event.type === "enemy_attacked_hero"));
});

test("overflow enemies strike Eira once while the held enemy stays engaged", () => {
  const simulation = new GameSimulation(
    createHeroCampaign("eira", 1),
    createFrontlineRules({ enemyTypes: ["raider", "raider", "raider"], enemyHp: 10_000 }),
  );
  simulation.startWave();
  const events = [];
  let elapsedMs = 0;
  while (elapsedMs < 10_000) {
    simulation.advance(100);
    events.push(...simulation.drainEvents());
    elapsedMs += 100;
    const view = simulation.readView();
    const overflow = view.enemies.filter((enemy) => enemy.id !== 1_000);
    if (overflow.length === 2 && overflow.every((enemy) => enemy.progress > view.hero.frontline.progress + 40)) break;
  }

  const passing = events.filter((event) => event.type === "enemy_attacked_hero" && event.attackKind === "passing");
  const engaged = events.filter((event) => event.type === "enemy_attacked_hero" && event.attackKind === "engaged");
  assert.deepEqual(passing.map((event) => event.enemyId), [1_001, 1_002]);
  assert.ok(engaged.length > 0 && engaged.every((event) => event.enemyId === 1_000));
  assert.deepEqual(simulation.readView().hero.frontline.blockedEnemyIds, [1_000]);
  assert.ok(simulation.readView().enemies.filter((enemy) => enemy.id !== 1_000).every((enemy) => !enemy.blocked));

  const replay = replaySimulation(simulation.exportReplay(), simulation.getRules());
  assert.deepEqual(replay.createSnapshot(), simulation.createSnapshot());
});

test("a high-speed heavy enemy cannot skip Eira's passing-strike window", () => {
  const simulation = new GameSimulation(
    createHeroCampaign("eira", 1),
    createFrontlineRules({ enemyTypes: ["brute"], enemySpeed: 20_000, enemyHp: 10_000 }),
  );
  simulation.startWave();
  const events = [];
  for (let elapsedMs = 0; elapsedMs < 3_000; elapsedMs += 50) {
    simulation.advance(50);
    events.push(...simulation.drainEvents());
  }
  const passing = events.filter((event) => event.type === "enemy_attacked_hero" && event.attackKind === "passing");
  assert.equal(passing.length, 1);
  assert.equal(passing[0].enemyId, 1_000);
});

test("a passing strike that knocks Eira out prevents later enemies hitting her body", () => {
  const simulation = new GameSimulation(
    createHeroCampaign("eira", 1),
    createFrontlineRules({ enemyTypes: Array.from({ length: 9 }, () => "brute"), enemyHp: 10_000 }),
  );
  simulation.startWave();
  const events = [];
  let elapsedMs = 0;
  while (simulation.readView().hero.frontline.status !== "knocked_out" && elapsedMs < 10_000) {
    simulation.advance(100);
    events.push(...simulation.drainEvents());
    elapsedMs += 100;
  }
  const passing = events.filter((event) => event.type === "enemy_attacked_hero" && event.attackKind === "passing");
  assert.equal(simulation.readView().hero.frontline.status, "knocked_out");
  assert.equal(passing.length, 7);
  assert.equal(new Set(passing.map((event) => event.enemyId)).size, passing.length);
  assert.ok(simulation.readView().enemies.every((enemy) => !enemy.blocked));
});

test("all heroes receive their distinct frontline durability, range, and block role", () => {
  const expected = {
    eira: { hp: 45, armor: 0, capacity: 1 },
    toren: { hp: 130, armor: 6, capacity: 2 },
    grak: { hp: 90, armor: 3, capacity: 1 },
  };

  for (const [heroId, role] of Object.entries(expected)) {
    const simulation = new GameSimulation(
      createHeroCampaign(heroId, 1),
      createFrontlineRules({ enemyTypes: [heroId === "grak" ? "raider" : "brute"], enemyHp: 10_000 }),
    );
    const frontline = simulation.readView().hero.frontline;
    assert.equal(frontline.hp, role.hp);
    assert.equal(frontline.maxHp, role.hp);
    assert.equal(frontline.heroicArmor, role.armor);
    assert.equal(frontline.blockCapacity, role.capacity);
    simulation.startWave();

    if (heroId === "eira") {
      let attackedBeforeContact = false;
      advanceUntil(simulation, () => {
        attackedBeforeContact ||= simulation.drainEvents().some((event) => event.type === "hero_attack");
        return attackedBeforeContact;
      }, 8_000);
      assert.equal(simulation.readView().hero.frontline.blockUsed, 0, "Eira shoots before a heavy enemy passes");
    } else {
      advanceUntil(simulation, (view) => view.hero.frontline.blockUsed === role.capacity, 9_000);
    }
  }
});

test("a boss stays engaged past three seconds and prevents Toren from regenerating", () => {
  const simulation = new GameSimulation(
    createTorenCampaign(2),
    createFrontlineRules({ enemyTypes: ["boss"], enemySpeed: 100 }),
  );
  simulation.startWave();
  advanceUntil(simulation, (view) => view.hero.frontline.blockUsed === 3, 9_000);
  const hpAtEngage = simulation.readView().hero.frontline.hp;
  const bossProgressAtEngage = simulation.readView().enemies[0].progress;
  advanceFor(simulation, 3_600);
  const fighting = simulation.readView();
  assert.ok(fighting.hero.frontline.hp < hpAtEngage);
  assert.equal(fighting.hero.frontline.regenActive, false);
  assert.equal(fighting.hero.frontline.passivePower, 1);
  assert.deepEqual(fighting.hero.frontline.blockedEnemyIds, [1_000]);
  assert.equal(fighting.enemies[0].progress, bossProgressAtEngage);
});

test("a boss preempts escorts and advances only after knocking Toren out", () => {
  const simulation = new GameSimulation(
    createTorenCampaign(1),
    createFrontlineRules({
      enemyTypes: ["raider", "raider", "boss"],
      enemySpeed: 100,
      spawnSpacingMs: 500,
    }),
  );
  simulation.startWave();
  advanceUntil(simulation, (view) => (
    view.hero.frontline.blockedEnemyIds.length === 2
    && view.hero.frontline.blockedEnemyIds.every((enemyId) => (
      view.enemies.find((enemy) => enemy.id === enemyId)?.type === "raider"
    ))
  ), 9_000);

  const bossId = 1_002;
  advanceUntil(simulation, (view) => view.hero.frontline.blockedEnemyIds.includes(bossId), 2_000);
  const engaged = simulation.readView();
  assert.equal(engaged.hero.frontline.blockUsed, 2, "boss occupies every rank-one block slot");
  assert.deepEqual(engaged.hero.frontline.blockedEnemyIds, [bossId]);
  assert.ok(engaged.enemies.filter((enemy) => enemy.type === "raider").every((enemy) => !enemy.blocked));
  simulation.drainEvents();

  advanceFor(simulation, 2_600);
  const combatEvents = simulation.drainEvents();
  assert.ok(combatEvents.some((event) => event.type === "enemy_attacked_hero" && event.enemyId === bossId));
  assert.ok(combatEvents.some((event) => event.type === "hero_attack" && event.targetId === bossId));
  assert.equal(simulation.readView().hero.frontline.blockedEnemyIds.includes(bossId), true);

  advanceUntil(simulation, (view) => view.hero.frontline.status === "knocked_out", 12_000);
  assert.deepEqual(simulation.readView().hero.frontline.blockedEnemyIds, []);
  const releasedAt = simulation.readView().enemies.find((enemy) => enemy.id === bossId).progress;
  advanceFor(simulation, 500);
  assert.ok(simulation.readView().enemies.find((enemy) => enemy.id === bossId).progress > releasedAt);
  assert.equal(simulation.drainEvents().some((event) => event.type === "hero_frontline_broken"), false);
});

test("a living boss cannot resume the route while Toren remains conscious", () => {
  const simulation = new GameSimulation(
    createTorenCampaign(3),
    createFrontlineRules({ enemyTypes: ["boss"], enemySpeed: 1, routeLength: 20 }),
  );
  simulation.startWave();
  advanceUntil(simulation, (view) => view.hero.frontline.blockedEnemyIds.includes(1_000), 9_000);
  const blockedAt = simulation.readView().enemies[0].progress;
  advanceFor(simulation, 8_000);
  const held = simulation.readView();
  assert.notEqual(held.hero.frontline.status, "knocked_out");
  assert.deepEqual(held.hero.frontline.blockedEnemyIds, [1_000]);
  assert.equal(held.enemies[0].progress, blockedAt);
});

test("a titan uses the same rank-independent frontline takeover as a boss", () => {
  const simulation = new GameSimulation(
    createTorenCampaign(1),
    createFrontlineRules({
      enemyTypes: ["raider", "titan"],
      enemySpeed: 100,
      spawnSpacingMs: 500,
    }),
  );
  simulation.startWave();

  const titanId = 1_001;
  advanceUntil(simulation, (view) => view.hero.frontline.blockedEnemyIds.includes(titanId), 10_000);
  assert.deepEqual(simulation.readView().hero.frontline.blockedEnemyIds, [titanId]);
  assert.equal(simulation.readView().hero.frontline.blockUsed, 2);
  simulation.drainEvents();

  advanceFor(simulation, 2_600);
  const combatEvents = simulation.drainEvents();
  assert.ok(combatEvents.some((event) => event.type === "enemy_attacked_hero" && event.enemyId === titanId));
  assert.ok(combatEvents.some((event) => event.type === "hero_attack" && event.targetId === titanId));
});

test("the final Titan breaks every rank-three frontline without an infinite stall", () => {
  const expectedHits = { eira: 1, toren: 3, grak: 2 };
  for (const [heroId, hitCount] of Object.entries(expectedHits)) {
    const simulation = new GameSimulation(
      createHeroCampaign(heroId, 3),
      createFrontlineRules({ enemyTypes: ["titan"], enemySpeed: 100 }),
    );
    simulation.startWave();
    advanceUntil(simulation, (view) => view.hero.frontline.status === "knocked_out", 12_000);
    const attacks = simulation.drainEvents().filter((event) => event.type === "enemy_attacked_hero");
    assert.equal(attacks.length, hitCount, `${heroId} absorbed an unexpected number of Titan hits`);
    assert.deepEqual(simulation.readView().hero.frontline.blockedEnemyIds, []);
  }
});

test("every frontline hero trades attacks while holding a boss", () => {
  const expectedDamage = { eira: 4, toren: 7, grak: 9 };
  for (const [heroId, damage] of Object.entries(expectedDamage)) {
    const simulation = new GameSimulation(
      createHeroCampaign(heroId, 1),
      createFrontlineRules({ enemyTypes: ["boss"], enemySpeed: 100 }),
    );
    simulation.startWave();
    advanceUntil(simulation, (view) => view.hero.frontline.blockedEnemyIds.includes(1_000), 9_000);
    simulation.drainEvents();
    advanceFor(simulation, 1_800);
    const events = simulation.drainEvents();
    assert.ok(events.some((event) => event.type === "enemy_attacked_hero"), `${heroId} was not struck`);
    assert.ok(events.some((event) => event.type === "hero_attack"), `${heroId} did not strike back`);
    assert.ok(
      events.some((event) => event.type === "enemy_damaged" && event.damage === damage),
      `${heroId} did not use frontline damage ${damage}`,
    );
  }
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
  assert.equal(knockedOut.hero.frontline.heroicArmor, 0);
  assert.equal(knockedOut.hero.frontline.blockUsed, 0);
  assert.equal(knockedOut.hero.frontline.passivePower, 0);
  assert.equal(knockedOut.heroAbilityAvailable, false);
  assert.ok(knockedOut.enemies.every((enemy) => enemy.blocked === false));
  assert.ok(simulation.drainEvents().some((event) => event.type === "hero_knocked_out"));

  advanceUntil(simulation, (view) => view.hero.frontline.status === "deploying", 11_000);
  assert.equal(simulation.readView().hero.frontline.hp, 65);
  assert.equal(simulation.readView().hero.frontline.heroicArmor, 3);
  assert.equal(simulation.readView().hero.frontline.passivePower, 0);
  assert.equal(simulation.readView().heroAbilityAvailable, false);
  assert.equal(simulation.useHeroAbility().error, "hero_ability_unavailable");
  advanceUntil(simulation, (view) => view.hero.frontline.status === "holding", 7_000);
  assert.equal(simulation.readView().heroAbilityAvailable, true);

  const replay = simulation.exportReplay();
  const restored = replaySimulation(replay, rules);
  assert.deepEqual(restored.createSnapshot(), simulation.createSnapshot());
});

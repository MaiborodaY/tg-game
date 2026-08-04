import assert from "node:assert/strict";
import test from "node:test";

import { GameSimulation, replaySimulation } from "../src/game/simulation.ts";
import { createCampaignState } from "../src/game/state.ts";

function createRules({ enemyHps, enemyTypes, enemySpeed = 1 }) {
  return Object.freeze({
    id: "test:morna:v1",
    routePoints: Object.freeze([
      Object.freeze({ x: 0, y: 20 }),
      Object.freeze({ x: 120, y: 20 }),
    ]),
    buildPads: Object.freeze([]),
    heroAnchors: Object.freeze([
      Object.freeze({ x: 36, y: 20 }),
      Object.freeze({ x: 72, y: 20 }),
      Object.freeze({ x: 100, y: 20 }),
    ]),
    heroCombat: "hero-frontline-v2",
    heroAwakeningWave: 20,
    finalWave: null,
    isComplete: () => false,
    createWavePlan: (wave) => Object.freeze({
      wave,
      spawns: Object.freeze(enemyHps.map((maxHp, index) => Object.freeze({
        id: wave * 1_000 + index,
        type: enemyTypes[index],
        atMs: 0,
        maxHp,
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

function mornaCampaign(level = 1, completedWave = 0) {
  return Object.freeze({
    ...createCampaignState({ heroId: "morna" }),
    completedWave,
    hero: Object.freeze({ id: "morna", level, anchorId: 0 }),
  });
}

function advanceUntil(simulation, predicate, label, maxSteps = 800) {
  for (let index = 0; index < maxSteps && !predicate(simulation.readView()); index += 1) {
    simulation.advance(50);
  }
  assert.equal(predicate(simulation.readView()), true, label);
}

test("Morna spends no charge without a corpse and raises a bounded warrior from a nearby kill", () => {
  const rules = createRules({
    enemyHps: [1, 4, 10_000],
    enemyTypes: ["raider", "raider", "raider"],
  });
  const simulation = new GameSimulation(mornaCampaign(), rules);
  simulation.startWave();
  advanceUntil(simulation, (view) => view.phase === "wave", "wave never started");
  assert.equal(simulation.useHeroAbility().error, "hero_ability_unavailable");
  assert.equal(simulation.readView().hero.abilityCharges, 1);

  advanceUntil(
    simulation,
    (view) => (view.hero.morna?.corpseEssence ?? 0) === 1,
    "Morna never harvested a nearby corpse",
  );
  const harvested = simulation.readView().hero.morna;
  assert.equal(harvested?.corpses.length, 1);
  assert.equal(harvested?.corpses[0].kind, "light");
  assert.equal(harvested?.maxSummons, 1);
  assert.equal(simulation.readView().heroAbilityAvailable, true);

  assert.deepEqual(simulation.useHeroAbility(), { ok: true, error: null });
  assert.equal(simulation.readView().hero.morna?.corpseEssence, 0);
  assert.equal(simulation.readView().hero.morna?.usedSummonSlots, 1);
  assert.equal(simulation.readView().hero.morna?.summons[0].kind, "warrior");
  advanceUntil(simulation, (view) => view.campaign.totalKills >= 2, "summoned warrior never killed its target");
  assert.equal(simulation.readView().hero.morna?.corpseEssence, 0, "summon kills must not create new corpses");

  const replay = simulation.exportReplay();
  assert.deepEqual(replaySimulation(replay, rules).createSnapshot(), simulation.createSnapshot());
});

test("awakened Morna consumes six essence for a colossus that holds a boss for at most three seconds", () => {
  const rules = createRules({
    enemyHps: [1, 1, 1, 10_000],
    enemyTypes: ["boss", "boss", "boss", "boss"],
  });
  const simulation = new GameSimulation(mornaCampaign(3, 20), rules);
  simulation.startWave();
  advanceUntil(
    simulation,
    (view) => (view.hero.morna?.corpseEssence ?? 0) >= 6,
    "Morna never collected six boss essences",
  );
  assert.equal(simulation.readView().hero.morna?.colossusReady, true);
  assert.deepEqual(simulation.useHeroAbility(), { ok: true, error: null });
  assert.equal(simulation.readView().hero.morna?.summons[0].kind, "colossus");
  assert.equal(simulation.readView().hero.morna?.usedSummonSlots, 3, "colossus must occupy every summon slot");

  simulation.drainEvents();
  advanceUntil(
    simulation,
    (view) => (view.hero.morna?.summons.length ?? 0) === 0,
    "colossus exceeded its bounded major-enemy hold",
    120,
  );
  assert.ok(simulation.drainEvents().some((event) => (
    event.type === "morna_summon_destroyed" && event.reason === "major_hold"
  )));
  assert.ok(simulation.readView().enemies.some((enemy) => enemy.type === "boss" && !enemy.blocked));
});

test("a Colossus cannot reset its sacrificial fuse by switching major targets", () => {
  const simulation = new GameSimulation(mornaCampaign(3, 20), createRules({
    enemyHps: [1, 1, 1, 20, 10_000, 10_000],
    enemyTypes: ["boss", "boss", "boss", "boss", "boss", "boss"],
  }));
  simulation.startWave();
  advanceUntil(
    simulation,
    (view) => (view.hero.morna?.corpseEssence ?? 0) >= 6,
    "Morna never collected the awakening essence",
  );
  assert.deepEqual(simulation.useHeroAbility(), { ok: true, error: null });
  advanceUntil(
    simulation,
    (view) => (view.hero.morna?.summons[0]?.blockedEnemyIds.length ?? 0) > 0,
    "Colossus never engaged its first major target",
  );
  const engagedAtMs = simulation.readView().simulationTimeMs;

  advanceUntil(
    simulation,
    (view) => (view.hero.morna?.summons.length ?? 0) === 0,
    "Colossus reset its major-enemy fuse",
    80,
  );

  assert.ok(
    simulation.readView().simulationTimeMs - engagedAtMs <= 3_050,
    "switching major targets extended the three-second sacrificial hold",
  );
  assert.ok(simulation.drainEvents().some((event) => (
    event.type === "morna_summon_destroyed" && event.reason === "major_hold"
  )));
});

test("Morna's summons crumble immediately when she is knocked out", () => {
  const rules = createRules({
    enemyHps: [1, 10_000],
    enemyTypes: ["raider", "boss"],
    enemySpeed: 15,
  });
  const simulation = new GameSimulation(mornaCampaign(), rules);
  simulation.startWave();
  advanceUntil(
    simulation,
    (view) => (view.hero.morna?.corpseEssence ?? 0) === 1,
    "Morna never harvested the setup corpse",
  );
  assert.deepEqual(simulation.useHeroAbility(), { ok: true, error: null });
  assert.equal(simulation.readView().hero.morna?.summons.length, 1);
  simulation.drainEvents();

  advanceUntil(
    simulation,
    (view) => view.hero.frontline?.status === "knocked_out",
    "boss never knocked Morna out",
  );
  assert.equal(simulation.readView().hero.morna?.summons.length, 0);
  assert.ok(simulation.drainEvents().some((event) => (
    event.type === "morna_summon_destroyed" && event.reason === "hero_knockout"
  )));
});

test("unspent corpses expire without consuming Morna's ability charge", () => {
  const simulation = new GameSimulation(mornaCampaign(), createRules({
    enemyHps: [1, 10_000],
    enemyTypes: ["raider", "raider"],
  }));
  simulation.startWave();
  advanceUntil(
    simulation,
    (view) => (view.hero.morna?.corpses.length ?? 0) === 1,
    "Morna never harvested the expiring corpse",
  );

  advanceUntil(
    simulation,
    (view) => (view.hero.morna?.corpses.length ?? 0) === 0,
    "Morna corpse exceeded its bounded lifetime",
    200,
  );

  assert.equal(simulation.readView().hero.morna?.corpses.length, 0);
  assert.equal(simulation.useHeroAbility().error, "hero_ability_unavailable");
  assert.equal(simulation.readView().hero.abilityCharges, 1);
});

test("ending a run clears Morna's corpses, summons, and enemy bindings", () => {
  const simulation = new GameSimulation(mornaCampaign(), createRules({
    enemyHps: [1, 10_000],
    enemyTypes: ["raider", "raider"],
  }));
  simulation.startWave();
  advanceUntil(
    simulation,
    (view) => (view.hero.morna?.corpseEssence ?? 0) === 1,
    "Morna never harvested the setup corpse",
  );
  assert.deepEqual(simulation.useHeroAbility(), { ok: true, error: null });
  advanceUntil(
    simulation,
    (view) => (view.hero.morna?.summons[0]?.blockedEnemyIds.length ?? 0) > 0,
    "summon never bound its target",
  );
  simulation.drainEvents();

  // The public surrender flow terminates outside the simulation; invoking the
  // private terminal hook here isolates cleanup of an in-flight battle.
  simulation["endRun"]("gameover");

  const morna = simulation.readView().hero.morna;
  assert.equal(morna?.corpses.length, 0);
  assert.equal(morna?.summons.length, 0);
  assert.equal(simulation.readView().enemies.length, 0);
  assert.ok(simulation.drainEvents().some((event) => (
    event.type === "morna_summon_destroyed" && event.reason === "run_end"
  )));
});

test("a Colossus explosion cannot leave its killer acting or skip the next enemy", () => {
  const simulation = new GameSimulation(mornaCampaign(3, 20), createRules({
    enemyHps: [1, 1, 1, 30, 10_000],
    enemyTypes: ["boss", "boss", "boss", "boss", "raider"],
  }));
  simulation.startWave();
  advanceUntil(
    simulation,
    (view) => (view.hero.morna?.corpseEssence ?? 0) >= 6,
    "Morna never collected the awakening essence",
  );
  assert.deepEqual(simulation.useHeroAbility(), { ok: true, error: null });
  advanceUntil(
    simulation,
    (view) => (view.hero.morna?.summons[0]?.blockedEnemyIds.length ?? 0) > 0,
    "Colossus never bound the test boss",
  );

  const summon = simulation.mornaSummons[0];
  const targetId = summon.blockedEnemyIds.values().next().value;
  const target = simulation.enemiesById.get(targetId);
  const follower = simulation.enemies.find((enemy) => enemy.id !== targetId);
  assert.ok(summon && target && follower);
  summon.hp = 1;
  target.hp = Math.min(target.hp, 30);
  target.heroAttackCooldownMs = 0;
  if (simulation.heroFrontline) simulation.heroFrontline.blockedEnemyIds.delete(follower.id);
  follower.blockedByHero = false;
  follower.blockedByMornaSummonId = null;
  follower.progress = 100;
  follower.x = 100;
  follower.y = 20;
  const followerProgress = follower.progress;
  simulation.drainEvents();

  simulation.advance(50);

  assert.equal(simulation.enemiesById.has(targetId), false, "explosion did not kill the attacking boss");
  assert.ok(follower.progress > followerProgress, "array compaction skipped the following enemy");
  assert.equal(simulation.drainEvents().some((event) => (
    event.type === "enemy_attacked_hero" && event.enemyId === targetId
  )), false, "a dead boss acted after triggering the explosion");
});

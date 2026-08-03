import assert from "node:assert/strict";
import test from "node:test";

import { CAMPAIGN_RULESET, NORTHERN_PASS_LEVEL } from "../src/game/content.ts";
import { getHeroStats } from "../src/game/heroes.ts";
import { GameSimulation, createSimulationRules } from "../src/game/simulation.ts";
import { createCampaignState } from "../src/game/state.ts";

const STRATEGIES = Object.freeze([
  Object.freeze({
    name: "Eira fire-control",
    heroId: "eira",
    anchorId: 0,
    buildPlan: Object.freeze([
      Object.freeze([7, "ember", 0]), Object.freeze([8, "ranger", 0]), Object.freeze([4, "frost", 1]),
      Object.freeze([5, "ember", 3]), Object.freeze([10, "storm", 5]), Object.freeze([11, "ranger", 7]),
      Object.freeze([6, "ember", 9]), Object.freeze([1, "storm", 11]), Object.freeze([12, "ranger", 13]),
    ]),
    upgradePriority: Object.freeze([7, 5, 8, 4, 10, 6, 11, 1, 12]),
  }),
  Object.freeze({
    name: "Toren crowd-control",
    heroId: "toren",
    anchorId: 1,
    buildPlan: Object.freeze([
      Object.freeze([7, "ember", 0]), Object.freeze([8, "ranger", 0]), Object.freeze([4, "frost", 1]),
      Object.freeze([5, "storm", 3]), Object.freeze([10, "ember", 5]), Object.freeze([11, "ranger", 7]),
      Object.freeze([6, "storm", 9]), Object.freeze([1, "ember", 11]), Object.freeze([12, "ranger", 13]),
    ]),
    upgradePriority: Object.freeze([7, 10, 8, 4, 5, 1, 11, 6, 12]),
  }),
  Object.freeze({
    name: "Grak tempo",
    heroId: "grak",
    anchorId: 1,
    buildPlan: Object.freeze([
      Object.freeze([9, "ember", 0]), Object.freeze([12, "ranger", 0]), Object.freeze([8, "frost", 1]),
      Object.freeze([11, "storm", 3]), Object.freeze([10, "ember", 5]), Object.freeze([5, "ranger", 7]),
      Object.freeze([7, "storm", 9]), Object.freeze([4, "ember", 11]), Object.freeze([1, "ranger", 13]),
    ]),
    upgradePriority: Object.freeze([9, 12, 8, 11, 10, 5, 7, 4, 1]),
  }),
]);

function prepareWave(simulation, strategy) {
  let view = simulation.readView();
  simulation.moveHero(strategy.anchorId);

  const heroGate = NORTHERN_PASS_LEVEL.progression.heroUpgradeWaves[view.campaign.hero.level - 1];
  if (heroGate !== undefined && view.campaign.completedWave >= heroGate) {
    // Saving for a due hero rank mirrors the choice offered to a real player.
    if (!simulation.upgradeHero().ok) return;
    view = simulation.readView();
  }

  for (const [padId, type, dueWave] of strategy.buildPlan) {
    if (dueWave > view.campaign.completedWave || view.campaign.towers.some((tower) => tower.padId === padId)) continue;
    if (!simulation.build(padId, type).ok) return;
    view = simulation.readView();
  }

  for (;;) {
    let upgraded = false;
    for (const padId of strategy.upgradePriority) {
      const tower = simulation.readView().campaign.towers.find((candidate) => candidate.padId === padId);
      if (!tower || tower.level >= 4) continue;
      if (simulation.upgrade(padId).ok) {
        upgraded = true;
        break;
      }
    }
    if (!upgraded) return;
  }
}

function tryUseHeroAbility(simulation, heroId) {
  const view = simulation.readView();
  if (view.phase !== "wave" || view.hero.abilityCharges <= 0 || view.enemies.length === 0) return false;

  if (heroId === "eira") {
    const hasBoss = view.enemies.some((enemy) => enemy.type === "boss" || enemy.type === "titan");
    return (view.enemies.length >= 5 || hasBoss) && simulation.useHeroAbility().ok;
  }
  if (heroId === "grak") {
    if (view.wavePlan?.hasBoss && !view.enemies.some((enemy) => enemy.type === "boss" || enemy.type === "titan")) {
      return false;
    }
    const radius = getHeroStats("grak", view.hero.level).abilityRadius;
    const supportedTowers = view.campaign.towers.filter((tower) => {
      const pad = NORTHERN_PASS_LEVEL.buildPads[tower.padId];
      return (pad.x - view.hero.x) ** 2 + (pad.y - view.hero.y) ** 2 <= radius ** 2;
    }).length;
    return supportedTowers >= 1 && view.enemies.length >= 5 && simulation.useHeroAbility().ok;
  }
  if (!view.hero.awakened) {
    const radius = getHeroStats("toren", view.hero.level).abilityRadius;
    const nearbyCount = view.enemies.filter((enemy) => (
      (enemy.x - view.hero.x) ** 2 + (enemy.y - view.hero.y) ** 2 <= radius ** 2
    )).length;
    return nearbyCount >= 3 && simulation.useHeroAbility().ok;
  }

  let bestCluster = { count: 0, progress: 0 };
  for (const candidate of view.enemies) {
    const count = view.enemies.filter((enemy) => Math.abs(enemy.progress - candidate.progress) <= 55).length;
    if (count > bestCluster.count) bestCluster = { count, progress: candidate.progress };
  }
  return bestCluster.count >= 5 && simulation.useHeroAbility(bestCluster.progress).ok;
}

function tryUseAvalanche(simulation, mode) {
  if (mode === "none") return false;
  const view = simulation.readView();
  const northern = view.northernPass;
  if (view.phase !== "wave" || !northern?.avalanche.available) return false;
  const requestedZoneId = mode === "fixed-upper" ? "upper" : northern.forecastDangerZoneId;
  const zone = northern.avalanche.zones.find((candidate) => candidate.id === requestedZoneId);
  if (!zone?.canTrigger) return false;

  const routeLength = routeTotalLength(northern.routePoints);
  const targets = view.enemies.filter((enemy) => {
    const ratio = routeLength > 0 ? enemy.progress / routeLength : 0;
    return ratio >= zone.startRatio && ratio < zone.endRatio;
  });
  const hasPriorityTarget = targets.some((enemy) => (
    enemy.type === "boss" || enemy.type === "titan" || enemy.type === "shaman"
  ));
  const bossPresent = targets.some((enemy) => enemy.type === "boss" || enemy.type === "titan");
  if (view.wavePlan?.hasBoss) {
    const firstBossChargeReady = northern.avalanche.chargesRemaining === northern.avalanche.maxCharges
      && bossPresent;
    const committedBossChargeReady = northern.avalanche.chargesRemaining < northern.avalanche.maxCharges
      && bossPresent;
    if (!firstBossChargeReady && !committedBossChargeReady) return false;
  } else if (!hasPriorityTarget && targets.length < 3) {
    return false;
  }
  return simulation.triggerNorthernAvalanche(requestedZoneId).ok;
}

function playCampaign(strategy, { avalancheMode = "informed" } = {}) {
  const simulation = new GameSimulation(
    createCampaignState({ level: NORTHERN_PASS_LEVEL, mode: CAMPAIGN_RULESET, heroId: strategy.heroId }),
    createSimulationRules(
      NORTHERN_PASS_LEVEL,
      CAMPAIGN_RULESET,
      { heroCombat: "hero-frontline-v2" },
    ),
  );
  let abilityUses = 0;
  let avalancheUses = 0;
  let passingHits = 0;
  let engagedHits = 0;
  let heroKnockouts = 0;
  let lastCompletedWave = 0;
  const livesByWave = [];
  const leaks = [];
  const avalanches = [];
  const knockoutWaves = [];

  for (let wave = 1; wave <= NORTHERN_PASS_LEVEL.waves.finalWave && simulation.readView().phase !== "gameover"; wave += 1) {
    prepareWave(simulation, strategy);
    const spawnTypes = new Map(simulation.getCurrentWavePlan().spawns.map((spawn) => [spawn.id, spawn.type]));
    assert.equal(simulation.startWave(), true, `${strategy.name} could not start wave ${wave}`);
    let ticks = 0;
    while (!["setup", "victory", "gameover"].includes(simulation.readView().phase) && ticks < 12_000) {
      simulation.advance(100);
      if (tryUseAvalanche(simulation, avalancheMode)) avalancheUses += 1;
      if (tryUseHeroAbility(simulation, strategy.heroId)) abilityUses += 1;
      for (const event of simulation.drainEvents()) {
        if (event.type === "enemy_leaked") leaks.push([wave, spawnTypes.get(event.enemyId) ?? "summon", event.damage]);
        if (event.type === "enemy_attacked_hero") {
          if (event.attackKind === "passing") passingHits += 1;
          else engagedHits += 1;
        }
        if (event.type === "hero_knocked_out") {
          heroKnockouts += 1;
          knockoutWaves.push(wave);
        }
        if (event.type === "northern_avalanche") {
          avalanches.push([wave, event.zoneId, event.impacts.map((impact) => spawnTypes.get(impact.enemyId) ?? "summon")]);
        }
      }
      ticks += 1;
    }
    assert.ok(ticks < 12_000, `${strategy.name} stalled on wave ${wave}`);
    lastCompletedWave = simulation.readView().campaign.completedWave;
    livesByWave.push([lastCompletedWave, simulation.readView().campaign.lives]);
  }
  return Object.freeze({
    view: simulation.readView(), abilityUses, avalancheUses, passingHits, engagedHits,
    heroKnockouts, knockoutWaves, lastCompletedWave, livesByWave, leaks, avalanches,
  });
}

for (const strategy of STRATEGIES) {
  test(`frontline ${strategy.name} still needs the informed Northern Pass mechanic`, () => {
    const result = playCampaign(strategy);
    assert.equal(result.view.phase, "victory", JSON.stringify({
      wave: result.lastCompletedWave,
      lives: result.view.campaign.lives,
      uses: result.avalancheUses,
    }));
    assert.equal(result.view.campaign.completedWave, 24);
    assert.ok(
      result.view.campaign.lives > 0 && result.view.campaign.lives <= 8,
      `expected a limited margin, got ${result.view.campaign.lives} lives`,
    );
    assert.ok(result.abilityUses > 0);
    assert.ok(result.avalancheUses >= 14);
    assert.ok(result.passingHits > 0, `${strategy.name} never faced overflow pressure`);
    assert.ok(result.engagedHits > 0, `${strategy.name} never traded with a held enemy`);
    assert.ok(result.heroKnockouts > 0, `${strategy.name} never left the field`);
    if (strategy.heroId === "eira") {
      assert.ok(result.heroKnockouts >= 8, `Eira was still too durable with ${result.heroKnockouts} knockouts`);
    }
  });
}

for (const strategy of STRATEGIES) {
  for (const avalancheMode of ["fixed-upper", "none"]) {
    test(`frontline ${strategy.name} does not turn ${avalancheMode} into a winning strategy`, () => {
      const result = playCampaign(strategy, { avalancheMode });
      assert.equal(result.view.phase, "gameover", JSON.stringify({
        wave: result.lastCompletedWave,
        lives: result.view.campaign.lives,
        uses: result.avalancheUses,
      }));
      assert.ok(result.lastCompletedWave >= 16, `${strategy.name} failed too early on wave ${result.lastCompletedWave + 1}`);
      assert.ok(result.lastCompletedWave < 24);
    });
  }
}

function routeTotalLength(points) {
  return points.slice(1).reduce((total, point, index) => (
    total + Math.hypot(point.x - points[index].x, point.y - points[index].y)
  ), 0);
}

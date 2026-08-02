import assert from "node:assert/strict";
import test from "node:test";

import {
  CAMPAIGN_RULESET,
  NORTHERN_PASS_LEVEL,
} from "../src/game/content.ts";
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
    anchorId: 0,
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
      Object.freeze([10, "ember", 0]), Object.freeze([11, "ranger", 0]), Object.freeze([7, "frost", 1]),
      Object.freeze([8, "storm", 3]), Object.freeze([4, "ember", 5]), Object.freeze([5, "ranger", 7]),
      Object.freeze([6, "storm", 9]), Object.freeze([12, "ember", 11]), Object.freeze([1, "ranger", 13]),
    ]),
    upgradePriority: Object.freeze([10, 8, 11, 7, 4, 12, 5, 6, 1]),
  }),
]);

const STORM_ANCHOR_BY_SECTOR = Object.freeze({ upper: 0, middle: 1, lower: 2 });

function prepareWave(simulation, strategy, followStorm) {
  let view = simulation.readView();
  const stormSector = simulation.getCurrentWavePlan().northernStorm?.sectorIds[0];
  const desiredAnchor = followStorm && stormSector
    ? STORM_ANCHOR_BY_SECTOR[stormSector]
    : strategy.anchorId;
  const switchedFire = desiredAnchor !== view.campaign.hero.anchorId;
  simulation.moveHero(desiredAnchor);

  const heroGate = NORTHERN_PASS_LEVEL.progression.heroUpgradeWaves[view.campaign.hero.level - 1];
  if (heroGate !== undefined && view.campaign.completedWave >= heroGate) {
    // Saving for a due hero rank is intentional player-like economy behavior.
    if (!simulation.upgradeHero().ok) return switchedFire;
    view = simulation.readView();
  }

  for (const [padId, type, dueWave] of strategy.buildPlan) {
    if (dueWave > view.campaign.completedWave || view.campaign.towers.some((tower) => tower.padId === padId)) continue;
    if (!simulation.build(padId, type).ok) return switchedFire;
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
    if (!upgraded) return switchedFire;
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

function playCampaign(strategy, { followStorm = false } = {}) {
  const simulation = new GameSimulation(
    createCampaignState({ level: NORTHERN_PASS_LEVEL, mode: CAMPAIGN_RULESET, heroId: strategy.heroId }),
    createSimulationRules(NORTHERN_PASS_LEVEL, CAMPAIGN_RULESET),
  );
  let abilityUses = 0;
  let fireSwitches = 0;
  let stormExposureTicks = 0;

  for (let wave = 1; wave <= NORTHERN_PASS_LEVEL.waves.finalWave && simulation.readView().phase !== "gameover"; wave += 1) {
    if (prepareWave(simulation, strategy, followStorm)) fireSwitches += 1;
    assert.equal(simulation.startWave(), true, `${strategy.name} could not start wave ${wave}`);
    let ticks = 0;
    while (!["setup", "victory", "gameover"].includes(simulation.readView().phase) && ticks < 12_000) {
      simulation.advance(100);
      stormExposureTicks += simulation.readView().enemies.filter((enemy) => enemy.stormAffected).length;
      if (tryUseHeroAbility(simulation, strategy.heroId)) abilityUses += 1;
      ticks += 1;
    }
    assert.ok(ticks < 12_000, `${strategy.name} stalled on wave ${wave}`);
  }

  return Object.freeze({ view: simulation.readView(), abilityUses, fireSwitches, stormExposureTicks });
}

for (const strategy of STRATEGIES) {
  test(`Northern Pass is completable with ${strategy.name}`, () => {
    const result = playCampaign(strategy, { followStorm: true });

    assert.equal(result.view.phase, "victory");
    assert.equal(result.view.campaign.completedWave, NORTHERN_PASS_LEVEL.waves.finalWave);
    assert.ok(result.view.campaign.lives > 0);
    assert.equal(result.view.campaign.hero.level, 3);
    assert.ok(result.abilityUses > 0);
    assert.ok(result.fireSwitches >= 10);
  });
}

test("reading the storm forecast and switching signal fires outperforms a fixed fire", () => {
  const informed = playCampaign(STRATEGIES[0], { followStorm: true });
  const fixed = playCampaign(Object.freeze({ ...STRATEGIES[0], anchorId: 2 }));

  assert.equal(informed.view.phase, "victory");
  assert.ok(informed.fireSwitches >= 10);
  assert.ok(
    fixed.stormExposureTicks >= informed.stormExposureTicks * 1.25,
    `fixed fire exposure ${fixed.stormExposureTicks} was not meaningfully above informed exposure ${informed.stormExposureTicks}`,
  );
});

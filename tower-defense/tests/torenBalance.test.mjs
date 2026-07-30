import assert from "node:assert/strict";
import test from "node:test";

import {
  CAMPAIGN_RULESET,
  CLASSIC_CAMPAIGN_LEVEL,
} from "../src/game/content.ts";
import { getHeroStats } from "../src/game/heroes.ts";
import { GameSimulation, createSimulationRules } from "../src/game/simulation.ts";
import { createCampaignState } from "../src/game/state.ts";

const BUILD_PLAN = Object.freeze([
  Object.freeze({ padId: 3, type: "ranger", dueWave: 0 }),
  Object.freeze({ padId: 5, type: "frost", dueWave: 0 }),
  Object.freeze({ padId: 4, type: "ember", dueWave: 2 }),
  Object.freeze({ padId: 7, type: "storm", dueWave: 3 }),
  Object.freeze({ padId: 8, type: "ember", dueWave: 5 }),
  Object.freeze({ padId: 9, type: "ember", dueWave: 7 }),
  Object.freeze({ padId: 10, type: "ranger", dueWave: 9 }),
  Object.freeze({ padId: 11, type: "ranger", dueWave: 11 }),
  Object.freeze({ padId: 13, type: "frost", dueWave: 13 }),
  Object.freeze({ padId: 6, type: "ember", dueWave: 15 }),
]);

const UPGRADE_PRIORITY = Object.freeze([4, 8, 9, 6, 7, 3, 10, 11, 5, 13]);

function prepareWave(simulation) {
  let view = simulation.readView();
  let savingForPlannedPurchase = false;
  for (const planned of BUILD_PLAN) {
    if (
      planned.dueWave > view.campaign.completedWave
      || view.campaign.towers.some((tower) => tower.padId === planned.padId)
    ) continue;
    if (!simulation.build(planned.padId, planned.type).ok) {
      savingForPlannedPurchase = true;
      break;
    }
    view = simulation.readView();
  }

  const heroUpgradeWave = view.hero.level === 1 ? 6 : view.hero.level === 2 ? 14 : Number.POSITIVE_INFINITY;
  if (view.campaign.completedWave >= heroUpgradeWave) {
    if (!simulation.upgradeHero().ok) savingForPlannedPurchase = true;
    view = simulation.readView();
  }

  if (savingForPlannedPurchase) return;
  let upgraded = true;
  while (upgraded) {
    upgraded = false;
    for (const padId of UPGRADE_PRIORITY) {
      const tower = simulation.readView().campaign.towers.find((candidate) => candidate.padId === padId);
      if (!tower || tower.level >= 4) continue;
      if (simulation.upgrade(padId).ok) {
        upgraded = true;
        break;
      }
    }
  }
}

function useTorenAbility(simulation) {
  const view = simulation.readView();
  if (view.phase !== "wave" || view.hero.abilityCharges <= 0) return;
  if (!view.hero.awakened) {
    const radius = getHeroStats("toren", view.hero.level).abilityRadius;
    const nearbyCount = view.enemies.filter((enemy) => (
      (enemy.x - view.hero.x) ** 2 + (enemy.y - view.hero.y) ** 2 <= radius ** 2
    )).length;
    if (nearbyCount >= 4) simulation.useHeroAbility();
    return;
  }

  if (view.enemies.length < 6) return;
  let bestProgress = 0;
  let bestCount = 0;
  for (const candidate of view.enemies) {
    const count = view.enemies.filter((enemy) => Math.abs(enemy.progress - candidate.progress) <= 28).length;
    if (count > bestCount) {
      bestCount = count;
      bestProgress = candidate.progress;
    }
  }
  if (bestCount >= 6) simulation.useHeroAbility(bestProgress);
}

test("Toren can finish the Forest Gate campaign with a realistic mixed build", () => {
  const simulation = new GameSimulation(
    createCampaignState({ heroId: "toren" }),
    createSimulationRules(CLASSIC_CAMPAIGN_LEVEL, CAMPAIGN_RULESET),
  );

  for (let wave = 1; wave <= 24 && simulation.readView().phase !== "gameover"; wave += 1) {
    prepareWave(simulation);
    assert.equal(simulation.startWave(), true);
    for (let tick = 0; tick < 6_000 && !["setup", "victory", "gameover"].includes(simulation.readView().phase); tick += 1) {
      simulation.advance(100);
      useTorenAbility(simulation);
    }
  }

  const result = simulation.readView();
  assert.equal(result.phase, "victory");
  assert.equal(result.campaign.completedWave, 24);
  assert.ok(result.campaign.lives > 0);
});

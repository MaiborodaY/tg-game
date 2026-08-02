import assert from "node:assert/strict";
import test from "node:test";

import {
  applyLeakDamage,
  awardEnemyKill,
  buildTower,
  completeWave,
  createCampaignState,
  createWaveCheckpoint,
  moveHero,
  recordActiveDuration,
  repairLives,
  sellTower,
  upgradeHero,
  upgradeTower,
} from "../src/game/state.ts";
import { CAMPAIGN_RULESET, NORTHERN_PASS_LEVEL } from "../src/game/content.ts";
import { getSelectedTowerDetails } from "../src/game/towerDetails.ts";

test("new runs bind transient state to a versioned level and mode", () => {
  const classic = createCampaignState();
  assert.deepEqual(
    { version: classic.version, contentVersion: classic.contentVersion, levelId: classic.levelId, modeId: classic.modeId },
    { version: 5, contentVersion: 2, levelId: "forest-gate", modeId: "campaign" },
  );
  assert.deepEqual(classic.hero, { id: "eira", level: 1, anchorId: 0 });
  assert.deepEqual(createCampaignState({ heroId: "toren" }).hero, { id: "toren", level: 1, anchorId: 0 });

  const northern = createCampaignState({ level: NORTHERN_PASS_LEVEL, mode: CAMPAIGN_RULESET });
  assert.equal(northern.gold, 190);
  assert.equal(northern.lives, 15);
  assert.equal(buildTower(northern, 12, "ranger").ok, true);
  assert.equal(buildTower(northern, 13, "ranger").error, "invalid_pad");
  assert.equal(repairLives({ ...northern, lives: 10 }, 99).lives, 15);
});

test("heroes move freely in setup state and upgrade through wave-gated gold costs", () => {
  const initial = { ...createCampaignState({ heroId: "eira" }), gold: 2_000 };
  assert.equal(moveHero(initial, 3).error, "invalid_hero_anchor");
  const moved = moveHero(initial, 2);
  assert.equal(moved.ok, true);
  assert.equal(moved.goldDelta, 0);
  assert.deepEqual(moved.state.hero, { id: "eira", level: 1, anchorId: 2 });

  assert.equal(upgradeHero(moved.state).error, "hero_upgrade_locked");
  const levelTwo = upgradeHero({ ...moved.state, completedWave: 4 });
  assert.equal(levelTwo.ok, true);
  assert.equal(levelTwo.state.gold, 1_850);
  assert.deepEqual(levelTwo.state.hero, { id: "eira", level: 2, anchorId: 2 });
  assert.equal(upgradeHero(levelTwo.state).error, "hero_upgrade_locked");

  const levelThree = upgradeHero({ ...levelTwo.state, completedWave: 12 });
  assert.equal(levelThree.ok, true);
  assert.equal(levelThree.state.gold, 1_370);
  assert.equal(levelThree.state.hero.level, 3);
  assert.equal(upgradeHero(levelThree.state).error, "hero_max_level");
  assert.ok(Object.isFrozen(levelThree.state.hero));
});

test("tower economy builds, upgrades and sells from immutable campaign states", () => {
  const initial = createCampaignState();
  const built = buildTower(initial, 0, "ranger");
  assert.equal(built.ok, true);
  assert.equal(initial.gold, 190, "the source state remains immutable");
  assert.equal(built.state.gold, 130);
  assert.deepEqual(built.state.towers, [{ padId: 0, type: "ranger", level: 1 }]);

  const duplicate = buildTower(built.state, 0, "frost");
  assert.deepEqual({ ok: duplicate.ok, error: duplicate.error }, { ok: false, error: "pad_occupied" });

  const upgraded = upgradeTower(built.state, 0);
  assert.equal(upgraded.ok, true);
  assert.equal(upgraded.state.gold, 55);
  assert.equal(upgraded.state.towers[0].level, 2);
  assert.equal(upgradeTower(upgraded.state, 0).error, "insufficient_gold");

  const sold = sellTower(upgraded.state, 0);
  assert.equal(sold.ok, true);
  assert.equal(sold.state.towers.length, 0);
  assert.equal(sold.goldDelta, 87);
  assert.equal(sold.state.gold, 142);
});

test("selected tower details stay Phaser-free and reflect economy and mastery", () => {
  const built = buildTower(createCampaignState(), 0, "ranger").state;
  const details = getSelectedTowerDetails({ campaign: built, selectedPadId: 0 });
  assert.equal(details?.tower.type, "ranger");
  assert.equal(details?.upgradeCost, 75);
  assert.equal(details?.sellValue, 39);
  assert.equal(details?.masteryLocked, false);
  assert.equal(getSelectedTowerDetails({ campaign: built, selectedPadId: null }), null);

  const mastery = getSelectedTowerDetails({
    campaign: {
      ...built,
      completedWave: 11,
      towers: [{ padId: 0, type: "ranger", level: 3 }],
    },
    selectedPadId: 0,
  });
  assert.equal(mastery?.masteryLocked, true);
});

test("only the next completed wave advances the reward score", () => {
  let state = createCampaignState();
  assert.equal(completeWave(state, 2, 30).error, "invalid_wave");
  state = completeWave(state, 1, 24).state;
  assert.equal(state.completedWave, 1);
  assert.equal(state.gold, 214);
  state = awardEnemyKill(state, 8);
  assert.equal(state.totalKills, 1);
  assert.equal(state.completedWave, 1, "kills do not alter the Telegram wave score");
});

test("lives and active duration are normalized without mutating other progress", () => {
  const initial = createCampaignState();
  const damaged = applyLeakDamage(initial, 3.8);
  const timed = recordActiveDuration(damaged, 1_234.9);
  assert.equal(damaged.lives, 17);
  assert.equal(timed.activeDurationMs, 1_234);
  assert.equal(timed.completedWave, 0);
});

test("a mid-wave duration checkpoint keeps pre-wave economy and damage", () => {
  const waveStart = buildTower(createCampaignState(), 0, "ranger").state;
  const liveState = recordActiveDuration(applyLeakDamage(awardEnemyKill(waveStart, 8), 4), 4_500);
  const checkpoint = createWaveCheckpoint(waveStart, liveState, liveState.activeDurationMs);

  assert.equal(checkpoint.activeDurationMs, 4_500);
  assert.equal(checkpoint.gold, waveStart.gold);
  assert.equal(checkpoint.lives, 16, "lost lives remain lost after a reload");
  assert.equal(checkpoint.totalKills, waveStart.totalKills);
  assert.deepEqual(checkpoint.hero, waveStart.hero);
});

test("level-four tower mastery unlocks only after wave twelve", () => {
  const base = createCampaignState();
  const levelThree = {
    ...base,
    gold: 2_000,
    completedWave: 11,
    towers: [{ padId: 0, type: "storm", level: 3 }],
  };
  assert.equal(upgradeTower(levelThree, 0).error, "mastery_locked");
  const mastered = upgradeTower({ ...levelThree, completedWave: 12 }, 0);
  assert.equal(mastered.ok, true);
  assert.equal(mastered.state.towers[0].level, 4);
  assert.equal(mastered.state.gold, 1_380);
});

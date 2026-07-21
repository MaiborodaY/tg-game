import assert from "node:assert/strict";
import test from "node:test";

import {
  applyLeakDamage,
  awardEnemyKill,
  buildTower,
  completeWave,
  createCampaignState,
  createWaveCheckpoint,
  recordActiveDuration,
  sellTower,
  upgradeTower,
} from "../src/game/state.ts";

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

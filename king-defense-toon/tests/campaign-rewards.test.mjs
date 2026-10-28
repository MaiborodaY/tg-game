import test from 'node:test';
import assert from 'node:assert/strict';
import { createCampaignState, campaignSnapshot, restoreCampaignState } from '../campaign-state.ts';
import { createBattleRewardReceipt, applyBattleKillRewards, applyCampaignBattleResult } from '../campaign-rewards.ts';
import { createBattle, updateBattle } from '../combat.ts';
import { WAVE_DEFINITIONS } from '../waves.ts';

const NOW = 100_000;
const fresh = () => createCampaignState(NOW);
function rejected(state, receipt, action, reason) {
  const beforeState = structuredClone(state), beforeReceipt = structuredClone(receipt);
  const result = action();
  assert.equal(result.ok, false);
  if (reason) assert.equal(result.reason, reason);
  assert.deepEqual(state, beforeState);
  assert.deepEqual(receipt, beforeReceipt);
}
function finish(state, receipt, won = true) {
  const wave = WAVE_DEFINITIONS[receipt.waveNumber - 1];
  assert.equal(applyBattleKillRewards(state, receipt, { kills: wave.total, totalGold: wave.reward }, () => 0.99).ok, true);
  return applyCampaignBattleResult(state, receipt, { waveNumber: wave.number, kills: wave.total, total: wave.total, won });
}

test('cumulative kill rewards pay each kill once and repeated frames do not reroll captures', () => {
  const state = fresh(), receipt = createBattleRewardReceipt(1), initialGold = state.gold;
  let rolls = 0;
  const random = () => { rolls += 1; return 0; };
  const first = applyBattleKillRewards(state, receipt, { kills: 1, totalGold: 1 }, random);
  assert.deepEqual(first, { ok: true, gold: 1, slaves: 1 });
  const afterFirst = structuredClone(state);
  assert.deepEqual(applyBattleKillRewards(state, receipt, { kills: 1, totalGold: 1 }, random), { ok: true, gold: 0, slaves: 0 });
  assert.deepEqual(state, afterFirst); assert.equal(rolls, 1);
  assert.equal(applyBattleKillRewards(state, receipt, { kills: 2, totalGold: 2 }, random).gold, 1);
  assert.equal(state.gold, initialGold + 2); assert.equal(rolls, 2);
});

test('stale, inconsistent and malformed cumulative totals cannot move the receipt or campaign', () => {
  const state = fresh(), receipt = createBattleRewardReceipt(1);
  applyBattleKillRewards(state, receipt, { kills: 1, totalGold: 1 }, () => 0.9);
  rejected(state, receipt, () => applyBattleKillRewards(state, receipt, { kills: 0, totalGold: 0 }, () => 0), 'stale-totals');
  rejected(state, receipt, () => applyBattleKillRewards(state, receipt, { kills: 1, totalGold: 2 }, () => 0), 'inconsistent-totals');
  rejected(state, receipt, () => applyBattleKillRewards(state, receipt, { kills: 2, totalGold: 1 }, () => 0), 'inconsistent-totals');
  for (const totals of [{ kills: NaN, totalGold: 2 }, { kills: 1_000_000, totalGold: 1_000_000 }, { kills: 2, totalGold: Infinity }, null]) {
    rejected(state, receipt, () => applyBattleKillRewards(state, receipt, totals, () => 0), 'invalid-totals');
  }
});

test('failed randomness after one staged capture rolls back the entire reward batch', () => {
  const state = fresh(), receipt = createBattleRewardReceipt(1);
  let rolls = 0;
  rejected(state, receipt, () => applyBattleKillRewards(state, receipt, { kills: 2, totalGold: 2 }, () => {
    rolls += 1; if (rolls === 2) throw new Error('random source failed'); return 0;
  }), 'invalid-random');
  assert.equal(rolls, 2);
  assert.equal(applyBattleKillRewards(state, receipt, { kills: 2, totalGold: 2 }, () => 0).slaves, 2);
});

test('victory applies experience, first clear, wallet and retreatable progress exactly once', () => {
  const state = fresh(), receipt = createBattleRewardReceipt(1), initialGold = state.gold;
  const result = finish(state, receipt);
  assert.equal(result.ok, true); assert.equal(result.firstClearBonus, 10);
  assert.ok(result.heroXp.gained > 0);
  assert.equal(state.gold, initialGold + WAVE_DEFINITIONS[0].reward + 10);
  assert.equal(state.clearedWaves, 1); assert.deepEqual(state.progression.firstClears, [1]);
  const wave = WAVE_DEFINITIONS[0];
  rejected(state, receipt, () => applyCampaignBattleResult(state, receipt,
    { waveNumber: 1, kills: wave.total, total: wave.total, won: true }), 'already-recorded');
  rejected(state, receipt, () => applyBattleKillRewards(state, receipt,
    { kills: wave.total, totalGold: wave.reward }, () => 0), 'already-recorded');
});

test('another actual battle may grant replay XP but cannot repeat a persisted first-clear bonus', () => {
  const state = fresh(); finish(state, createBattleRewardReceipt(1));
  const restored = restoreCampaignState(campaignSnapshot(state), NOW), oldXp = restored.hero.xp, oldGold = restored.gold;
  const result = finish(restored, createBattleRewardReceipt(1));
  assert.equal(result.firstClearBonus, 0);
  assert.ok(restored.hero.xp > oldXp);
  assert.equal(restored.gold, oldGold + WAVE_DEFINITIONS[0].reward);
  assert.deepEqual(restored.progression.firstClears, [1]);
});

test('defeat awards partial XP once and retreats wave progress without deleting first clears', () => {
  const state = fresh(); state.clearedWaves = 5; state.progression.firstClears = [1, 2, 3, 4, 5];
  const receipt = createBattleRewardReceipt(6), wave = WAVE_DEFINITIONS[5];
  assert.equal(applyBattleKillRewards(state, receipt, { kills: 1, totalGold: 1 }, () => 0.9).ok, true);
  const outcome = { waveNumber: 6, kills: 1, total: wave.total, won: false };
  const result = applyCampaignBattleResult(state, receipt, outcome);
  assert.equal(result.ok, true); assert.equal(result.firstClearBonus, 0); assert.ok(result.heroXp.gained > 0);
  assert.equal(state.clearedWaves, 4); assert.deepEqual(state.progression.firstClears, [1, 2, 3, 4, 5]);
  rejected(state, receipt, () => applyCampaignBattleResult(state, receipt, outcome), 'already-recorded');
});

test('zero-kill defeat remains a valid result with no XP or currency', () => {
  const state = fresh(), receipt = createBattleRewardReceipt(1), initialGold = state.gold;
  const result = applyCampaignBattleResult(state, receipt, { waveNumber: 1, kills: 0, total: WAVE_DEFINITIONS[0].total, won: false });
  assert.equal(result.ok, true); assert.equal(result.heroXp.gained, 0); assert.equal(state.gold, initialGold);
});

test('a result cannot commit before pending kills or for another wave', () => {
  const state = fresh(), receipt = createBattleRewardReceipt(1), wave = WAVE_DEFINITIONS[0];
  rejected(state, receipt, () => applyCampaignBattleResult(state, receipt,
    { waveNumber: 1, kills: wave.total, total: wave.total, won: true }), 'unclaimed-kills');
  rejected(state, receipt, () => applyCampaignBattleResult(state, receipt,
    { waveNumber: 2, kills: 0, total: wave.total, won: false }), 'invalid-outcome');
  rejected(state, receipt, () => applyCampaignBattleResult(state, receipt,
    { waveNumber: 1, kills: 0, total: wave.total, won: true }), 'invalid-outcome');
});

test('reward overflow preserves the pending receipt, XP, first-clear eligibility and balances', () => {
  const state = fresh(), receipt = createBattleRewardReceipt(1);
  state.gold = Number.MAX_SAFE_INTEGER;
  rejected(state, receipt, () => applyBattleKillRewards(state, receipt, { kills: 1, totalGold: 1 }, () => 0), 'resource-overflow');
  state.gold = 0;
  const wave = WAVE_DEFINITIONS[0];
  applyBattleKillRewards(state, receipt, { kills: wave.total, totalGold: wave.reward }, () => 0.9);
  state.gold = Number.MAX_SAFE_INTEGER;
  rejected(state, receipt, () => applyCampaignBattleResult(state, receipt,
    { waveNumber: 1, kills: wave.total, total: wave.total, won: true }), 'resource-overflow');
});

test('real combat cumulative output settles through the command boundary without changing simulation', () => {
  const state = fresh(); state.units = [{ id: 1, type: 'swordsman', level: 100, col: 2, row: 0 }];
  state.nextUnitId = 2;
  const battle = createBattle(state.units, 1, state.hero, state.forge, state.capitol), receipt = createBattleRewardReceipt(1);
  const initialGold = state.gold;
  let steps = 0;
  while (battle.phase === 'running' && steps++ < 60 * 180) {
    updateBattle(battle, 1 / 60);
    const result = applyBattleKillRewards(state, receipt, { kills: battle.kills, totalGold: battle.reward }, () => 0.9);
    assert.equal(result.ok, true);
  }
  assert.equal(battle.phase, 'victory');
  const result = applyCampaignBattleResult(state, receipt, { waveNumber: battle.waveNumber,
    kills: battle.kills, total: battle.total, won: true });
  assert.equal(result.ok, true);
  assert.equal(state.gold, initialGold + battle.reward + result.firstClearBonus);
});

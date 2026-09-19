import type { CampaignState } from './campaign-state.ts';
import { rollSlaveDrop, progressionAfterBattle } from './economy.ts';
import { awardHeroXp } from './hero.ts';
import type { HeroOutcome, HeroXpResult } from './hero.ts';
import { claimFirstClear } from './progression.ts';
import { WAVE_DEFINITIONS } from './waves.ts';
import { getDungeonLevel } from './dungeons.ts';
import type { DungeonRun } from './dungeon-run.ts';

export interface CampaignBattleResult {
  heroXp: HeroXpResult;
  firstClearBonus: number;
  clearedWaves: number;
}

/** Runtime receipt belongs to one battle; battles themselves are not persisted. */
export interface BattleRewardReceipt {
  readonly waveNumber: number;
  kills: number;
  gold: number;
  result: CampaignBattleResult | null;
}

const fail = <Reason extends string>(reason: Reason): { ok: false; reason: Reason } => ({ ok: false, reason });
const count = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const validWave = (wave: number): boolean => Number.isSafeInteger(wave) && wave >= 1 && wave <= WAVE_DEFINITIONS.length;
const validReceipt = (receipt: BattleRewardReceipt): boolean => receipt !== null && typeof receipt === 'object'
  && validWave(receipt.waveNumber) && count(receipt.kills) && count(receipt.gold);

/** One session-only run is one receipt; re-entry creates a new eligible run. */
export function applyDungeonRunReward(state: CampaignState, run: DungeonRun) {
  if (run.reward !== null) return fail('already-recorded');
  const level = getDungeonLevel(run.level.id);
  if (level?.tier !== 1) return fail('preview-only');
  if (run.stage !== 'complete' || run.waveIndex !== 2 || run.waves.length !== 3
    || run.battle?.phase !== 'victory' || run.battle.waveNumber !== 3
    || run.battle.kills !== run.battle.total) return fail('unfinished-run');
  const { gold, slaves } = level.completionReward;
  if (!count(state.gold) || state.gold > Number.MAX_SAFE_INTEGER - gold
    || !count(state.economy.slaves) || state.economy.slaves > Number.MAX_SAFE_INTEGER - slaves) return fail('resource-overflow');
  // Validate the whole grant first. Persist the resulting campaign snapshot before
  // enabling result actions; save retries write this balance, never grant again.
  state.gold += gold;
  state.economy.slaves += slaves;
  run.reward = Object.freeze({ gold, slaves });
  return { ok: true as const, gold, slaves };
}

export function createBattleRewardReceipt(waveNumber: number): BattleRewardReceipt {
  if (!validWave(waveNumber)) throw new RangeError('Invalid battle reward wave');
  return { waveNumber, kills: 0, gold: 0, result: null };
}

export function applyBattleKillRewards(state: CampaignState, receipt: BattleRewardReceipt,
  totals: { kills: number; totalGold: number }, random: () => number) {
  if (!validReceipt(receipt)) return fail('invalid-receipt');
  if (receipt.result !== null) return fail('already-recorded');
  if (!totals || !count(totals.kills) || !count(totals.totalGold)) return fail('invalid-totals');
  const wave = WAVE_DEFINITIONS[receipt.waveNumber - 1];
  if (totals.kills > wave.total || totals.totalGold > wave.reward) return fail('invalid-totals');
  const kills = totals.kills - receipt.kills, gold = totals.totalGold - receipt.gold;
  if (kills < 0 || gold < 0) return fail('stale-totals');
  if (kills === 0 && gold !== 0 || kills !== 0 && gold === 0) return fail('inconsistent-totals');
  if (!count(state.gold) || state.gold > Number.MAX_SAFE_INTEGER - gold) return fail('resource-overflow');
  if (kills === 0) return { ok: true as const, gold: 0, slaves: 0 };
  if (typeof random !== 'function') return fail('invalid-random');
  const economy = { ...state.economy };
  let slaves = 0;
  try {
    for (let index = 0; index < kills; index += 1) slaves += rollSlaveDrop(economy, () => {
      const roll = random();
      if (!Number.isFinite(roll) || roll < 0 || roll >= 1) throw new RangeError('Invalid capture random');
      return roll;
    });
  } catch { return fail('invalid-random'); }
  if (!count(economy.slaves) || !count(economy.captures) || !count(economy.captureKills)) return fail('resource-overflow');
  // Cumulative counters make a repeated frame harmless, including capture rolls.
  state.gold += gold; state.economy = economy;
  receipt.kills = totals.kills; receipt.gold = totals.totalGold;
  return { ok: true as const, gold, slaves };
}

export function applyCampaignBattleResult(state: CampaignState, receipt: BattleRewardReceipt, outcome: HeroOutcome) {
  if (!validReceipt(receipt)) return fail('invalid-receipt');
  if (receipt.result !== null) return fail('already-recorded');
  const wave = WAVE_DEFINITIONS[receipt.waveNumber - 1];
  if (!outcome || outcome.waveNumber !== receipt.waveNumber || !count(outcome.kills)
    || outcome.kills > wave.total || outcome.total !== wave.total || typeof outcome.won !== 'boolean'
    || outcome.won && outcome.kills !== outcome.total) return fail('invalid-outcome');
  if (outcome.kills !== receipt.kills) return fail('unclaimed-kills');
  const hero = { ...state.hero, talents: { ...state.hero.talents } };
  const progression = { ...state.progression, firstClears: [...state.progression.firstClears] };
  const heroXp = awardHeroXp(hero, outcome);
  const firstClearBonus = outcome.won ? claimFirstClear(progression, outcome.waveNumber) : 0;
  if (!count(state.gold) || state.gold > Number.MAX_SAFE_INTEGER - firstClearBonus) return fail('resource-overflow');
  const clearedWaves = progressionAfterBattle(outcome.waveNumber, outcome.won, WAVE_DEFINITIONS.length);
  const result = { heroXp, firstClearBonus, clearedWaves };
  state.gold += firstClearBonus; state.hero = hero; state.progression = progression; state.clearedWaves = clearedWaves;
  receipt.result = result;
  return { ok: true as const, ...result };
}

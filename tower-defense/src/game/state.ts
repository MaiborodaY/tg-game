import {
  BUILD_PADS,
  MASTERY_UNLOCK_WAVE,
  MAX_TOWER_LEVEL,
  STARTING_GOLD,
  STARTING_LIVES,
  TOWER_DEFINITIONS,
  getTowerTotalInvestment,
} from "./config.ts";
import type { CampaignError, CampaignResult, CampaignState, TowerLevel, TowerPlacement, TowerType } from "./types.ts";

export function createCampaignState(): CampaignState {
  return freezeState({
    version: 3,
    gold: STARTING_GOLD,
    lives: STARTING_LIVES,
    completedWave: 0,
    totalKills: 0,
    activeDurationMs: 0,
    towers: [],
  });
}

export function buildTower(state: CampaignState, padId: number, type: TowerType): CampaignResult {
  if (!isValidPad(padId)) return failure(state, "invalid_pad");
  if (state.towers.some((tower) => tower.padId === padId)) return failure(state, "pad_occupied");
  const cost = TOWER_DEFINITIONS[type].buildCost;
  if (state.gold < cost) return failure(state, "insufficient_gold");
  return success(state, {
    gold: state.gold - cost,
    towers: [...state.towers, Object.freeze({ padId, type, level: 1 as const })],
  }, -cost);
}

export function upgradeTower(state: CampaignState, padId: number): CampaignResult {
  const tower = state.towers.find((candidate) => candidate.padId === padId);
  if (!tower) return failure(state, isValidPad(padId) ? "pad_empty" : "invalid_pad");
  if (tower.level >= MAX_TOWER_LEVEL) return failure(state, "max_level");
  if (tower.level === 3 && state.completedWave < MASTERY_UNLOCK_WAVE) return failure(state, "mastery_locked");
  const cost = TOWER_DEFINITIONS[tower.type].upgradeCosts[tower.level - 1];
  if (state.gold < cost) return failure(state, "insufficient_gold");
  const towers = state.towers.map((candidate): TowerPlacement => candidate.padId === padId
    ? Object.freeze({ ...candidate, level: (candidate.level + 1) as TowerLevel })
    : candidate);
  return success(state, { gold: state.gold - cost, towers }, -cost);
}

export function sellTower(state: CampaignState, padId: number): CampaignResult {
  const tower = state.towers.find((candidate) => candidate.padId === padId);
  if (!tower) return failure(state, isValidPad(padId) ? "pad_empty" : "invalid_pad");
  const refund = Math.floor(getTowerTotalInvestment(tower.type, tower.level) * 0.65);
  return success(state, {
    gold: state.gold + refund,
    towers: state.towers.filter((candidate) => candidate.padId !== padId),
  }, refund);
}

export function awardEnemyKill(state: CampaignState, goldReward: number): CampaignState {
  const reward = clampInteger(goldReward, 0, 100_000);
  return freezeState({
    ...state,
    gold: state.gold + reward,
    totalKills: state.totalKills + 1,
  });
}

export function applyLeakDamage(state: CampaignState, damage: number): CampaignState {
  return freezeState({ ...state, lives: Math.max(0, state.lives - clampInteger(damage, 0, 100)) });
}

export function repairLives(state: CampaignState, amount: number): CampaignState {
  return freezeState({ ...state, lives: Math.min(STARTING_LIVES, state.lives + clampInteger(amount, 0, 100)) });
}

export function recordActiveDuration(state: CampaignState, durationMs: number): CampaignState {
  return freezeState({ ...state, activeDurationMs: clampInteger(durationMs, 0, Number.MAX_SAFE_INTEGER) });
}

export function createWaveCheckpoint(
  waveStart: CampaignState,
  liveState: CampaignState,
  activeDurationMs: number,
): CampaignState {
  return freezeState({
    ...waveStart,
    lives: Math.min(waveStart.lives, liveState.lives),
    activeDurationMs: clampInteger(activeDurationMs, 0, Number.MAX_SAFE_INTEGER),
  });
}

export function completeWave(state: CampaignState, wave: number, clearBonus: number): CampaignResult {
  if (wave !== state.completedWave + 1) return failure(state, "invalid_wave");
  const bonus = clampInteger(clearBonus, 0, 100_000);
  return success(state, {
    gold: state.gold + bonus,
    completedWave: wave,
  }, bonus);
}

export function getTower(state: CampaignState, padId: number): TowerPlacement | undefined {
  return state.towers.find((tower) => tower.padId === padId);
}

function success(
  state: CampaignState,
  patch: Partial<Pick<CampaignState, "gold" | "lives" | "completedWave" | "totalKills" | "activeDurationMs" | "towers">>,
  goldDelta: number,
): CampaignResult {
  return Object.freeze({ state: freezeState({ ...state, ...patch }), ok: true, error: null, goldDelta });
}

function failure(state: CampaignState, error: CampaignError): CampaignResult {
  return Object.freeze({ state, ok: false, error, goldDelta: 0 });
}

function freezeState(state: CampaignState): CampaignState {
  return Object.freeze({ ...state, towers: Object.freeze([...state.towers]) });
}

function isValidPad(padId: number): boolean {
  return Number.isInteger(padId) && padId >= 0 && padId < BUILD_PADS.length;
}

function clampInteger(value: number, min: number, max: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.floor(parsed))) : min;
}

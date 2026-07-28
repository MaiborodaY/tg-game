import {
  MASTERY_UNLOCK_WAVE,
  MAX_TOWER_LEVEL,
  TOWER_DEFINITIONS,
  getTowerTotalInvestment,
} from "./config.ts";
import {
  CAMPAIGN_RULESET,
  CLASSIC_CAMPAIGN_LEVEL,
  CONTENT_VERSION,
  getLevelDefinition,
  type LevelDefinition,
  type ModeRuleset,
} from "./content.ts";
import { getHeroUpgradeCost, getHeroUpgradeWaveGate } from "./heroes.ts";
import type {
  CampaignError,
  CampaignResult,
  CampaignState,
  HeroId,
  HeroLevel,
  TowerLevel,
  TowerPlacement,
  TowerType,
} from "./types.ts";

export type CreateRunStateOptions = Readonly<{
  level?: LevelDefinition;
  mode?: ModeRuleset;
  heroId?: HeroId;
}>;

export function createCampaignState(options: CreateRunStateOptions = {}): CampaignState {
  const level = options.level ?? CLASSIC_CAMPAIGN_LEVEL;
  const mode = options.mode ?? CAMPAIGN_RULESET;
  return freezeState({
    version: 5,
    contentVersion: CONTENT_VERSION,
    levelId: level.id,
    modeId: mode.id,
    gold: level.startingGold,
    lives: level.startingLives,
    completedWave: 0,
    totalKills: 0,
    activeDurationMs: 0,
    hero: Object.freeze({ id: options.heroId ?? "eira", level: 1, anchorId: 0 }),
    towers: [],
  });
}

export function moveHero(state: CampaignState, anchorId: number): CampaignResult {
  const level = getLevelDefinition(state.levelId);
  if (!level || !Number.isInteger(anchorId) || anchorId < 0 || anchorId >= level.heroAnchors.length) {
    return failure(state, "invalid_hero_anchor");
  }
  return success(state, {
    hero: Object.freeze({ ...state.hero, anchorId }),
  }, 0);
}

export function upgradeHero(state: CampaignState): CampaignResult {
  const currentLevel = state.hero.level;
  if (currentLevel >= 3) return failure(state, "hero_max_level");
  const gate = getHeroUpgradeWaveGate(currentLevel);
  if (gate !== null && state.completedWave < gate) return failure(state, "hero_upgrade_locked");
  const cost = getHeroUpgradeCost(state.hero.id, currentLevel);
  if (cost === null) return failure(state, "hero_max_level");
  if (state.gold < cost) return failure(state, "insufficient_gold");
  return success(state, {
    gold: state.gold - cost,
    hero: Object.freeze({ ...state.hero, level: (currentLevel + 1) as HeroLevel }),
  }, -cost);
}

export function buildTower(state: CampaignState, padId: number, type: TowerType): CampaignResult {
  if (!isValidPad(state, padId)) return failure(state, "invalid_pad");
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
  if (!tower) return failure(state, isValidPad(state, padId) ? "pad_empty" : "invalid_pad");
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
  if (!tower) return failure(state, isValidPad(state, padId) ? "pad_empty" : "invalid_pad");
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
  const maximumLives = getLevelDefinition(state.levelId)?.startingLives ?? state.lives;
  return freezeState({ ...state, lives: Math.min(maximumLives, state.lives + clampInteger(amount, 0, 100)) });
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
  patch: Partial<Pick<CampaignState, "gold" | "lives" | "completedWave" | "totalKills" | "activeDurationMs" | "hero" | "towers">>,
  goldDelta: number,
): CampaignResult {
  return Object.freeze({ state: freezeState({ ...state, ...patch }), ok: true, error: null, goldDelta });
}

function failure(state: CampaignState, error: CampaignError): CampaignResult {
  return Object.freeze({ state, ok: false, error, goldDelta: 0 });
}

function freezeState(state: CampaignState): CampaignState {
  return Object.freeze({
    ...state,
    hero: Object.freeze({ ...state.hero }),
    towers: Object.freeze([...state.towers]),
  });
}

function isValidPad(state: CampaignState, padId: number): boolean {
  const level = getLevelDefinition(state.levelId);
  return Boolean(level && Number.isInteger(padId) && padId >= 0 && padId < level.buildPads.length);
}

function clampInteger(value: number, min: number, max: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.floor(parsed))) : min;
}

import { WAVE_DEFINITIONS, CAMPAIGN_VERSION, WAVES_PER_LEVEL, WAVES_PER_ROUND } from './waves.mjs';

export const SAVE_KEY = 'brotd-infinity:campaign:v2';
export const STARTING_GOLD = 125;
export const STARTING_CELLS = Object.freeze(['2:0', '2:1', '2:2']);
export const MAX_CELLS = 15;
// Slaves recruit fighters; gold expands the army without competing for the same resource.
export const CELL_UNLOCK_COSTS = Object.freeze([25, 50, 100, 175, 275, 400, 550, 750, 1000, 1300, 1650, 2100]);
export const UNIT_UPGRADE_COSTS = Object.freeze([30, 250, 800]);

export const cellKey = (col, row) => `${col}:${row}`;
export const isValidCell = key => typeof key === 'string' && /^[0-4]:[0-2]$/.test(key);
export const unitUpgradeCost = level => UNIT_UPGRADE_COSTS[level - 1] ?? null;
export const unitInvestment = (baseCost, level) => baseCost + UNIT_UPGRADE_COSTS.slice(0, level - 1).reduce((sum, cost) => sum + cost, 0);

export function migrateCampaignSave(saved) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return null;
  if (saved.campaignVersion >= CAMPAIGN_VERSION) return saved;
  const rawCleared = Number(saved.clearedWaves);
  const legacyCleared = Number.isFinite(rawCleared) ? Math.max(0, Math.min(20, Math.floor(rawCleared))) : 0;
  // Preserve the pending wave's biome: old wave 11 becomes 2-1 wave 1 (global 201).
  // An old completed campaign continues at 2-2, instead of skipping the new rounds.
  const clearedWaves = legacyCleared < WAVES_PER_ROUND ? legacyCleared
    : WAVES_PER_LEVEL + legacyCleared - WAVES_PER_ROUND;
  const claims = Array.isArray(saved.progression?.firstClears) ? saved.progression.firstClears : [];
  const firstClears = [...new Set(claims.filter(wave => Number.isInteger(wave) && wave >= 1 && wave <= 20)
    .map(wave => wave <= WAVES_PER_ROUND ? wave : WAVES_PER_LEVEL + wave - WAVES_PER_ROUND))];
  return { ...saved, campaignVersion: CAMPAIGN_VERSION, clearedWaves,
    progression: { ...saved.progression, firstClears } };
}

export function createProgression(saved = {}) {
  return {
    unlockedCells: [...new Set([...STARTING_CELLS, ...(Array.isArray(saved?.unlockedCells) ? saved.unlockedCells.filter(isValidCell) : [])])],
    firstClears: [...new Set((Array.isArray(saved?.firstClears) ? saved.firstClears : []).filter(wave => Number.isInteger(wave) && wave >= 1 && wave <= WAVE_DEFINITIONS.length))],
  };
}

export function nextCellCost(progression) {
  return CELL_UNLOCK_COSTS[progression.unlockedCells.length - STARTING_CELLS.length] ?? null;
}

export function unlockCell(progression, gold, key) {
  const cost = nextCellCost(progression);
  if (cost === null || !isValidCell(key) || progression.unlockedCells.includes(key)
    || !Number.isFinite(gold) || gold < 0 || gold < cost) return { unlocked: false, gold };
  progression.unlockedCells.push(key);
  return { unlocked: true, gold: gold - cost };
}

export function claimFirstClear(progression, wave) {
  if (!Number.isInteger(wave) || wave < 1 || wave > WAVE_DEFINITIONS.length || progression.firstClears.includes(wave)) return 0;
  // Kept separately from retreatable wave progress; retries and replays cannot repeat the bonus.
  progression.firstClears.push(wave);
  return WAVE_DEFINITIONS[wave - 1].waveInRound * 10;
}

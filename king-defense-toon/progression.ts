import { WAVE_DEFINITIONS, CAMPAIGN_VERSION, WAVES_PER_LEVEL, WAVES_PER_ROUND } from './waves.ts';

export type CellKey = `${0 | 1 | 2 | 3 | 4}:${0 | 1 | 2}`;

export interface Progression {
  unlockedCells: CellKey[];
  firstClears: number[];
}

export interface CellUnlockResult {
  unlocked: boolean;
  gold: number;
}

export const SAVE_KEY = 'brotd-infinity:campaign:v2';
export const STARTING_GOLD = 125;
export const STARTING_CELLS = Object.freeze(['2:0', '2:1', '2:2'] as const);
export const MAX_CELLS = 15;
// Slaves recruit fighters; gold expands the army without competing for the same resource.
export const CELL_UNLOCK_COSTS = Object.freeze([25, 50, 100, 175, 275, 400, 550, 750, 1000, 1300, 1650, 2100]);
export const UNIT_UPGRADE_COSTS = Object.freeze([30, 250, 800]);

export const cellKey = (col: number, row: number): string => `${col}:${row}`;
export const isValidCell = (key: unknown): key is CellKey => typeof key === 'string' && /^[0-4]:[0-2]$/.test(key);
export const unitUpgradeCost = (level: number): number | null => UNIT_UPGRADE_COSTS[level - 1] ?? null;
export const unitInvestment = (baseCost: number, level: number): number => baseCost + UNIT_UPGRADE_COSTS.slice(0, level - 1).reduce((sum, cost) => sum + cost, 0);

// Saved fields remain unknown until validated. Boxing retains the old property-read
// and spread behavior even for legacy primitives, arrays, null and undefined.
function savedFields(value: unknown): Record<string, unknown> {
  return Object(value) as Record<string, unknown>;
}

// This migrates campaign numbering, not the entire save schema. Callers still
// validate gold, units, hero and other independent fields when loading them.
export function migrateCampaignSave(saved: unknown): Record<string, unknown> | null {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return null;
  const record = savedFields(saved);
  if (Number(record.campaignVersion) >= CAMPAIGN_VERSION) return record;
  const rawCleared = Number(record.clearedWaves);
  const legacyCleared = Number.isFinite(rawCleared) ? Math.max(0, Math.min(20, Math.floor(rawCleared))) : 0;
  // Preserve the pending wave's biome: old wave 11 becomes 2-1 wave 1 (global 201).
  // An old completed campaign continues at 2-2, instead of skipping the new rounds.
  const clearedWaves = legacyCleared < WAVES_PER_ROUND ? legacyCleared
    : WAVES_PER_LEVEL + legacyCleared - WAVES_PER_ROUND;
  const previousProgression = savedFields(record.progression);
  const claims: unknown[] = Array.isArray(previousProgression.firstClears) ? previousProgression.firstClears : [];
  const firstClears = [...new Set(claims.filter((wave): wave is number => typeof wave === 'number' && Number.isInteger(wave) && wave >= 1 && wave <= 20)
    .map(wave => wave <= WAVES_PER_ROUND ? wave : WAVES_PER_LEVEL + wave - WAVES_PER_ROUND))];
  return { ...record, campaignVersion: CAMPAIGN_VERSION, clearedWaves,
    progression: { ...previousProgression, firstClears } };
}

export function createProgression(saved: unknown = {}): Progression {
  const fields = savedFields(saved);
  const cells: unknown[] = Array.isArray(fields.unlockedCells) ? fields.unlockedCells : [];
  const claims: unknown[] = Array.isArray(fields.firstClears) ? fields.firstClears : [];
  return {
    unlockedCells: [...new Set([...STARTING_CELLS, ...cells.filter(isValidCell)])],
    firstClears: [...new Set(claims.filter((wave): wave is number => typeof wave === 'number' && Number.isInteger(wave) && wave >= 1 && wave <= WAVE_DEFINITIONS.length))],
  };
}

export function nextCellCost(progression: Progression): number | null {
  return CELL_UNLOCK_COSTS[progression.unlockedCells.length - STARTING_CELLS.length] ?? null;
}

export function unlockCell(progression: Progression, gold: number, key: string): CellUnlockResult {
  const cost = nextCellCost(progression);
  if (cost === null || !isValidCell(key) || progression.unlockedCells.includes(key)
    || !Number.isFinite(gold) || gold < 0 || gold < cost) return { unlocked: false, gold };
  progression.unlockedCells.push(key);
  return { unlocked: true, gold: gold - cost };
}

export function claimFirstClear(progression: Progression, wave: number): number {
  if (!Number.isInteger(wave) || wave < 1 || wave > WAVE_DEFINITIONS.length || progression.firstClears.includes(wave)) return 0;
  // Kept separately from retreatable wave progress; retries and replays cannot repeat the bonus.
  progression.firstClears.push(wave);
  return WAVE_DEFINITIONS[wave - 1].waveInRound * 10;
}

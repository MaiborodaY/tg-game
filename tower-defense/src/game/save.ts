import {
  CAMPAIGN_MODE_ID,
  CAMPAIGN_RULESET,
  CLASSIC_CAMPAIGN_LEVEL,
  CLASSIC_CAMPAIGN_LEVEL_ID,
  CONTENT_VERSION,
  MAX_ENDLESS_WAVE,
  getLevelDefinition,
  getModeRuleset,
} from "./content.ts";
import { createCampaignState } from "./state.ts";
import { isHeroId, isHeroLevel } from "./heroes.ts";
import type { CampaignState, HeroState, Point, TowerPlacement, TowerType } from "./types.ts";

export const LOCAL_SAVE_KEY = createLocalCampaignSaveKey(CLASSIC_CAMPAIGN_LEVEL_ID, CAMPAIGN_MODE_ID);
export const LEGACY_V3_LOCAL_SAVE_KEY = "td-save-v3:local";
export const LEGACY_SAVE_KEY = "td_save_v2";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type RunContentBinding = Readonly<{
  levelId: string;
  modeId: string;
}>;

export function createLocalCampaignSaveKey(levelId: string, modeId: string): string {
  return `td-save-v5:local:${levelId}:${modeId}`;
}

export function getCampaignSaveKey(
  runId: string | null,
  levelId = CLASSIC_CAMPAIGN_LEVEL_ID,
  modeId = CAMPAIGN_MODE_ID,
): string {
  return runId ? `td-save-v5:run:${runId}` : createLocalCampaignSaveKey(levelId, modeId);
}

export function loadCampaign(
  storage: StorageLike | null,
  key: string,
  expectedBinding?: RunContentBinding,
): CampaignState | null {
  if (!storage) return null;
  try {
    let raw = storage.getItem(key);
    let migratedFrom: string | null = null;
    if (!raw) {
      const legacyKey = legacyV4KeyForV5(key);
      if (!legacyKey) return null;
      raw = storage.getItem(legacyKey);
      migratedFrom = raw ? legacyKey : null;
    }
    if (!raw) return null;
    const campaign = sanitizeCampaign(JSON.parse(raw) as unknown);
    if (
      !campaign
      || (expectedBinding && (
        campaign.levelId !== expectedBinding.levelId
        || campaign.modeId !== expectedBinding.modeId
      ))
    ) return null;
    if (migratedFrom) persistMigration(storage, key, migratedFrom, campaign);
    return campaign;
  } catch {
    return null;
  }
}

export function saveCampaign(storage: StorageLike | null, key: string, state: CampaignState): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(state));
    const legacyKey = legacyV4KeyForV5(key);
    if (legacyKey) {
      try {
        storage.removeItem(legacyKey);
      } catch {
        // The v5 checkpoint is already durable; stale cleanup can retry later.
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function clearCampaign(storage: StorageLike | null, key: string): void {
  if (!storage) return;
  const keys = [key, legacyV4KeyForV5(key)].filter((candidate): candidate is string => Boolean(candidate));
  for (const candidate of keys) {
    try {
      storage.removeItem(candidate);
    } catch {
      // A blocked WebView storage must not prevent a restart.
    }
  }
}

export function migrateLegacyCampaign(storage: StorageLike | null, runId: string | null = null): CampaignState | null {
  if (!storage) return null;
  const legacyV3Key = runId ? `td-save-v3:run:${runId}` : LEGACY_V3_LOCAL_SAVE_KEY;
  try {
    const v3Raw = storage.getItem(legacyV3Key);
    if (v3Raw) {
      const migrated = sanitizeLegacyV3Campaign(JSON.parse(v3Raw) as unknown);
      if (migrated) {
        persistMigration(storage, getCampaignSaveKey(runId), legacyV3Key, migrated);
        return migrated;
      }
    }

    if (runId !== null) return null;
    const raw = storage.getItem(LEGACY_SAVE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as unknown;
    if (!isRecord(value)) return null;

    const usedPads = new Set<number>();
    const towers: TowerPlacement[] = [];
    if (Array.isArray(value.towers)) {
      for (const candidate of value.towers) {
        if (!isRecord(candidate)) continue;
        const row = finiteInteger(candidate.r);
        const column = finiteInteger(candidate.c);
        if (row === null || column === null) continue;
        const padId = nearestUnusedPad(
          column * 40 + 20,
          row * 40 + 20,
          CLASSIC_CAMPAIGN_LEVEL.buildPads,
          usedPads,
        );
        if (padId === null) continue;
        usedPads.add(padId);
        towers.push(Object.freeze({
          padId,
          type: candidate.type === "MAGE" ? "ember" : "ranger",
          level: 1,
        }));
      }
    }

    const initial = createCampaignState();
    const resumeWave = clampInteger(value.resumeWave, 1, 10_000, 1);
    const migrated = sanitizeCampaign({
      ...initial,
      gold: clampInteger(value.gold, 0, 10_000_000, initial.gold),
      lives: clampInteger(value.hp, 1, CLASSIC_CAMPAIGN_LEVEL.startingLives, CLASSIC_CAMPAIGN_LEVEL.startingLives),
      completedWave: Math.max(0, resumeWave - 1),
      towers,
    });
    if (!migrated) return null;
    persistMigration(storage, LOCAL_SAVE_KEY, LEGACY_SAVE_KEY, migrated);
    return migrated;
  } catch {
    return null;
  }
}

export function sanitizeCampaign(value: unknown): CampaignState | null {
  if (
    !isRecord(value)
    || (value.version !== 4 && value.version !== 5)
    || value.contentVersion !== CONTENT_VERSION
  ) return null;
  const level = typeof value.levelId === "string" ? getLevelDefinition(value.levelId) : null;
  const mode = typeof value.modeId === "string" ? getModeRuleset(value.modeId) : null;
  if (!level || !mode) return null;
  const hero = value.version === 4
    ? Object.freeze({ id: "eira", level: 1, anchorId: 0 } as const)
    : sanitizeHero(value.hero, level.heroAnchors.length);
  if (!hero) return null;

  const usedPads = new Set<number>();
  const towers: TowerPlacement[] = [];
  if (!Array.isArray(value.towers)) return null;
  for (const candidate of value.towers) {
    if (!isRecord(candidate)) continue;
    const padId = finiteInteger(candidate.padId);
    const type = sanitizeTowerType(candidate.type);
    const levelValue = finiteInteger(candidate.level);
    if (padId === null || padId < 0 || padId >= level.buildPads.length || usedPads.has(padId) || !type) continue;
    if (levelValue !== 1 && levelValue !== 2 && levelValue !== 3 && levelValue !== 4) continue;
    usedPads.add(padId);
    towers.push(Object.freeze({ padId, type, level: levelValue }));
  }

  const finalWave = mode.getFinalWave(level);
  return Object.freeze({
    version: 5,
    contentVersion: CONTENT_VERSION,
    levelId: level.id,
    modeId: mode.id,
    gold: clampInteger(value.gold, 0, 10_000_000, 0),
    lives: clampInteger(value.lives, 0, level.startingLives, level.startingLives),
    completedWave: clampInteger(value.completedWave, 0, finalWave ?? MAX_ENDLESS_WAVE, 0),
    totalKills: clampInteger(value.totalKills, 0, 100_000_000, 0),
    activeDurationMs: clampInteger(value.activeDurationMs, 0, Number.MAX_SAFE_INTEGER, 0),
    hero,
    towers: Object.freeze(towers),
  });
}

function sanitizeLegacyV3Campaign(value: unknown): CampaignState | null {
  if (!isRecord(value) || value.version !== 3 || !Array.isArray(value.towers)) return null;
  const initial = createCampaignState({ level: CLASSIC_CAMPAIGN_LEVEL, mode: CAMPAIGN_RULESET });
  return sanitizeCampaign({
    ...initial,
    gold: value.gold,
    lives: value.lives,
    completedWave: value.completedWave,
    totalKills: value.totalKills,
    activeDurationMs: value.activeDurationMs,
    towers: value.towers,
  });
}

function persistMigration(
  storage: StorageLike,
  destinationKey: string,
  legacyKey: string,
  state: CampaignState,
): void {
  try {
    storage.setItem(destinationKey, JSON.stringify(state));
    storage.removeItem(legacyKey);
  } catch {
    // The in-memory migration is still playable when WebView storage is blocked.
  }
}

function legacyV4KeyForV5(key: string): string | null {
  return key.startsWith("td-save-v5:") ? key.replace(/^td-save-v5:/, "td-save-v4:") : null;
}

function nearestUnusedPad(
  x: number,
  y: number,
  pads: readonly Point[],
  usedPads: ReadonlySet<number>,
): number | null {
  let bestPad: number | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  pads.forEach((pad, index) => {
    if (usedPads.has(index)) return;
    const distance = Math.pow(pad.x - x, 2) + Math.pow(pad.y - y, 2);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestPad = index;
    }
  });
  return bestPad;
}

function sanitizeTowerType(value: unknown): TowerType | null {
  return value === "ranger" || value === "frost" || value === "ember" || value === "storm" ? value : null;
}

function sanitizeHero(value: unknown, anchorCount: number): HeroState | null {
  if (!isRecord(value) || !isHeroId(value.id) || !isHeroLevel(value.level)) return null;
  const anchorId = finiteInteger(value.anchorId);
  if (anchorId === null || anchorId < 0 || anchorId >= anchorCount) return null;
  return Object.freeze({ id: value.id, level: value.level, anchorId });
}

function finiteInteger(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : null;
}

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = finiteInteger(value);
  return parsed === null ? fallback : Math.min(max, Math.max(min, parsed));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

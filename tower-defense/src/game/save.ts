import { BUILD_PADS, FINAL_WAVE, STARTING_LIVES } from "./config.ts";
import { createCampaignState } from "./state.ts";
import type { CampaignState, TowerPlacement, TowerType } from "./types.ts";

export const LOCAL_SAVE_KEY = "td-save-v3:local";
export const LEGACY_SAVE_KEY = "td_save_v2";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function getCampaignSaveKey(runId: string | null): string {
  return runId ? `td-save-v3:run:${runId}` : LOCAL_SAVE_KEY;
}

export function loadCampaign(storage: StorageLike | null, key: string): CampaignState | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return sanitizeCampaign(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function saveCampaign(storage: StorageLike | null, key: string, state: CampaignState): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearCampaign(storage: StorageLike | null, key: string): void {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // A blocked WebView storage must not prevent a restart.
  }
}

export function migrateLegacyCampaign(storage: StorageLike | null): CampaignState | null {
  if (!storage) return null;
  try {
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
        const padId = nearestUnusedPad(column * 40 + 20, row * 40 + 20, usedPads);
        if (padId === null) continue;
        usedPads.add(padId);
        towers.push(Object.freeze({
          padId,
          type: candidate.type === "MAGE" ? "ember" : "ranger",
          level: 1,
        }));
      }
    }

    const resumeWave = clampInteger(value.resumeWave, 1, 10_000, 1);
    const migrated = sanitizeCampaign({
      version: 3,
      gold: clampInteger(value.gold, 0, 10_000_000, createCampaignState().gold),
      lives: clampInteger(value.hp, 1, STARTING_LIVES, STARTING_LIVES),
      completedWave: Math.max(0, resumeWave - 1),
      totalKills: 0,
      activeDurationMs: 0,
      towers,
    });
    if (!migrated) return null;
    try {
      storage.setItem(LOCAL_SAVE_KEY, JSON.stringify(migrated));
      storage.removeItem(LEGACY_SAVE_KEY);
    } catch {
      // The in-memory migration is still playable when WebView storage is blocked.
    }
    return migrated;
  } catch {
    return null;
  }
}

export function sanitizeCampaign(value: unknown): CampaignState | null {
  if (!isRecord(value) || value.version !== 3) return null;
  const usedPads = new Set<number>();
  const towers: TowerPlacement[] = [];
  if (!Array.isArray(value.towers)) return null;

  for (const candidate of value.towers) {
    if (!isRecord(candidate)) continue;
    const padId = finiteInteger(candidate.padId);
    const type = sanitizeTowerType(candidate.type);
    const level = finiteInteger(candidate.level);
    if (padId === null || padId < 0 || padId >= BUILD_PADS.length || usedPads.has(padId) || !type) continue;
    if (level !== 1 && level !== 2 && level !== 3) continue;
    usedPads.add(padId);
    towers.push(Object.freeze({ padId, type, level }));
  }

  return Object.freeze({
    version: 3,
    gold: clampInteger(value.gold, 0, 10_000_000, 0),
    lives: clampInteger(value.lives, 0, STARTING_LIVES, STARTING_LIVES),
    completedWave: clampInteger(value.completedWave, 0, FINAL_WAVE, 0),
    totalKills: clampInteger(value.totalKills, 0, 100_000_000, 0),
    activeDurationMs: clampInteger(value.activeDurationMs, 0, Number.MAX_SAFE_INTEGER, 0),
    towers: Object.freeze(towers),
  });
}

function nearestUnusedPad(x: number, y: number, usedPads: ReadonlySet<number>): number | null {
  let bestPad: number | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  BUILD_PADS.forEach((pad, index) => {
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
  return value === "ranger" || value === "frost" || value === "ember" ? value : null;
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

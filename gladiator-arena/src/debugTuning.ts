import {
  DEFAULT_ENEMY_SCALE,
  DEFAULT_ENEMY_STAGE_X,
  DEFAULT_ENEMY_STAGE_Y,
  DEFAULT_PLAYER_SCALE,
  DEFAULT_PLAYER_STAGE_X,
  DEFAULT_PLAYER_STAGE_Y,
  DEFAULT_STAGE_ORIGIN_X,
  DEFAULT_STAGE_ORIGIN_Y,
} from "./arenaLayout";

export interface ArenaDebugTuning {
  showGrid: boolean;
  gridStep: number;
  gridOpacity: number;
  originX: number;
  originY: number;
  playerStageX: number;
  playerStageY: number;
  enemyStageX: number;
  enemyStageY: number;
  playerScale: number;
  enemyScale: number;
}

export const defaultDebugTuning: ArenaDebugTuning = {
  showGrid: true,
  gridStep: 40,
  gridOpacity: 0.22,
  originX: DEFAULT_STAGE_ORIGIN_X,
  originY: DEFAULT_STAGE_ORIGIN_Y,
  playerStageX: DEFAULT_PLAYER_STAGE_X,
  playerStageY: DEFAULT_PLAYER_STAGE_Y,
  enemyStageX: DEFAULT_ENEMY_STAGE_X,
  enemyStageY: DEFAULT_ENEMY_STAGE_Y,
  playerScale: DEFAULT_PLAYER_SCALE,
  enemyScale: DEFAULT_ENEMY_SCALE,
};

const storageKey = "dust-arena-debug-tuning";
const listeners = new Set<() => void>();

export const debugTuning: ArenaDebugTuning = loadDebugTuning();

export function updateDebugTuning(patch: Partial<ArenaDebugTuning>): void {
  Object.assign(debugTuning, normalizeDebugTuning({ ...debugTuning, ...patch }));
  saveDebugTuning(debugTuning);
  listeners.forEach((listener) => listener());
}

export function resetDebugTuning(): void {
  updateDebugTuning(defaultDebugTuning);
}

export function subscribeDebugTuning(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

export function normalizeDebugTuning(input: Partial<ArenaDebugTuning>): ArenaDebugTuning {
  return {
    showGrid: typeof input.showGrid === "boolean" ? input.showGrid : defaultDebugTuning.showGrid,
    gridStep: clampNumber(input.gridStep, 10, 100, defaultDebugTuning.gridStep),
    gridOpacity: clampNumber(input.gridOpacity, 0.1, 1, defaultDebugTuning.gridOpacity),
    originX: clampNumber(input.originX, 0, 430, defaultDebugTuning.originX),
    originY: clampNumber(input.originY, 0, 764, defaultDebugTuning.originY),
    playerStageX: clampNumber(input.playerStageX, -600, 600, defaultDebugTuning.playerStageX),
    playerStageY: clampNumber(input.playerStageY, -500, 500, defaultDebugTuning.playerStageY),
    enemyStageX: clampNumber(input.enemyStageX, -600, 600, defaultDebugTuning.enemyStageX),
    enemyStageY: clampNumber(input.enemyStageY, -500, 500, defaultDebugTuning.enemyStageY),
    playerScale: clampNumber(input.playerScale, 0.1, 6, defaultDebugTuning.playerScale),
    enemyScale: clampNumber(input.enemyScale, 0.1, 6, defaultDebugTuning.enemyScale),
  };
}

function loadDebugTuning(): ArenaDebugTuning {
  if (typeof window === "undefined") {
    return { ...defaultDebugTuning };
  }

  const raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    return { ...defaultDebugTuning };
  }

  try {
    return normalizeDebugTuning(JSON.parse(raw) as Partial<ArenaDebugTuning>);
  } catch {
    return { ...defaultDebugTuning };
  }
}

function saveDebugTuning(nextTuning: ArenaDebugTuning): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(nextTuning));
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, value));
}

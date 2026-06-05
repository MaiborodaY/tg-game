export interface ArenaDebugTuning {
  showGrid: boolean;
  gridStep: number;
  gridOpacity: number;
  playerXOffset: number;
  enemyXOffset: number;
  fighterYOffset: number;
  playerYOffset: number;
  enemyYOffset: number;
  playerScale: number;
  enemyScale: number;
  actionWheelScale: number;
  actionWheelOffsetX: number;
  actionWheelOffsetY: number;
}

export const defaultDebugTuning: ArenaDebugTuning = {
  showGrid: true,
  gridStep: 40,
  gridOpacity: 0.22,
  playerXOffset: 0,
  enemyXOffset: 0,
  fighterYOffset: 0,
  playerYOffset: 0,
  enemyYOffset: 0,
  playerScale: 1,
  enemyScale: 1,
  actionWheelScale: 1,
  actionWheelOffsetX: 0,
  actionWheelOffsetY: 0,
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
    playerXOffset: clampNumber(input.playerXOffset, -320, 320, defaultDebugTuning.playerXOffset),
    enemyXOffset: clampNumber(input.enemyXOffset, -320, 320, defaultDebugTuning.enemyXOffset),
    fighterYOffset: clampNumber(input.fighterYOffset, -320, 320, defaultDebugTuning.fighterYOffset),
    playerYOffset: clampNumber(input.playerYOffset, -240, 240, defaultDebugTuning.playerYOffset),
    enemyYOffset: clampNumber(input.enemyYOffset, -240, 240, defaultDebugTuning.enemyYOffset),
    playerScale: clampNumber(input.playerScale, 0.1, 6, defaultDebugTuning.playerScale),
    enemyScale: clampNumber(input.enemyScale, 0.1, 6, defaultDebugTuning.enemyScale),
    actionWheelScale: clampNumber(input.actionWheelScale, 0.2, 4, defaultDebugTuning.actionWheelScale),
    actionWheelOffsetX: clampNumber(input.actionWheelOffsetX, -260, 260, defaultDebugTuning.actionWheelOffsetX),
    actionWheelOffsetY: clampNumber(input.actionWheelOffsetY, -260, 260, defaultDebugTuning.actionWheelOffsetY),
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
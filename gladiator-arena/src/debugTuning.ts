export interface ArenaDebugTuning {
  playerXOffset: number;
  enemyXOffset: number;
  fighterYOffset: number;
  playerScale: number;
  enemyScale: number;
  actionWheelScale: number;
  actionWheelOffsetX: number;
  actionWheelOffsetY: number;
}

export const defaultDebugTuning: ArenaDebugTuning = {
  playerXOffset: 0,
  enemyXOffset: 0,
  fighterYOffset: 0,
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
    playerXOffset: clampNumber(input.playerXOffset, -180, 180, defaultDebugTuning.playerXOffset),
    enemyXOffset: clampNumber(input.enemyXOffset, -180, 180, defaultDebugTuning.enemyXOffset),
    fighterYOffset: clampNumber(input.fighterYOffset, -180, 180, defaultDebugTuning.fighterYOffset),
    playerScale: clampNumber(input.playerScale, 0.35, 2.2, defaultDebugTuning.playerScale),
    enemyScale: clampNumber(input.enemyScale, 0.35, 2.2, defaultDebugTuning.enemyScale),
    actionWheelScale: clampNumber(input.actionWheelScale, 0.55, 1.8, defaultDebugTuning.actionWheelScale),
    actionWheelOffsetX: clampNumber(input.actionWheelOffsetX, -160, 160, defaultDebugTuning.actionWheelOffsetX),
    actionWheelOffsetY: clampNumber(input.actionWheelOffsetY, -160, 160, defaultDebugTuning.actionWheelOffsetY),
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
import {
  DEFAULT_DICE_COUNT,
  DEFAULT_TARGET,
  isRollTarget,
  normalizeDiceCount,
  type RollTarget,
} from "./dice.ts";
import type { StorageLike } from "./history.ts";

export const PREFERENCES_STORAGE_KEY = "brodice.preferences.v1";

export type BroDicePreferences = Readonly<{
  diceCount: number;
  target: RollTarget;
  soundEnabled: boolean;
}>;

export const DEFAULT_PREFERENCES: BroDicePreferences = Object.freeze({
  diceCount: DEFAULT_DICE_COUNT,
  target: DEFAULT_TARGET,
  soundEnabled: true,
});

export function loadPreferences(storage: StorageLike | null): BroDicePreferences {
  if (!storage) return DEFAULT_PREFERENCES;
  try {
    const raw = storage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return DEFAULT_PREFERENCES;
    const candidate = value as Partial<BroDicePreferences>;
    return Object.freeze({
      diceCount: normalizeDiceCount(candidate.diceCount, DEFAULT_DICE_COUNT),
      target: isRollTarget(candidate.target) ? candidate.target : DEFAULT_TARGET,
      soundEnabled: typeof candidate.soundEnabled === "boolean" ? candidate.soundEnabled : true,
    });
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function persistPreferences(storage: StorageLike | null, preferences: BroDicePreferences): boolean {
  if (!storage) return false;
  try {
    storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}

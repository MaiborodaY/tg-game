import {
  CAMPAIGN_MODE_ID,
  CLASSIC_CAMPAIGN_LEVEL_ID,
  getLevelDefinition,
  getModeRuleset,
  type LevelDefinition,
  type ModeRuleset,
} from "./content.ts";
import type { StorageLike } from "./save.ts";

export const SESSION_SELECTION_KEY = "td-session-selection-v1";

export type SessionSelection = Readonly<{
  levelId: string;
  modeId: string;
}>;

export type ResolvedSessionSelection = Readonly<{
  selection: SessionSelection;
  level: LevelDefinition;
  mode: ModeRuleset;
  locked: boolean;
}>;

const DEFAULT_SELECTION: SessionSelection = Object.freeze({
  levelId: CLASSIC_CAMPAIGN_LEVEL_ID,
  modeId: CAMPAIGN_MODE_ID,
});

export function resolveSessionSelection(
  rewardMode: "local" | "server",
  candidate: unknown,
): ResolvedSessionSelection {
  const selection = rewardMode === "server" ? DEFAULT_SELECTION : sanitizeSelection(candidate) ?? DEFAULT_SELECTION;
  const level = getLevelDefinition(selection.levelId);
  const mode = getModeRuleset(selection.modeId);
  if (!level || !mode) throw new Error("Default Tower Defense content is unavailable.");
  return Object.freeze({ selection, level, mode, locked: rewardMode === "server" });
}

export function readSessionSelection(
  storage: StorageLike | null,
  rewardMode: "local" | "server",
): ResolvedSessionSelection {
  if (!storage || rewardMode === "server") return resolveSessionSelection(rewardMode, null);
  try {
    const raw = storage.getItem(SESSION_SELECTION_KEY);
    return resolveSessionSelection(rewardMode, raw ? JSON.parse(raw) : null);
  } catch {
    return resolveSessionSelection(rewardMode, null);
  }
}

export function writeSessionSelection(storage: StorageLike | null, selection: SessionSelection): boolean {
  const sanitized = sanitizeSelection(selection);
  if (!storage || !sanitized) return false;
  try {
    storage.setItem(SESSION_SELECTION_KEY, JSON.stringify(sanitized));
    return true;
  } catch {
    return false;
  }
}

function sanitizeSelection(value: unknown): SessionSelection | null {
  if (!isRecord(value) || typeof value.levelId !== "string" || typeof value.modeId !== "string") return null;
  if (!getLevelDefinition(value.levelId) || !getModeRuleset(value.modeId)) return null;
  return Object.freeze({ levelId: value.levelId, modeId: value.modeId });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

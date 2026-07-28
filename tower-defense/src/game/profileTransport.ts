import {
  sanitizePlayerProfileSnapshot,
  type PlayerProfileSnapshot,
} from "./profile.ts";

const PROFILE_TRANSPORT_KEYS = Object.freeze([
  "version",
  "revision",
  "unlocked_level_ids",
  "best_results",
  "owned_cosmetic_skins",
  "equipped_tower_skins",
] as const);
const BEST_RESULT_TRANSPORT_KEYS = Object.freeze([
  "level_id",
  "outcome",
  "completed_waves",
  "score",
  "duration_ms",
] as const);
const OWNED_SKIN_TRANSPORT_KEYS = Object.freeze(["skin_id", "tower_type"] as const);
const EQUIPPED_SKIN_TRANSPORT_KEYS = Object.freeze(["tower_type", "skin_id"] as const);

export function parsePlayerProfileTransport(value: unknown): PlayerProfileSnapshot | null {
  if (!hasExactKeys(value, PROFILE_TRANSPORT_KEYS)) return null;
  if (!Array.isArray(value.best_results)) return null;
  if (!Array.isArray(value.owned_cosmetic_skins)) return null;
  if (!Array.isArray(value.equipped_tower_skins)) return null;

  const bestResults = value.best_results.map((candidate) => {
    if (!hasExactKeys(candidate, BEST_RESULT_TRANSPORT_KEYS)) return null;
    return {
      levelId: candidate.level_id,
      outcome: candidate.outcome,
      completedWaves: candidate.completed_waves,
      score: candidate.score,
      durationMs: candidate.duration_ms,
    };
  });
  if (bestResults.some((candidate) => candidate === null)) return null;

  const ownedCosmeticSkins = value.owned_cosmetic_skins.map((candidate) => {
    if (!hasExactKeys(candidate, OWNED_SKIN_TRANSPORT_KEYS)) return null;
    return { skinId: candidate.skin_id, towerType: candidate.tower_type };
  });
  if (ownedCosmeticSkins.some((candidate) => candidate === null)) return null;

  const equippedTowerSkins = value.equipped_tower_skins.map((candidate) => {
    if (!hasExactKeys(candidate, EQUIPPED_SKIN_TRANSPORT_KEYS)) return null;
    return { towerType: candidate.tower_type, skinId: candidate.skin_id };
  });
  if (equippedTowerSkins.some((candidate) => candidate === null)) return null;

  return sanitizePlayerProfileSnapshot({
    version: value.version,
    revision: value.revision,
    unlockedLevelIds: value.unlocked_level_ids,
    bestResults,
    ownedCosmeticSkins,
    equippedTowerSkins,
  });
}

export function serializePlayerProfileTransport(profile: PlayerProfileSnapshot): unknown | null {
  const sanitized = sanitizePlayerProfileSnapshot(profile);
  if (!sanitized) return null;
  return Object.freeze({
    version: sanitized.version,
    revision: sanitized.revision,
    unlocked_level_ids: Object.freeze([...sanitized.unlockedLevelIds]),
    best_results: Object.freeze(sanitized.bestResults.map((result) => Object.freeze({
      level_id: result.levelId,
      outcome: result.outcome,
      completed_waves: result.completedWaves,
      score: result.score,
      duration_ms: result.durationMs,
    }))),
    owned_cosmetic_skins: Object.freeze(sanitized.ownedCosmeticSkins.map((skin) => Object.freeze({
      skin_id: skin.skinId,
      tower_type: skin.towerType,
    }))),
    equipped_tower_skins: Object.freeze(sanitized.equippedTowerSkins.map((skin) => Object.freeze({
      tower_type: skin.towerType,
      skin_id: skin.skinId,
    }))),
  });
}

function hasExactKeys<const TKeys extends readonly string[]>(
  value: unknown,
  keys: TKeys,
): value is Record<TKeys[number], unknown> {
  if (!isRecord(value)) return false;
  const actual = Object.keys(value).sort(compareText);
  const expected = [...keys].sort(compareText);
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

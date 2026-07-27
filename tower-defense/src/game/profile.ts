import type { TowerType } from "./types.ts";

export const PLAYER_PROFILE_VERSION = 1 as const;

export type CampaignOutcome = "defeat" | "victory";

export type CampaignBestResult = Readonly<{
  levelId: string;
  outcome: CampaignOutcome;
  completedWaves: number;
  score: number;
  durationMs: number;
}>;

export type OwnedCosmeticSkin = Readonly<{
  skinId: string;
  towerType: TowerType;
}>;

export type EquippedTowerSkin = Readonly<{
  towerType: TowerType;
  skinId: string;
}>;

// This snapshot contains cross-run progression only. Gold, lives, placed towers,
// timers, run credentials and other transient CampaignState data do not belong here.
export type PlayerProfileSnapshot = Readonly<{
  version: typeof PLAYER_PROFILE_VERSION;
  revision: number;
  unlockedLevelIds: readonly string[];
  bestResults: readonly CampaignBestResult[];
  ownedCosmeticSkins: readonly OwnedCosmeticSkin[];
  equippedTowerSkins: readonly EquippedTowerSkin[];
}>;

export type PlayerProfileMutationError =
  | "invalid_level_id"
  | "invalid_best_result"
  | "level_locked"
  | "invalid_skin"
  | "skin_id_conflict"
  | "invalid_tower_type"
  | "skin_not_owned"
  | "skin_target_mismatch"
  | "profile_limit_reached"
  | "revision_exhausted";

export type PlayerProfileMutationResult = Readonly<{
  profile: PlayerProfileSnapshot;
  changed: boolean;
  error: PlayerProfileMutationError | null;
}>;

const TOWER_TYPES = Object.freeze(["ranger", "frost", "ember", "storm"] as const);
const TOWER_TYPE_ORDER = new Map<TowerType, number>(TOWER_TYPES.map((type, index) => [type, index]));
const PROFILE_KEYS = Object.freeze([
  "version",
  "revision",
  "unlockedLevelIds",
  "bestResults",
  "ownedCosmeticSkins",
  "equippedTowerSkins",
] as const);
const BEST_RESULT_KEYS = Object.freeze([
  "levelId",
  "outcome",
  "completedWaves",
  "score",
  "durationMs",
] as const);
const OWNED_SKIN_KEYS = Object.freeze(["skinId", "towerType"] as const);
const EQUIPPED_SKIN_KEYS = Object.freeze(["towerType", "skinId"] as const);
const CONTENT_ID_PATTERN = /^[a-z0-9][a-z0-9._:-]{0,95}$/;
const MAX_LEVELS = 512;
const MAX_BEST_RESULTS = 512;
const MAX_OWNED_SKINS = 1_024;

export function createPlayerProfileSnapshot(): PlayerProfileSnapshot {
  return freezeProfile({
    version: PLAYER_PROFILE_VERSION,
    revision: 0,
    unlockedLevelIds: [],
    bestResults: [],
    ownedCosmeticSkins: [],
    equippedTowerSkins: [],
  });
}

export function sanitizePlayerProfileSnapshot(value: unknown): PlayerProfileSnapshot | null {
  if (!hasExactKeys(value, PROFILE_KEYS) || value.version !== PLAYER_PROFILE_VERSION) return null;
  const revision = readNonNegativeInteger(value.revision);
  if (revision === null) return null;

  const unlockedLevelIds = readUniqueContentIds(value.unlockedLevelIds, MAX_LEVELS);
  if (!unlockedLevelIds) return null;
  const unlocked = new Set(unlockedLevelIds);

  if (!Array.isArray(value.bestResults) || value.bestResults.length > MAX_BEST_RESULTS) return null;
  const bestResults: CampaignBestResult[] = [];
  const resultLevels = new Set<string>();
  for (const candidate of value.bestResults) {
    const result = readBestResult(candidate);
    if (!result || !unlocked.has(result.levelId) || resultLevels.has(result.levelId)) return null;
    resultLevels.add(result.levelId);
    bestResults.push(result);
  }

  if (!Array.isArray(value.ownedCosmeticSkins) || value.ownedCosmeticSkins.length > MAX_OWNED_SKINS) return null;
  const ownedCosmeticSkins: OwnedCosmeticSkin[] = [];
  const ownedById = new Map<string, OwnedCosmeticSkin>();
  for (const candidate of value.ownedCosmeticSkins) {
    const skin = readOwnedSkin(candidate);
    if (!skin || ownedById.has(skin.skinId)) return null;
    ownedById.set(skin.skinId, skin);
    ownedCosmeticSkins.push(skin);
  }

  if (!Array.isArray(value.equippedTowerSkins) || value.equippedTowerSkins.length > TOWER_TYPES.length) return null;
  const equippedTowerSkins: EquippedTowerSkin[] = [];
  const equippedTypes = new Set<TowerType>();
  for (const candidate of value.equippedTowerSkins) {
    const equipped = readEquippedSkin(candidate);
    const owned = equipped ? ownedById.get(equipped.skinId) : undefined;
    if (!equipped || equippedTypes.has(equipped.towerType) || !owned || owned.towerType !== equipped.towerType) return null;
    equippedTypes.add(equipped.towerType);
    equippedTowerSkins.push(equipped);
  }

  return freezeProfile({
    version: PLAYER_PROFILE_VERSION,
    revision,
    unlockedLevelIds: unlockedLevelIds.sort(compareText),
    bestResults: bestResults.sort((left, right) => compareText(left.levelId, right.levelId)),
    ownedCosmeticSkins: ownedCosmeticSkins.sort((left, right) => compareText(left.skinId, right.skinId)),
    equippedTowerSkins: equippedTowerSkins.sort(compareEquippedSkins),
  });
}

export function unlockCampaignLevel(profile: PlayerProfileSnapshot, levelIdValue: unknown): PlayerProfileMutationResult {
  const levelId = readContentId(levelIdValue);
  if (!levelId) return failure(profile, "invalid_level_id");
  if (profile.unlockedLevelIds.includes(levelId)) return unchanged(profile);
  if (profile.unlockedLevelIds.length >= MAX_LEVELS) return failure(profile, "profile_limit_reached");
  return updateProfile(profile, {
    unlockedLevelIds: [...profile.unlockedLevelIds, levelId].sort(compareText),
  });
}

export function recordCampaignBestResult(
  profile: PlayerProfileSnapshot,
  candidateValue: unknown,
): PlayerProfileMutationResult {
  const candidate = readBestResult(candidateValue);
  if (!candidate) return failure(profile, "invalid_best_result");
  if (!profile.unlockedLevelIds.includes(candidate.levelId)) return failure(profile, "level_locked");

  const current = profile.bestResults.find((result) => result.levelId === candidate.levelId);
  if (current && compareBestResults(candidate, current) <= 0) return unchanged(profile);
  if (!current && profile.bestResults.length >= MAX_BEST_RESULTS) return failure(profile, "profile_limit_reached");

  const bestResults = profile.bestResults
    .filter((result) => result.levelId !== candidate.levelId)
    .concat(candidate)
    .sort((left, right) => compareText(left.levelId, right.levelId));
  return updateProfile(profile, { bestResults });
}

export function grantCosmeticSkin(
  profile: PlayerProfileSnapshot,
  skinValue: unknown,
): PlayerProfileMutationResult {
  const skin = readOwnedSkin(skinValue);
  if (!skin) return failure(profile, "invalid_skin");
  const existing = profile.ownedCosmeticSkins.find((candidate) => candidate.skinId === skin.skinId);
  if (existing) {
    return existing.towerType === skin.towerType
      ? unchanged(profile)
      : failure(profile, "skin_id_conflict");
  }
  if (profile.ownedCosmeticSkins.length >= MAX_OWNED_SKINS) return failure(profile, "profile_limit_reached");
  return updateProfile(profile, {
    ownedCosmeticSkins: [...profile.ownedCosmeticSkins, skin]
      .sort((left, right) => compareText(left.skinId, right.skinId)),
  });
}

export function equipTowerSkin(
  profile: PlayerProfileSnapshot,
  towerTypeValue: unknown,
  skinIdValue: unknown,
): PlayerProfileMutationResult {
  if (!isTowerType(towerTypeValue)) return failure(profile, "invalid_tower_type");
  const skinId = readContentId(skinIdValue);
  if (!skinId) return failure(profile, "invalid_skin");
  const owned = profile.ownedCosmeticSkins.find((skin) => skin.skinId === skinId);
  if (!owned) return failure(profile, "skin_not_owned");
  if (owned.towerType !== towerTypeValue) return failure(profile, "skin_target_mismatch");

  const current = profile.equippedTowerSkins.find((skin) => skin.towerType === towerTypeValue);
  if (current?.skinId === skinId) return unchanged(profile);
  const equippedTowerSkins = profile.equippedTowerSkins
    .filter((skin) => skin.towerType !== towerTypeValue)
    .concat(Object.freeze({ towerType: towerTypeValue, skinId }))
    .sort(compareEquippedSkins);
  return updateProfile(profile, { equippedTowerSkins });
}

export function unequipTowerSkin(
  profile: PlayerProfileSnapshot,
  towerTypeValue: unknown,
): PlayerProfileMutationResult {
  if (!isTowerType(towerTypeValue)) return failure(profile, "invalid_tower_type");
  if (!profile.equippedTowerSkins.some((skin) => skin.towerType === towerTypeValue)) return unchanged(profile);
  return updateProfile(profile, {
    equippedTowerSkins: profile.equippedTowerSkins.filter((skin) => skin.towerType !== towerTypeValue),
  });
}

function compareBestResults(left: CampaignBestResult, right: CampaignBestResult): number {
  const outcomeDifference = outcomeRank(left.outcome) - outcomeRank(right.outcome);
  if (outcomeDifference !== 0) return outcomeDifference;
  if (left.completedWaves !== right.completedWaves) return left.completedWaves - right.completedWaves;
  if (left.score !== right.score) return left.score - right.score;
  return comparableDuration(right.durationMs) - comparableDuration(left.durationMs);
}

function updateProfile(
  profile: PlayerProfileSnapshot,
  patch: Partial<Pick<PlayerProfileSnapshot, "unlockedLevelIds" | "bestResults" | "ownedCosmeticSkins" | "equippedTowerSkins">>,
): PlayerProfileMutationResult {
  if (profile.revision >= Number.MAX_SAFE_INTEGER) return failure(profile, "revision_exhausted");
  return Object.freeze({
    profile: freezeProfile({ ...profile, ...patch, revision: profile.revision + 1 }),
    changed: true,
    error: null,
  });
}

function unchanged(profile: PlayerProfileSnapshot): PlayerProfileMutationResult {
  return Object.freeze({ profile, changed: false, error: null });
}

function failure(profile: PlayerProfileSnapshot, error: PlayerProfileMutationError): PlayerProfileMutationResult {
  return Object.freeze({ profile, changed: false, error });
}

function freezeProfile(profile: PlayerProfileSnapshot): PlayerProfileSnapshot {
  return Object.freeze({
    version: PLAYER_PROFILE_VERSION,
    revision: profile.revision,
    unlockedLevelIds: Object.freeze([...profile.unlockedLevelIds]),
    bestResults: Object.freeze(profile.bestResults.map((result) => Object.freeze({ ...result }))),
    ownedCosmeticSkins: Object.freeze(profile.ownedCosmeticSkins.map((skin) => Object.freeze({ ...skin }))),
    equippedTowerSkins: Object.freeze(profile.equippedTowerSkins.map((skin) => Object.freeze({ ...skin }))),
  });
}

function readBestResult(value: unknown): CampaignBestResult | null {
  if (!hasExactKeys(value, BEST_RESULT_KEYS)) return null;
  const levelId = readContentId(value.levelId);
  const outcome = value.outcome === "defeat" || value.outcome === "victory" ? value.outcome : null;
  const completedWaves = readNonNegativeInteger(value.completedWaves);
  const score = readNonNegativeInteger(value.score);
  const durationMs = readNonNegativeInteger(value.durationMs);
  return levelId && outcome && completedWaves !== null && score !== null && durationMs !== null
    ? Object.freeze({ levelId, outcome, completedWaves, score, durationMs })
    : null;
}

function readOwnedSkin(value: unknown): OwnedCosmeticSkin | null {
  if (!hasExactKeys(value, OWNED_SKIN_KEYS)) return null;
  const skinId = readContentId(value.skinId);
  return skinId && isTowerType(value.towerType)
    ? Object.freeze({ skinId, towerType: value.towerType })
    : null;
}

function readEquippedSkin(value: unknown): EquippedTowerSkin | null {
  if (!hasExactKeys(value, EQUIPPED_SKIN_KEYS)) return null;
  const skinId = readContentId(value.skinId);
  return skinId && isTowerType(value.towerType)
    ? Object.freeze({ towerType: value.towerType, skinId })
    : null;
}

function readUniqueContentIds(value: unknown, maxItems: number): string[] | null {
  if (!Array.isArray(value) || value.length > maxItems) return null;
  const ids: string[] = [];
  const unique = new Set<string>();
  for (const candidate of value) {
    const id = readContentId(candidate);
    if (!id || unique.has(id)) return null;
    unique.add(id);
    ids.push(id);
  }
  return ids;
}

function readContentId(value: unknown): string | null {
  return typeof value === "string" && CONTENT_ID_PATTERN.test(value) ? value : null;
}

function readNonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function isTowerType(value: unknown): value is TowerType {
  return typeof value === "string" && TOWER_TYPES.includes(value as TowerType);
}

function outcomeRank(outcome: CampaignOutcome): number {
  return outcome === "victory" ? 1 : 0;
}

function comparableDuration(durationMs: number): number {
  return durationMs > 0 ? durationMs : Number.MAX_SAFE_INTEGER;
}

function compareEquippedSkins(left: EquippedTowerSkin, right: EquippedTowerSkin): number {
  return (TOWER_TYPE_ORDER.get(left.towerType) ?? 0) - (TOWER_TYPE_ORDER.get(right.towerType) ?? 0);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

import {
  BUILD_PADS,
  ENEMY_DEFINITIONS,
  FINAL_WAVE,
  GAME_HEIGHT,
  GAME_WIDTH,
  ROUTE_POINTS,
  STARTING_GOLD,
  STARTING_LIVES,
} from "./config.ts";
import type { LevelProgression, Point, WavePlan, WaveSpawn } from "./types.ts";
import type { TranslationKey } from "../i18n.ts";
import { calculateRatingScore } from "./scoring.ts";
import {
  NORTHERN_PASS_BUILD_PADS,
  NORTHERN_PASS_FINAL_WAVE,
  NORTHERN_PASS_HERO_ANCHORS,
  NORTHERN_PASS_PROGRESSION,
  NORTHERN_PASS_ROUTE,
  createNorthernPassWave,
} from "./northernPassContent.ts";
import { createWavePlan } from "./waves.ts";

export const CONTENT_VERSION = 2 as const;

export const CLASSIC_CAMPAIGN_LEVEL_ID = "forest-gate";
export const LEGACY_NORTHERN_PASS_LEVEL_ID = "northern-pass";
export const NORTHERN_PASS_LEVEL_ID = "northern-pass-v3";
export const CAMPAIGN_MODE_ID = "campaign";
export const ENDLESS_MODE_ID = "endless";
export const MAX_ENDLESS_WAVE = 1_000_000;

export type WaveDefinition = WavePlan;

export type WaveSource = Readonly<{
  id: string;
  contentVersion: typeof CONTENT_VERSION;
  kind: "finite";
  finalWave: number;
  createWave(wave: number): WaveDefinition;
}>;

export type LevelDefinition = Readonly<{
  id: string;
  displayNameKey: TranslationKey;
  contentVersion: typeof CONTENT_VERSION;
  width: number;
  height: number;
  startingGold: number;
  startingLives: number;
  route: readonly Point[];
  buildPads: readonly Point[];
  heroAnchors: readonly Point[];
  signalFires: readonly Point[];
  progression: LevelProgression;
  waves: WaveSource;
}>;

export type ModeRuleset = Readonly<{
  id: string;
  displayNameKey: TranslationKey;
  resultSummaryKey: TranslationKey;
  contentVersion: typeof CONTENT_VERSION;
  kind: "campaign" | "endless";
  scorePolicy: "legacy_campaign_rating" | "waves_survived";
  calculateScore(completedWave: number): number;
  getFinalWave(level: LevelDefinition): number | null;
  createWave(level: LevelDefinition, wave: number): WaveDefinition;
  isComplete(level: LevelDefinition, completedWave: number): boolean;
}>;

export type ContentCatalog = Readonly<{
  contentVersion: typeof CONTENT_VERSION;
  levels: Readonly<Record<string, LevelDefinition>>;
  modes: Readonly<Record<string, ModeRuleset>>;
}>;

export function createClassicCampaignWave(wave: number): WaveDefinition {
  const index = requireWaveIndex(wave, FINAL_WAVE);
  return freezeWave(createWavePlan(index));
}

const classicWaveSource = defineWaveSource("classic-campaign-v1", FINAL_WAVE, createClassicCampaignWave);

export const CLASSIC_CAMPAIGN_LEVEL = defineLevel({
  id: CLASSIC_CAMPAIGN_LEVEL_ID,
  displayNameKey: "level_forest_gate",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  startingGold: STARTING_GOLD,
  startingLives: STARTING_LIVES,
  route: ROUTE_POINTS,
  buildPads: BUILD_PADS,
  heroAnchors: [
    { x: 350, y: 88 },
    { x: 34, y: 382 },
    { x: 345, y: 492 },
  ],
  signalFires: [],
  progression: Object.freeze({
    heroUpgradeWaves: Object.freeze([4, 12]) as readonly [number, number],
    masteryWave: 12,
    awakeningWave: 20,
    actSize: 8,
  }),
  waves: classicWaveSource,
});

export { createNorthernPassWave } from "./northernPassContent.ts";

const northernPassWaveSource = defineWaveSource(
  "northern-pass-campaign-v3",
  NORTHERN_PASS_FINAL_WAVE,
  createNorthernPassWave,
);

export const NORTHERN_PASS_LEVEL = defineLevel({
  id: NORTHERN_PASS_LEVEL_ID,
  displayNameKey: "level_northern_pass",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  startingGold: 190,
  startingLives: 8,
  route: NORTHERN_PASS_ROUTE,
  buildPads: NORTHERN_PASS_BUILD_PADS,
  heroAnchors: NORTHERN_PASS_HERO_ANCHORS,
  signalFires: [],
  progression: NORTHERN_PASS_PROGRESSION,
  waves: northernPassWaveSource,
});

export const CAMPAIGN_RULESET: ModeRuleset = Object.freeze({
  id: CAMPAIGN_MODE_ID,
  displayNameKey: "mode_campaign",
  resultSummaryKey: "result_summary",
  contentVersion: CONTENT_VERSION,
  kind: "campaign",
  scorePolicy: "legacy_campaign_rating",
  calculateScore: calculateRatingScore,
  getFinalWave: (level) => level.waves.finalWave,
  createWave: (level, wave) => level.waves.createWave(wave),
  isComplete: (level, completedWave) => normalizeCompletedWave(completedWave) >= level.waves.finalWave,
});

export const ENDLESS_RULESET: ModeRuleset = Object.freeze({
  id: ENDLESS_MODE_ID,
  displayNameKey: "mode_endless",
  resultSummaryKey: "result_summary_endless",
  contentVersion: CONTENT_VERSION,
  kind: "endless",
  scorePolicy: "waves_survived",
  calculateScore: normalizeCompletedWave,
  getFinalWave: () => null,
  createWave: createEndlessWave,
  // Operational safety cap: effectively endless for players, finite for integer IDs and persistence.
  isComplete: (_level, completedWave) => normalizeCompletedWave(completedWave) >= MAX_ENDLESS_WAVE,
});

const levels = Object.freeze({
  [CLASSIC_CAMPAIGN_LEVEL_ID]: CLASSIC_CAMPAIGN_LEVEL,
  [NORTHERN_PASS_LEVEL_ID]: NORTHERN_PASS_LEVEL,
});

const modes = Object.freeze({
  [CAMPAIGN_MODE_ID]: CAMPAIGN_RULESET,
  [ENDLESS_MODE_ID]: ENDLESS_RULESET,
});

const catalog: ContentCatalog = Object.freeze({
  contentVersion: CONTENT_VERSION,
  levels,
  modes,
});

assertValidContentCatalog(catalog);

export const CONTENT_CATALOG = catalog;

export function getLevelDefinition(id: string): LevelDefinition | null {
  return Object.hasOwn(CONTENT_CATALOG.levels, id) ? CONTENT_CATALOG.levels[id] : null;
}

export function getModeRuleset(id: string): ModeRuleset | null {
  return Object.hasOwn(CONTENT_CATALOG.modes, id) ? CONTENT_CATALOG.modes[id] : null;
}

export function validateContentCatalog(value: unknown): readonly string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return Object.freeze(["catalog must be an object"]);
  if (value.contentVersion !== CONTENT_VERSION) errors.push(`catalog.contentVersion must be ${CONTENT_VERSION}`);
  if (!Object.isFrozen(value)) errors.push("catalog must be frozen");

  const levelValues = validateRecord(value.levels, "levels", errors);
  const modeValues = validateRecord(value.modes, "modes", errors);
  const validLevels: LevelDefinition[] = [];

  for (const [key, candidate] of levelValues) {
    const levelErrors = validateLevelDefinition(candidate);
    errors.push(...levelErrors.map((error) => `levels.${key}.${error}`));
    if (levelErrors.length === 0) {
      const level = candidate as LevelDefinition;
      validLevels.push(level);
      if (key !== level.id) errors.push(`levels.${key}.id must match its catalog key`);
    }
  }

  for (const [key, candidate] of modeValues) {
    const modeErrors = validateModeRuleset(candidate, validLevels[0]);
    errors.push(...modeErrors.map((error) => `modes.${key}.${error}`));
    if (modeErrors.length === 0 && key !== (candidate as ModeRuleset).id) {
      errors.push(`modes.${key}.id must match its catalog key`);
    }
  }

  if (levelValues.length === 0) errors.push("levels must not be empty");
  if (modeValues.length === 0) errors.push("modes must not be empty");
  return Object.freeze(errors);
}

export function assertValidContentCatalog(value: unknown): asserts value is ContentCatalog {
  const errors = validateContentCatalog(value);
  if (errors.length > 0) throw new Error(`Invalid Tower Defense content catalog: ${errors.join("; ")}`);
}

export function validateLevelDefinition(value: unknown): readonly string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return Object.freeze(["level must be an object"]);
  if (!validId(value.id)) errors.push("id must be a stable lowercase identifier");
  if (typeof value.displayNameKey !== "string") errors.push("displayNameKey must be a translation key");
  if (value.contentVersion !== CONTENT_VERSION) errors.push(`contentVersion must be ${CONTENT_VERSION}`);
  if (!positiveInteger(value.width)) errors.push("width must be a positive integer");
  if (!positiveInteger(value.height)) errors.push("height must be a positive integer");
  if (!nonNegativeInteger(value.startingGold)) errors.push("startingGold must be a non-negative integer");
  if (!positiveInteger(value.startingLives)) errors.push("startingLives must be a positive integer");
  validatePoints(value.route, "route", 2, value.width, value.height, errors, true);
  validatePoints(value.buildPads, "buildPads", 1, value.width, value.height, errors, false);
  validatePoints(value.heroAnchors, "heroAnchors", 3, value.width, value.height, errors, false);
  validatePoints(value.signalFires, "signalFires", 0, value.width, value.height, errors, false);
  if (Array.isArray(value.heroAnchors) && value.heroAnchors.length !== 3) {
    errors.push("heroAnchors must contain exactly 3 points");
  }
  if (Array.isArray(value.signalFires) && value.signalFires.length !== 0 && value.signalFires.length !== 3) {
    errors.push("signalFires must be empty or contain exactly 3 points");
  }
  errors.push(...validateProgression(value.progression, isRecord(value.waves) ? value.waves.finalWave : null));
  errors.push(...validateWaveSource(value.waves).map((error) => `waves.${error}`));
  if (!Object.isFrozen(value)) errors.push("level must be frozen");
  return Object.freeze(errors);
}

function createEndlessWave(level: LevelDefinition, wave: number): WaveDefinition {
  const index = requireWaveIndex(wave, MAX_ENDLESS_WAVE);
  const cycleLength = level.waves.finalWave;
  const cycle = Math.floor((index - 1) / cycleLength);
  const localWave = ((index - 1) % cycleLength) + 1;
  const source = level.waves.createWave(localWave);
  const healthMultiplier = endlessHealthMultiplier(level, source, cycle, localWave);
  const speedMultiplier = Math.min(1.55, 1 + cycle * 0.06);
  const rewardMultiplier = 1 + cycle * 0.18;
  const scaledClearBonus = Math.ceil(source.clearBonus * (1 + cycle * 0.25));
  const scaledSpawnReward = source.spawns.reduce(
    (total, spawn) => total + Math.max(0, Math.ceil(spawn.reward * rewardMultiplier)),
    0,
  );
  const preliminaryReward = scaledSpawnReward + scaledClearBonus;
  const rewardFloor = endlessRewardFloor(level, cycle, localWave);
  const continuityBonus = Math.max(0, rewardFloor - preliminaryReward);
  const spawns = source.spawns.map((spawn, spawnIndex): WaveSpawn => Object.freeze({
    ...spawn,
    id: index * 100_000 + spawnIndex,
    maxHp: Math.max(1, Math.round(spawn.maxHp * healthMultiplier)),
    speed: spawn.speed * speedMultiplier,
    reward: Math.max(0, Math.ceil(spawn.reward * rewardMultiplier)),
    physicalResistance: Math.min(0.78, spawn.physicalResistance + cycle * 0.018),
    magicResistance: Math.min(0.78, spawn.magicResistance + cycle * 0.018),
    controlResistance: Math.min(0.9, spawn.controlResistance + cycle * 0.025),
    elite: spawn.elite || (cycle > 0 && !isBoss(spawn) && (spawnIndex + index) % Math.max(3, 8 - cycle) === 0),
    bossTier: cycle > 0 ? 3 : spawn.bossTier,
    summonThresholds: Object.freeze([...spawn.summonThresholds]),
  }));

  return freezeWave({
    ...source,
    wave: index,
    spawns,
    clearBonus: scaledClearBonus + continuityBonus,
    act: cycle > 0 ? 3 : source.act,
    threat: (cycle > 0 ? 5 : source.threat) as 1 | 2 | 3 | 4 | 5,
  });
}

function endlessRewardFloor(level: LevelDefinition, cycle: number, localWave: number): number {
  if (cycle === 0) return 0;
  const finalWave = level.waves.createWave(level.waves.finalWave);
  const finalWaveReward = totalWaveReward(finalWave);
  const progress = level.waves.finalWave <= 1 ? 1 : (localWave - 1) / (level.waves.finalWave - 1);
  // A new cycle keeps the previous finale's economy instead of returning to
  // wave-one income while enemy effective health stays at finale scale.
  const previousFinalScale = 1 + (cycle - 1) * 0.25;
  const currentFinalScale = 1 + cycle * 0.25;
  const continuousScale = previousFinalScale + (currentFinalScale - previousFinalScale) * progress;
  return Math.round(finalWaveReward * continuousScale);
}

function endlessHealthMultiplier(
  level: LevelDefinition,
  source: WaveDefinition,
  cycle: number,
  localWave: number,
): number {
  if (cycle === 0) return 1;
  const sourceHealth = totalWaveHealth(source);
  const finalHealth = totalWaveHealth(level.waves.createWave(level.waves.finalWave));
  const progress = level.waves.finalWave <= 1 ? 1 : (localWave - 1) / (level.waves.finalWave - 1);
  const continuousTarget = finalHealth * Math.pow(1.5, cycle - 1) * (1 + progress * 0.5);
  return Math.min(10_000, Math.max(1, continuousTarget / Math.max(1, sourceHealth)));
}

function totalWaveHealth(wave: WaveDefinition): number {
  return wave.spawns.reduce(
    (total, spawn) => total + spawn.maxHp * (1 + spawn.shieldRatio + (spawn.frostArmorRatio ?? 0)),
    0,
  );
}

function totalWaveReward(wave: WaveDefinition): number {
  return wave.clearBonus + wave.spawns.reduce((total, spawn) => total + spawn.reward, 0);
}

function defineWaveSource(id: string, finalWave: number, factory: (wave: number) => WaveDefinition): WaveSource {
  return Object.freeze({ id, contentVersion: CONTENT_VERSION, kind: "finite", finalWave, createWave: factory });
}

function defineLevel(value: Omit<LevelDefinition, "contentVersion" | "route" | "buildPads" | "heroAnchors" | "signalFires" | "progression"> & {
  route: readonly Point[];
  buildPads: readonly Point[];
  heroAnchors: readonly Point[];
  signalFires?: readonly Point[];
  progression: LevelProgression;
}): LevelDefinition {
  return Object.freeze({
    ...value,
    contentVersion: CONTENT_VERSION,
    route: freezePoints(value.route),
    buildPads: freezePoints(value.buildPads),
    heroAnchors: freezePoints(value.heroAnchors),
    signalFires: freezePoints(value.signalFires ?? []),
    progression: Object.freeze({
      ...value.progression,
      heroUpgradeWaves: Object.freeze([...value.progression.heroUpgradeWaves]) as readonly [number, number],
    }),
  });
}

function freezePoints(points: readonly Point[]): readonly Point[] {
  return Object.freeze(points.map((point) => Object.freeze({ x: point.x, y: point.y })));
}

function freezeWave(value: WavePlan): WaveDefinition {
  const spawns = value.spawns.map((spawn): WaveSpawn => Object.freeze({
    ...spawn,
    summonThresholds: Object.freeze([...spawn.summonThresholds]),
  }));
  return Object.freeze({ ...value, spawns: Object.freeze(spawns) });
}

function validateWaveSource(value: unknown): readonly string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return Object.freeze(["source must be an object"]);
  if (!validId(value.id)) errors.push("id must be a stable lowercase identifier");
  if (value.contentVersion !== CONTENT_VERSION) errors.push(`contentVersion must be ${CONTENT_VERSION}`);
  if (value.kind !== "finite") errors.push("kind must be finite");
  if (!positiveInteger(value.finalWave)) errors.push("finalWave must be a positive integer");
  if (typeof value.createWave !== "function") errors.push("createWave must be a function");
  if (!Object.isFrozen(value)) errors.push("source must be frozen");
  if (errors.length > 0) return Object.freeze(errors);

  const source = value as WaveSource;
  for (const wave of new Set([1, source.finalWave])) {
    try {
      errors.push(...validateWaveDefinition(source.createWave(wave), wave).map((error) => `wave ${wave}: ${error}`));
    } catch (error) {
      errors.push(`wave ${wave}: factory threw ${errorMessage(error)}`);
    }
  }
  return Object.freeze(errors);
}

function validateModeRuleset(value: unknown, sampleLevel: LevelDefinition | undefined): readonly string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return Object.freeze(["ruleset must be an object"]);
  if (!validId(value.id)) errors.push("id must be a stable lowercase identifier");
  if (typeof value.displayNameKey !== "string") errors.push("displayNameKey must be a translation key");
  if (typeof value.resultSummaryKey !== "string") errors.push("resultSummaryKey must be a translation key");
  if (value.contentVersion !== CONTENT_VERSION) errors.push(`contentVersion must be ${CONTENT_VERSION}`);
  if (value.kind !== "campaign" && value.kind !== "endless") errors.push("kind must be campaign or endless");
  if (value.scorePolicy !== "legacy_campaign_rating" && value.scorePolicy !== "waves_survived") {
    errors.push("scorePolicy is unsupported");
  }
  for (const method of ["calculateScore", "getFinalWave", "createWave", "isComplete"] as const) {
    if (typeof value[method] !== "function") errors.push(`${method} must be a function`);
  }
  if (!Object.isFrozen(value)) errors.push("ruleset must be frozen");
  if (errors.length > 0 || !sampleLevel) return Object.freeze(errors);

  try {
    const ruleset = value as ModeRuleset;
    const finalWave = ruleset.getFinalWave(sampleLevel);
    if (finalWave !== null && !positiveInteger(finalWave)) errors.push("getFinalWave returned an invalid value");
    if (typeof ruleset.isComplete(sampleLevel, 0) !== "boolean") errors.push("isComplete must return a boolean");
    errors.push(...validateWaveDefinition(ruleset.createWave(sampleLevel, 1), 1).map((error) => `wave 1: ${error}`));
  } catch (error) {
    errors.push(`ruleset sample failed: ${errorMessage(error)}`);
  }
  return Object.freeze(errors);
}

function validateWaveDefinition(value: unknown, expectedWave: number): readonly string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return Object.freeze(["definition must be an object"]);
  if (value.wave !== expectedWave) errors.push(`wave must equal ${expectedWave}`);
  if (!Array.isArray(value.spawns) || value.spawns.length === 0) errors.push("spawns must be a non-empty array");
  if (!nonNegativeInteger(value.clearBonus)) errors.push("clearBonus must be a non-negative integer");
  if (typeof value.hasBoss !== "boolean") errors.push("hasBoss must be boolean");
  if (value.act !== 1 && value.act !== 2 && value.act !== 3) errors.push("act must be 1, 2, or 3");
  if (![1, 2, 3, 4, 5].includes(value.threat as number)) errors.push("threat must be between 1 and 5");
  if (!Object.isFrozen(value)) errors.push("definition must be frozen");

  if (Array.isArray(value.spawns)) {
    const ids = new Set<number>();
    let previousTime = -1;
    value.spawns.forEach((candidate, index) => {
      if (!isRecord(candidate)) {
        errors.push(`spawn ${index} must be an object`);
        return;
      }
      if (!nonNegativeInteger(candidate.id) || ids.has(candidate.id as number)) errors.push(`spawn ${index} has an invalid id`);
      else ids.add(candidate.id as number);
      if (!nonNegativeInteger(candidate.atMs) || (candidate.atMs as number) < previousTime) errors.push(`spawn ${index} has invalid timing`);
      else previousTime = candidate.atMs as number;
      if (typeof candidate.type !== "string" || !(candidate.type in ENEMY_DEFINITIONS)) errors.push(`spawn ${index} has an unknown type`);
      if (
        candidate.variant !== undefined
        && candidate.variant !== "standard"
        && candidate.variant !== "snow-runner"
        && candidate.variant !== "icebound"
      ) errors.push(`spawn ${index} has an unknown variant`);
      if (!positiveNumber(candidate.maxHp)) errors.push(`spawn ${index} must have positive maxHp`);
      if (!positiveNumber(candidate.speed)) errors.push(`spawn ${index} must have positive speed`);
      if (!nonNegativeInteger(candidate.reward)) errors.push(`spawn ${index} must have a non-negative reward`);
      if (!positiveInteger(candidate.leakDamage)) errors.push(`spawn ${index} must have positive leakDamage`);
      for (const key of ["physicalResistance", "magicResistance", "shieldRatio", "controlResistance"] as const) {
        if (!boundedNumber(candidate[key], 0, 1)) errors.push(`spawn ${index} has invalid ${key}`);
      }
      if (candidate.frostArmorRatio !== undefined && !boundedNumber(candidate.frostArmorRatio, 0, 1)) {
        errors.push(`spawn ${index} has invalid frostArmorRatio`);
      }
      if (!boundedNumber(candidate.healingRadius, 0, Number.MAX_SAFE_INTEGER)) errors.push(`spawn ${index} has invalid healingRadius`);
      if (!boundedNumber(candidate.healingRatio, 0, 1)) errors.push(`spawn ${index} has invalid healingRatio`);
      if (typeof candidate.elite !== "boolean") errors.push(`spawn ${index} elite must be boolean`);
      if (candidate.bossTier !== 1 && candidate.bossTier !== 2 && candidate.bossTier !== 3) {
        errors.push(`spawn ${index} has invalid bossTier`);
      }
      if (!nonNegativeInteger(candidate.summonCount)) errors.push(`spawn ${index} has invalid summonCount`);
      if (!Object.isFrozen(candidate)) errors.push(`spawn ${index} must be frozen`);
      if (!Array.isArray(candidate.summonThresholds) || !Object.isFrozen(candidate.summonThresholds)) {
        errors.push(`spawn ${index} summonThresholds must be a frozen array`);
      } else if (candidate.summonThresholds.some((threshold) => !boundedNumber(threshold, 0, 1, true))) {
        errors.push(`spawn ${index} has invalid summonThresholds`);
      }
    });
    if (!Object.isFrozen(value.spawns)) errors.push("spawns must be frozen");
    const containsBoss = value.spawns.some((spawn) => isRecord(spawn) && (spawn.type === "boss" || spawn.type === "titan"));
    if (typeof value.hasBoss === "boolean" && value.hasBoss !== containsBoss) errors.push("hasBoss must match the spawn list");
  }
  return Object.freeze(errors);
}

function validatePoints(
  value: unknown,
  key: string,
  minimum: number,
  widthValue: unknown,
  heightValue: unknown,
  errors: string[],
  allowOutsideEntrance: boolean,
): void {
  if (!Array.isArray(value) || value.length < minimum) {
    errors.push(`${key} must contain at least ${minimum} points`);
    return;
  }
  const width = Number(widthValue);
  const height = Number(heightValue);
  const seen = new Set<string>();
  value.forEach((candidate, index) => {
    if (!isRecord(candidate) || !Number.isFinite(candidate.x) || !Number.isFinite(candidate.y)) {
      errors.push(`${key}.${index} must be a finite point`);
      return;
    }
    const x = Number(candidate.x);
    const y = Number(candidate.y);
    const outside = x < 0 || x > width || y < 0 || y > height;
    if (outside && !(allowOutsideEntrance && index === 0)) errors.push(`${key}.${index} must be inside the level bounds`);
    const pointKey = `${x}:${y}`;
    if (seen.has(pointKey)) errors.push(`${key}.${index} duplicates another point`);
    seen.add(pointKey);
    if (!Object.isFrozen(candidate)) errors.push(`${key}.${index} must be frozen`);
  });
  if (!Object.isFrozen(value)) errors.push(`${key} must be frozen`);
}

function validateProgression(value: unknown, finalWaveValue: unknown): readonly string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return Object.freeze(["progression must be an object"]);
  const finalWave = Number(finalWaveValue);
  if (!Object.isFrozen(value)) errors.push("progression must be frozen");
  if (
    !Array.isArray(value.heroUpgradeWaves)
    || value.heroUpgradeWaves.length !== 2
    || !Object.isFrozen(value.heroUpgradeWaves)
    || !value.heroUpgradeWaves.every(positiveInteger)
    || Number(value.heroUpgradeWaves[0]) >= Number(value.heroUpgradeWaves[1])
  ) errors.push("progression.heroUpgradeWaves must be an ascending frozen pair");
  for (const key of ["masteryWave", "awakeningWave", "actSize"] as const) {
    if (!positiveInteger(value[key])) errors.push(`progression.${key} must be a positive integer`);
  }
  if (positiveInteger(finalWave) && positiveInteger(value.actSize) && value.actSize * 3 !== finalWave) {
    errors.push("progression.actSize must split the campaign into three equal acts");
  }
  if (positiveInteger(finalWave)) {
    const milestones = [
      ...(Array.isArray(value.heroUpgradeWaves) ? value.heroUpgradeWaves : []),
      value.masteryWave,
      value.awakeningWave,
    ];
    if (milestones.some((milestone) => !positiveInteger(milestone) || milestone >= finalWave)) {
      errors.push("progression milestones must occur before the final wave");
    }
  }
  return Object.freeze(errors);
}

function validateRecord(value: unknown, key: string, errors: string[]): readonly [string, unknown][] {
  if (!isRecord(value)) {
    errors.push(`${key} must be an object`);
    return [];
  }
  if (!Object.isFrozen(value)) errors.push(`${key} must be frozen`);
  return Object.entries(value);
}

function requireWaveIndex(value: number, maximum: number): number {
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new RangeError(`Wave must be an integer between 1 and ${maximum}.`);
  }
  return value;
}

function normalizeCompletedWave(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function validId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function positiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function nonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function positiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function boundedNumber(value: unknown, minimum: number, maximum: number, exclusive = false): value is number {
  return typeof value === "number"
    && Number.isFinite(value)
    && (exclusive ? value > minimum && value < maximum : value >= minimum && value <= maximum);
}

function isBoss(spawn: Pick<WaveSpawn, "type">): boolean {
  return spawn.type === "boss" || spawn.type === "titan";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

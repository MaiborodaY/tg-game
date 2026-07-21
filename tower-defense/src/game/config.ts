import type { EnemyDefinition, EnemyType, Point, TowerLevel, TowerStats, TowerType } from "./types.ts";

export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 560;
export const STARTING_GOLD = 190;
export const STARTING_LIVES = 20;
export const MAX_TOWER_LEVEL = 4;
export const MASTERY_UNLOCK_WAVE = 12;
export const FINAL_WAVE = 24;
export const BUILD_PAD_HIT_SIZE = 86;

export const ROUTE_POINTS: readonly Point[] = Object.freeze([
  { x: -24, y: 52 },
  { x: 82, y: 52 },
  { x: 82, y: 140 },
  { x: 308, y: 140 },
  { x: 308, y: 236 },
  { x: 78, y: 236 },
  { x: 78, y: 336 },
  { x: 306, y: 336 },
  { x: 306, y: 438 },
  { x: 162, y: 438 },
  { x: 162, y: 518 },
]);

export const BUILD_PADS: readonly Point[] = Object.freeze([
  { x: 28, y: 103 },
  { x: 150, y: 91 },
  { x: 236, y: 91 },
  { x: 359, y: 185 },
  { x: 241, y: 191 },
  { x: 148, y: 190 },
  { x: 29, y: 286 },
  { x: 148, y: 288 },
  { x: 244, y: 288 },
  { x: 359, y: 386 },
  { x: 230, y: 389 },
  { x: 113, y: 391 },
  { x: 42, y: 475 },
  { x: 238, y: 496 },
]);

export type TowerDefinition = Readonly<{
  type: TowerType;
  buildCost: number;
  upgradeCosts: readonly [number, number, number];
  base: Omit<TowerStats, "level">;
}>;

export const TOWER_DEFINITIONS: Readonly<Record<TowerType, TowerDefinition>> = Object.freeze({
  ranger: {
    type: "ranger",
    buildCost: 60,
    upgradeCosts: [75, 120, 430],
    base: {
      type: "ranger",
      damageKind: "physical",
      damage: 12,
      range: 122,
      fireRateMs: 520,
      projectileSpeed: 440,
      splashRadius: 0,
      slowFactor: 1,
      slowDurationMs: 0,
      burnDamagePerSecond: 0,
      burnDurationMs: 0,
      chainTargets: 0,
      chainRange: 0,
      bossDamageMultiplier: 1,
    },
  },
  frost: {
    type: "frost",
    buildCost: 90,
    upgradeCosts: [105, 155, 500],
    base: {
      type: "frost",
      damageKind: "frost",
      damage: 8,
      range: 114,
      fireRateMs: 920,
      projectileSpeed: 320,
      splashRadius: 18,
      slowFactor: 0.62,
      slowDurationMs: 1_900,
      burnDamagePerSecond: 0,
      burnDurationMs: 0,
      chainTargets: 0,
      chainRange: 0,
      bossDamageMultiplier: 1,
    },
  },
  ember: {
    type: "ember",
    buildCost: 125,
    upgradeCosts: [140, 205, 580],
    base: {
      type: "ember",
      damageKind: "fire",
      damage: 22,
      range: 132,
      fireRateMs: 1_280,
      projectileSpeed: 270,
      splashRadius: 48,
      slowFactor: 1,
      slowDurationMs: 0,
      burnDamagePerSecond: 4,
      burnDurationMs: 2_400,
      chainTargets: 0,
      chainRange: 0,
      bossDamageMultiplier: 1,
    },
  },
  storm: {
    type: "storm",
    buildCost: 145,
    upgradeCosts: [165, 230, 620],
    base: {
      type: "storm",
      damageKind: "arcane",
      damage: 14,
      range: 126,
      fireRateMs: 1_000,
      projectileSpeed: 390,
      splashRadius: 0,
      slowFactor: 1,
      slowDurationMs: 0,
      burnDamagePerSecond: 0,
      burnDurationMs: 0,
      chainTargets: 3,
      chainRange: 70,
      bossDamageMultiplier: 1,
    },
  },
});

export const ENEMY_DEFINITIONS = Object.freeze({
  raider: {
    type: "raider",
    baseHp: 38,
    speed: 52,
    reward: 7,
    leakDamage: 1,
    size: 15,
    physicalResistance: 0,
    magicResistance: 0,
    shieldRatio: 0,
    controlResistance: 0,
    healingRadius: 0,
    healingRatio: 0,
    glyph: "◆",
  },
  swift: {
    type: "swift",
    baseHp: 28,
    speed: 82,
    reward: 8,
    leakDamage: 1,
    size: 12,
    physicalResistance: 0,
    magicResistance: 0.08,
    shieldRatio: 0,
    controlResistance: 0.08,
    healingRadius: 0,
    healingRatio: 0,
    glyph: "➤",
  },
  brute: {
    type: "brute",
    baseHp: 92,
    speed: 35,
    reward: 14,
    leakDamage: 2,
    size: 20,
    physicalResistance: 0.22,
    magicResistance: 0,
    shieldRatio: 0,
    controlResistance: 0.16,
    healingRadius: 0,
    healingRatio: 0,
    glyph: "⬢",
  },
  warden: {
    type: "warden",
    baseHp: 64,
    speed: 47,
    reward: 12,
    leakDamage: 2,
    size: 17,
    physicalResistance: 0.06,
    magicResistance: 0.3,
    shieldRatio: 0,
    controlResistance: 0.12,
    healingRadius: 0,
    healingRatio: 0,
    glyph: "◇",
  },
  shade: {
    type: "shade",
    baseHp: 46,
    speed: 76,
    reward: 13,
    leakDamage: 1,
    size: 13,
    physicalResistance: 0.08,
    magicResistance: 0.08,
    shieldRatio: 0,
    controlResistance: 0.7,
    healingRadius: 0,
    healingRatio: 0,
    glyph: "◈",
  },
  bulwark: {
    type: "bulwark",
    baseHp: 145,
    speed: 34,
    reward: 18,
    leakDamage: 3,
    size: 21,
    physicalResistance: 0.34,
    magicResistance: 0.08,
    shieldRatio: 0.3,
    controlResistance: 0.2,
    healingRadius: 0,
    healingRatio: 0,
    glyph: "⬟",
  },
  shaman: {
    type: "shaman",
    baseHp: 78,
    speed: 43,
    reward: 20,
    leakDamage: 2,
    size: 16,
    physicalResistance: 0.05,
    magicResistance: 0.24,
    shieldRatio: 0,
    controlResistance: 0.18,
    healingRadius: 92,
    healingRatio: 0.035,
    glyph: "✣",
  },
  boss: {
    type: "boss",
    baseHp: 420,
    speed: 29,
    reward: 75,
    leakDamage: 5,
    size: 27,
    physicalResistance: 0.12,
    magicResistance: 0.14,
    shieldRatio: 0.12,
    controlResistance: 0.42,
    healingRadius: 0,
    healingRatio: 0,
    glyph: "♛",
  },
  titan: {
    type: "titan",
    baseHp: 650,
    speed: 26,
    reward: 100,
    leakDamage: 8,
    size: 31,
    physicalResistance: 0.18,
    magicResistance: 0.18,
    shieldRatio: 0.2,
    controlResistance: 0.7,
    healingRadius: 0,
    healingRatio: 0,
    glyph: "♜",
  },
} satisfies Readonly<Record<string, EnemyDefinition>>);

export const ENEMY_PREVIEW_ORDER: readonly EnemyType[] = Object.freeze([
  "raider", "swift", "brute", "warden", "shade", "bulwark", "shaman", "boss", "titan",
]);

const LEVEL_DAMAGE_MULTIPLIER = [1, 1.55, 2.3, 3.35] as const;
const LEVEL_RATE_MULTIPLIER = [1, 0.91, 0.8, 0.7] as const;

export function getTowerStats(type: TowerType, level: TowerLevel): TowerStats {
  const definition = TOWER_DEFINITIONS[type];
  const index = level - 1;
  return Object.freeze({
    ...definition.base,
    level,
    damage: Math.round(definition.base.damage * LEVEL_DAMAGE_MULTIPLIER[index]),
    range: definition.base.range + index * 8,
    fireRateMs: Math.round(definition.base.fireRateMs * LEVEL_RATE_MULTIPLIER[index]),
    splashRadius: definition.base.splashRadius + index * 5,
    burnDamagePerSecond: Math.round(definition.base.burnDamagePerSecond * LEVEL_DAMAGE_MULTIPLIER[index]),
    slowFactor: type === "frost" && level === 4 ? 0.52 : definition.base.slowFactor,
    slowDurationMs: type === "frost" && level === 4 ? 2_200 : definition.base.slowDurationMs,
    chainTargets: type === "storm" ? [3, 3, 4, 5][index] : definition.base.chainTargets,
    bossDamageMultiplier: type === "ranger" && level === 4 ? 1.35 : definition.base.bossDamageMultiplier,
  });
}

export function getTowerTotalInvestment(type: TowerType, level: TowerLevel): number {
  const definition = TOWER_DEFINITIONS[type];
  let total = definition.buildCost;
  for (let index = 0; index < level - 1; index += 1) total += definition.upgradeCosts[index];
  return total;
}

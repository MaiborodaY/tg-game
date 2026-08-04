import type { EnemyType, HeroLevel } from "./types.ts";

export type MornaCorpseKind = "light" | "heavy" | "essence";
export type MornaSummonKind = "warrior" | "guard" | "colossus";

export type MornaRankRules = Readonly<{
  harvestRadius: number;
  corpseLifetimeMs: number;
  maxCorpseEssence: number;
  maxSummons: number;
  summonLifetimeMs: number;
  healPerEssence: number;
  armorPerEssence: number;
}>;

export type MornaSummonStats = Readonly<{
  maxHp: number;
  attackDamage: number;
  attackIntervalMs: number;
  moveSpeed: number;
  blockCapacity: number;
  splashRadius: number;
}>;

export const MORNA_AWAKENING_ESSENCE = 6;
export const MORNA_COLOSSUS_MAJOR_HOLD_MS = 3_000;

export const MORNA_RANK_RULES: Readonly<Record<HeroLevel, MornaRankRules>> = Object.freeze({
  1: Object.freeze({
    harvestRadius: 140,
    corpseLifetimeMs: 8_000,
    maxCorpseEssence: 6,
    maxSummons: 1,
    summonLifetimeMs: 9_000,
    healPerEssence: 0,
    armorPerEssence: 0,
  }),
  2: Object.freeze({
    harvestRadius: 155,
    corpseLifetimeMs: 9_000,
    maxCorpseEssence: 6,
    maxSummons: 2,
    summonLifetimeMs: 10_000,
    healPerEssence: 6,
    armorPerEssence: 1,
  }),
  3: Object.freeze({
    harvestRadius: 170,
    corpseLifetimeMs: 10_000,
    maxCorpseEssence: 6,
    maxSummons: 3,
    summonLifetimeMs: 11_000,
    healPerEssence: 8,
    armorPerEssence: 1.5,
  }),
});

const MORNA_SUMMON_STATS: Readonly<Record<MornaSummonKind, Readonly<Record<HeroLevel, MornaSummonStats>>>> = Object.freeze({
  warrior: defineSummonRanks([
    { maxHp: 30, attackDamage: 4, attackIntervalMs: 900, moveSpeed: 46, blockCapacity: 1, splashRadius: 0 },
    { maxHp: 40, attackDamage: 6, attackIntervalMs: 850, moveSpeed: 48, blockCapacity: 1, splashRadius: 0 },
    { maxHp: 52, attackDamage: 8, attackIntervalMs: 800, moveSpeed: 50, blockCapacity: 1, splashRadius: 0 },
  ]),
  guard: defineSummonRanks([
    { maxHp: 55, attackDamage: 5, attackIntervalMs: 1_100, moveSpeed: 32, blockCapacity: 1, splashRadius: 0 },
    { maxHp: 72, attackDamage: 7, attackIntervalMs: 1_050, moveSpeed: 34, blockCapacity: 2, splashRadius: 0 },
    { maxHp: 92, attackDamage: 10, attackIntervalMs: 1_000, moveSpeed: 36, blockCapacity: 2, splashRadius: 18 },
  ]),
  colossus: defineSummonRanks([
    { maxHp: 110, attackDamage: 10, attackIntervalMs: 1_150, moveSpeed: 24, blockCapacity: 2, splashRadius: 24 },
    { maxHp: 130, attackDamage: 13, attackIntervalMs: 1_100, moveSpeed: 25, blockCapacity: 3, splashRadius: 28 },
    { maxHp: 150, attackDamage: 16, attackIntervalMs: 1_050, moveSpeed: 26, blockCapacity: 3, splashRadius: 32 },
  ]),
});

export function getMornaRankRules(level: HeroLevel): MornaRankRules {
  return MORNA_RANK_RULES[level];
}

export function getMornaCorpseKind(enemyType: EnemyType, elite = false): MornaCorpseKind {
  if (enemyType === "boss" || enemyType === "titan") return "essence";
  if (elite || enemyType === "brute" || enemyType === "bulwark" || enemyType === "warden") return "heavy";
  return "light";
}

export function getMornaCorpseEssence(kind: MornaCorpseKind): number {
  return kind === "essence" ? 2 : 1;
}

export function getMornaSummonKind(kind: MornaCorpseKind): Exclude<MornaSummonKind, "colossus"> {
  return kind === "light" ? "warrior" : "guard";
}

export function getMornaSummonStats(kind: MornaSummonKind, level: HeroLevel): MornaSummonStats {
  return MORNA_SUMMON_STATS[kind][level];
}

function defineSummonRanks(
  levels: readonly [MornaSummonStats, MornaSummonStats, MornaSummonStats],
): Readonly<Record<HeroLevel, MornaSummonStats>> {
  return Object.freeze({
    1: Object.freeze({ ...levels[0] }),
    2: Object.freeze({ ...levels[1] }),
    3: Object.freeze({ ...levels[2] }),
  });
}

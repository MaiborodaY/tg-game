import type { EnemyType, HeroLevel } from "./types.ts";

export const HERO_COMBAT_RULESET_SUFFIX = "hero-combat-v1";
export const HERO_COMBAT_SAVE_NAMESPACE = "hero-combat-v1";

export const HERO_FRONTLINE_RATIOS = Object.freeze([
  420 / 1_400,
  846 / 1_400,
  1_176 / 1_400,
] as const);

export type TorenHeroCombatStats = Readonly<{
  maxHp: number;
  armor: number;
  blockCapacity: number;
  regenHpPerSecond: number;
}>;

export const TOREN_HERO_COMBAT_STATS: Readonly<Record<HeroLevel, TorenHeroCombatStats>> = Object.freeze({
  1: Object.freeze({ maxHp: 180, armor: 0.1, blockCapacity: 2, regenHpPerSecond: 9 }),
  2: Object.freeze({ maxHp: 270, armor: 0.18, blockCapacity: 3, regenHpPerSecond: 14 }),
  3: Object.freeze({ maxHp: 390, armor: 0.25, blockCapacity: 3, regenHpPerSecond: 20 }),
});

export const HERO_COMBAT_TIMING = Object.freeze({
  regenDelayMs: 3_000,
  knockoutDurationMs: 10_000,
  respawnHpRatio: 0.5,
  countdownMoveSpeed: 420,
  respawnMoveSpeed: 180,
  captureDistance: 22,
  meleeRange: 38,
  bossMaximumBlockMs: 3_000,
  bossBlockImmunityMs: 5_000,
});

export type EnemyHeroAttackProfile = Readonly<{
  damage: number;
  intervalMs: number;
}>;

export const ENEMY_HERO_ATTACK_PROFILES: Readonly<Record<EnemyType, EnemyHeroAttackProfile>> = Object.freeze({
  raider: Object.freeze({ damage: 7, intervalMs: 1_200 }),
  swift: Object.freeze({ damage: 5, intervalMs: 800 }),
  brute: Object.freeze({ damage: 16, intervalMs: 1_600 }),
  warden: Object.freeze({ damage: 10, intervalMs: 1_200 }),
  shade: Object.freeze({ damage: 7, intervalMs: 750 }),
  bulwark: Object.freeze({ damage: 18, intervalMs: 1_800 }),
  shaman: Object.freeze({ damage: 9, intervalMs: 1_400 }),
  boss: Object.freeze({ damage: 28, intervalMs: 1_600 }),
  titan: Object.freeze({ damage: 40, intervalMs: 1_800 }),
});

export const ENEMY_HERO_BLOCK_COSTS: Readonly<Record<EnemyType, number>> = Object.freeze({
  raider: 1,
  swift: 1,
  brute: 2,
  warden: 1,
  shade: 1,
  bulwark: 2,
  shaman: 1,
  boss: 3,
  titan: 3,
});

export function getTorenHeroCombatStats(level: HeroLevel): TorenHeroCombatStats {
  return TOREN_HERO_COMBAT_STATS[level];
}

export function getEnemyHeroAttackProfile(type: EnemyType): EnemyHeroAttackProfile {
  return ENEMY_HERO_ATTACK_PROFILES[type];
}

export function getEnemyHeroBlockCost(type: EnemyType): number {
  return ENEMY_HERO_BLOCK_COSTS[type];
}

export function getEnemyHeroFirstAttackDelayMs(type: EnemyType): number {
  return Math.min(600, getEnemyHeroAttackProfile(type).intervalMs / 2);
}

export function getHeroFrontlineRatio(anchorId: number): number | null {
  return Number.isInteger(anchorId) && anchorId >= 0 && anchorId < HERO_FRONTLINE_RATIOS.length
    ? HERO_FRONTLINE_RATIOS[anchorId]
    : null;
}

export function getHeroFrontlineProgress(totalLength: number, anchorId: number): number | null {
  const ratio = getHeroFrontlineRatio(anchorId);
  return ratio !== null && Number.isFinite(totalLength) && totalLength > 0
    ? totalLength * ratio
    : null;
}

export function calculateHeroDamageTaken(rawDamage: number, armor: number): number {
  const damage = Number.isFinite(rawDamage) ? Math.max(0, rawDamage) : 0;
  const mitigation = Number.isFinite(armor) ? Math.min(1, Math.max(0, armor)) : 0;
  return damage > 0 ? Math.max(1, Math.round(damage * (1 - mitigation))) : 0;
}

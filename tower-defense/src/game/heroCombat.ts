import type { EnemyType, HeroId, HeroLevel } from "./types.ts";

export const HERO_COMBAT_RULESET_SUFFIX = "hero-combat-v2";
export const HERO_COMBAT_RELEASED = true;

export const HERO_FRONTLINE_RATIOS = Object.freeze([
  420 / 1_400,
  846 / 1_400,
  1_176 / 1_400,
] as const);

export type HeroCombatStats = Readonly<{
  maxHp: number;
  maxHeroicArmor: number;
  blockCapacity: number;
  regenHpPerSecond: number;
  attackRange: number;
  attackDamage: number;
}>;

export const HERO_COMBAT_STATS: Readonly<Record<HeroId, Readonly<Record<HeroLevel, HeroCombatStats>>>> = Object.freeze({
  eira: defineHeroCombatRanks([
    { maxHp: 45, maxHeroicArmor: 0, blockCapacity: 1, regenHpPerSecond: 2, attackRange: 120, attackDamage: 4 },
    { maxHp: 65, maxHeroicArmor: 2, blockCapacity: 1, regenHpPerSecond: 3, attackRange: 124, attackDamage: 6 },
    { maxHp: 90, maxHeroicArmor: 3, blockCapacity: 1, regenHpPerSecond: 4, attackRange: 128, attackDamage: 8 },
  ]),
  toren: defineHeroCombatRanks([
    { maxHp: 130, maxHeroicArmor: 6, blockCapacity: 2, regenHpPerSecond: 5, attackRange: 38, attackDamage: 7 },
    { maxHp: 190, maxHeroicArmor: 10, blockCapacity: 3, regenHpPerSecond: 8, attackRange: 38, attackDamage: 11 },
    { maxHp: 260, maxHeroicArmor: 15, blockCapacity: 3, regenHpPerSecond: 11, attackRange: 38, attackDamage: 17 },
  ]),
  grak: defineHeroCombatRanks([
    { maxHp: 90, maxHeroicArmor: 3, blockCapacity: 1, regenHpPerSecond: 4, attackRange: 42, attackDamage: 9 },
    { maxHp: 135, maxHeroicArmor: 6, blockCapacity: 1, regenHpPerSecond: 6, attackRange: 44, attackDamage: 14 },
    { maxHp: 185, maxHeroicArmor: 9, blockCapacity: 1, regenHpPerSecond: 8, attackRange: 46, attackDamage: 18 },
  ]),
});

export const HERO_COMBAT_TIMING = Object.freeze({
  regenDelayMs: 3_000,
  knockoutDurationMs: 10_000,
  respawnHpRatio: 0.5,
  countdownMoveSpeed: 420,
  respawnMoveSpeed: 180,
  captureDistance: 22,
  meleeRange: 38,
});

// A passive is part of the hero's identity and only pauses while the hero is
// absent from their post: deploying or knocked out.
export const HERO_FRONTLINE_PASSIVE_POWER = Object.freeze({
  ready: 1,
  deploying: 0,
  holding: 1,
  fighting: 1,
  knocked_out: 0,
});

export const FROST_ARMORED_HERO_DAMAGE_MULTIPLIER = 1.45;

export type EnemyHeroAttackProfile = Readonly<{
  damage: number;
  armorDamage: number;
  intervalMs: number;
}>;

export const ENEMY_HERO_ATTACK_PROFILES: Readonly<Record<EnemyType, EnemyHeroAttackProfile>> = Object.freeze({
  raider: Object.freeze({ damage: 7, armorDamage: 1, intervalMs: 1_200 }),
  swift: Object.freeze({ damage: 5, armorDamage: 1, intervalMs: 800 }),
  brute: Object.freeze({ damage: 16, armorDamage: 3, intervalMs: 1_600 }),
  warden: Object.freeze({ damage: 10, armorDamage: 2, intervalMs: 1_200 }),
  shade: Object.freeze({ damage: 7, armorDamage: 1, intervalMs: 750 }),
  bulwark: Object.freeze({ damage: 18, armorDamage: 4, intervalMs: 1_800 }),
  shaman: Object.freeze({ damage: 9, armorDamage: 2, intervalMs: 1_400 }),
  boss: Object.freeze({ damage: 42, armorDamage: 10, intervalMs: 1_600 }),
  titan: Object.freeze({ damage: 100, armorDamage: 18, intervalMs: 1_800 }),
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

export function getHeroCombatStats(id: HeroId, level: HeroLevel): HeroCombatStats {
  return HERO_COMBAT_STATS[id][level];
}

export function getEnemyHeroAttackProfile(type: EnemyType): EnemyHeroAttackProfile {
  return ENEMY_HERO_ATTACK_PROFILES[type];
}

export function getEnemyHeroBlockCost(type: EnemyType): number {
  return ENEMY_HERO_BLOCK_COSTS[type];
}

export function getEffectiveEnemyHeroBlockCost(type: EnemyType, blockCapacity: number): number {
  const capacity = Number.isFinite(blockCapacity) ? Math.max(0, Math.floor(blockCapacity)) : 0;
  if (capacity === 0) return 0;
  return type === "boss" || type === "titan"
    ? capacity
    : getEnemyHeroBlockCost(type);
}

export function getEnemyHeroFirstAttackDelayMs(type: EnemyType): number {
  return Math.min(600, getEnemyHeroAttackProfile(type).intervalMs / 2);
}

export function getEnemyHeroDamageMultiplier(frostArmor: number): number {
  return Number.isFinite(frostArmor) && frostArmor > 0
    ? FROST_ARMORED_HERO_DAMAGE_MULTIPLIER
    : 1;
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

export function calculateHeroDamageTaken(rawDamage: number, currentArmorPercent: number): number {
  const damage = Number.isFinite(rawDamage) ? Math.max(0, rawDamage) : 0;
  const armorPercent = Number.isFinite(currentArmorPercent)
    ? Math.min(100, Math.max(0, currentArmorPercent))
    : 0;
  return damage > 0 ? Math.max(1, Math.round(damage * (1 - armorPercent / 100))) : 0;
}

export function applyHeroicArmorDamage(currentArmorPercent: number, armorDamage: number): number {
  const current = Number.isFinite(currentArmorPercent)
    ? Math.min(100, Math.max(0, currentArmorPercent))
    : 0;
  const chip = Number.isFinite(armorDamage) ? Math.max(0, armorDamage) : 0;
  return Math.max(0, current - chip);
}

function defineHeroCombatRanks(
  levels: readonly [HeroCombatStats, HeroCombatStats, HeroCombatStats],
): Readonly<Record<HeroLevel, HeroCombatStats>> {
  return Object.freeze({
    1: Object.freeze({ ...levels[0] }),
    2: Object.freeze({ ...levels[1] }),
    3: Object.freeze({ ...levels[2] }),
  });
}

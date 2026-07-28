import type { DamageKind, HeroId, HeroLevel } from "./types.ts";

export const HERO_IDS = Object.freeze(["eira", "toren"] as const);
export const HERO_UPGRADE_WAVE_GATES = Object.freeze([4, 12] as const);

export type HeroStats = Readonly<{
  id: HeroId;
  level: HeroLevel;
  damageKind: DamageKind;
  attackDamage: number;
  attackRange: number;
  attackIntervalMs: number;
  attackSplashRadius: number;
  towerDamageAuraRadius: number;
  towerDamageMultiplier: number;
  slowAuraRadius: number;
  slowAuraFactor: number;
  abilityRadius: number;
  abilityDamage: number;
  abilityStunMs: number;
  markDurationMs: number;
  markedTowerDamageMultiplier: number;
}>;

export type HeroDefinition = Readonly<{
  id: HeroId;
  upgradeCosts: readonly [number, number];
  levels: Readonly<Record<HeroLevel, HeroStats>>;
}>;

export const HERO_DEFINITIONS: Readonly<Record<HeroId, HeroDefinition>> = Object.freeze({
  eira: defineHero("eira", [150, 480], [
    {
      damageKind: "physical",
      attackDamage: 10,
      attackRange: 120,
      attackIntervalMs: 720,
      attackSplashRadius: 0,
      towerDamageAuraRadius: 0,
      towerDamageMultiplier: 1,
      slowAuraRadius: 0,
      slowAuraFactor: 1,
      abilityRadius: 0,
      abilityDamage: 0,
      abilityStunMs: 0,
      markDurationMs: 6_000,
      markedTowerDamageMultiplier: 1.18,
    },
    {
      damageKind: "physical",
      attackDamage: 16,
      attackRange: 124,
      attackIntervalMs: 680,
      attackSplashRadius: 0,
      towerDamageAuraRadius: 105,
      towerDamageMultiplier: 1.08,
      slowAuraRadius: 0,
      slowAuraFactor: 1,
      abilityRadius: 0,
      abilityDamage: 0,
      abilityStunMs: 0,
      markDurationMs: 7_000,
      markedTowerDamageMultiplier: 1.22,
    },
    {
      damageKind: "physical",
      attackDamage: 24,
      attackRange: 128,
      attackIntervalMs: 630,
      attackSplashRadius: 0,
      towerDamageAuraRadius: 118,
      towerDamageMultiplier: 1.12,
      slowAuraRadius: 0,
      slowAuraFactor: 1,
      abilityRadius: 0,
      abilityDamage: 0,
      abilityStunMs: 0,
      markDurationMs: 8_000,
      markedTowerDamageMultiplier: 1.26,
    },
  ]),
  toren: defineHero("toren", [160, 500], [
    {
      damageKind: "arcane",
      attackDamage: 8,
      attackRange: 108,
      attackIntervalMs: 980,
      attackSplashRadius: 28,
      towerDamageAuraRadius: 0,
      towerDamageMultiplier: 1,
      slowAuraRadius: 0,
      slowAuraFactor: 1,
      abilityRadius: 115,
      abilityDamage: 24,
      abilityStunMs: 850,
      markDurationMs: 0,
      markedTowerDamageMultiplier: 1,
    },
    {
      damageKind: "arcane",
      attackDamage: 13,
      attackRange: 112,
      attackIntervalMs: 920,
      attackSplashRadius: 30,
      towerDamageAuraRadius: 0,
      towerDamageMultiplier: 1,
      slowAuraRadius: 100,
      slowAuraFactor: 0.92,
      abilityRadius: 128,
      abilityDamage: 45,
      abilityStunMs: 1_050,
      markDurationMs: 0,
      markedTowerDamageMultiplier: 1,
    },
    {
      damageKind: "arcane",
      attackDamage: 20,
      attackRange: 116,
      attackIntervalMs: 850,
      attackSplashRadius: 34,
      towerDamageAuraRadius: 0,
      towerDamageMultiplier: 1,
      slowAuraRadius: 115,
      slowAuraFactor: 0.86,
      abilityRadius: 142,
      abilityDamage: 75,
      abilityStunMs: 1_250,
      markDurationMs: 0,
      markedTowerDamageMultiplier: 1,
    },
  ]),
});

export function getHeroDefinition(id: HeroId): HeroDefinition {
  return HERO_DEFINITIONS[id];
}

export function getHeroStats(id: HeroId, level: HeroLevel): HeroStats {
  return HERO_DEFINITIONS[id].levels[level];
}

export function getHeroUpgradeCost(id: HeroId, level: HeroLevel): number | null {
  return level >= 3 ? null : HERO_DEFINITIONS[id].upgradeCosts[level - 1];
}

export function getHeroUpgradeWaveGate(level: HeroLevel): number | null {
  return level >= 3 ? null : HERO_UPGRADE_WAVE_GATES[level - 1];
}

export function isHeroId(value: unknown): value is HeroId {
  return typeof value === "string" && HERO_IDS.includes(value as HeroId);
}

export function isHeroLevel(value: unknown): value is HeroLevel {
  return value === 1 || value === 2 || value === 3;
}

function defineHero(
  id: HeroId,
  upgradeCosts: readonly [number, number],
  levels: readonly [Omit<HeroStats, "id" | "level">, Omit<HeroStats, "id" | "level">, Omit<HeroStats, "id" | "level">],
): HeroDefinition {
  const stats = levels.map((level, index) => Object.freeze({
    ...level,
    id,
    level: (index + 1) as HeroLevel,
  })) as unknown as readonly [HeroStats, HeroStats, HeroStats];
  return Object.freeze({
    id,
    upgradeCosts: Object.freeze([...upgradeCosts]) as readonly [number, number],
    levels: Object.freeze({ 1: stats[0], 2: stats[1], 3: stats[2] }),
  });
}

import type { DamageKind, HeroId, HeroLevel } from "./types.ts";

export const HERO_IDS = Object.freeze(["eira", "toren", "grak"] as const);
export const HERO_UPGRADE_WAVE_GATES = Object.freeze([4, 12] as const);
export const HERO_AWAKENING_WAVE = 20;
export const HERO_ABILITY_RECHARGE_KILLS = 25;

export type HeroStats = Readonly<{
  id: HeroId;
  level: HeroLevel;
  damageKind: DamageKind;
  attackDamage: number;
  attackRange: number;
  attackIntervalMs: number;
  attackSplashRadius: number;
  globalTowerDamageMultiplier: number;
  towerDamageAuraRadius: number;
  towerDamageMultiplier: number;
  globalTowerAttackIntervalMultiplier: number;
  towerAttackSpeedAuraRadius: number;
  towerAttackIntervalMultiplier: number;
  slowAuraRadius: number;
  slowAuraFactor: number;
  controlResistancePenetration: number;
  gateShield: number;
  abilityRadius: number;
  abilityDamage: number;
  abilityStunMs: number;
  abilityDurationMs: number;
  abilityTowerAttackIntervalMultiplier: number;
  abilityResistancePenetration: number;
  markDurationMs: number;
  markedTowerDamageMultiplier: number;
}>;

export type HeroDefinition = Readonly<{
  id: HeroId;
  upgradeCosts: readonly [number, number];
  levels: Readonly<Record<HeroLevel, HeroStats>>;
}>;

export type HeroAura = Readonly<{
  kind: "tower_damage" | "slow" | "tower_attack_speed";
  radius: number;
  strength: number;
  globalStrength: number;
}>;

export const HERO_AWAKENINGS = Object.freeze({
  eira: Object.freeze({
    id: "eira" as const,
    abilityDurationMs: 12_000,
    markedTargetCount: 4,
    markedTowerDamageMultiplier: 1.4,
  }),
  toren: Object.freeze({
    id: "toren" as const,
    abilityDurationMs: 6_000,
    bossBarrierDurationMs: 3_000,
    barrierCapacity: 10,
    barrierCaptureRadius: 28,
    impactRadius: 60,
    impactDamage: 110,
  }),
  grak: Object.freeze({
    id: "grak" as const,
    abilityDurationMs: 10_000,
    towerAttackIntervalMultiplier: 1 / 1.3,
    resistancePenetration: 0.3,
  }),
});

export type HeroAwakeningDefinition = (typeof HERO_AWAKENINGS)[HeroId];

export const HERO_DEFINITIONS: Readonly<Record<HeroId, HeroDefinition>> = Object.freeze({
  eira: defineHero("eira", [150, 480], [
    {
      damageKind: "physical",
      attackDamage: 10,
      attackRange: 120,
      attackIntervalMs: 720,
      attackSplashRadius: 0,
      globalTowerDamageMultiplier: 1,
      towerDamageAuraRadius: 0,
      towerDamageMultiplier: 1,
      globalTowerAttackIntervalMultiplier: 1,
      towerAttackSpeedAuraRadius: 0,
      towerAttackIntervalMultiplier: 1,
      slowAuraRadius: 0,
      slowAuraFactor: 1,
      controlResistancePenetration: 0,
      gateShield: 0,
      abilityRadius: 0,
      abilityDamage: 0,
      abilityStunMs: 0,
      abilityDurationMs: 0,
      abilityTowerAttackIntervalMultiplier: 1,
      abilityResistancePenetration: 0,
      markDurationMs: 6_000,
      markedTowerDamageMultiplier: 1.18,
    },
    {
      damageKind: "physical",
      attackDamage: 16,
      attackRange: 124,
      attackIntervalMs: 680,
      attackSplashRadius: 0,
      globalTowerDamageMultiplier: 1.04,
      towerDamageAuraRadius: 145,
      towerDamageMultiplier: 1.12,
      globalTowerAttackIntervalMultiplier: 1,
      towerAttackSpeedAuraRadius: 0,
      towerAttackIntervalMultiplier: 1,
      slowAuraRadius: 0,
      slowAuraFactor: 1,
      controlResistancePenetration: 0,
      gateShield: 0,
      abilityRadius: 0,
      abilityDamage: 0,
      abilityStunMs: 0,
      abilityDurationMs: 0,
      abilityTowerAttackIntervalMultiplier: 1,
      abilityResistancePenetration: 0,
      markDurationMs: 7_000,
      markedTowerDamageMultiplier: 1.22,
    },
    {
      damageKind: "physical",
      attackDamage: 24,
      attackRange: 128,
      attackIntervalMs: 630,
      attackSplashRadius: 0,
      globalTowerDamageMultiplier: 1.08,
      towerDamageAuraRadius: 160,
      towerDamageMultiplier: 1.2,
      globalTowerAttackIntervalMultiplier: 1,
      towerAttackSpeedAuraRadius: 0,
      towerAttackIntervalMultiplier: 1,
      slowAuraRadius: 0,
      slowAuraFactor: 1,
      controlResistancePenetration: 0,
      gateShield: 0,
      abilityRadius: 0,
      abilityDamage: 0,
      abilityStunMs: 0,
      abilityDurationMs: 0,
      abilityTowerAttackIntervalMultiplier: 1,
      abilityResistancePenetration: 0,
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
      globalTowerDamageMultiplier: 1,
      towerDamageAuraRadius: 0,
      towerDamageMultiplier: 1,
      globalTowerAttackIntervalMultiplier: 1,
      towerAttackSpeedAuraRadius: 0,
      towerAttackIntervalMultiplier: 1,
      slowAuraRadius: 0,
      slowAuraFactor: 1,
      controlResistancePenetration: 0,
      gateShield: 0,
      abilityRadius: 115,
      abilityDamage: 24,
      abilityStunMs: 850,
      abilityDurationMs: 0,
      abilityTowerAttackIntervalMultiplier: 1,
      abilityResistancePenetration: 0,
      markDurationMs: 0,
      markedTowerDamageMultiplier: 1,
    },
    {
      damageKind: "arcane",
      attackDamage: 13,
      attackRange: 112,
      attackIntervalMs: 920,
      attackSplashRadius: 30,
      globalTowerDamageMultiplier: 1,
      towerDamageAuraRadius: 0,
      towerDamageMultiplier: 1,
      globalTowerAttackIntervalMultiplier: 1,
      towerAttackSpeedAuraRadius: 0,
      towerAttackIntervalMultiplier: 1,
      slowAuraRadius: 155,
      slowAuraFactor: 0.9,
      controlResistancePenetration: 0.15,
      gateShield: 2,
      abilityRadius: 135,
      abilityDamage: 55,
      abilityStunMs: 1_200,
      abilityDurationMs: 0,
      abilityTowerAttackIntervalMultiplier: 1,
      abilityResistancePenetration: 0,
      markDurationMs: 0,
      markedTowerDamageMultiplier: 1,
    },
    {
      damageKind: "arcane",
      attackDamage: 20,
      attackRange: 116,
      attackIntervalMs: 850,
      attackSplashRadius: 34,
      globalTowerDamageMultiplier: 1,
      towerDamageAuraRadius: 0,
      towerDamageMultiplier: 1,
      globalTowerAttackIntervalMultiplier: 1,
      towerAttackSpeedAuraRadius: 0,
      towerAttackIntervalMultiplier: 1,
      slowAuraRadius: 190,
      slowAuraFactor: 0.78,
      controlResistancePenetration: 0.35,
      gateShield: 5,
      abilityRadius: 155,
      abilityDamage: 105,
      abilityStunMs: 1_600,
      abilityDurationMs: 0,
      abilityTowerAttackIntervalMultiplier: 1,
      abilityResistancePenetration: 0,
      markDurationMs: 0,
      markedTowerDamageMultiplier: 1,
    },
  ]),
  grak: defineHero("grak", [170, 520], [
    {
      damageKind: "physical",
      attackDamage: 14,
      attackRange: 112,
      attackIntervalMs: 820,
      attackSplashRadius: 26,
      globalTowerDamageMultiplier: 1,
      towerDamageAuraRadius: 0,
      towerDamageMultiplier: 1,
      globalTowerAttackIntervalMultiplier: 1,
      towerAttackSpeedAuraRadius: 0,
      towerAttackIntervalMultiplier: 1,
      slowAuraRadius: 0,
      slowAuraFactor: 1,
      controlResistancePenetration: 0,
      gateShield: 0,
      abilityRadius: 108,
      abilityDamage: 0,
      abilityStunMs: 0,
      abilityDurationMs: 6_000,
      abilityTowerAttackIntervalMultiplier: 1 / 1.18,
      abilityResistancePenetration: 0.15,
      markDurationMs: 0,
      markedTowerDamageMultiplier: 1,
    },
    {
      damageKind: "physical",
      attackDamage: 21,
      attackRange: 116,
      attackIntervalMs: 760,
      attackSplashRadius: 30,
      globalTowerDamageMultiplier: 1,
      towerDamageAuraRadius: 0,
      towerDamageMultiplier: 1,
      globalTowerAttackIntervalMultiplier: 1 / 1.04,
      towerAttackSpeedAuraRadius: 145,
      towerAttackIntervalMultiplier: 1 / 1.12,
      slowAuraRadius: 0,
      slowAuraFactor: 1,
      controlResistancePenetration: 0,
      gateShield: 0,
      abilityRadius: 116,
      abilityDamage: 0,
      abilityStunMs: 0,
      abilityDurationMs: 7_500,
      abilityTowerAttackIntervalMultiplier: 1 / 1.22,
      abilityResistancePenetration: 0.22,
      markDurationMs: 0,
      markedTowerDamageMultiplier: 1,
    },
    {
      damageKind: "physical",
      attackDamage: 30,
      attackRange: 120,
      attackIntervalMs: 690,
      attackSplashRadius: 34,
      globalTowerDamageMultiplier: 1,
      towerDamageAuraRadius: 0,
      towerDamageMultiplier: 1,
      globalTowerAttackIntervalMultiplier: 1 / 1.08,
      towerAttackSpeedAuraRadius: 160,
      towerAttackIntervalMultiplier: 1 / 1.2,
      slowAuraRadius: 0,
      slowAuraFactor: 1,
      controlResistancePenetration: 0,
      gateShield: 0,
      abilityRadius: 128,
      abilityDamage: 0,
      abilityStunMs: 0,
      abilityDurationMs: 9_000,
      abilityTowerAttackIntervalMultiplier: 1 / 1.25,
      abilityResistancePenetration: 0.3,
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

export function getHeroAura(id: HeroId, level: HeroLevel): HeroAura | null {
  if (level < 2) return null;
  const stats = getHeroStats(id, level);
  if (id === "eira") {
    return Object.freeze({
      kind: "tower_damage",
      radius: stats.towerDamageAuraRadius,
      strength: stats.towerDamageMultiplier - 1,
      globalStrength: stats.globalTowerDamageMultiplier - 1,
    });
  }
  if (id === "toren") {
    return Object.freeze({
      kind: "slow",
      radius: stats.slowAuraRadius,
      strength: 1 - stats.slowAuraFactor,
      globalStrength: 0,
    });
  }
  return Object.freeze({
    kind: "tower_attack_speed",
    radius: stats.towerAttackSpeedAuraRadius,
    strength: 1 / stats.towerAttackIntervalMultiplier - 1,
    globalStrength: 1 / stats.globalTowerAttackIntervalMultiplier - 1,
  });
}

export function getHeroAwakening(id: HeroId): HeroAwakeningDefinition {
  return HERO_AWAKENINGS[id];
}

export function isHeroAwakened(level: HeroLevel, completedWave: number): boolean {
  return level === 3 && Number.isFinite(completedWave) && completedWave >= HERO_AWAKENING_WAVE;
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

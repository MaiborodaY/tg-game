import { ENEMY_PREVIEW_ORDER } from "./config.ts";
import type { EnemyType, TowerType, WavePlan, WaveSpawn } from "./types.ts";

export type WaveEnemyVariant = Readonly<{
  count: number;
  maxHp: number;
  speed: number;
  leakDamage: number;
  physicalResistance: number;
  magicResistance: number;
  controlResistance: number;
  shieldRatio: number;
  healingRadius: number;
  healingRatio: number;
  elite: boolean;
}>;

export type WaveEnemyAggregate = Readonly<{
  type: EnemyType;
  count: number;
  eliteCount: number;
  variants: readonly WaveEnemyVariant[];
}>;

export type GameplayAdviceCategory =
  | "victory"
  | "boss"
  | "support"
  | "control"
  | "armor"
  | "swift"
  | "mixed";

export type GameplayOutcome = "victory" | "defeat";

export type GameplayResultAdvice = Readonly<{
  category: GameplayAdviceCategory;
  recommendedTowers: readonly TowerType[];
}>;

const TOWER_ORDER: readonly TowerType[] = Object.freeze(["ranger", "frost", "ember", "storm"]);

/** Groups identical spawn variants without replacing actual wave stats with base definitions. */
export function aggregateWaveEnemies(plan: WavePlan): readonly WaveEnemyAggregate[] {
  const byType = new Map<EnemyType, WaveSpawn[]>();
  for (const spawn of plan.spawns) {
    const entries = byType.get(spawn.type);
    if (entries) entries.push(spawn);
    else byType.set(spawn.type, [spawn]);
  }

  return Object.freeze(ENEMY_PREVIEW_ORDER.flatMap((type) => {
    const spawns = byType.get(type);
    if (!spawns?.length) return [];

    const variants = new Map<string, WaveEnemyVariant>();
    for (const spawn of spawns) {
      const values = variantValues(spawn);
      const key = JSON.stringify(values);
      const existing = variants.get(key);
      variants.set(key, Object.freeze({ ...values, count: (existing?.count ?? 0) + 1 }));
    }

    return [Object.freeze({
      type,
      count: spawns.length,
      eliteCount: spawns.reduce((total, spawn) => total + Number(spawn.elite), 0),
      variants: Object.freeze([...variants.values()]),
    })];
  }));
}

/** Produces a deterministic, bounded shortlist from the actual upcoming wave. */
export function recommendWaveTowers(plan: WavePlan, max = 2): readonly TowerType[] {
  const limit = Number.isFinite(max) ? Math.max(0, Math.min(TOWER_ORDER.length, Math.trunc(max))) : 2;
  if (limit === 0) return Object.freeze([]);

  const scores = new Map<TowerType, number>([
    ["ranger", 1],
    ["frost", 0.75],
    ["ember", 0.5],
    ["storm", 0.25],
  ]);
  const add = (tower: TowerType, score: number): void => {
    scores.set(tower, (scores.get(tower) ?? 0) + score);
  };

  if (plan.spawns.length >= 8) {
    add("ember", 4);
    add("storm", 2);
    add("frost", 2);
  }

  for (const spawn of plan.spawns) {
    const weight = spawn.elite ? 1.35 : 1;
    if (spawn.type === "boss" || spawn.type === "titan") {
      add("ranger", 8 * weight);
      add("storm", 2 * weight);
    }
    if (spawn.speed >= 70) {
      if (spawn.controlResistance < 0.55) add("frost", 4 * weight);
      else {
        add("ranger", 2 * weight);
        add("storm", 1.5 * weight);
      }
    }
    if (spawn.physicalResistance >= 0.18) {
      add("ember", 2 * weight);
      add("storm", 2 * weight);
    }
    if (spawn.magicResistance >= 0.2) {
      add("ranger", 2 * weight);
      add("storm", 3 * weight);
    }
    if (spawn.shieldRatio >= 0.1) {
      add("ember", 2 * weight);
      add("storm", 3 * weight);
    }
    if (spawn.healingRadius > 0 && spawn.healingRatio > 0) {
      add("ranger", 2 * weight);
      add("storm", 4 * weight);
    }
    if (spawn.controlResistance >= 0.6) {
      add("ranger", 2 * weight);
      add("storm", 2 * weight);
      add("frost", -1 * weight);
    }
    if (spawn.elite) {
      add("ranger", 2);
      add("storm", 1);
    }
  }

  return Object.freeze([...TOWER_ORDER]
    .sort((left, right) => (scores.get(right) ?? 0) - (scores.get(left) ?? 0)
      || TOWER_ORDER.indexOf(left) - TOWER_ORDER.indexOf(right))
    .slice(0, limit));
}

export function deriveResultAdvice(plan: WavePlan, outcome: GameplayOutcome): GameplayResultAdvice {
  const category = outcome === "victory"
    ? "victory"
    : deriveDefeatCategory(plan);
  const recommendedTowers = category === "boss"
    ? prioritizeTowers(["ranger"], recommendWaveTowers(plan), 2)
    : recommendWaveTowers(plan);
  return Object.freeze({
    category,
    recommendedTowers,
  });
}

function prioritizeTowers(
  preferred: readonly TowerType[],
  fallback: readonly TowerType[],
  max: number,
): readonly TowerType[] {
  return Object.freeze([...new Set([...preferred, ...fallback])].slice(0, max));
}

function deriveDefeatCategory(plan: WavePlan): Exclude<GameplayAdviceCategory, "victory"> {
  if (plan.hasBoss || plan.spawns.some(({ type }) => type === "boss" || type === "titan")) return "boss";
  if (plan.spawns.some(({ healingRadius, healingRatio }) => healingRadius > 0 && healingRatio > 0)) return "support";
  if (plan.spawns.some(({ physicalResistance, magicResistance, shieldRatio }) => (
    physicalResistance >= 0.2 || magicResistance >= 0.25 || shieldRatio >= 0.1
  ))) return "armor";
  if (plan.spawns.some(({ speed }) => speed >= 70)) return "swift";
  if (plan.spawns.length >= 10) return "control";
  return "mixed";
}

function variantValues(spawn: WaveSpawn): Omit<WaveEnemyVariant, "count"> {
  return {
    maxHp: spawn.maxHp,
    speed: spawn.speed,
    leakDamage: spawn.leakDamage,
    physicalResistance: spawn.physicalResistance,
    magicResistance: spawn.magicResistance,
    controlResistance: spawn.controlResistance,
    shieldRatio: spawn.shieldRatio,
    healingRadius: spawn.healingRadius,
    healingRatio: spawn.healingRatio,
    elite: spawn.elite,
  };
}

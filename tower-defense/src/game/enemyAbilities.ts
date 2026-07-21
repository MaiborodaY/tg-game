import type { EnemyType } from "./types.ts";

export type HealingCandidate = Readonly<{
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  dead: boolean;
}>;

export function applyControlResistance(
  slowFactor: number,
  durationMs: number,
  resistance: number,
): Readonly<{ slowFactor: number; durationMs: number }> {
  const controlResistance = clamp(resistance, 0, 0.9);
  const strength = (1 - clamp(slowFactor, 0.1, 1)) * (1 - controlResistance);
  return Object.freeze({
    slowFactor: 1 - strength,
    durationMs: Math.max(120, Math.round(durationMs * (1 - controlResistance * 0.82))),
  });
}

export function isEnemyAbilityReady(nowMs: number, stunUntilMs: number, nextCastAtMs: number): boolean {
  return nowMs >= stunUntilMs && nowMs >= nextCastAtMs;
}

export function selectHealingTargets(
  source: Readonly<{ id: number; x: number; y: number }>,
  candidates: readonly HealingCandidate[],
  radius: number,
  limit = 2,
): HealingCandidate[] {
  const radiusSquared = Math.max(0, radius) ** 2;
  return candidates
    .filter((candidate) => (
      !candidate.dead
      && candidate.id !== source.id
      && candidate.type !== "shaman"
      && candidate.type !== "boss"
      && candidate.type !== "titan"
      && candidate.hp > 0
      && candidate.hp < candidate.maxHp
      && squaredDistance(source, candidate) <= radiusSquared
    ))
    .sort((left, right) => (left.hp / left.maxHp) - (right.hp / right.maxHp) || left.id - right.id)
    .slice(0, Math.max(0, Math.floor(limit)));
}

export function crossedSummonThresholds(
  previousHpRatio: number,
  currentHpRatio: number,
  thresholds: readonly number[],
  alreadyTriggered: ReadonlySet<number>,
): number[] {
  return thresholds.filter((threshold) => (
    !alreadyTriggered.has(threshold)
    && previousHpRatio > threshold
    && currentHpRatio <= threshold
  ));
}

export function mergeSlowEffect(
  current: Readonly<{ factor: number; untilMs: number }>,
  incoming: Readonly<{ factor: number; durationMs: number }>,
  nowMs: number,
): Readonly<{ factor: number; untilMs: number }> {
  const next = Object.freeze({
    factor: clamp(incoming.factor, 0.1, 1),
    untilMs: nowMs + Math.max(0, incoming.durationMs),
  });
  if (current.untilMs <= nowMs || next.factor < current.factor) return next;
  if (next.factor === current.factor) return Object.freeze({ ...current, untilMs: Math.max(current.untilMs, next.untilMs) });
  return current;
}

export function mergeBurnEffect(
  current: Readonly<{ damagePerSecond: number; untilMs: number }>,
  incoming: Readonly<{ damagePerSecond: number; durationMs: number }>,
  nowMs: number,
): Readonly<{ damagePerSecond: number; untilMs: number }> {
  const next = Object.freeze({
    damagePerSecond: Math.max(0, incoming.damagePerSecond),
    untilMs: nowMs + Math.max(0, incoming.durationMs),
  });
  if (current.untilMs <= nowMs || next.damagePerSecond > current.damagePerSecond) return next;
  if (next.damagePerSecond === current.damagePerSecond) {
    return Object.freeze({ ...current, untilMs: Math.max(current.untilMs, next.untilMs) });
  }
  return current;
}

function squaredDistance(left: Readonly<{ x: number; y: number }>, right: Readonly<{ x: number; y: number }>): number {
  return (left.x - right.x) ** 2 + (left.y - right.y) ** 2;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

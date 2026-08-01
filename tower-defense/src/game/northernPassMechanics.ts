import type { DamageKind, Point } from "./types.ts";

export const SIGNAL_FIRE_RADIUS = 124;
export const FROST_ARMOR_FIRE_MULTIPLIER = 1.7;
export const FROST_ARMOR_WARM_MULTIPLIER = 1.55;
export const FROST_ARMOR_MAX_MULTIPLIER = 2.2;

export function isInsideSignalFire(point: Point, fire: Point | null | undefined): boolean {
  if (!fire) return false;
  const dx = point.x - fire.x;
  const dy = point.y - fire.y;
  return dx * dx + dy * dy <= SIGNAL_FIRE_RADIUS * SIGNAL_FIRE_RADIUS;
}

export function getFrostArmorDamageMultiplier(kind: DamageKind, insideWarmZone: boolean): number {
  const fireMultiplier = kind === "fire" ? FROST_ARMOR_FIRE_MULTIPLIER : 1;
  const warmMultiplier = insideWarmZone ? FROST_ARMOR_WARM_MULTIPLIER : 1;
  return Math.min(FROST_ARMOR_MAX_MULTIPLIER, fireMultiplier * warmMultiplier);
}

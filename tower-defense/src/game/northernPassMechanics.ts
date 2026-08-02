import type {
  DamageKind,
  EnemyVariant,
  NorthernStormPlan,
  NorthernStormSectorId,
  Point,
} from "./types.ts";

export const SIGNAL_FIRE_RADIUS = 124;
export const FROST_ARMOR_FIRE_MULTIPLIER = 1.7;
export const FROST_ARMOR_WARM_MULTIPLIER = 1.55;
export const FROST_ARMOR_MAX_MULTIPLIER = 2.2;

export const NORTHERN_STORM_SECTORS: readonly Readonly<{
  id: NorthernStormSectorId;
  startRatio: number;
  endRatio: number;
}>[] = Object.freeze([
  Object.freeze({ id: "upper", startRatio: 0, endRatio: 0.45 }),
  Object.freeze({ id: "middle", startRatio: 0.45, endRatio: 0.73 }),
  Object.freeze({ id: "lower", startRatio: 0.73, endRatio: 1 }),
]);

const HERO_ANCHOR_SECTORS: readonly NorthernStormSectorId[] = Object.freeze(["upper", "middle", "lower"]);

export type NorthernStormEffect = Readonly<{
  sectorId: NorthernStormSectorId;
  protected: boolean;
  affected: boolean;
  speedMultiplier: number;
  controlResistanceBonus: number;
}>;

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

export function getHeroProtectedStormSector(anchorId: number): NorthernStormSectorId | null {
  return HERO_ANCHOR_SECTORS[anchorId] ?? null;
}

export function getStormSectorAtProgress(progress: number, totalLength: number): NorthernStormSectorId {
  const ratio = totalLength > 0 ? Math.min(1, Math.max(0, progress / totalLength)) : 0;
  return NORTHERN_STORM_SECTORS.find((sector) => ratio < sector.endRatio)?.id ?? "lower";
}

export function getNorthernStormEffect(
  variant: EnemyVariant,
  progress: number,
  totalLength: number,
  activeHeroAnchorId: number,
  plan: NorthernStormPlan | null | undefined,
): NorthernStormEffect {
  const sectorId = getStormSectorAtProgress(progress, totalLength);
  const protectedSectorId = getHeroProtectedStormSector(activeHeroAnchorId);
  const protectedByFire = protectedSectorId === sectorId;
  const affected = Boolean(plan?.sectorIds.includes(sectorId) && !protectedByFire);
  return Object.freeze({
    sectorId,
    protected: protectedByFire,
    affected,
    speedMultiplier: affected && variant === "snow-runner" ? 1 + (plan?.runnerSpeedBonus ?? 0) : 1,
    controlResistanceBonus: affected && variant === "icebound"
      ? plan?.iceboundControlResistanceBonus ?? 0
      : 0,
  });
}

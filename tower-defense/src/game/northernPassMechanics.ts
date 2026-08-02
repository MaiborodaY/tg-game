import type {
  DamageKind,
  NorthernAvalancheZone,
  NorthernAvalancheZoneId,
} from "./types.ts";

export const NORTHERN_AVALANCHE_ZONES: readonly NorthernAvalancheZone[] = Object.freeze([
  Object.freeze({ id: "upper", startRatio: 0, endRatio: 0.36 }),
  Object.freeze({ id: "middle", startRatio: 0.36, endRatio: 0.7 }),
  Object.freeze({ id: "lower", startRatio: 0.7, endRatio: 1 }),
]);

export const AVALANCHE_FROST_ARMOR_REMOVAL_RATIO = 1;
export const AVALANCHE_BOSS_FROST_ARMOR_REMOVAL_RATIO = 0.9;
export const AVALANCHE_STUN_MS = 2_000;
export const AVALANCHE_BOSS_STUN_MS = 1_600;
export const AVALANCHE_HEALING_INTERRUPT_MS = 3_500;
export const FROST_ARMOR_FIRE_MULTIPLIER = 1.7;

export type NorthernAvalancheImpact = Readonly<{
  frostArmorRemoved: number;
  stunDurationMs: number;
  healingInterrupted: boolean;
}>;

export function getNorthernAvalancheZone(zoneId: NorthernAvalancheZoneId): NorthernAvalancheZone {
  const zone = NORTHERN_AVALANCHE_ZONES.find((candidate) => candidate.id === zoneId);
  if (!zone) throw new RangeError(`Unknown Northern avalanche zone: ${zoneId}`);
  return zone;
}

export function getNorthernAvalancheZoneAtProgress(
  progress: number,
  totalLength: number,
): NorthernAvalancheZoneId {
  const ratio = normalizeProgressRatio(progress, totalLength);
  return NORTHERN_AVALANCHE_ZONES.find((zone) => ratio < zone.endRatio)?.id ?? "lower";
}

export function isProgressInsideNorthernAvalancheZone(
  progress: number,
  totalLength: number,
  zoneId: NorthernAvalancheZoneId,
): boolean {
  return getNorthernAvalancheZoneAtProgress(progress, totalLength) === zoneId;
}

export function calculateNorthernAvalancheImpact(
  frostArmor: number,
  maxFrostArmor: number,
  boss: boolean,
  healer: boolean,
): NorthernAvalancheImpact {
  const armorRemovalRatio = boss
    ? AVALANCHE_BOSS_FROST_ARMOR_REMOVAL_RATIO
    : AVALANCHE_FROST_ARMOR_REMOVAL_RATIO;
  return Object.freeze({
    frostArmorRemoved: Math.min(
      Math.max(0, frostArmor),
      Math.max(0, maxFrostArmor) * armorRemovalRatio,
    ),
    stunDurationMs: boss ? AVALANCHE_BOSS_STUN_MS : AVALANCHE_STUN_MS,
    healingInterrupted: healer,
  });
}

/** Fire keeps its tower-role advantage, without depending on the removed signal-fire system. */
export function getFrostArmorDamageMultiplier(kind: DamageKind): number {
  return kind === "fire" ? FROST_ARMOR_FIRE_MULTIPLIER : 1;
}

function normalizeProgressRatio(progress: number, totalLength: number): number {
  if (!Number.isFinite(progress) || !Number.isFinite(totalLength) || totalLength <= 0) return 0;
  return Math.min(1, Math.max(0, progress / totalLength));
}

import type { DamageKind, TowerType } from "./types.ts";

export type TargetCandidate = {
  id: number;
  x: number;
  y: number;
  progress: number;
  slowed: boolean;
  physicalResistance: number;
  magicResistance: number;
};

export function chooseTowerTarget(
  towerType: TowerType,
  origin: Readonly<{ x: number; y: number }>,
  range: number,
  candidates: readonly TargetCandidate[],
  splashRadius = 0,
): TargetCandidate | null {
  const inRange = candidates.filter((candidate) => squaredDistance(origin, candidate) <= range * range);
  if (inRange.length === 0) return null;

  if (towerType === "ember") {
    return inRange.reduce((best, candidate) => {
      const density = candidates.filter((other) => squaredDistance(candidate, other) <= splashRadius * splashRadius).length;
      const bestDensity = candidates.filter((other) => squaredDistance(best, other) <= splashRadius * splashRadius).length;
      return density > bestDensity || (density === bestDensity && candidate.progress > best.progress) ? candidate : best;
    });
  }

  const preferred = towerType === "frost" ? inRange.filter((candidate) => !candidate.slowed) : inRange;
  const pool = preferred.length > 0 ? preferred : inRange;
  return pool.reduce((best, candidate) => candidate.progress > best.progress ? candidate : best);
}

export function calculateDamage(
  amount: number,
  kind: DamageKind,
  target: Pick<TargetCandidate, "physicalResistance" | "magicResistance">,
): number {
  const resistance = kind === "physical" ? target.physicalResistance : kind === "arcane" ? 0 : target.magicResistance;
  return Math.max(0, amount * (1 - Math.min(0.9, Math.max(0, resistance))));
}

function squaredDistance(left: Readonly<{ x: number; y: number }>, right: Readonly<{ x: number; y: number }>): number {
  return Math.pow(left.x - right.x, 2) + Math.pow(left.y - right.y, 2);
}

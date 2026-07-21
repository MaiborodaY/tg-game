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

  if (towerType === "ember" || towerType === "storm") {
    let best = inRange[0];
    let bestDensity = -1;
    for (const candidate of inRange) {
      let density = 0;
      for (const other of candidates) {
        if (squaredDistance(candidate, other) <= splashRadius * splashRadius) density += 1;
      }
      if (density > bestDensity || (density === bestDensity && candidate.progress > best.progress)) {
        best = candidate;
        bestDensity = density;
      }
    }
    return best;
  }

  const preferred = towerType === "frost" ? inRange.filter((candidate) => !candidate.slowed) : inRange;
  const pool = preferred.length > 0 ? preferred : inRange;
  return pool.reduce((best, candidate) => candidate.progress > best.progress ? candidate : best);
}

export function chooseChainTargets(
  primary: TargetCandidate,
  candidates: readonly TargetCandidate[],
  maxTargets: number,
  chainRange: number,
): TargetCandidate[] {
  const selected: TargetCandidate[] = [primary];
  const used = new Set([primary.id]);
  const rangeSquared = Math.max(0, chainRange) ** 2;
  let current = primary;
  while (selected.length < Math.max(1, Math.floor(maxTargets))) {
    let next: TargetCandidate | null = null;
    let nextDistance = Number.POSITIVE_INFINITY;
    for (const candidate of candidates) {
      if (used.has(candidate.id)) continue;
      const distance = squaredDistance(current, candidate);
      if (distance <= rangeSquared && (distance < nextDistance || (distance === nextDistance && candidate.progress > (next?.progress ?? -1)))) {
        next = candidate;
        nextDistance = distance;
      }
    }
    if (!next) break;
    selected.push(next);
    used.add(next.id);
    current = next;
  }
  return selected;
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

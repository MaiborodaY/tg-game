import type { CampaignAct } from "../game/types.ts";
import type { Point } from "../game/types.ts";
import {
  createPathMetrics,
  getPointAtDistance,
  getRouteAngleAtDistance,
} from "../game/pathing.ts";

export type AvalancheZoneState = "available" | "armed" | "spent";

export type AvalancheZoneVisualProfile = Readonly<{
  footprint: number;
  footprintAlpha: number;
  rim: number;
  rimAlpha: number;
  marker: number;
  markerAlpha: number;
  icon: number;
  iconAlpha: number;
  rubbleAlpha: number;
  pulseAlpha: number;
}>;

export type AvalancheActVisualProfile = Readonly<{
  route: number;
  routeAlpha: number;
  snow: number;
  crack: number;
  accent: number;
}>;

const AVALANCHE_ZONE_VISUALS = Object.freeze({
  available: Object.freeze({
    footprint: 0x153f4c,
    footprintAlpha: 0.56,
    rim: 0x8ee9f1,
    rimAlpha: 0.88,
    marker: 0x2e8492,
    markerAlpha: 0.94,
    icon: 0xe8fdff,
    iconAlpha: 1,
    rubbleAlpha: 0.08,
    pulseAlpha: 0.24,
  }),
  armed: Object.freeze({
    footprint: 0x4b3518,
    footprintAlpha: 0.68,
    rim: 0xffd47c,
    rimAlpha: 1,
    marker: 0xd98535,
    markerAlpha: 1,
    icon: 0xfff3ba,
    iconAlpha: 1,
    rubbleAlpha: 0.18,
    pulseAlpha: 0.52,
  }),
  spent: Object.freeze({
    footprint: 0x18252c,
    footprintAlpha: 0.48,
    rim: 0x718891,
    rimAlpha: 0.42,
    marker: 0x4d6067,
    markerAlpha: 0.64,
    icon: 0xa7b8bd,
    iconAlpha: 0.64,
    rubbleAlpha: 0.92,
    pulseAlpha: 0,
  }),
}) satisfies Readonly<Record<AvalancheZoneState, AvalancheZoneVisualProfile>>;

const AVALANCHE_ACT_VISUALS = Object.freeze({
  1: Object.freeze({
    route: 0xbfe9ee,
    routeAlpha: 0.12,
    snow: 0xdff8f7,
    crack: 0x6f9ca7,
    accent: 0x8ee9f1,
  }),
  2: Object.freeze({
    route: 0x70bed1,
    routeAlpha: 0.2,
    snow: 0xc8eef2,
    crack: 0x397887,
    accent: 0x72d9e8,
  }),
  3: Object.freeze({
    route: 0x9c8eea,
    routeAlpha: 0.2,
    snow: 0xd8d9fa,
    crack: 0x63589a,
    accent: 0xc2a8ff,
  }),
}) satisfies Readonly<Record<CampaignAct, AvalancheActVisualProfile>>;

export function getAvalancheZoneVisualProfile(state: AvalancheZoneState): AvalancheZoneVisualProfile {
  return AVALANCHE_ZONE_VISUALS[state];
}

export function getAvalancheActVisualProfile(act: CampaignAct): AvalancheActVisualProfile {
  return AVALANCHE_ACT_VISUALS[act];
}

export function sampleAvalancheRouteSegment(
  routePoints: readonly Point[],
  startRatio: number,
  endRatio: number,
  spacing = 18,
): readonly Point[] {
  const path = createPathMetrics(routePoints);
  const start = path.totalLength * clampRatio(startRatio);
  const end = path.totalLength * Math.max(clampRatio(startRatio), clampRatio(endRatio));
  const count = Math.max(1, Math.ceil((end - start) / Math.max(4, spacing)));
  return Object.freeze(Array.from({ length: count + 1 }, (_, index) => (
    getPointAtDistance(path, start + ((end - start) * index) / count)
  )));
}

/** Keeps the tap target near its route section but away from towers, heroes, and screen edges. */
export function selectAvalancheMarkerPoint(
  routePoints: readonly Point[],
  startRatio: number,
  endRatio: number,
  reservedPoints: readonly Point[],
  width: number,
  height: number,
): Point {
  const path = createPathMetrics(routePoints);
  const start = clampRatio(startRatio);
  const end = Math.max(start, clampRatio(endRatio));
  let best: Readonly<{ point: Point; clearance: number }> | null = null;
  for (let index = 1; index < 12; index += 1) {
    const ratio = start + ((end - start) * index) / 12;
    const distance = path.totalLength * ratio;
    const routePoint = getPointAtDistance(path, distance);
    const normalAngle = getRouteAngleAtDistance(path, distance) + Math.PI / 2;
    for (const offset of [0, -46, 46]) {
      const point = Object.freeze({
        x: routePoint.x + Math.cos(normalAngle) * offset,
        y: routePoint.y + Math.sin(normalAngle) * offset,
      });
      const interactionClearance = reservedPoints.length > 0
        ? Math.min(...reservedPoints.map((reserved) => Math.hypot(point.x - reserved.x, point.y - reserved.y)))
        : Number.POSITIVE_INFINITY;
      const edgeClearance = Math.min(point.x, width - point.x, point.y, height - point.y);
      const clearance = Math.min(interactionClearance, edgeClearance);
      if (!best || clearance > best.clearance) best = Object.freeze({ point, clearance });
    }
  }
  return best?.point ?? getPointAtDistance(path, path.totalLength * ((start + end) / 2));
}

function clampRatio(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

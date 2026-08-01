import type { CampaignAct, Point, TowerLevel, TowerType } from "../game/types.ts";

export type TowerTierVisualProfile = Readonly<{
  footprintRadius: number;
  headLift: number;
  buttressCount: number;
  accent: number;
  trim: number;
  mastery: boolean;
}>;

export type ActVisualProfile = Readonly<{
  veil: number;
  veilAlpha: number;
  portal: number;
  gateWard: number;
  bossAccent: number;
  snowAlpha: number;
  auroraAlpha: number;
  stormAlpha: number;
}>;

export type WorldVisualTheme = Readonly<{
  id: "forest-gate" | "northern-pass";
  seed: number;
  ground: number;
  groundDeep: number;
  groundLight: number;
  moss: number;
  leaf: number;
  flower: number;
  routeShadow: number;
  routeBank: number;
  routeEdge: number;
  routeBed: number;
  routeLight: number;
  routeWidths: readonly [number, number, number, number, number];
  stoneDark: number;
  stoneLight: number;
  portal: number;
  crystal: number;
}>;

export type WorldDecorationPoint = Readonly<{
  x: number;
  y: number;
  scale: number;
  variant: number;
}>;

export type WorldDecorationLayout = Readonly<{
  clearings: readonly WorldDecorationPoint[];
  groundDetails: readonly WorldDecorationPoint[];
  shrubs: readonly WorldDecorationPoint[];
  trees: readonly WorldDecorationPoint[];
  fireflies: readonly WorldDecorationPoint[];
}>;

export type NorthernLandmarkLayout = Readonly<{
  caravan: Readonly<{ x: number; y: number; rotation: number }>;
  iceBridge: Readonly<{ x: number; y: number; rotation: number; length: number }>;
}>;

const TOWER_VISUAL_COLORS = Object.freeze({
  ranger: Object.freeze({ accent: 0xd8ad62, trim: 0xf3d88a }),
  frost: Object.freeze({ accent: 0x74e8f3, trim: 0xd9ffff }),
  ember: Object.freeze({ accent: 0xff7b45, trim: 0xffd56a }),
  storm: Object.freeze({ accent: 0x74dff2, trim: 0xc9f8ff }),
}) satisfies Readonly<Record<TowerType, Readonly<{ accent: number; trim: number }>>>;

const TOWER_TIER_GEOMETRY = Object.freeze({
  1: Object.freeze({ footprintRadius: 17, headLift: 0, buttressCount: 0, mastery: false }),
  2: Object.freeze({ footprintRadius: 18, headLift: 2, buttressCount: 2, mastery: false }),
  3: Object.freeze({ footprintRadius: 20, headLift: 4, buttressCount: 4, mastery: false }),
  4: Object.freeze({ footprintRadius: 22, headLift: 6, buttressCount: 4, mastery: true }),
}) satisfies Readonly<Record<TowerLevel, Readonly<{
  footprintRadius: number;
  headLift: number;
  buttressCount: number;
  mastery: boolean;
}>>>;

const ACT_VISUAL_PROFILES = Object.freeze({
  "forest-gate": Object.freeze({
    1: Object.freeze({ veil: 0x3e7b63, veilAlpha: 0, portal: 0xb77df2, gateWard: 0x72e6c2, bossAccent: 0xf3c967, snowAlpha: 0, auroraAlpha: 0, stormAlpha: 0 }),
    2: Object.freeze({ veil: 0x5c3c78, veilAlpha: 0.08, portal: 0xa879e8, gateWard: 0x79d9ed, bossAccent: 0xc7a2f5, snowAlpha: 0, auroraAlpha: 0, stormAlpha: 0 }),
    3: Object.freeze({ veil: 0x8b3448, veilAlpha: 0.14, portal: 0xe05f78, gateWard: 0xffa168, bossAccent: 0xff7b72, snowAlpha: 0, auroraAlpha: 0, stormAlpha: 0 }),
  }),
  "northern-pass": Object.freeze({
    1: Object.freeze({ veil: 0x24495e, veilAlpha: 0.025, portal: 0x75d7f5, gateWard: 0x8fe8ef, bossAccent: 0xe1fbff, snowAlpha: 0.18, auroraAlpha: 0, stormAlpha: 0 }),
    2: Object.freeze({ veil: 0x30486f, veilAlpha: 0.1, portal: 0xa0d8ff, gateWard: 0xb6e9ff, bossAccent: 0xd9edff, snowAlpha: 0.54, auroraAlpha: 0, stormAlpha: 0.18 }),
    3: Object.freeze({ veil: 0x244e61, veilAlpha: 0.08, portal: 0x91e8ef, gateWard: 0xa7f5dc, bossAccent: 0xffd1e6, snowAlpha: 0.32, auroraAlpha: 0.3, stormAlpha: 0.06 }),
  }),
}) satisfies Readonly<Record<WorldVisualTheme["id"], Readonly<Record<CampaignAct, ActVisualProfile>>>>;

const FOREST_GATE_THEME: WorldVisualTheme = Object.freeze({
  id: "forest-gate",
  seed: 87_121,
  ground: 0x123029,
  groundDeep: 0x081d1a,
  groundLight: 0x21483a,
  moss: 0x315f43,
  leaf: 0x6f8f52,
  flower: 0xe3c778,
  routeShadow: 0x061512,
  routeBank: 0x493a2b,
  routeEdge: 0x7d6547,
  routeBed: 0xb68b55,
  routeLight: 0xd6b474,
  routeWidths: Object.freeze([58, 52, 45, 38, 29] as const),
  stoneDark: 0x33433d,
  stoneLight: 0x78907e,
  portal: 0xb77df2,
  crystal: 0x72e6c2,
});

const NORTHERN_PASS_THEME: WorldVisualTheme = Object.freeze({
  id: "northern-pass",
  seed: 41_903,
  ground: 0x14262e,
  groundDeep: 0x07151d,
  groundLight: 0x28414b,
  moss: 0x35515a,
  leaf: 0x87aab2,
  flower: 0xdaf8ff,
  routeShadow: 0x06121a,
  routeBank: 0x283842,
  routeEdge: 0x667986,
  routeBed: 0x8999a0,
  routeLight: 0xd4e3e4,
  routeWidths: Object.freeze([48, 43, 36, 28, 19] as const),
  stoneDark: 0x263943,
  stoneLight: 0x91aeb9,
  portal: 0x75d7f5,
  crystal: 0x8fe8ef,
});

export const WORLD_VISUAL_THEMES = Object.freeze({
  "forest-gate": FOREST_GATE_THEME,
  "northern-pass": NORTHERN_PASS_THEME,
});

export const FOREST_GATE_LANDMARKS = Object.freeze([
  Object.freeze({ id: "fallen-log", x: 346, y: 294, radius: 28 }),
  Object.freeze({ id: "mushroom-ring", x: 28, y: 430, radius: 17 }),
] as const);

export function getTowerTierVisualProfile(type: TowerType, level: TowerLevel): TowerTierVisualProfile {
  return Object.freeze({ ...TOWER_TIER_GEOMETRY[level], ...TOWER_VISUAL_COLORS[type] });
}

export function getActVisualProfile(
  act: CampaignAct,
  themeId: WorldVisualTheme["id"] = "forest-gate",
): ActVisualProfile {
  return ACT_VISUAL_PROFILES[themeId][act];
}

export function isPointWithinVisualRadius(point: Point, center: Point, radius: number): boolean {
  if (!Number.isFinite(radius) || radius <= 0) return false;
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return dx * dx + dy * dy <= radius * radius;
}

export function getWorldVisualTheme(levelId?: string): WorldVisualTheme {
  return levelId === "northern-pass" ? NORTHERN_PASS_THEME : FOREST_GATE_THEME;
}

export function createWorldDecorationLayout(
  theme: WorldVisualTheme,
  route: readonly Point[],
  width: number,
  height: number,
  reservedPoints: readonly Point[] = [],
): WorldDecorationLayout {
  const rng = seededRandom(theme.seed);
  const northern = theme.id === "northern-pass";
  const clearings = createScatteredPoints(rng, northern ? 9 : 11, width, height, route, reservedPoints, 48, 50, 0.8, 1.45);
  const groundDetails = createScatteredPoints(rng, northern ? 58 : 78, width, height, route, reservedPoints, 29, 22, 0.65, 1.25);
  const shrubs = createScatteredPoints(rng, northern ? 21 : 34, width, height, route, reservedPoints, 38, 30, 0.72, 1.3);
  const trees = createEdgePoints(rng, northern ? 8 : 10, width, height, route, reservedPoints);
  const fireflies = createScatteredPoints(rng, northern ? 12 : 6, width, height, route, reservedPoints, 31, 24, 0.8, 1.15);
  return Object.freeze({ clearings, groundDetails, shrubs, trees, fireflies });
}

/** Keeps authored Northern Pass landmarks stable while adapting to future route revisions. */
export function createNorthernLandmarkLayout(
  route: readonly Point[],
  width: number,
  height: number,
  clearings: readonly WorldDecorationPoint[],
): NorthernLandmarkLayout {
  const caravanTarget = Object.freeze({ x: width * 0.19, y: height * 0.62 });
  const caravanPoint = clearings.reduce<WorldDecorationPoint | undefined>((best, point) => {
    if (!best) return point;
    return pointDistance(point, caravanTarget) < pointDistance(best, caravanTarget) ? point : best;
  }, undefined) ?? Object.freeze({ ...caravanTarget, scale: 1, variant: 0 });

  const bridgeSegment = findBridgeSegment(route, width, height);
  return Object.freeze({
    caravan: Object.freeze({
      x: caravanPoint.x,
      y: caravanPoint.y,
      rotation: caravanPoint.variant % 2 === 0 ? -0.16 : 0.16,
    }),
    iceBridge: Object.freeze(bridgeSegment),
  });
}

export function distanceToWorldRoute(point: Point, route: readonly Point[]): number {
  let best = Number.POSITIVE_INFINITY;
  for (let index = 1; index < route.length; index += 1) {
    best = Math.min(best, distanceToSegment(point, route[index - 1], route[index]));
  }
  return best;
}

function createScatteredPoints(
  rng: () => number,
  targetCount: number,
  width: number,
  height: number,
  route: readonly Point[],
  reservedPoints: readonly Point[],
  routeClearance: number,
  reservedClearance: number,
  minScale: number,
  maxScale: number,
): readonly WorldDecorationPoint[] {
  const points: WorldDecorationPoint[] = [];
  const maxAttempts = targetCount * 12;
  for (let attempt = 0; attempt < maxAttempts && points.length < targetCount; attempt += 1) {
    const candidate = Object.freeze({
      x: 10 + rng() * Math.max(1, width - 20),
      y: 10 + rng() * Math.max(1, height - 20),
      scale: minScale + rng() * (maxScale - minScale),
      variant: Math.floor(rng() * 4),
    });
    if (!isWorldPointClear(candidate, route, reservedPoints, routeClearance, reservedClearance)) continue;
    points.push(candidate);
  }
  return Object.freeze(points);
}

function createEdgePoints(
  rng: () => number,
  targetCount: number,
  width: number,
  height: number,
  route: readonly Point[],
  reservedPoints: readonly Point[],
): readonly WorldDecorationPoint[] {
  const points: WorldDecorationPoint[] = [];
  const maxAttempts = targetCount * 20;
  for (let attempt = 0; attempt < maxAttempts && points.length < targetCount; attempt += 1) {
    const left = attempt % 2 === 0;
    const candidate = Object.freeze({
      x: left ? 3 + rng() * 17 : width - 3 - rng() * 17,
      y: 34 + rng() * Math.max(1, height - 68),
      scale: 0.82 + rng() * 0.42,
      variant: Math.floor(rng() * 4),
    });
    if (!isWorldPointClear(candidate, route, reservedPoints, 40, 38)) continue;
    if (points.some((point) => Math.hypot(point.x - candidate.x, point.y - candidate.y) < 42)) continue;
    points.push(candidate);
  }
  return Object.freeze(points);
}

function isWorldPointClear(
  point: Point,
  route: readonly Point[],
  reservedPoints: readonly Point[],
  routeClearance: number,
  reservedClearance: number,
): boolean {
  if (distanceToWorldRoute(point, route) < routeClearance) return false;
  return reservedPoints.every((reserved) => Math.hypot(point.x - reserved.x, point.y - reserved.y) >= reservedClearance);
}

function distanceToSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const ratio = lengthSquared === 0
    ? 0
    : Math.min(1, Math.max(0, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (start.x + dx * ratio), point.y - (start.y + dy * ratio));
}

function findBridgeSegment(
  route: readonly Point[],
  width: number,
  height: number,
): Readonly<{ x: number; y: number; rotation: number; length: number }> {
  const center = Object.freeze({ x: width * 0.52, y: height * 0.46 });
  let best: Readonly<{ start: Point; end: Point; score: number }> | undefined;
  for (let index = 1; index < route.length; index += 1) {
    const start = route[index - 1];
    const end = route[index];
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    if (length < 44) continue;
    const midpoint = Object.freeze({ x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 });
    const edgePenalty = midpoint.x < 36 || midpoint.x > width - 36 || midpoint.y < 36 || midpoint.y > height - 36
      ? width + height
      : 0;
    const score = pointDistance(midpoint, center) + edgePenalty - Math.min(length, 120) * 0.12;
    if (!best || score < best.score) best = Object.freeze({ start, end, score });
  }

  const start = best?.start ?? route[0] ?? Object.freeze({ x: width * 0.35, y: height * 0.46 });
  const end = best?.end ?? route[1] ?? Object.freeze({ x: width * 0.69, y: height * 0.46 });
  return Object.freeze({
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
    rotation: Math.atan2(end.y - start.y, end.x - start.x),
    length: Math.min(104, Math.max(54, Math.hypot(end.x - start.x, end.y - start.y) * 0.72)),
  });
}

function pointDistance(first: Point, second: Point): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = Math.imul(1_664_525, value) + 1_013_904_223;
    return (value >>> 0) / 4_294_967_296;
  };
}

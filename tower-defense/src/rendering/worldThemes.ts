import type { Point } from "../game/types.ts";

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
  ground: 0x172b2b,
  groundDeep: 0x0b1b20,
  groundLight: 0x294243,
  moss: 0x3d5d57,
  leaf: 0x77958a,
  flower: 0xb9e5df,
  routeShadow: 0x071418,
  routeBank: 0x414445,
  routeEdge: 0x6c716f,
  routeBed: 0x9a8d75,
  routeLight: 0xc6b99a,
  routeWidths: Object.freeze([48, 42, 34, 25, 17] as const),
  stoneDark: 0x354246,
  stoneLight: 0x8ba0a0,
  portal: 0x79c9e8,
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
  const clearings = createScatteredPoints(rng, 11, width, height, route, reservedPoints, 48, 50, 0.8, 1.45);
  const groundDetails = createScatteredPoints(rng, 78, width, height, route, reservedPoints, 29, 22, 0.65, 1.25);
  const shrubs = createScatteredPoints(rng, 34, width, height, route, reservedPoints, 38, 30, 0.72, 1.3);
  const trees = createEdgePoints(rng, 10, width, height, route, reservedPoints);
  const fireflies = createScatteredPoints(rng, 6, width, height, route, reservedPoints, 31, 24, 0.8, 1.15);
  return Object.freeze({ clearings, groundDetails, shrubs, trees, fireflies });
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

function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = Math.imul(1_664_525, value) + 1_013_904_223;
    return (value >>> 0) / 4_294_967_296;
  };
}

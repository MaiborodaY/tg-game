import type { Point } from "./types.ts";

export type PathMetrics = Readonly<{
  points: readonly Point[];
  segmentLengths: readonly number[];
  cumulativeLengths: readonly number[];
  totalLength: number;
}>;

export function createPathMetrics(points: readonly Point[]): PathMetrics {
  if (points.length < 2) throw new Error("A route needs at least two points.");
  const segmentLengths: number[] = [];
  const cumulativeLengths: number[] = [0];
  let totalLength = 0;
  for (let index = 1; index < points.length; index += 1) {
    const left = points[index - 1];
    const right = points[index];
    const length = Math.hypot(right.x - left.x, right.y - left.y);
    segmentLengths.push(length);
    totalLength += length;
    cumulativeLengths.push(totalLength);
  }
  return Object.freeze({
    points: Object.freeze([...points]),
    segmentLengths: Object.freeze(segmentLengths),
    cumulativeLengths: Object.freeze(cumulativeLengths),
    totalLength,
  });
}

export function getPointAtDistance(path: PathMetrics, distanceValue: number): Point {
  const distance = Math.min(path.totalLength, Math.max(0, Number(distanceValue) || 0));
  let segment = path.segmentLengths.length - 1;
  for (let index = 0; index < path.segmentLengths.length; index += 1) {
    if (distance <= path.cumulativeLengths[index + 1]) {
      segment = index;
      break;
    }
  }
  const start = path.points[segment];
  const end = path.points[segment + 1];
  const localDistance = distance - path.cumulativeLengths[segment];
  const ratio = path.segmentLengths[segment] > 0 ? localDistance / path.segmentLengths[segment] : 0;
  return Object.freeze({
    x: start.x + (end.x - start.x) * ratio,
    y: start.y + (end.y - start.y) * ratio,
  });
}

export function getRouteAngleAtDistance(path: PathMetrics, distanceValue: number): number {
  const before = getPointAtDistance(path, Math.max(0, distanceValue - 2));
  const after = getPointAtDistance(path, Math.min(path.totalLength, distanceValue + 2));
  return Math.atan2(after.y - before.y, after.x - before.x);
}

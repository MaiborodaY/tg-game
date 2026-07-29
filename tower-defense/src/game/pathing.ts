import type { Point } from "./types.ts";

export type PathMetrics = Readonly<{
  points: readonly Point[];
  segmentLengths: readonly number[];
  cumulativeLengths: readonly number[];
  totalLength: number;
}>;

export type MutablePoint = { x: number; y: number };

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
  return Object.freeze(samplePointAtDistance(path, distanceValue, { x: 0, y: 0 }));
}

export function samplePointAtDistance(
  path: PathMetrics,
  distanceValue: number,
  output: MutablePoint,
): MutablePoint {
  const distance = clampPathDistance(path, distanceValue);
  const segment = findSegmentAtDistance(path, distance);
  const ratio = getSegmentRatio(path, segment, distance);
  const start = path.points[segment];
  const end = path.points[segment + 1];
  output.x = start.x + (end.x - start.x) * ratio;
  output.y = start.y + (end.y - start.y) * ratio;
  return output;
}

export function getRouteAngleAtDistance(path: PathMetrics, distanceValue: number): number {
  const beforeDistance = clampPathDistance(path, Math.max(0, distanceValue - 2));
  const afterDistance = clampPathDistance(path, Math.min(path.totalLength, distanceValue + 2));
  const beforeSegment = findSegmentAtDistance(path, beforeDistance);
  const afterSegment = findSegmentAtDistance(path, afterDistance);
  const beforeRatio = getSegmentRatio(path, beforeSegment, beforeDistance);
  const afterRatio = getSegmentRatio(path, afterSegment, afterDistance);
  const beforeStart = path.points[beforeSegment];
  const beforeEnd = path.points[beforeSegment + 1];
  const afterStart = path.points[afterSegment];
  const afterEnd = path.points[afterSegment + 1];
  const beforeX = beforeStart.x + (beforeEnd.x - beforeStart.x) * beforeRatio;
  const beforeY = beforeStart.y + (beforeEnd.y - beforeStart.y) * beforeRatio;
  const afterX = afterStart.x + (afterEnd.x - afterStart.x) * afterRatio;
  const afterY = afterStart.y + (afterEnd.y - afterStart.y) * afterRatio;
  return Math.atan2(afterY - beforeY, afterX - beforeX);
}

export function projectPointToPathDistance(path: PathMetrics, point: Point): number {
  const x = Number.isFinite(point.x) ? point.x : path.points[0].x;
  const y = Number.isFinite(point.y) ? point.y : path.points[0].y;
  let bestDistanceSquared = Number.POSITIVE_INFINITY;
  let bestProgress = 0;

  for (let index = 0; index < path.segmentLengths.length; index += 1) {
    const start = path.points[index];
    const end = path.points[index + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    const ratio = lengthSquared > 0
      ? Math.min(1, Math.max(0, ((x - start.x) * dx + (y - start.y) * dy) / lengthSquared))
      : 0;
    const projectedX = start.x + dx * ratio;
    const projectedY = start.y + dy * ratio;
    const offsetX = x - projectedX;
    const offsetY = y - projectedY;
    const distanceSquared = offsetX * offsetX + offsetY * offsetY;
    const progress = path.cumulativeLengths[index] + path.segmentLengths[index] * ratio;

    if (
      distanceSquared < bestDistanceSquared
      || (distanceSquared === bestDistanceSquared && progress < bestProgress)
    ) {
      bestDistanceSquared = distanceSquared;
      bestProgress = progress;
    }
  }

  return bestProgress;
}

function clampPathDistance(path: PathMetrics, distanceValue: number): number {
  return Math.min(path.totalLength, Math.max(0, Number(distanceValue) || 0));
}

function findSegmentAtDistance(path: PathMetrics, distance: number): number {
  for (let index = 0; index < path.segmentLengths.length; index += 1) {
    if (distance <= path.cumulativeLengths[index + 1]) return index;
  }
  return path.segmentLengths.length - 1;
}

function getSegmentRatio(path: PathMetrics, segment: number, distance: number): number {
  const segmentLength = path.segmentLengths[segment];
  return segmentLength > 0 ? (distance - path.cumulativeLengths[segment]) / segmentLength : 0;
}

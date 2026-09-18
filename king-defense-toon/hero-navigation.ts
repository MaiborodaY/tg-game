import { WALKABLE_AREAS } from './field.ts';
import type { Point } from './field.ts';

const GRID_STEP = 12;
const BODY_CLEARANCE = 29;
const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

// Called only after a blocked approach, not per animation frame. Fewer than 1,500 nodes
// cover the island; heroes and monks reuse this when their lightweight movement stalls.
export function findHeroCrowdRoute(start: Point, target: Point, friends: readonly Point[], range: number,
  canWalk: (from: Point, to: Point) => boolean, advanceLimit: number): Point[] | null {
  const left = Math.min(...WALKABLE_AREAS.map(area => area.left));
  const right = Math.max(...WALKABLE_AREAS.map(area => area.right));
  const bottom = Math.max(...WALKABLE_AREAS.map(area => area.bottom));
  // Include exact shores and the starting axes: a uniformly spaced grid can miss
  // the only outward escape when separation has pressed the hero against a bank.
  const axes = (low: number, high: number, extra: number[]): number[] => [...new Set([
    ...Array.from({ length: Math.floor((high - low) / GRID_STEP) + 1 }, (_, index) => low + index * GRID_STEP),
    ...extra.filter(value => value >= low && value <= high), high,
  ])].sort((a, b) => a - b);
  const xs = axes(left, right, [start.x, ...WALKABLE_AREAS.flatMap(area => [area.left, area.right])]);
  const ys = axes(advanceLimit, bottom, [start.y, ...WALKABLE_AREAS.flatMap(area => [area.top, area.bottom])]);
  const columns = xs.length, rows = ys.length;
  const points = Array.from({ length: columns * rows }, (_, index) => ({
    x: xs[index % columns], y: ys[Math.floor(index / columns)],
  }));
  const clearSegment = (from: Point, to: Point): boolean => {
    if (!canWalk(from, to)) return false;
    const dx = to.x - from.x, dy = to.y - from.y;
    const lengthSquared = dx * dx + dy * dy;
    return friends.every(friend => {
      const fx = from.x - friend.x, fy = from.y - friend.y;
      // Soft separation may leave the starting actor slightly inside a body radius.
      // Permit an outward escape, never a shortcut through that body.
      if (fx * fx + fy * fy < BODY_CLEARANCE ** 2) {
        return fx * dx + fy * dy >= 0 && distance(to, friend) >= BODY_CLEARANCE;
      }
      const t = lengthSquared > 0 ? Math.max(0, Math.min(1, -(fx * dx + fy * dy) / lengthSquared)) : 0;
      return (fx + dx * t) ** 2 + (fy + dy * t) ** 2 >= BODY_CLEARANCE ** 2;
    });
  };
  const open = points.map(point => point.y >= advanceLimit && canWalk(point, point)
    && friends.every(friend => distance(point, friend) >= BODY_CLEARANCE));
  const previous = new Int32Array(points.length).fill(-2);
  const queue = points.map((point, index) => ({ point, index }))
    .filter(({ point, index }) => open[index] && distance(start, point) <= GRID_STEP * 3
      && clearSegment(start, point))
    .sort((a, b) => distance(start, a.point) - distance(start, b.point)).map(item => item.index);
  for (const index of queue) previous[index] = -1;
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor], point = points[index];
    if (distance(point, target) <= range && canWalk(point, target)) {
      const reverse: Point[] = [];
      for (let current = index; current >= 0; current = previous[current]) reverse.push(points[current]);
      const path = reverse.reverse(), route: Point[] = [];
      let from = start;
      // Keep only visible corners, checking whole segments so we cannot clip allies.
      for (let next = 0; next < path.length;) {
        let end = path.length - 1;
        while (end > next && !clearSegment(from, path[end])) end -= 1;
        route.push(path[end]);
        from = path[end];
        next = end + 1;
      }
      return route;
    }
    const col = index % columns, row = Math.floor(index / columns);
    const neighbours = [col > 0 ? index - 1 : -1, col < columns - 1 ? index + 1 : -1,
      row > 0 ? index - columns : -1, row < rows - 1 ? index + columns : -1];
    for (const next of neighbours) {
      if (next < 0 || !open[next] || previous[next] !== -2 || !clearSegment(point, points[next])) continue;
      previous[next] = index;
      queue.push(next);
    }
  }
  return null;
}

import assert from "node:assert/strict";
import test from "node:test";

import { createPathMetrics, getPointAtDistance } from "../src/game/pathing.ts";

test("continuous path progress crosses multiple corners without waypoint overshoot", () => {
  const path = createPathMetrics([
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 30, y: 10 },
  ]);
  assert.equal(path.totalLength, 40);
  assert.deepEqual(getPointAtDistance(path, 5), { x: 5, y: 0 });
  assert.deepEqual(getPointAtDistance(path, 15), { x: 10, y: 5 });
  assert.deepEqual(getPointAtDistance(path, 35), { x: 25, y: 10 });
  assert.deepEqual(getPointAtDistance(path, 1_000), { x: 30, y: 10 });
});

test("invalid and negative progress clamps to the route entrance", () => {
  const path = createPathMetrics([{ x: -4, y: 3 }, { x: 6, y: 3 }]);
  assert.deepEqual(getPointAtDistance(path, -50), { x: -4, y: 3 });
  assert.deepEqual(getPointAtDistance(path, Number.NaN), { x: -4, y: 3 });
  assert.throws(() => createPathMetrics([{ x: 0, y: 0 }]));
});

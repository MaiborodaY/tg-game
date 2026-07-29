import assert from "node:assert/strict";
import test from "node:test";

import {
  createPathMetrics,
  getPointAtDistance,
  getRouteAngleAtDistance,
  projectPointToPathDistance,
  samplePointAtDistance,
} from "../src/game/pathing.ts";

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

test("allocation-free sampling reuses and updates the provided output", () => {
  const path = createPathMetrics([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }]);
  const output = { x: Number.NaN, y: Number.NaN };

  assert.equal(samplePointAtDistance(path, 4, output), output);
  assert.deepEqual(output, { x: 4, y: 0 });
  assert.equal(samplePointAtDistance(path, 16, output), output);
  assert.deepEqual(output, { x: 10, y: 6 });
  assert.equal(Object.isFrozen(output), false);
  assert.equal(Object.isFrozen(getPointAtDistance(path, 4)), true);
});

test("allocation-free sampling preserves route boundary clamping", () => {
  const path = createPathMetrics([{ x: -3, y: 2 }, { x: 7, y: 2 }, { x: 7, y: 12 }]);
  const output = { x: 0, y: 0 };

  assert.deepEqual(samplePointAtDistance(path, -1, output), { x: -3, y: 2 });
  assert.deepEqual(samplePointAtDistance(path, Number.NaN, output), { x: -3, y: 2 });
  assert.deepEqual(samplePointAtDistance(path, path.totalLength, output), { x: 7, y: 12 });
  assert.deepEqual(samplePointAtDistance(path, Number.POSITIVE_INFINITY, output), { x: 7, y: 12 });
});

test("route angle follows straight segments and blends across corners", () => {
  const path = createPathMetrics([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }]);

  assert.equal(getRouteAngleAtDistance(path, 0), 0);
  assert.equal(getRouteAngleAtDistance(path, 5), 0);
  assert.ok(Math.abs(getRouteAngleAtDistance(path, 10) - Math.PI / 4) < 1e-12);
  assert.ok(Math.abs(getRouteAngleAtDistance(path, 15) - Math.PI / 2) < 1e-12);
  assert.equal(getRouteAngleAtDistance(path, 1_000), 0);
  assert.equal(getRouteAngleAtDistance(path, Number.NaN), 0);
  assert.equal(getRouteAngleAtDistance(path, Number.POSITIVE_INFINITY), 0);
});

test("zero-length segments keep sampling and angles finite", () => {
  const path = createPathMetrics([{ x: 2, y: 3 }, { x: 2, y: 3 }, { x: 8, y: 3 }]);
  const output = { x: 0, y: 0 };

  assert.deepEqual(samplePointAtDistance(path, 0, output), { x: 2, y: 3 });
  assert.deepEqual(samplePointAtDistance(path, 3, output), { x: 5, y: 3 });
  assert.equal(getRouteAngleAtDistance(path, 0), 0);
  assert.equal(Number.isFinite(getRouteAngleAtDistance(path, 3)), true);
});

test("point projection selects the nearest segment and clamps to route endpoints", () => {
  const path = createPathMetrics([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }]);

  assert.equal(projectPointToPathDistance(path, { x: 4, y: 3 }), 4);
  assert.equal(projectPointToPathDistance(path, { x: 13, y: 7 }), 17);
  assert.equal(projectPointToPathDistance(path, { x: -50, y: 0 }), 0);
  assert.equal(projectPointToPathDistance(path, { x: 10, y: 50 }), 20);
});

test("equidistant path projection deterministically prefers the earliest progress", () => {
  const path = createPathMetrics([
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ]);

  assert.equal(projectPointToPathDistance(path, { x: 5, y: 5 }), 5);
  assert.equal(projectPointToPathDistance(path, { x: Number.NaN, y: Number.NaN }), 0);
});

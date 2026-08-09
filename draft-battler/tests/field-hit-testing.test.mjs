import assert from "node:assert/strict";
import test from "node:test";

import { findNearestSlotHitTarget } from "../src/fieldHitTesting.ts";

function createTarget(slotIndex, rect, hitRect, anchor) {
  return { slotIndex, rect, hitRect, anchor };
}

test("overlapping exact targets choose the nearest anchor instead of DOM order", () => {
  const point = { x: 50, y: 50 };
  const targets = [
    createTarget("far", { left: 30, top: 30, right: 70, bottom: 70 }, { left: 20, top: 20, right: 80, bottom: 80 }, { x: 32, y: 32 }),
    createTarget("near", { left: 40, top: 40, right: 80, bottom: 80 }, { left: 30, top: 30, right: 90, bottom: 90 }, { x: 52, y: 51 }),
  ];

  assert.equal(findNearestSlotHitTarget(point, targets)?.slotIndex, "near");
});

test("overlapping padded targets choose the nearest anchor", () => {
  const point = { x: 50, y: 50 };
  const targets = [
    createTarget("far", { left: 0, top: 0, right: 20, bottom: 20 }, { left: 0, top: 0, right: 70, bottom: 70 }, { x: 20, y: 20 }),
    createTarget("near", { left: 60, top: 45, right: 80, bottom: 65 }, { left: 40, top: 35, right: 90, bottom: 75 }, { x: 60, y: 50 }),
  ];

  assert.equal(findNearestSlotHitTarget(point, targets)?.slotIndex, "near");
});

test("an exact target wins over a closer padded target", () => {
  const point = { x: 50, y: 50 };
  const targets = [
    createTarget("exact", { left: 40, top: 40, right: 60, bottom: 60 }, { left: 30, top: 30, right: 70, bottom: 70 }, { x: 40, y: 40 }),
    createTarget("padded", { left: 60, top: 45, right: 80, bottom: 65 }, { left: 45, top: 35, right: 90, bottom: 75 }, { x: 51, y: 50 }),
  ];

  assert.equal(findNearestSlotHitTarget(point, targets)?.slotIndex, "exact");
});

test("a point outside every exact and padded rectangle returns undefined", () => {
  const target = createTarget(
    "only",
    { left: 10, top: 10, right: 20, bottom: 20 },
    { left: 5, top: 5, right: 25, bottom: 25 },
    { x: 15, y: 15 },
  );

  assert.equal(findNearestSlotHitTarget({ x: 30, y: 30 }, [target]), undefined);
});

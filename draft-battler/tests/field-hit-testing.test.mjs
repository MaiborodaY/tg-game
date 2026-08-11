import assert from "node:assert/strict";
import test from "node:test";

import {
  findNearestSlotHitTarget,
  resolveFieldSlotIndexForClick,
} from "../src/fieldHitTesting.ts";

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

test("pointer clicks resolve overlapping rows by the visual anchor instead of the DOM target", () => {
  const targets = [
    createTarget(0, { left: 20, top: 55, right: 100, bottom: 135 }, { left: 12, top: 47, right: 108, bottom: 143 }, { x: 60, y: 112 }),
    createTarget(3, { left: 20, top: 20, right: 100, bottom: 100 }, { left: 12, top: 12, right: 108, bottom: 108 }, { x: 60, y: 72 }),
  ];

  const resolvedSlotIndex = resolveFieldSlotIndexForClick(
    { clientX: 60, clientY: 95, detail: 1 },
    3,
    targets,
  );

  assert.equal(resolvedSlotIndex, 0);
});

test("keyboard and programmatic clicks preserve the supplied DOM slot", () => {
  const targets = [
    createTarget(0, { left: -20, top: -20, right: 20, bottom: 20 }, { left: -30, top: -30, right: 30, bottom: 30 }, { x: 0, y: 0 }),
    createTarget(3, { left: 20, top: 20, right: 100, bottom: 100 }, { left: 12, top: 12, right: 108, bottom: 108 }, { x: 60, y: 72 }),
  ];

  const resolvedSlotIndex = resolveFieldSlotIndexForClick(
    { clientX: 0, clientY: 0, detail: 0 },
    3,
    targets,
  );

  assert.equal(resolvedSlotIndex, 3);
});

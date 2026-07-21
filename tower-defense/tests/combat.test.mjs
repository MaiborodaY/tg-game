import assert from "node:assert/strict";
import test from "node:test";

import { calculateDamage, chooseChainTargets, chooseTowerTarget } from "../src/game/combat.ts";

const origin = { x: 0, y: 0 };

test("tower targeting respects progress, frost control and ember clusters", () => {
  const candidates = [
    target(1, 10, 0, 80, false),
    target(2, 12, 0, 70, true),
    target(3, 14, 1, 40, false),
    target(4, 88, 0, 100, false),
  ];
  assert.equal(chooseTowerTarget("ranger", origin, 100, candidates).id, 4);
  assert.equal(chooseTowerTarget("frost", origin, 30, candidates).id, 1, "frost prefers an advanced unslowed target");
  assert.equal(chooseTowerTarget("ember", origin, 100, candidates, 8).id, 1, "ember aims into the densest cluster");
  assert.equal(chooseTowerTarget("storm", origin, 100, candidates, 8).id, 1, "storm also aims into a chainable cluster");
});

test("chain lightning visits nearby unique targets and stops outside chain range", () => {
  const candidates = [
    target(1, 0, 0, 10, false),
    target(2, 15, 0, 20, false),
    target(3, 31, 0, 30, false),
    target(4, 90, 0, 100, false),
  ];
  assert.deepEqual(chooseChainTargets(candidates[0], candidates, 5, 20).map(({ id }) => id), [1, 2, 3]);
  assert.deepEqual(chooseChainTargets(candidates[0], candidates, 2, 20).map(({ id }) => id), [1, 2]);
});

test("physical armor and magic wards reduce only their matching damage", () => {
  const armored = { physicalResistance: 0.25, magicResistance: 0.4 };
  assert.equal(calculateDamage(100, "physical", armored), 75);
  assert.equal(calculateDamage(100, "fire", armored), 60);
  assert.equal(calculateDamage(100, "frost", armored), 60);
  assert.equal(calculateDamage(100, "arcane", armored), 100);
});

function target(id, x, y, progress, slowed) {
  return { id, x, y, progress, slowed, physicalResistance: 0, magicResistance: 0 };
}

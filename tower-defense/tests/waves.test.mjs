import assert from "node:assert/strict";
import test from "node:test";

import { createWavePlan } from "../src/game/waves.ts";

test("the twelve-wave campaign is deterministic and has bosses at its milestones", () => {
  for (let wave = 1; wave <= 12; wave += 1) {
    assert.deepEqual(createWavePlan(wave), createWavePlan(wave));
    assert.equal(createWavePlan(wave).hasBoss, [4, 8, 12].includes(wave));
  }
  assert.deepEqual(
    createWavePlan(1).spawns.map((spawn) => spawn.type),
    Array.from({ length: 8 }, () => "raider"),
  );
  assert.equal(createWavePlan(12).spawns.at(-1).type, "boss");
});

test("late waves raise health while keeping spawn identifiers and timing valid", () => {
  const early = createWavePlan(1);
  const late = createWavePlan(10);
  assert.ok(late.spawns.find((spawn) => spawn.type === "raider").maxHp > early.spawns[0].maxHp);
  assert.ok(late.spawns.every((spawn, index) => spawn.id === 100_000 + index));
  assert.ok(late.spawns.every((spawn, index) => index === 0 || spawn.atMs > late.spawns[index - 1].atMs));
  assert.ok(late.clearBonus > early.clearBonus);
});

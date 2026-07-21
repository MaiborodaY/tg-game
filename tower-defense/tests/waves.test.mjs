import assert from "node:assert/strict";
import test from "node:test";

import { BOSS_WAVES, createWavePlan, getBossRepair, getWaveAct, getWaveHealthMultiplier } from "../src/game/waves.ts";

test("the 24-wave campaign is deterministic and has six milestone bosses", () => {
  for (let wave = 1; wave <= 24; wave += 1) {
    assert.deepEqual(createWavePlan(wave), createWavePlan(wave));
    assert.equal(createWavePlan(wave).hasBoss, BOSS_WAVES.includes(wave));
  }
  assert.deepEqual(
    createWavePlan(1).spawns.map((spawn) => spawn.type),
    Array.from({ length: 8 }, () => "raider"),
  );
  assert.equal(createWavePlan(12).spawns.at(-1).type, "boss");
  assert.equal(createWavePlan(16).spawns.at(-1).type, "titan");
  assert.equal(createWavePlan(24).spawns.at(-1).type, "titan");
});

test("late waves raise health while keeping spawn identifiers and timing valid", () => {
  const early = createWavePlan(1);
  const late = createWavePlan(10);
  assert.ok(late.spawns.find((spawn) => spawn.type === "raider").maxHp > early.spawns[0].maxHp);
  assert.ok(late.spawns.every((spawn, index) => spawn.id === 100_000 + index));
  assert.ok(late.spawns.every((spawn, index) => index === 0 || spawn.atMs > late.spawns[index - 1].atMs));
  assert.ok(late.clearBonus > early.clearBonus);
});

test("late acts add specialist enemies, elite variants and steep health scaling", () => {
  const actTwo = createWavePlan(15);
  const finale = createWavePlan(24);
  assert.equal(actTwo.act, 2);
  assert.equal(finale.act, 3);
  assert.equal(finale.threat, 5);
  assert.ok(actTwo.spawns.some((spawn) => spawn.type === "bulwark" && spawn.shieldRatio > 0));
  assert.ok(actTwo.spawns.some((spawn) => spawn.type === "shaman" && spawn.healingRadius > 0));
  assert.ok(createWavePlan(17).spawns.some((spawn) => spawn.elite));
  assert.ok(getWaveHealthMultiplier(24) > getWaveHealthMultiplier(12) * 4);
  assert.equal(getWaveAct(8), 1);
  assert.equal(getWaveAct(9), 2);
});

test("titan phases and boss repairs make late milestones distinct", () => {
  assert.deepEqual(createWavePlan(16).spawns.at(-1).summonThresholds, [0.5]);
  assert.deepEqual(createWavePlan(20).spawns.at(-1).summonThresholds, [0.66, 0.33]);
  assert.deepEqual(createWavePlan(24).spawns.at(-1).summonThresholds, [0.75, 0.5, 0.25]);
  assert.equal(getBossRepair(12), 2);
  assert.equal(getBossRepair(16), 1);
  assert.equal(getBossRepair(24), 0);
  assert.deepEqual(createWavePlan(999), createWavePlan(24));
});

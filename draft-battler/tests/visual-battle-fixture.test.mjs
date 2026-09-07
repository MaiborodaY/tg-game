import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isCardAllowedInSlot } from "../src/game/index.ts";
import { createVisualBattleFixture, holdVisualBattleFormation } from "./visual/battleFixture.ts";

test("the visual replay uses deterministic legal full armies and actual combat output", () => {
  const fixture = createVisualBattleFixture();
  assert.deepEqual(fixture, createVisualBattleFixture());
  for (const board of [fixture.playerSlots, fixture.enemySlots]) {
    assert.equal(board.length, 6);
    board.forEach((slot) => assert.ok(isCardAllowedInSlot(slot.cardId, slot.slotIndex), slot.cardId));
  }
  assert.equal(fixture.timeline.units.filter((unit) => !unit.summonedBy).length, 12);
  assert.equal(fixture.timeline.winner, fixture.combat.winner);
  assert.ok(fixture.combat.events.some((event) => event.type === "unit_healed"));
  assert.ok(fixture.combat.events.some((event) => event.type === "unit_damaged" && event.shieldAbsorbed > 0));
  assert.ok(fixture.timeline.events.some((event) => event.type === "battle_finished"));
});

test("formation preview delays positive combat time without mutating actual combat or entry buffs", () => {
  const fixture = createVisualBattleFixture();
  const original = globalThis.structuredClone(fixture.timeline);
  const held = holdVisualBattleFormation(fixture.timeline);
  assert.deepEqual(fixture.timeline, original);
  assert.deepEqual(held.units, original.units);
  assert.deepEqual(held.castles, original.castles);
  held.events.forEach((event, index) => {
    const previous = original.events[index];
    assert.equal(event.time, previous.time > 0 ? previous.time + 250 : 0);
    if (event.type === "combat_step" && event.time > 0) {
      event.events.forEach((step, stepIndex) => assert.equal(step.time, previous.events[stepIndex].time + 250));
    }
  });
});

test("the local visual harness is not reachable from the production entry point", async () => {
  const main = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
  const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.doesNotMatch(main, /tests\/visual|battleFixture|visual\/battle/);
  assert.doesNotMatch(index, /tests\/visual|battleFixture|visual\/battle/);
});

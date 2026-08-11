import assert from "node:assert/strict";
import test from "node:test";

import { formatDebugRunReport, simulateDebugRun } from "../src/game/index.ts";

test("debug simulation reports a deterministic two-castle duel", () => {
  const first = simulateDebugRun({ seed: "debug-duel", strategy: "synergy" });
  const repeated = simulateDebugRun({ seed: "debug-duel", strategy: "synergy" });

  assert.deepEqual(first, repeated);
  assert.equal(first.finalStatus, "finished");
  assert.ok(["player", "enemy", "draw"].includes(first.outcome));
  assert.ok(first.finalPlayerHp >= 0 && first.finalPlayerHp <= 20);
  assert.ok(first.finalEnemyHp >= 0 && first.finalEnemyHp <= 20);
  first.rounds.forEach((round) => {
    assert.equal(round.playerHpAfter, Math.max(0, round.playerHpBefore - round.combat.playerCastleDamage));
    assert.equal(round.enemyHpAfter, Math.max(0, round.enemyHpBefore - round.combat.enemyCastleDamage));
  });

  const formatted = formatDebugRunReport(first);
  assert.match(formatted, /outcome (player|enemy|draw), HP \d+:\d+/);
  assert.match(formatted, /castle damage \d+:\d+/);
});

import assert from "node:assert/strict";
import test from "node:test";

import { getDebugBoardScore, getDebugDraftOptionScore, getDebugTeamScore } from "../src/game/debugSimulation.ts";
import { createRun, formatDebugRunReport, pickSynergyCards, simulateDebugRun } from "../src/game/index.ts";

test("debug simulation reports a deterministic two-castle duel", () => {
  const first = simulateDebugRun({ seed: "debug-duel", strategy: "synergy", botDifficulty: "strong" });
  const repeated = simulateDebugRun({ seed: "debug-duel", strategy: "synergy", botDifficulty: "strong" });

  assert.deepEqual(first, repeated);
  assert.equal(first.botDifficulty, "strong");
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

test("synergy strategy values crossing tier four over an unrelated high-tier caster", () => {
  const threeRogues = ["sneakblade", "longbow_hunter", "bone_archer"];
  const masteryScore = getDebugTeamScore([...threeRogues, "harpy_scout"]);
  const unrelatedScore = getDebugTeamScore([...threeRogues, "star_seer"]);

  assert.ok(masteryScore > unrelatedScore, `${masteryScore} should beat ${unrelatedScore}`);
});

test("synergy strategy does not count a duplicate upgrade as a fourth tagged unit", () => {
  const state = createRun("debug-real-placement");
  state.boardSlots[0] = { slotIndex: 0, cardId: "sneakblade", upgradeLevel: 0 };
  state.boardSlots[1] = { slotIndex: 1, cardId: "longbow_hunter", upgradeLevel: 0 };
  state.boardSlots[2] = { slotIndex: 2, cardId: "bone_archer", upgradeLevel: 0 };
  state.draftOptions = [
    { optionId: "duplicate", cardId: "bone_archer" },
    { optionId: "real-fourth", cardId: "harpy_scout" },
  ];

  const unchangedScore = getDebugBoardScore(state.boardSlots);
  const upgradedScore = getDebugDraftOptionScore(state, "bone_archer");

  assert.ok(upgradedScore > unchangedScore, "the real upgraded stats should still improve the board score");
  assert.ok(
    getDebugDraftOptionScore(state, "harpy_scout") > getDebugDraftOptionScore(state, "bone_archer"),
  );
  assert.deepEqual(pickSynergyCards(state), ["harpy_scout"]);
});

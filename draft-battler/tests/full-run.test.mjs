import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_RUN_ROUNDS,
  PLAYER_STARTING_HP,
  autoplayRun,
  createBattleTimeline,
  createEnemyBoardSlots,
} from "../src/game/index.ts";

const pickFirstOption = (state) => [state.draftOptions[0].cardId];

test("a complete seeded run reaches a valid terminal state", () => {
  const first = autoplayRun("p0-complete-run", pickFirstOption);
  const repeated = autoplayRun("p0-complete-run", pickFirstOption);

  assert.deepEqual(first, repeated);
  assert.equal(first.status, "finished");
  assert.ok(first.roundHistory.length >= 1 && first.roundHistory.length <= MAX_RUN_ROUNDS);
  assert.equal(first.roundHistory.at(-1).round, first.round);
  assert.ok(first.playerHp >= 0 && first.playerHp <= PLAYER_STARTING_HP);
  assert.ok(first.enemyHp >= 0 && first.enemyHp <= PLAYER_STARTING_HP);
  assert.ok(["player", "enemy", "draw"].includes(first.outcome));
  assert.ok(first.playerHp === 0 || first.enemyHp === 0 || first.round === MAX_RUN_ROUNDS);

  first.roundHistory.forEach((record) => {
    assert.deepEqual(record.enemySlots, createEnemyBoardSlots(first.seed, record.round));
    assert.equal(record.playerHpAfter, Math.max(0, record.playerHpBefore - record.combatResult.playerCastleDamage));
    assert.equal(record.enemyHpAfter, Math.max(0, record.enemyHpBefore - record.combatResult.enemyCastleDamage));
    assert.equal(record.combatResult.events[0].type, "combat_started");
    assert.equal(record.combatResult.events.at(-1).type, "combat_finished");

    const timeline = createBattleTimeline({
      playerSlots: record.playerSlots,
      enemySlots: record.enemySlots,
      combat: record.combatResult,
      playerCastleHpBefore: record.playerHpBefore,
      playerCastleHpAfter: record.playerHpAfter,
      enemyCastleHpBefore: record.enemyHpBefore,
      enemyCastleHpAfter: record.enemyHpAfter,
    });
    assert.equal(timeline.winner, record.combatResult.winner);
    assert.equal(timeline.events.at(-1).type, "battle_finished");
  });
});

test("a strong-bot run is deterministic and retains its difficulty", () => {
  const first = autoplayRun("strong-complete-run", pickFirstOption, "strong");
  const repeated = autoplayRun("strong-complete-run", pickFirstOption, "strong");

  assert.deepEqual(first, repeated);
  assert.equal(first.botDifficulty, "strong");
  assert.equal(first.status, "finished");
  assert.ok(["player", "enemy", "draw"].includes(first.outcome));
});

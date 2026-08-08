import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_RUN_ROUNDS,
  PLAYER_STARTING_HP,
  autoplayRun,
  createBattleTimeline,
} from "../src/game/index.ts";

test("a complete seeded run reaches a valid terminal state", () => {
  const pickFirstOption = (state) => [state.draftOptions[0].cardId];
  const first = autoplayRun("p0-complete-run", pickFirstOption);
  const repeated = autoplayRun("p0-complete-run", pickFirstOption);

  assert.deepEqual(first, repeated);
  assert.equal(first.status, "finished");
  assert.ok(first.roundHistory.length >= 1 && first.roundHistory.length <= MAX_RUN_ROUNDS);
  assert.equal(first.roundHistory.at(-1).round, first.round);
  assert.ok(first.playerHp >= 0 && first.playerHp <= PLAYER_STARTING_HP);
  assert.ok(first.playerHp === 0 || first.round === MAX_RUN_ROUNDS);

  first.roundHistory.forEach((record) => {
    assert.equal(record.enemySlots.filter((slot) => slot.cardId !== null).length, Math.min(record.round, 6));
    assert.equal(record.playerHpAfter, Math.max(0, record.playerHpBefore - record.combatResult.hpLoss));
    assert.equal(record.combatResult.events[0].type, "combat_started");
    assert.equal(record.combatResult.events.at(-1).type, "combat_finished");

    const timeline = createBattleTimeline({
      playerSlots: record.playerSlots,
      enemySlots: record.enemySlots,
      combat: record.combatResult,
      playerCastleHpBefore: record.playerHpBefore,
      playerCastleHpAfter: record.playerHpAfter,
    });
    assert.equal(timeline.winner, record.combatResult.winner);
    assert.equal(timeline.events.at(-1).type, "battle_finished");
  });
});

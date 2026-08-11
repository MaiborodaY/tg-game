import assert from "node:assert/strict";
import test from "node:test";
import {
  BATTLE_PLAYBACK_SPEED_STORAGE_KEY,
  createGameHudSnapshot,
  createRoundSummarySnapshot,
  loadBattlePlaybackSpeed,
  saveBattlePlaybackSpeed,
} from "../src/battleUi.ts";

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    values,
  };
}

test("battle playback speed is versioned, bounded, and storage failures are non-fatal", () => {
  const storage = createMemoryStorage({ [BATTLE_PLAYBACK_SPEED_STORAGE_KEY]: "2" });
  assert.equal(loadBattlePlaybackSpeed(storage), 2);

  storage.values.set(BATTLE_PLAYBACK_SPEED_STORAGE_KEY, "3");
  assert.equal(loadBattlePlaybackSpeed(storage), 1);
  assert.equal(saveBattlePlaybackSpeed(storage, 2), true);
  assert.equal(storage.values.get(BATTLE_PLAYBACK_SPEED_STORAGE_KEY), "2");

  const brokenStorage = {
    getItem: () => { throw new Error("read blocked"); },
    setItem: () => { throw new Error("write blocked"); },
  };
  assert.equal(loadBattlePlaybackSpeed(brokenStorage), 1);
  assert.equal(saveBattlePlaybackSpeed(brokenStorage, 2), false);
  assert.equal(saveBattlePlaybackSpeed(undefined, 2), false);
});

test("game HUD clamps castle HP and round presentation", () => {
  assert.deepEqual(createGameHudSnapshot(18.9, -3, 99), {
    playerHp: 18,
    enemyHp: 0,
    round: 15,
    maxRounds: 15,
  });
});

test("round summary exposes both castle deltas and the combat outcome", () => {
  const summary = createRoundSummarySnapshot({
    round: 4,
    playerHpBefore: 17,
    playerHpAfter: 15,
    enemyHpBefore: 18,
    enemyHpAfter: 14,
    draftOptions: [],
    draftRerollCount: 0,
    playerSlots: [],
    enemySlots: [],
    combatResult: {
      winner: "player",
      hpLoss: 2,
      playerCastleDamage: 2,
      enemyCastleDamage: 4,
      actions: 12,
      events: [],
      survivingPlayerUnits: [],
      survivingEnemyUnits: [],
    },
  });

  assert.deepEqual(summary, {
    winner: "player",
    playerHpAfter: 15,
    enemyHpAfter: 14,
    playerHpLoss: 2,
    enemyHpLoss: 4,
    actions: 12,
  });
});

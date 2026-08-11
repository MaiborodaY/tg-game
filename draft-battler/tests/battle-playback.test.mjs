import assert from "node:assert/strict";
import test from "node:test";

import {
  BattlePlaybackClock,
  BattlePlaybackCompletion,
  completeSkippedBattle,
} from "../src/rendering/battlePlayback.ts";

test("playback clock preserves virtual timeline progress across live speed changes", () => {
  const clock = new BattlePlaybackClock(1);
  clock.start(1_000);

  assert.equal(clock.getDelayUntil(1_000, 1_250), 750);

  clock.setSpeed(2, 1_250);
  assert.equal(clock.getDelayUntil(1_000, 1_500), 250);
  assert.equal(clock.getDelayUntil(1_000, 1_625), 0);
});

test("skip applies terminal state and publishes final castle HP before finishing exactly once", () => {
  const calls = [];
  const completion = new BattlePlaybackCompletion({
    onCastleHpChanged: (owner, hp) => calls.push(`hp:${owner}:${hp}`),
    onFinished: () => calls.push("finished"),
  });
  const timeline = {
    winner: "player",
    castles: [
      { owner: "enemy", maxHp: 20, startHp: 17, finalHp: 14 },
      { owner: "player", maxHp: 20, startHp: 11, finalHp: 11 },
    ],
    units: [
      {
        unitId: "player-0",
        owner: "player",
        cardId: "vanguard",
        name: "Vanguard",
        slotIndex: 0,
        upgradeLevel: 0,
        attack: 3,
        maxHp: 5,
        startHp: 5,
        finalHp: 0,
        defeated: true,
      },
      {
        unitId: "enemy-0",
        owner: "enemy",
        cardId: "vanguard",
        name: "Vanguard",
        slotIndex: 0,
        upgradeLevel: 0,
        attack: 3,
        maxHp: 5,
        startHp: 5,
        finalHp: 2,
        defeated: false,
      },
    ],
    events: [],
  };

  assert.equal(
    completeSkippedBattle(completion, timeline, (presentation) => {
      calls.push("applied");
      assert.equal(presentation.winner, "player");
      assert.deepEqual(presentation.castles, { player: 11, enemy: 14 });
      assert.deepEqual(presentation.units.get("player-0"), { hp: 0, visible: false });
      assert.deepEqual(presentation.units.get("enemy-0"), { hp: 2, visible: true });
    }),
    true,
  );
  assert.deepEqual(calls, ["applied", "hp:player:11", "hp:enemy:14", "finished"]);

  assert.equal(completeSkippedBattle(completion, timeline, () => calls.push("stale-apply")), false);
  completion.emitCastleHp("enemy", 1);
  assert.equal(completion.finish(), false);
  assert.deepEqual(calls, ["applied", "hp:player:11", "hp:enemy:14", "finished"]);
});

test("cancelled playback suppresses stale HP and completion callbacks", () => {
  const calls = [];
  const completion = new BattlePlaybackCompletion({
    onCastleHpChanged: () => calls.push("hp"),
    onFinished: () => calls.push("finished"),
  });

  completion.cancel();
  completion.emitCastleHp("player", 4);
  assert.equal(completion.finish(), false);
  assert.deepEqual(calls, []);
});

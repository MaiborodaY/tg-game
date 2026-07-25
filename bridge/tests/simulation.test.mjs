import assert from "node:assert/strict";
import test from "node:test";

import { chooseBotAction } from "../src/ai/index.ts";
import {
  SEATS,
  applyCall,
  createGame,
  createViewerSnapshot,
  getTurnController,
  playCard,
} from "../src/game/index.ts";

test("hundreds of deterministic all-bot boards finish without an illegal action", () => {
  for (let board = 1; board <= 256; board += 1) {
    let state = createGame({ seed: `simulation-${board}`, boardNumber: board });
    let actionCount = 0;

    while (state.phase !== "complete") {
      const controller = getTurnController(state);
      assert.ok(controller, `board ${board} has no controller before completion`);
      const snapshot = createViewerSnapshot(state, controller);
      const action = chooseBotAction(snapshot);
      assert.ok(action, `board ${board} bot returned no action at revision ${state.revision}`);

      state = action.type === "call"
        ? applyCall(state, action.call)
        : playCard(state, action.cardId);
      actionCount += 1;
      assert.ok(actionCount < 220, `board ${board} did not converge`);
    }

    assert.ok(state.result, `board ${board} has no result`);
    if (state.result.type === "contract") {
      assert.equal(state.completedTricks.length, 13);
      assert.equal(SEATS.reduce((total, seat) => total + state.hands[seat].length, 0), 0);
      assert.equal(state.result.declarerTricks + state.result.defenderTricks, 13);
    }
  }
});

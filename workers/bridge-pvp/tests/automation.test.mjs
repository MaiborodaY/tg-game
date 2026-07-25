import assert from "node:assert/strict";
import test from "node:test";

import {
  applyCall,
  createGame,
  createViewerSnapshot,
  getTurnController,
  playCard,
} from "../../../bridge/src/game/index.ts";
import { chooseBotAction } from "../../../bridge/src/ai/index.ts";

test("server-side bots complete deals using only personalized legal views", () => {
  for (let boardNumber = 1; boardNumber <= 16; boardNumber += 1) {
    let state = createGame({ seed: `worker-ai-${boardNumber}`, boardNumber });
    let actions = 0;

    while (state.phase !== "complete" && actions < 160) {
      const controller = getTurnController(state);
      assert.ok(controller);
      const view = createViewerSnapshot(state, controller);
      const action = chooseBotAction(view);

      assert.ok(action, `AI returned no action on board ${boardNumber}, revision ${state.revision}`);
      assert.equal(Object.hasOwn(view, "seed"), false);
      assert.equal(Object.hasOwn(view, "deckOrder"), false);
      state = action.type === "call"
        ? applyCall(state, action.call)
        : playCard(state, action.cardId);
      actions += 1;
    }

    assert.equal(state.phase, "complete", `board ${boardNumber} did not complete`);
    assert.equal(state.revision, actions);
  }
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  applySheddingAction,
  chooseSheddingBotAction,
  createSheddingGame,
  createSheddingViewerSnapshot,
  getSheddingTurnController,
} from "../../../bridge/src/shedding/index.ts";

test("server-side bots complete matches using only personalized legal views", () => {
  for (let index = 0; index < 16; index += 1) {
    let state = createSheddingGame({ seed: `worker-ai-${index}`, targetScore: 60 });
    let actions = 0;

    while (state.phase !== "match_complete" && actions < 2_000) {
      const controller = getSheddingTurnController(state);
      assert.ok(controller);
      const view = createSheddingViewerSnapshot(state, controller);
      const action = chooseSheddingBotAction(view);

      assert.ok(action, `AI returned no action at revision ${state.revision}`);
      assert.equal(Object.hasOwn(view, "matchSeed"), false);
      assert.equal(Object.hasOwn(view, "drawPile"), false);
      state = applySheddingAction(state, action);
      actions += 1;
    }

    assert.equal(state.phase, "match_complete", `seed ${index} did not complete`);
    assert.equal(state.revision, actions);
    assert.ok(state.matchWinner);
    assert.ok(state.matchLoser);
    assert.ok(state.scores[state.matchLoser] > state.targetScore);
  }
});

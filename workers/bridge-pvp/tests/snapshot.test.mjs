import assert from "node:assert/strict";
import test from "node:test";

import {
  createSheddingGame,
  createSheddingViewerSnapshot,
} from "../../../bridge/src/shedding/index.ts";

test("viewer snapshots never expose the shuffle seed or the opponent hand", () => {
  const state = createSheddingGame({ seed: "worker-redaction" });
  const foreignCards = [...state.hands.west];
  const southView = createSheddingViewerSnapshot(state, "south");
  const serialized = JSON.stringify(southView);

  assert.deepEqual(Object.keys(southView.hands), ["south"]);
  assert.equal(Object.hasOwn(southView, "matchSeed"), false);
  assert.equal(Object.hasOwn(southView, "drawPile"), false);
  foreignCards.forEach((cardId) => assert.equal(serialized.includes(`"${cardId}"`), false));
});

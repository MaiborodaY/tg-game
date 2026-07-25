import assert from "node:assert/strict";
import test from "node:test";

import {
  applyCall,
  createGame,
  createViewerSnapshot,
  getLegalCardIds,
  playCard,
} from "../../../bridge/src/game/index.ts";

test("viewer snapshots never expose deal material or closed foreign hands", () => {
  let state = createGame({ seed: "worker-redaction", boardNumber: 3 });
  const foreignCards = [
    ...state.hands.north,
    ...state.hands.east,
    ...state.hands.west,
  ];
  const southView = createViewerSnapshot(state, "south");
  const serialized = JSON.stringify(southView);

  assert.deepEqual(Object.keys(southView.hands), ["south"]);
  assert.equal(Object.hasOwn(southView, "seed"), false);
  assert.equal(Object.hasOwn(southView, "deckOrder"), false);
  foreignCards.forEach((cardId) => assert.equal(serialized.includes(`"${cardId}"`), false));

  state = applyCall(state, { type: "bid", level: 1, strain: "notrump" });
  state = applyCall(state, { type: "pass" });
  state = applyCall(state, { type: "pass" });
  state = applyCall(state, { type: "pass" });

  assert.equal(state.contract?.declarer, "south");
  assert.equal(state.contract?.dummy, "north");
  assert.deepEqual(Object.keys(createViewerSnapshot(state, "south").hands), ["south"]);

  state = playCard(state, getLegalCardIds(state)[0]);
  const afterLead = createViewerSnapshot(state, "south");
  assert.deepEqual(new Set(Object.keys(afterLead.hands)), new Set(["south", "north"]));
  assert.equal(Object.hasOwn(afterLead, "seed"), false);
  assert.equal(Object.hasOwn(afterLead, "deckOrder"), false);
  assert.equal(afterLead.hands.east, undefined);
  assert.equal(afterLead.hands.west, undefined);
});

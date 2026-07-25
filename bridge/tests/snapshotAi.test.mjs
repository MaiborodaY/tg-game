import assert from "node:assert/strict";
import test from "node:test";

import { chooseAiCall, chooseAiCard, chooseBotAction } from "../src/ai/index.ts";
import {
  SEATS,
  applyCall,
  callsEqual,
  createGame,
  createViewerSnapshot,
  getCard,
  getLegalCardIds,
  getTurnController,
  playCard,
} from "../src/game/index.ts";

const PASS = Object.freeze({ type: "pass" });

test("viewer snapshot hides seed, deck order and every unopened foreign hand", () => {
  const state = createGame({ seed: "top-secret-seed", dealer: "north" });
  const snapshot = createViewerSnapshot(state, "north");
  assert.deepEqual(Object.keys(snapshot.hands), ["north"]);
  assert.equal(Object.hasOwn(snapshot, "seed"), false);
  assert.equal(Object.hasOwn(snapshot, "deckOrder"), false);
  const serialized = JSON.stringify(snapshot);
  assert.equal(serialized.includes("top-secret-seed"), false);
  assert.equal(serialized.includes(state.hands.east[0]), false);
  assert.ok(snapshot.legalCalls.length > 0);
  assert.equal(createViewerSnapshot(state, "east").legalCalls.length, 0, "only controller receives legal calls");
});

test("dummy appears after opening lead, declarer alone receives dummy actions", () => {
  let state = contractState("dummy-view");
  const declarer = state.contract.declarer;
  const dummy = state.contract.dummy;
  const leader = state.contract.openingLeader;
  assert.equal(Object.hasOwn(createViewerSnapshot(state, declarer).hands, dummy), false);

  state = playCard(state, getLegalCardIds(state)[0]);
  const declarerView = createViewerSnapshot(state, declarer);
  const dummyView = createViewerSnapshot(state, dummy);
  const defenderView = createViewerSnapshot(state, leader);
  assert.equal(state.currentSeat, dummy);
  assert.equal(declarerView.controller, declarer);
  assert.equal(Object.hasOwn(declarerView.hands, dummy), true);
  assert.equal(Object.hasOwn(defenderView.hands, dummy), true);
  assert.equal(Object.hasOwn(defenderView.hands, state.contract.declarer), false, "declarer's closed hand stays hidden from defenders");
  assert.ok(declarerView.legalCardIds.length > 0);
  assert.equal(dummyView.legalCardIds.length, 0);
});

test("complete snapshot reveals all original hands for replay without private deal fields", () => {
  let state = createGame({ seed: "replay", dealer: "north" });
  const originals = Object.fromEntries(SEATS.map((seat) => [seat, [...state.hands[seat]]]));
  for (let index = 0; index < 4; index += 1) state = applyCall(state, PASS);
  const snapshot = createViewerSnapshot(state, "east");
  assert.equal(snapshot.phase, "complete");
  assert.deepEqual(Object.keys(snapshot.hands).sort(), [...SEATS].sort());
  for (const seat of SEATS) assert.deepEqual(snapshot.hands[seat], originals[seat]);
  assert.equal(Object.hasOwn(snapshot, "seed"), false);
  assert.equal(Object.hasOwn(snapshot, "deckOrder"), false);
  assert.equal(snapshot.legalCalls.length, 0);
  assert.equal(snapshot.legalCardIds.length, 0);
});

test("bidding AI is deterministic and selects only a supplied legal call", () => {
  let state = createGame({ seed: "ai-auction", dealer: "north" });
  for (let step = 0; state.phase === "auction" && step < 20; step += 1) {
    const controller = getTurnController(state);
    const snapshot = createViewerSnapshot(state, controller);
    const first = chooseAiCall(snapshot);
    const second = chooseAiCall(snapshot);
    assert.deepEqual(first, second);
    assert.ok(first);
    assert.ok(snapshot.legalCalls.some((call) => callsEqual(call, first)));
    assert.deepEqual(chooseBotAction(snapshot), { type: "call", call: first });
    state = applyCall(state, first);
  }
  assert.notEqual(state.phase, "auction", "bounded natural system terminates the auction");
});

test("card AI sees a viewer snapshot, stays deterministic/legal and finishes 13 tricks", () => {
  let state = contractState("ai-play");
  for (let play = 0; play < 52; play += 1) {
    const controller = getTurnController(state);
    const snapshot = createViewerSnapshot(state, controller);
    const first = chooseAiCard(snapshot);
    const second = chooseAiCard(snapshot);
    assert.equal(first, second);
    assert.ok(snapshot.legalCardIds.includes(first));
    assert.deepEqual(chooseBotAction(snapshot), { type: "play_card", cardId: first });
    state = playCard(state, first);
  }
  assert.equal(state.phase, "complete");
  assert.equal(state.completedTricks.length, 13);
  const replay = createViewerSnapshot(state, "west");
  for (const seat of SEATS) assert.equal(replay.hands[seat].length, 13);
});

test("card AI follows the led suit whenever the controlled hand can", () => {
  let state = contractState("ai-follow");
  const leader = state.currentSeat;
  const next = SEATS[(SEATS.indexOf(leader) + 1) % 4];
  const suit = ["clubs", "diamonds", "hearts", "spades"].find((candidate) => (
    state.hands[leader].some((id) => getCard(id).suit === candidate)
    && state.hands[next].some((id) => getCard(id).suit === candidate)
  ));
  const lead = state.hands[leader].find((id) => getCard(id).suit === suit);
  state = playCard(state, lead);
  const controller = getTurnController(state);
  const snapshot = createViewerSnapshot(state, controller);
  const choice = chooseAiCard(snapshot);
  assert.equal(getCard(choice).suit, suit);
});

function contractState(seed) {
  let state = createGame({ seed, dealer: "north", vulnerability: "none" });
  state = applyCall(state, { type: "bid", level: 1, strain: "notrump" });
  state = applyCall(state, PASS);
  state = applyCall(state, PASS);
  state = applyCall(state, PASS);
  return state;
}

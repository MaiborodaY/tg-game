import assert from "node:assert/strict";
import test from "node:test";

import {
  BridgeRuleError,
  FULL_DECK,
  SEATS,
  applyCall,
  callsEqual,
  createDeck,
  createGame,
  getBoardDealer,
  getBoardVulnerability,
  getCard,
  getLegalCardIds,
  getLegalCalls,
  getTrickWinner,
  getTurnController,
  playCard,
} from "../src/game/index.ts";

const PASS = Object.freeze({ type: "pass" });

test("standard deck and seeded deal contain 52 unique cards in four hands", () => {
  const deck = createDeck();
  assert.equal(deck.length, 52);
  assert.equal(new Set(deck).size, 52);
  assert.deepEqual(deck, FULL_DECK);
  deck.forEach((cardId) => assert.equal(getCard(cardId).id, cardId));

  const first = createGame({ seed: "board-alpha", boardNumber: 9 });
  const repeated = createGame({ seed: "board-alpha", boardNumber: 9 });
  const other = createGame({ seed: "board-beta", boardNumber: 9 });
  assert.deepEqual(first.deckOrder, repeated.deckOrder);
  assert.notDeepEqual(first.deckOrder, other.deckOrder);
  assert.deepEqual(SEATS.map((seat) => first.hands[seat].length), [13, 13, 13, 13]);
  assert.equal(new Set(SEATS.flatMap((seat) => first.hands[seat])).size, 52);
  assert.equal(first.dealer, "north");
  assert.equal(first.vulnerability, "ew");

  const readyDeck = [...FULL_DECK].reverse();
  assert.deepEqual(createGame({ deck: readyDeck }).deckOrder, readyDeck);
  assert.throws(
    () => createGame({ deck: [...FULL_DECK.slice(0, 51), FULL_DECK[0]] }),
    /each standard card exactly once/,
  );
});

test("duplicate board dealer and vulnerability follow the sixteen-board cycle", () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(getBoardDealer), ["north", "east", "south", "west", "north"]);
  assert.deepEqual(
    Array.from({ length: 16 }, (_, index) => getBoardVulnerability(index + 1)),
    ["none", "ns", "ew", "both", "ns", "ew", "both", "none", "ew", "both", "none", "ns", "both", "none", "ns", "ew"],
  );
});

test("auction enforces ascending bids and legal double/redouble ownership", () => {
  const initial = createGame({ seed: "auction", dealer: "north" });
  assert.equal(getLegalCalls(initial).length, 36);
  const oneHeart = { type: "bid", level: 1, strain: "hearts" };
  const afterBid = applyCall(initial, oneHeart);
  assert.equal(initial.revision, 0);
  assert.equal(initial.auction.length, 0, "source state remains unchanged");
  assert.equal(afterBid.revision, 1);
  assert.equal(afterBid.currentSeat, "east");
  assert.equal(getLegalCalls(afterBid).some((call) => callsEqual(call, { type: "bid", level: 1, strain: "diamonds" })), false);
  assert.equal(getLegalCalls(afterBid).some((call) => call.type === "double"), true);

  const doubled = applyCall(afterBid, { type: "double" });
  assert.equal(getLegalCalls(doubled).some((call) => call.type === "redouble"), true);
  assert.equal(getLegalCalls(doubled).some((call) => call.type === "double"), false);
  const redoubled = applyCall(doubled, { type: "redouble" });
  let finished = applyCall(redoubled, PASS);
  finished = applyCall(finished, PASS);
  finished = applyCall(finished, PASS);
  assert.equal(finished.phase, "play");
  assert.equal(finished.contract.doubled, 2);
  assert.equal(finished.contract.declarer, "north");
  assert.equal(finished.contract.dummy, "south");
  assert.equal(finished.contract.openingLeader, "east");

  const partnerTurn = applyCall(applyCall(createGame({ seed: "bad-double", dealer: "north" }), { type: "bid", level: 1, strain: "clubs" }), PASS);
  assert.equal(partnerTurn.currentSeat, "south");
  assert.equal(getLegalCalls(partnerTurn).some((call) => call.type === "double"), false);
  assert.throws(() => applyCall(partnerTurn, { type: "double" }), (error) => error instanceof BridgeRuleError && error.code === "illegal_call");

  let resetByBid = createGame({ seed: "reset-double", dealer: "north" });
  resetByBid = applyCall(resetByBid, { type: "bid", level: 1, strain: "clubs" });
  resetByBid = applyCall(resetByBid, { type: "double" });
  resetByBid = applyCall(resetByBid, { type: "bid", level: 1, strain: "diamonds" });
  assert.equal(getLegalCalls(resetByBid).some((call) => call.type === "double"), true);
  assert.equal(getLegalCalls(resetByBid).some((call) => call.type === "redouble"), false);
});

test("auction ends passed out after four passes and finds first strain bidder as declarer", () => {
  let passedOut = createGame({ seed: "passes", dealer: "west" });
  for (let index = 0; index < 4; index += 1) passedOut = applyCall(passedOut, PASS);
  assert.equal(passedOut.phase, "complete");
  assert.deepEqual(passedOut.result, { type: "passed_out", scoreNS: 0 });
  assert.equal(passedOut.revision, 4);

  let state = createGame({ seed: "declarer", dealer: "north" });
  state = applyCall(state, { type: "bid", level: 1, strain: "hearts" });
  state = applyCall(state, PASS);
  state = applyCall(state, { type: "bid", level: 2, strain: "hearts" });
  state = applyCall(state, PASS);
  state = applyCall(state, PASS);
  state = applyCall(state, PASS);
  assert.equal(state.contract.level, 2);
  assert.equal(state.contract.declarer, "north", "first NS player to name hearts declares");
  assert.equal(getTurnController(state), "east");
});

test("opening lead exposes dummy control and follow-suit is mandatory", () => {
  let state = contractState("follow-suit");
  const leader = state.currentSeat;
  const dummy = state.contract.dummy;
  const commonSuit = ["clubs", "diamonds", "hearts", "spades"].find((suit) => (
    state.hands[leader].some((id) => getCard(id).suit === suit)
    && state.hands[dummy].some((id) => getCard(id).suit === suit)
    && state.hands[dummy].some((id) => getCard(id).suit !== suit)
  ));
  assert.ok(commonSuit, "seed supplies a follow-suit test case");
  const lead = state.hands[leader].find((id) => getCard(id).suit === commonSuit);
  const before = state;
  state = playCard(state, lead);
  assert.equal(before.hands[leader].includes(lead), true, "source hand remains unchanged");
  assert.equal(state.openingLeadPlayed, true);
  assert.equal(state.currentSeat, dummy);
  assert.equal(getTurnController(state), state.contract.declarer, "declarer controls dummy");
  assert.ok(getLegalCardIds(state).every((id) => getCard(id).suit === commonSuit));
  const discard = state.hands[dummy].find((id) => getCard(id).suit !== commonSuit);
  assert.throws(() => playCard(state, discard), (error) => error instanceof BridgeRuleError && error.code === "must_follow_suit");
});

test("trick winner honors led suit, trump and rank", () => {
  assert.equal(getTrickWinner([
    { seat: "north", cardId: "CT" },
    { seat: "east", cardId: "CA" },
    { seat: "south", cardId: "C2" },
    { seat: "west", cardId: "CK" },
  ], { strain: "notrump" }), "east");

  assert.equal(getTrickWinner([
    { seat: "north", cardId: "SA" },
    { seat: "east", cardId: "H2" },
    { seat: "south", cardId: "H4" },
    { seat: "west", cardId: "H3" },
  ], { strain: "hearts" }), "south");
});

test("legal-card reducer plays all thirteen tricks and completes exactly once", () => {
  let state = contractState("full-play");
  const auctionRevision = state.revision;
  for (let play = 0; play < 52; play += 1) {
    const legal = getLegalCardIds(state);
    assert.ok(legal.length > 0);
    state = playCard(state, legal[0]);
  }
  assert.equal(state.phase, "complete");
  assert.equal(state.currentSeat, null);
  assert.equal(state.revision, auctionRevision + 52);
  assert.equal(state.completedTricks.length, 13);
  assert.equal(state.tricksWon.ns + state.tricksWon.ew, 13);
  assert.deepEqual(SEATS.map((seat) => state.hands[seat].length), [0, 0, 0, 0]);
  assert.equal(state.result.type, "contract");
  assert.equal(state.result.declarerTricks + state.result.defenderTricks, 13);
  assert.throws(() => playCard(state, "CA"), (error) => error instanceof BridgeRuleError && error.code === "not_in_play");
});

test("completed contract score is signed for North-South regardless of declarer side", () => {
  const northSouth = finishByFirstLegal(contractState("score-ns"));
  assert.equal(northSouth.result.scoreNS, northSouth.result.breakdown.total);

  let eastWest = createGame({ seed: "score-ew", dealer: "east", vulnerability: "none" });
  eastWest = applyCall(eastWest, { type: "bid", level: 1, strain: "notrump" });
  eastWest = applyCall(eastWest, PASS);
  eastWest = applyCall(eastWest, PASS);
  eastWest = applyCall(eastWest, PASS);
  eastWest = finishByFirstLegal(eastWest);
  assert.equal(eastWest.contract.declaringSide, "ew");
  assert.equal(eastWest.result.scoreNS, -eastWest.result.breakdown.total);
});

function contractState(seed) {
  let state = createGame({ seed, dealer: "north", vulnerability: "none" });
  state = applyCall(state, { type: "bid", level: 1, strain: "notrump" });
  state = applyCall(state, PASS);
  state = applyCall(state, PASS);
  state = applyCall(state, PASS);
  return state;
}

function finishByFirstLegal(source) {
  let state = source;
  while (state.phase === "play") state = playCard(state, getLegalCardIds(state)[0]);
  return state;
}

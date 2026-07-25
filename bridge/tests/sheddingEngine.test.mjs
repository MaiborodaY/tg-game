import assert from "node:assert/strict";
import test from "node:test";

import {
  SHEDDING_DECK,
  applySheddingAction,
  chooseSheddingBotAction,
  createSheddingGame,
  createSheddingViewerSnapshot,
  getLegalSheddingCardIds,
  getSheddingCardPoints,
  getSheddingTurnController,
  playSheddingCards,
  scoreSheddingHand,
  startNextSheddingRound,
} from "../src/shedding/index.ts";

function deckWithPrefix(prefix) {
  assert.equal(new Set(prefix).size, prefix.length, "test deck prefix must be unique");
  return [...prefix, ...SHEDDING_DECK.filter((cardId) => !prefix.includes(cardId))];
}

function replaceState(state, changes) {
  return Object.freeze({
    ...state,
    ...changes,
    hands: Object.freeze({
      south: Object.freeze([...(changes.hands?.south ?? state.hands.south)]),
      west: Object.freeze([...(changes.hands?.west ?? state.hands.west)]),
    }),
    drawPile: Object.freeze([...(changes.drawPile ?? state.drawPile)]),
    discardPile: Object.freeze([...(changes.discardPile ?? state.discardPile)]),
    scores: Object.freeze({ ...(changes.scores ?? state.scores) }),
  });
}

test("a round uses a 36-card deck and the dealer opens their fifth card", () => {
  const deck = deckWithPrefix(["C6", "D6", "C7", "D7", "C8", "D8", "C9", "D9", "CT", "DT"]);
  const state = createSheddingGame({ deck, dealer: "south", seed: "ignored-with-ready-deck" });

  assert.equal(SHEDDING_DECK.length, 36);
  assert.deepEqual(state.hands.west, ["C6", "C7", "C8", "C9", "CT"]);
  assert.deepEqual(state.hands.south, ["D6", "D7", "D8", "D9"]);
  assert.deepEqual(state.discardPile, ["DT"]);
  assert.equal(state.currentSeat, "west");
  assert.equal(state.drawPile.length, 26);
});

test("cards match the open suit or rank, while a jack is always wild", () => {
  const deck = deckWithPrefix(["H6", "C7", "C9", "D7", "SJ", "S7", "D8", "H8", "HK", "H9"]);
  const state = createSheddingGame({ deck, dealer: "south" });

  assert.deepEqual(new Set(getLegalSheddingCardIds(state)), new Set(["H6", "C9", "SJ", "HK"]));
  assert.throws(() => playSheddingCards(state, ["D8"]), { code: "illegal_card" });
  assert.throws(() => playSheddingCards(state, ["SJ"]), { code: "jack_requires_suit" });

  const afterJack = playSheddingCards(state, ["SJ"], "diamonds");
  assert.equal(afterJack.declaredSuit, "diamonds");
  assert.equal(afterJack.currentSeat, "south");
  assert.deepEqual(getLegalSheddingCardIds(afterJack), ["D7"]);
});

test("equal ranks can be discarded together and special cards resolve immediately", () => {
  const state = replaceState(createSheddingGame({ seed: "effects" }), {
    currentSeat: "west",
    hands: {
      west: ["H8", "S8", "S6"],
      south: ["C7", "D9"],
    },
    drawPile: ["CQ", "DK", "HA", "S6", "C9"],
    discardPile: ["H9"],
  });

  const afterEights = playSheddingCards(state, ["H8", "S8"]);
  assert.equal(afterEights.currentSeat, "west", "an eight skips the opponent");
  assert.deepEqual(afterEights.hands.south, ["C7", "D9", "CQ", "DK", "HA", "S6"]);
  assert.equal(afterEights.lastAction?.penaltyCards, 4);

  const afterSix = playSheddingCards(afterEights, ["S6"]);
  assert.equal(afterSix.phase, "round_complete");
  assert.equal(afterSix.roundResult?.winner, "west");
});

test("a seven gives cards but does not skip the opponent", () => {
  const state = replaceState(createSheddingGame({ seed: "seven" }), {
    currentSeat: "south",
    hands: { south: ["H7", "C6"], west: ["D8"] },
    drawPile: ["SA", "C9"],
    discardPile: ["H9"],
  });

  const next = playSheddingCards(state, ["H7"]);
  assert.equal(next.currentSeat, "west");
  assert.deepEqual(next.hands.west, ["D8", "SA"]);
  assert.equal(next.lastAction?.penaltyCards, 1);
});

test("a player draws one card only when no legal play is available", () => {
  const state = replaceState(createSheddingGame({ seed: "draw" }), {
    currentSeat: "south",
    hands: { south: ["C6"], west: ["D8"] },
    drawPile: ["SA", "C9"],
    discardPile: ["H9"],
  });
  const next = applySheddingAction(state, { type: "draw_card" });
  assert.deepEqual(next.hands.south, ["C6", "SA"]);
  assert.equal(next.currentSeat, "west");

  const playable = replaceState(state, { hands: { south: ["H6"], west: ["D8"] } });
  assert.throws(() => applySheddingAction(playable, { type: "draw_card" }), { code: "play_available" });
});

test("round points go to the player who emptied their hand and 125 wins the match", () => {
  assert.equal(getSheddingCardPoints("C6"), 6);
  assert.equal(getSheddingCardPoints("DT"), 10);
  assert.equal(getSheddingCardPoints("HJ"), 20);
  assert.equal(getSheddingCardPoints("SA"), 15);
  assert.equal(scoreSheddingHand(["C6", "DT", "HJ", "SA"]), 51);

  const state = replaceState(createSheddingGame({ seed: "score", targetScore: 125 }), {
    currentSeat: "west",
    hands: { west: ["H9"], south: ["C6", "DT", "HJ", "SA"] },
    discardPile: ["S9"],
    scores: { south: 0, west: 80 },
  });
  const complete = playSheddingCards(state, ["H9"]);

  assert.equal(complete.phase, "match_complete");
  assert.equal(complete.matchWinner, "west");
  assert.equal(complete.scores.west, 131);
  assert.equal(complete.roundResult?.points, 51);
});

test("the dealer alternates and score survives across rounds", () => {
  const state = replaceState(createSheddingGame({ seed: "rounds", dealer: "south" }), {
    currentSeat: "west",
    hands: { west: ["H9"], south: ["C6"] },
    discardPile: ["S9"],
  });
  const complete = playSheddingCards(state, ["H9"]);
  const next = startNextSheddingRound(complete);

  assert.equal(next.round, 2);
  assert.equal(next.dealer, "west");
  assert.equal(next.currentSeat, "south");
  assert.equal(next.scores.west, 6);
  assert.equal(next.hands.west.length, 4);
  assert.equal(next.hands.south.length, 5);
});

test("viewer snapshots hide the opponent hand and private shuffle seed", () => {
  const state = createSheddingGame({ seed: "private-seed" });
  const view = createSheddingViewerSnapshot(state, "south");
  const serialized = JSON.stringify(view);

  assert.deepEqual(Object.keys(view.hands), ["south"]);
  assert.equal(view.hands.west, undefined);
  assert.equal(Object.hasOwn(view, "matchSeed"), false);
  state.hands.west.forEach((cardId) => assert.equal(serialized.includes(`"${cardId}"`), false));
});

test("the AI returns only legal actions and completes seeded matches", () => {
  for (let index = 0; index < 12; index += 1) {
    let state = createSheddingGame({ seed: `simulation-${index}`, targetScore: 60 });
    let actions = 0;

    while (state.phase !== "match_complete" && actions < 2_000) {
      const controller = getSheddingTurnController(state);
      assert.ok(controller);
      const view = createSheddingViewerSnapshot(state, controller);
      const action = chooseSheddingBotAction(view);
      assert.ok(action);
      if (action.type === "play_cards") {
        assert.equal(view.legalCardIds.includes(action.cardIds[0]), true);
      }
      state = applySheddingAction(state, action);
      actions += 1;
    }

    assert.equal(state.phase, "match_complete", `seed ${index} stalled after ${actions} actions`);
    assert.ok(state.matchWinner);
  }
});

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
  mustCoverSheddingSix,
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
  assert.equal(state.currentSeat, "south");
  assert.equal(state.drawPile.length, 26);
});

test("the dealer with four cards opens and may cover the table by suit or rank", () => {
  const deck = deckWithPrefix(["H6", "CT", "H7", "D7", "H8", "D8", "H9", "D9", "HK", "DT"]);
  const state = createSheddingGame({ deck, dealer: "south" });

  assert.equal(state.currentSeat, "south");
  assert.deepEqual(new Set(getLegalSheddingCardIds(state)), new Set(["CT", "D7", "D8", "D9"]));
});

test("cards match the open suit or rank, while a jack is always wild", () => {
  const deck = deckWithPrefix(["H6", "C7", "C9", "D7", "SJ", "S7", "D8", "H8", "HK", "H9"]);
  const state = replaceState(createSheddingGame({ deck, dealer: "south" }), { currentSeat: "west" });

  assert.deepEqual(new Set(getLegalSheddingCardIds(state)), new Set(["H6", "C9", "SJ", "HK"]));
  assert.throws(() => playSheddingCards(state, ["D8"]), { code: "illegal_card" });
  assert.throws(() => playSheddingCards(state, ["SJ"]), { code: "jack_requires_suit" });

  const afterJack = playSheddingCards(state, ["SJ"], "diamonds");
  assert.equal(afterJack.declaredSuit, "diamonds");
  assert.equal(afterJack.currentSeat, "south");
  assert.deepEqual(getLegalSheddingCardIds(afterJack), ["D7"]);
});

test("equal ranks can be discarded together and eights resolve immediately", () => {
  const state = replaceState(createSheddingGame({ seed: "effects" }), {
    currentSeat: "west",
    hands: {
      west: ["H8", "S8", "S6"],
      south: ["C7", "D9"],
    },
    drawPile: ["CQ", "DK", "HA", "C9", "H7"],
    discardPile: ["H9"],
  });

  const afterEights = playSheddingCards(state, ["H8", "S8"]);
  assert.equal(afterEights.currentSeat, "west", "an eight skips the opponent");
  assert.deepEqual(afterEights.hands.south, ["C7", "D9", "CQ", "DK", "HA", "C9"]);
  assert.equal(afterEights.lastAction?.penaltyCards, 4);

});

test("the player who lays a six must cover it and draws until a cover is available", () => {
  const state = replaceState(createSheddingGame({ seed: "six-cover" }), {
    currentSeat: "south",
    hands: { south: ["H6"], west: ["DT"] },
    drawPile: ["C7", "H7", "C9"],
    discardPile: ["H9"],
    sixCoverSeat: null,
  });

  const afterSix = playSheddingCards(state, ["H6"]);
  assert.equal(afterSix.phase, "playing", "a final six cannot end the round");
  assert.equal(afterSix.currentSeat, "south");
  assert.equal(mustCoverSheddingSix(afterSix), true);
  assert.deepEqual(afterSix.hands.south, []);

  const afterDraw = applySheddingAction(afterSix, { type: "draw_card" });
  assert.equal(afterDraw.currentSeat, "south", "the turn stays until the six can be covered");
  assert.equal(afterDraw.lastAction?.type, "draw_card");
  assert.equal(afterDraw.lastAction?.count, 2);
  assert.deepEqual(afterDraw.hands.south, ["C7", "H7"]);
  assert.deepEqual(getLegalSheddingCardIds(afterDraw), ["H7"]);

  const afterCover = playSheddingCards(afterDraw, ["H7"]);
  assert.equal(mustCoverSheddingSix(afterCover), false);
  assert.equal(afterCover.currentSeat, "west");
});

test("an opening six must be covered by the dealer", () => {
  const deck = deckWithPrefix(["C6", "C7", "D7", "H8", "S7", "S9", "C8", "CK", "D8", "D6"]);
  const state = createSheddingGame({ deck, dealer: "south" });

  assert.equal(state.currentSeat, "south");
  assert.equal(state.sixCoverSeat, "south");
  assert.equal(mustCoverSheddingSix(state), true);
  assert.deepEqual(getLegalSheddingCardIds(state), []);
});

test("an exhausted deck releases an impossible six cover instead of deadlocking", () => {
  const state = replaceState(createSheddingGame({ seed: "empty-six-cover" }), {
    currentSeat: "south",
    hands: { south: ["C7"], west: ["H7"] },
    drawPile: [],
    discardPile: ["H6"],
    sixCoverSeat: "south",
  });

  const next = applySheddingAction(state, { type: "draw_card" });
  assert.equal(next.currentSeat, "west");
  assert.equal(next.sixCoverSeat, null);
  assert.equal(mustCoverSheddingSix(next), false);
  assert.deepEqual(getLegalSheddingCardIds(next), ["H7"]);
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

test("hand penalties use contextual jack values and ignore cards below ten", () => {
  assert.equal(getSheddingCardPoints("C6"), 0);
  assert.equal(getSheddingCardPoints("S9"), 0);
  assert.equal(getSheddingCardPoints("DT"), 10);
  assert.equal(getSheddingCardPoints("HJ"), 10);
  assert.equal(getSheddingCardPoints("SA"), 15);
  assert.equal(scoreSheddingHand(["C6", "D7", "H8", "S9"]), 0);
  assert.equal(scoreSheddingHand(["HJ"]), 20);
  assert.equal(scoreSheddingHand(["HJ", "SJ"]), 40);
  assert.equal(scoreSheddingHand(["HJ", "SJ", "C6"]), 20);
  assert.equal(scoreSheddingHand(["C6", "DT", "HJ", "SJ", "SA"]), 45);
});

test("the round loser receives penalties and loses the match only above 125", () => {
  const state = replaceState(createSheddingGame({ seed: "score", targetScore: 125 }), {
    currentSeat: "west",
    hands: { west: ["H9"], south: ["C6", "DT", "HJ", "SA"] },
    discardPile: ["S9"],
    scores: { south: 100, west: 80 },
  });
  const complete = playSheddingCards(state, ["H9"]);

  assert.equal(complete.phase, "match_complete");
  assert.equal(complete.matchWinner, "west");
  assert.equal(complete.matchLoser, "south");
  assert.equal(complete.scores.south, 135);
  assert.equal(complete.scores.west, 80);
  assert.equal(complete.roundResult?.finish, "empty_hand");
  assert.equal(complete.roundResult?.basePoints, 35);
  assert.equal(complete.roundResult?.scoreMultiplier, 1);
  assert.equal(complete.roundResult?.points, 35);
  assert.equal(complete.roundResult?.penaltyReset, false);
});

test("exactly 125 resets the loser's penalties to zero and continues the match", () => {
  const state = replaceState(createSheddingGame({ seed: "exact-reset", targetScore: 125 }), {
    currentSeat: "west",
    hands: { west: ["CJ"], south: ["DT"] },
    discardPile: ["S9"],
    scores: { south: 105, west: 40 },
  });
  const complete = playSheddingCards(state, ["CJ"], "clubs");

  assert.equal(complete.phase, "round_complete");
  assert.equal(complete.matchWinner, null);
  assert.equal(complete.matchLoser, null);
  assert.equal(complete.scores.south, 0);
  assert.equal(complete.scores.west, 40);
  assert.equal(complete.roundResult?.basePoints, 10);
  assert.equal(complete.roundResult?.scoreMultiplier, 2);
  assert.equal(complete.roundResult?.points, 20);
  assert.equal(complete.roundResult?.penaltyReset, true);
});

test("a losing hand below ten adds no penalty and cannot end the match", () => {
  const state = replaceState(createSheddingGame({ seed: "zero-penalty", targetScore: 125 }), {
    currentSeat: "west",
    hands: { west: ["H9"], south: ["C6", "D7", "H8", "C9"] },
    discardPile: ["S9"],
    scores: { south: 124, west: 90 },
  });
  const complete = playSheddingCards(state, ["H9"]);

  assert.equal(complete.phase, "round_complete");
  assert.equal(complete.scores.south, 124);
  assert.equal(complete.roundResult?.points, 0);
  assert.equal(complete.roundResult?.penaltyReset, false);
});

test("finishing with one or more jacks doubles the round points once", () => {
  const state = replaceState(createSheddingGame({ seed: "jack-finish" }), {
    currentSeat: "west",
    hands: { west: ["CJ"], south: ["DT", "HJ"] },
    discardPile: ["S9"],
    scores: { south: 60, west: 0 },
  });
  const complete = playSheddingCards(state, ["CJ"], "clubs");

  assert.equal(complete.phase, "round_complete");
  assert.equal(complete.scores.south, 100);
  assert.equal(complete.scores.west, 0);
  assert.equal(complete.roundResult?.finish, "jack_finish");
  assert.equal(complete.roundResult?.basePoints, 20);
  assert.equal(complete.roundResult?.scoreMultiplier, 2);
  assert.equal(complete.roundResult?.points, 40);
});

test("four matching cards on top end the round immediately with double points", () => {
  const state = replaceState(createSheddingGame({ seed: "four-sevens" }), {
    currentSeat: "west",
    hands: { west: ["S7", "C9"], south: ["DT", "HA"] },
    drawPile: ["C6"],
    discardPile: ["H7", "D7", "C7"],
  });
  const complete = playSheddingCards(state, ["S7"]);

  assert.equal(complete.phase, "round_complete");
  assert.deepEqual(complete.hands.south, ["DT", "HA"], "the fourth seven ends before its draw effect");
  assert.deepEqual(complete.drawPile, ["C6"]);
  assert.equal(complete.roundResult?.winner, "west");
  assert.equal(complete.roundResult?.finish, "four_of_a_kind");
  assert.equal(complete.roundResult?.basePoints, 25);
  assert.equal(complete.roundResult?.scoreMultiplier, 2);
  assert.equal(complete.roundResult?.points, 50);
  assert.equal(complete.scores.south, 50);
  assert.equal(complete.scores.west, 0);
  assert.equal(complete.lastAction?.type, "play_cards");
  assert.equal(complete.lastAction?.penaltyCards, 0);
});

test("matching ranks must be consecutive and four jacks never stack into a x4 bonus", () => {
  const nonConsecutive = replaceState(createSheddingGame({ seed: "broken-chain" }), {
    currentSeat: "west",
    hands: { west: ["S7", "C9"], south: ["DT"] },
    drawPile: ["C6"],
    discardPile: ["H7", "D7", "C9", "C7"],
  });
  assert.equal(playSheddingCards(nonConsecutive, ["S7"]).phase, "playing");

  const fourJacks = replaceState(createSheddingGame({ seed: "four-jacks" }), {
    currentSeat: "west",
    hands: { west: ["SJ"], south: ["DT"] },
    discardPile: ["HJ", "DJ", "CJ"],
  });
  const complete = playSheddingCards(fourJacks, ["SJ"], "hearts");
  assert.equal(complete.roundResult?.finish, "four_of_a_kind");
  assert.equal(complete.roundResult?.scoreMultiplier, 2);
  assert.equal(complete.roundResult?.points, 20);
});

test("the dealer alternates and score survives across rounds", () => {
  const state = replaceState(createSheddingGame({ seed: "rounds", dealer: "south" }), {
    currentSeat: "west",
    hands: { west: ["H9"], south: ["CT"] },
    discardPile: ["S9"],
  });
  const complete = playSheddingCards(state, ["H9"]);
  const next = startNextSheddingRound(complete);

  assert.equal(next.round, 2);
  assert.equal(next.dealer, "west");
  assert.equal(next.currentSeat, "west");
  assert.equal(next.scores.south, 10);
  assert.equal(next.scores.west, 0);
  assert.equal(next.hands.west.length, 4);
  assert.equal(next.hands.south.length, 5);
});

test("viewer snapshots hide the opponent hand and private shuffle seed", () => {
  const state = createSheddingGame({ seed: "private-seed" });
  const view = createSheddingViewerSnapshot(state, "south");
  const serialized = JSON.stringify(view);

  assert.deepEqual(Object.keys(view.hands), ["south"]);
  assert.equal(view.version, 4);
  assert.equal(view.topRankCount, 1);
  assert.equal(typeof view.mustCoverSix, "boolean");
  assert.equal(view.matchLoser, null);
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
    assert.ok(state.matchLoser);
    assert.ok(state.scores[state.matchLoser] > state.targetScore);
  }
});

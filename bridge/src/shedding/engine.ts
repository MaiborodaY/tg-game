import {
  createRandomSeed,
  compareSheddingCards,
  createSheddingDeck,
  getSheddingCard,
  scoreSheddingHand,
  shuffleSheddingDeck,
  validateSheddingDeck,
} from "./cards.ts";
import {
  SHEDDING_SEATS,
  SHEDDING_SUITS,
  SheddingRuleError,
  type CreateSheddingGameOptions,
  type SheddingAction,
  type SheddingCardId,
  type SheddingGameState,
  type SheddingLastAction,
  type SheddingRoundFinish,
  type SheddingRoundResult,
  type SheddingSeat,
  type SheddingSuit,
  type SheddingViewerSnapshot,
} from "./types.ts";

const DEFAULT_TARGET_SCORE = 125;

export function createSheddingGame(options: CreateSheddingGameOptions = {}): SheddingGameState {
  const targetScore = normalizeTargetScore(options.targetScore ?? DEFAULT_TARGET_SCORE);
  const dealer = options.dealer ?? "south";
  const matchSeed = options.seed === undefined ? createRandomSeed() : String(options.seed);
  const deck = options.deck
    ? validateSheddingDeck(options.deck)
    : shuffleSheddingDeck(createSheddingDeck(), `${matchSeed}:round:1`);

  return createRoundState({
    revision: 0,
    round: 1,
    targetScore,
    dealer,
    scores: Object.freeze({ south: 0, west: 0 }),
    matchSeed,
    deck,
  });
}

export function applySheddingAction(state: SheddingGameState, action: SheddingAction): SheddingGameState {
  if (action.type === "play_cards") {
    return playSheddingCards(state, action.cardIds, action.declaredSuit);
  }
  if (action.type === "draw_card") {
    return drawSheddingCard(state);
  }
  return startNextSheddingRound(state);
}

export function playSheddingCards(
  state: SheddingGameState,
  cardIds: readonly SheddingCardId[],
  declaredSuit?: SheddingSuit,
): SheddingGameState {
  if (state.phase !== "playing" || !state.currentSeat) throw new SheddingRuleError("not_in_play");
  if (!Array.isArray(cardIds) || cardIds.length < 1 || cardIds.length > 4) {
    throw new SheddingRuleError("bad_card_count");
  }

  const normalized = cardIds.map((cardId) => getSheddingCard(cardId).id);
  if (new Set(normalized).size !== normalized.length) throw new SheddingRuleError("duplicate_card");

  const seat = state.currentSeat;
  const hand = state.hands[seat];
  if (normalized.some((cardId) => !hand.includes(cardId))) throw new SheddingRuleError("card_not_in_hand");

  const rank = getSheddingCard(normalized[0]).rank;
  if (normalized.some((cardId) => getSheddingCard(cardId).rank !== rank)) {
    throw new SheddingRuleError("cards_must_match_rank");
  }
  if (!getLegalSheddingCardIds(state).includes(normalized[0])) throw new SheddingRuleError("illegal_card");
  if (rank === 11 && !declaredSuit) throw new SheddingRuleError("jack_requires_suit");
  if (rank !== 11 && declaredSuit !== undefined) throw new SheddingRuleError("suit_only_for_jack");
  if (declaredSuit && !SHEDDING_SUITS.includes(declaredSuit)) throw new SheddingRuleError("bad_declared_suit");

  const opponent = otherSheddingSeat(seat);
  const hands: Record<SheddingSeat, SheddingCardId[]> = {
    south: [...state.hands.south],
    west: [...state.hands.west],
  };
  hands[seat] = hands[seat].filter((candidate) => !normalized.includes(candidate));

  let drawPile = [...state.drawPile];
  let discardPile = [...state.discardPile, ...normalized];
  const madeFourOfAKind = getTopRankCount(discardPile) === 4;
  let recycleCount = state.recycleCount;
  let penaltyCards = 0;
  let skippedOpponent = false;
  const nextDeclaredSuit = rank === 11 ? declaredSuit ?? null : null;

  if (madeFourOfAKind) {
    const lastAction: SheddingLastAction = Object.freeze({
      type: "play_cards",
      seat,
      cardIds: Object.freeze([...normalized]),
      declaredSuit: nextDeclaredSuit,
      penaltyCards: 0,
      skippedOpponent: false,
    });
    return completeRound(
      state,
      seat,
      hands,
      drawPile,
      discardPile,
      recycleCount,
      nextDeclaredSuit,
      lastAction,
      "four_of_a_kind",
    );
  }

  if (rank === 7) {
    penaltyCards = normalized.length;
  } else if (rank === 8) {
    penaltyCards = normalized.length * 2;
    skippedOpponent = true;
  } else if (rank === 14) {
    skippedOpponent = true;
  }

  if (penaltyCards > 0) {
    const drawResult = drawFromPiles(drawPile, discardPile, penaltyCards, recycleCount);
    drawPile = drawResult.drawPile;
    discardPile = drawResult.discardPile;
    recycleCount = drawResult.recycleCount;
    hands[opponent].push(...drawResult.cards);
    penaltyCards = drawResult.cards.length;
  }

  const lastAction: SheddingLastAction = Object.freeze({
    type: "play_cards",
    seat,
    cardIds: Object.freeze([...normalized]),
    declaredSuit: nextDeclaredSuit,
    penaltyCards,
    skippedOpponent,
  });

  // A six never ends a turn by itself: the same player must cover it first.
  if (rank !== 6 && hands[seat].length === 0) {
    return completeRound(
      state,
      seat,
      hands,
      drawPile,
      discardPile,
      recycleCount,
      nextDeclaredSuit,
      lastAction,
      rank === 11 ? "jack_finish" : "empty_hand",
    );
  }

  return freezeState({
    ...state,
    revision: state.revision + 1,
    currentSeat: rank === 6 || skippedOpponent ? seat : opponent,
    hands,
    drawPile,
    discardPile,
    declaredSuit: nextDeclaredSuit,
    sixCoverSeat: rank === 6 ? seat : null,
    recycleCount,
    lastAction,
  });
}

export function drawSheddingCard(state: SheddingGameState): SheddingGameState {
  if (state.phase !== "playing" || !state.currentSeat) throw new SheddingRuleError("not_in_play");
  if (getLegalSheddingCardIds(state).length > 0) throw new SheddingRuleError("play_available");

  const seat = state.currentSeat;
  const coveringSix = mustCoverSheddingSix(state);
  let drawPile = [...state.drawPile];
  let discardPile = [...state.discardPile];
  let recycleCount = state.recycleCount;
  const drawnCards: SheddingCardId[] = [];

  do {
    const drawResult = drawFromPiles(drawPile, discardPile, 1, recycleCount);
    drawPile = drawResult.drawPile;
    discardPile = drawResult.discardPile;
    recycleCount = drawResult.recycleCount;
    drawnCards.push(...drawResult.cards);
    if (drawResult.cards.length === 0 || !coveringSix) break;
  } while (!drawnCards.some((cardId) => isLegalSheddingCard(state, cardId)));

  const hands = {
    south: [...state.hands.south],
    west: [...state.hands.west],
  };
  hands[seat].push(...drawnCards);
  const canNowCoverSix = coveringSix && hands[seat].some((cardId) => isLegalSheddingCard(state, cardId));

  return freezeState({
    ...state,
    revision: state.revision + 1,
    currentSeat: canNowCoverSix ? seat : otherSheddingSeat(seat),
    hands,
    drawPile,
    discardPile,
    sixCoverSeat: canNowCoverSix ? seat : null,
    recycleCount,
    lastAction: Object.freeze({ type: "draw_card", seat, count: drawnCards.length }),
  });
}

export function startNextSheddingRound(state: SheddingGameState): SheddingGameState {
  if (state.phase !== "round_complete") throw new SheddingRuleError("round_not_complete");
  const round = state.round + 1;
  const dealer = otherSheddingSeat(state.dealer);
  const deck = shuffleSheddingDeck(createSheddingDeck(), `${state.matchSeed}:round:${round}`);
  return createRoundState({
    revision: state.revision + 1,
    round,
    targetScore: state.targetScore,
    dealer,
    scores: state.scores,
    matchSeed: state.matchSeed,
    deck,
  });
}

export function getLegalSheddingCardIds(state: SheddingGameState): readonly SheddingCardId[] {
  if (state.phase !== "playing" || !state.currentSeat) return Object.freeze([]);
  return Object.freeze(state.hands[state.currentSeat].filter((cardId) => isLegalSheddingCard(state, cardId)));
}

export function getSheddingTurnController(state: SheddingGameState): SheddingSeat | null {
  if (state.phase === "playing") return state.currentSeat;
  if (state.phase === "round_complete") return state.roundResult?.winner ?? null;
  return null;
}

export function mustCoverSheddingSix(state: SheddingGameState): boolean {
  return state.phase === "playing"
    && state.currentSeat !== null
    && state.sixCoverSeat === state.currentSeat;
}

export function createSheddingViewerSnapshot(
  state: SheddingGameState,
  viewerSeat: SheddingSeat,
): SheddingViewerSnapshot {
  if (!SHEDDING_SEATS.includes(viewerSeat)) throw new Error(`Unknown viewer seat: ${viewerSeat}`);
  const controller = getSheddingTurnController(state);
  const canAct = controller === viewerSeat;
  const hands = state.phase === "match_complete"
    ? Object.freeze({
        south: Object.freeze([...state.hands.south].sort(compareSheddingCards)),
        west: Object.freeze([...state.hands.west].sort(compareSheddingCards)),
      })
    : Object.freeze({ [viewerSeat]: Object.freeze([...state.hands[viewerSeat]].sort(compareSheddingCards)) });

  return Object.freeze({
    version: 3,
    revision: state.revision,
    round: state.round,
    targetScore: state.targetScore,
    phase: state.phase,
    viewerSeat,
    dealer: state.dealer,
    currentSeat: state.currentSeat,
    controller,
    scores: Object.freeze({ ...state.scores }),
    hands,
    handCounts: Object.freeze({ south: state.hands.south.length, west: state.hands.west.length }),
    topCard: getTopDiscard(state),
    topRankCount: getTopRankCount(state.discardPile),
    mustCoverSix: mustCoverSheddingSix(state),
    declaredSuit: state.declaredSuit,
    drawCount: state.drawPile.length,
    discardCount: state.discardPile.length,
    recycleCount: state.recycleCount,
    lastAction: state.lastAction,
    roundResult: state.roundResult,
    matchWinner: state.matchWinner,
    legalCardIds: canAct && state.phase === "playing" ? getLegalSheddingCardIds(state) : Object.freeze([]),
    canDraw: canAct && state.phase === "playing",
    canStartNextRound: canAct && state.phase === "round_complete",
  });
}

export function otherSheddingSeat(seat: SheddingSeat): SheddingSeat {
  return seat === "south" ? "west" : "south";
}

function completeRound(
  state: SheddingGameState,
  winner: SheddingSeat,
  hands: Record<SheddingSeat, SheddingCardId[]>,
  drawPile: readonly SheddingCardId[],
  discardPile: readonly SheddingCardId[],
  recycleCount: number,
  declaredSuit: SheddingSuit | null,
  lastAction: SheddingLastAction,
  finish: SheddingRoundFinish,
): SheddingGameState {
  const loser = otherSheddingSeat(winner);
  const basePoints = scoreSheddingHand(hands[loser]);
  const scoreMultiplier = finish === "empty_hand" ? 1 : 2;
  const points = basePoints * scoreMultiplier;
  const scores = Object.freeze({
    ...state.scores,
    [winner]: state.scores[winner] + points,
  });
  const matchWinner = scores[winner] >= state.targetScore ? winner : null;
  const roundResult: SheddingRoundResult = Object.freeze({
    round: state.round,
    winner,
    loser,
    finish,
    basePoints,
    scoreMultiplier,
    points,
    loserCards: Object.freeze([...hands[loser]].sort(compareSheddingCards)),
    scores,
  });

  return freezeState({
    ...state,
    revision: state.revision + 1,
    phase: matchWinner ? "match_complete" : "round_complete",
    currentSeat: null,
    scores,
    hands,
    drawPile,
    discardPile,
    declaredSuit,
    sixCoverSeat: null,
    recycleCount,
    lastAction,
    roundResult,
    matchWinner,
  });
}

function createRoundState(options: {
  revision: number;
  round: number;
  targetScore: number;
  dealer: SheddingSeat;
  scores: Readonly<Record<SheddingSeat, number>>;
  matchSeed: string;
  deck: readonly SheddingCardId[];
}): SheddingGameState {
  const deck = validateSheddingDeck(options.deck);
  const nonDealer = otherSheddingSeat(options.dealer);
  const hands: Record<SheddingSeat, SheddingCardId[]> = { south: [], west: [] };
  let cursor = 0;

  for (let cardIndex = 0; cardIndex < 5; cardIndex += 1) {
    hands[nonDealer].push(deck[cursor++]);
    hands[options.dealer].push(deck[cursor++]);
  }

  const openingCard = hands[options.dealer].pop();
  if (!openingCard) throw new Error("Could not create the opening discard.");

  return freezeState({
    version: 3,
    revision: options.revision,
    round: options.round,
    targetScore: options.targetScore,
    phase: "playing",
    dealer: options.dealer,
    currentSeat: options.dealer,
    scores: options.scores,
    hands,
    drawPile: deck.slice(cursor),
    discardPile: [openingCard],
    declaredSuit: null,
    sixCoverSeat: getSheddingCard(openingCard).rank === 6 ? options.dealer : null,
    recycleCount: 0,
    lastAction: null,
    roundResult: null,
    matchWinner: null,
    matchSeed: options.matchSeed,
  });
}

function drawFromPiles(
  sourceDrawPile: readonly SheddingCardId[],
  sourceDiscardPile: readonly SheddingCardId[],
  count: number,
  sourceRecycleCount: number,
): {
  cards: SheddingCardId[];
  drawPile: SheddingCardId[];
  discardPile: SheddingCardId[];
  recycleCount: number;
} {
  const cards: SheddingCardId[] = [];
  let drawPile = [...sourceDrawPile];
  let discardPile = [...sourceDiscardPile];
  let recycleCount = sourceRecycleCount;

  while (cards.length < count) {
    if (drawPile.length === 0 && discardPile.length > 1) {
      const top = discardPile[discardPile.length - 1];
      drawPile = discardPile.slice(0, -1).reverse();
      discardPile = [top];
      recycleCount += 1;
    }
    const card = drawPile.shift();
    if (!card) break;
    cards.push(card);
  }

  return { cards, drawPile, discardPile, recycleCount };
}

function getTopDiscard(state: Pick<SheddingGameState, "discardPile">): SheddingCardId {
  const cardId = state.discardPile[state.discardPile.length - 1];
  if (!cardId) throw new Error("A shedding Bridge state must have an open card.");
  return cardId;
}

function getTopRankCount(discardPile: readonly SheddingCardId[]): number {
  const topCardId = discardPile[discardPile.length - 1];
  if (!topCardId) return 0;
  const topRank = getSheddingCard(topCardId).rank;
  let count = 0;
  for (let index = discardPile.length - 1; index >= 0; index -= 1) {
    if (getSheddingCard(discardPile[index]).rank !== topRank) break;
    count += 1;
  }
  return count;
}

function isLegalSheddingCard(
  state: Pick<SheddingGameState, "discardPile" | "declaredSuit">,
  cardId: SheddingCardId,
): boolean {
  const topCard = getSheddingCard(getTopDiscard(state));
  const card = getSheddingCard(cardId);
  if (card.rank === 11) return true;
  if (state.declaredSuit) return card.suit === state.declaredSuit;
  return card.suit === topCard.suit || card.rank === topCard.rank;
}

function freezeState(state: SheddingGameState | (Omit<SheddingGameState, "hands" | "drawPile" | "discardPile"> & {
  hands: Record<SheddingSeat, readonly SheddingCardId[]>;
  drawPile: readonly SheddingCardId[];
  discardPile: readonly SheddingCardId[];
})): SheddingGameState {
  return Object.freeze({
    ...state,
    scores: Object.freeze({ ...state.scores }),
    hands: Object.freeze({
      south: Object.freeze([...state.hands.south]),
      west: Object.freeze([...state.hands.west]),
    }),
    drawPile: Object.freeze([...state.drawPile]),
    discardPile: Object.freeze([...state.discardPile]),
  }) as SheddingGameState;
}

function normalizeTargetScore(value: number): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > 10_000) {
    throw new Error("Target score must be an integer between 1 and 10000.");
  }
  return value;
}

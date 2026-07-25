import { getAuctionSeat, getLegalCallsForAuction, isAuctionComplete, isLegalCall, resolveContract } from "./auction.ts";
import { createDeck, dealCards, shuffleDeck, validateDeck } from "./cards.ts";
import { getLegalCardsForTrick, getTrickWinner } from "./play.ts";
import { scoreDuplicateContract } from "./scoring.ts";
import { nextSeat, partnershipOf } from "./seats.ts";
import {
  BridgeRuleError,
  SEATS,
  type AuctionEntry,
  type BridgeGameState,
  type Call,
  type CardId,
  type CardPlay,
  type CompletedTrick,
  type Contract,
  type CreateGameOptions,
  type Seat,
  type TrickInProgress,
  type Vulnerability,
} from "./types.ts";

const BOARD_VULNERABILITY: readonly Vulnerability[] = Object.freeze([
  "none", "ns", "ew", "both",
  "ns", "ew", "both", "none",
  "ew", "both", "none", "ns",
  "both", "none", "ns", "ew",
]);

export function createGame(options: CreateGameOptions = {}): BridgeGameState {
  if (options.deck && (options.seed !== undefined || options.random)) {
    throw new Error("Provide a ready deck or a shuffle source, not both.");
  }
  if (options.seed !== undefined && options.random) {
    throw new Error("Provide either seed or random, not both.");
  }

  const boardNumber = normalizeBoardNumber(options.boardNumber ?? 1);
  const dealer = options.dealer ?? getBoardDealer(boardNumber);
  const vulnerability = options.vulnerability ?? getBoardVulnerability(boardNumber);
  const deckOrder = options.deck
    ? validateDeck(options.deck)
    : shuffleDeck(createDeck(), { seed: options.seed, random: options.random });
  const seed = options.seed === undefined ? null : String(options.seed);

  return Object.freeze({
    version: 1,
    revision: 0,
    boardNumber,
    phase: "auction",
    dealer,
    vulnerability,
    currentSeat: dealer,
    auction: Object.freeze([]),
    contract: null,
    hands: dealCards(deckOrder, dealer),
    currentTrick: null,
    completedTricks: Object.freeze([]),
    tricksWon: Object.freeze({ ns: 0, ew: 0 }),
    openingLeadPlayed: false,
    result: null,
    seed,
    deckOrder: Object.freeze([...deckOrder]),
  });
}

export function applyCall(state: BridgeGameState, call: Call): BridgeGameState {
  if (state.phase !== "auction" || !state.currentSeat) throw new BridgeRuleError("not_in_auction");
  if (!isLegalCall(state.auction, state.currentSeat, call)) throw new BridgeRuleError("illegal_call");

  const entry: AuctionEntry = Object.freeze({ seat: state.currentSeat, call: freezeCall(call) });
  const auction = Object.freeze([...state.auction, entry]);
  if (!isAuctionComplete(auction)) {
    return Object.freeze({
      ...state,
      revision: state.revision + 1,
      currentSeat: getAuctionSeat(state.dealer, auction),
      auction,
    });
  }

  const contract = resolveContract(auction);
  if (!contract) {
    return Object.freeze({
      ...state,
      revision: state.revision + 1,
      phase: "complete",
      currentSeat: null,
      auction,
      result: Object.freeze({ type: "passed_out", scoreNS: 0 }),
    });
  }

  return Object.freeze({
    ...state,
    revision: state.revision + 1,
    phase: "play",
    currentSeat: contract.openingLeader,
    auction,
    contract,
    currentTrick: createEmptyTrick(1, contract.openingLeader),
  });
}

export function playCard(state: BridgeGameState, cardId: CardId): BridgeGameState {
  if (state.phase !== "play" || !state.currentSeat || !state.contract || !state.currentTrick) {
    throw new BridgeRuleError("not_in_play");
  }
  const normalizedCard = typeof cardId === "string" ? cardId.toUpperCase() : "";
  const hand = state.hands[state.currentSeat];
  if (!hand.includes(normalizedCard)) throw new BridgeRuleError("card_not_in_hand");
  const legalCards = getLegalCardsForTrick(hand, state.currentTrick.plays);
  if (!legalCards.includes(normalizedCard)) throw new BridgeRuleError("must_follow_suit");

  const play: CardPlay = Object.freeze({ seat: state.currentSeat, cardId: normalizedCard });
  const plays = Object.freeze([...state.currentTrick.plays, play]);
  const hands = replaceHand(state.hands, state.currentSeat, hand.filter((candidate) => candidate !== normalizedCard));
  const openingLeadPlayed = state.openingLeadPlayed || (state.completedTricks.length === 0 && plays.length >= 1);

  if (plays.length < 4) {
    return Object.freeze({
      ...state,
      revision: state.revision + 1,
      currentSeat: nextSeat(state.currentSeat),
      hands,
      currentTrick: Object.freeze({ ...state.currentTrick, plays }),
      openingLeadPlayed,
    });
  }

  const winner = getTrickWinner(plays, state.contract);
  const completedTrick: CompletedTrick = Object.freeze({ ...state.currentTrick, plays, winner });
  const completedTricks = Object.freeze([...state.completedTricks, completedTrick]);
  const winnerSide = partnershipOf(winner);
  const tricksWon = Object.freeze({
    ...state.tricksWon,
    [winnerSide]: state.tricksWon[winnerSide] + 1,
  });

  if (completedTricks.length === 13) {
    return completeContract(state, hands, completedTricks, tricksWon, openingLeadPlayed);
  }

  return Object.freeze({
    ...state,
    revision: state.revision + 1,
    currentSeat: winner,
    hands,
    currentTrick: createEmptyTrick(completedTricks.length + 1, winner),
    completedTricks,
    tricksWon,
    openingLeadPlayed,
  });
}

export function getLegalCalls(state: BridgeGameState): readonly Call[] {
  return state.phase === "auction" && state.currentSeat
    ? getLegalCallsForAuction(state.auction, state.currentSeat)
    : Object.freeze([]);
}

export function getLegalCardIds(state: BridgeGameState): readonly CardId[] {
  if (state.phase !== "play" || !state.currentSeat || !state.currentTrick) return Object.freeze([]);
  return getLegalCardsForTrick(state.hands[state.currentSeat], state.currentTrick.plays);
}

export function getTurnController(state: BridgeGameState): Seat | null {
  if (!state.currentSeat || state.phase === "complete") return null;
  if (state.phase === "play" && state.contract && state.currentSeat === state.contract.dummy) {
    return state.contract.declarer;
  }
  return state.currentSeat;
}

export function isHumanActionRequired(state: BridgeGameState, humanSeats: readonly Seat[]): boolean {
  const controller = getTurnController(state);
  return controller !== null && humanSeats.includes(controller);
}

export function getBoardDealer(boardNumber: number): Seat {
  return SEATS[(normalizeBoardNumber(boardNumber) - 1) % SEATS.length];
}

export function getBoardVulnerability(boardNumber: number): Vulnerability {
  return BOARD_VULNERABILITY[(normalizeBoardNumber(boardNumber) - 1) % BOARD_VULNERABILITY.length];
}

function completeContract(
  state: BridgeGameState,
  hands: BridgeGameState["hands"],
  completedTricks: readonly CompletedTrick[],
  tricksWon: BridgeGameState["tricksWon"],
  openingLeadPlayed: boolean,
): BridgeGameState {
  const contract = state.contract as Contract;
  const declarerTricks = tricksWon[contract.declaringSide];
  const defenderTricks = 13 - declarerTricks;
  const breakdown = scoreDuplicateContract(contract, declarerTricks, state.vulnerability);
  const scoreNS = contract.declaringSide === "ns" ? breakdown.total : -breakdown.total;
  return Object.freeze({
    ...state,
    revision: state.revision + 1,
    phase: "complete",
    currentSeat: null,
    hands,
    currentTrick: null,
    completedTricks,
    tricksWon,
    openingLeadPlayed,
    result: Object.freeze({
      type: "contract",
      contract,
      declarerTricks,
      defenderTricks,
      made: breakdown.made,
      scoreNS,
      breakdown,
    }),
  });
}

function replaceHand(
  hands: BridgeGameState["hands"],
  seat: Seat,
  hand: readonly CardId[],
): BridgeGameState["hands"] {
  return Object.freeze({
    ...hands,
    [seat]: Object.freeze([...hand]),
  });
}

function createEmptyTrick(index: number, leader: Seat): TrickInProgress {
  return Object.freeze({ index, leader, plays: Object.freeze([]) });
}

function freezeCall(call: Call): Call {
  return call.type === "bid"
    ? Object.freeze({ type: "bid", level: call.level, strain: call.strain })
    : Object.freeze({ type: call.type });
}

function normalizeBoardNumber(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

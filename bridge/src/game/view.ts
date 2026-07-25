import { dealCards } from "./cards.ts";
import { getLegalCalls, getLegalCardIds, getTurnController } from "./engine.ts";
import { SEATS, type BridgeGameState, type CardId, type Seat, type ViewerSnapshot } from "./types.ts";

export function createViewerSnapshot(state: BridgeGameState, viewerSeat: Seat): ViewerSnapshot {
  if (!SEATS.includes(viewerSeat)) throw new Error(`Unknown viewer seat: ${String(viewerSeat)}`);

  const controller = getTurnController(state);
  const visibleHands: Partial<Record<Seat, readonly CardId[]>> = {};
  if (state.phase === "complete") {
    const originalHands = dealCards(state.deckOrder, state.dealer);
    for (const seat of SEATS) visibleHands[seat] = Object.freeze([...originalHands[seat]]);
  } else {
    visibleHands[viewerSeat] = Object.freeze([...state.hands[viewerSeat]]);
    if (state.phase === "play" && state.openingLeadPlayed && state.contract) {
      visibleHands[state.contract.dummy] = Object.freeze([...state.hands[state.contract.dummy]]);
    }
  }

  return Object.freeze({
    version: 1,
    revision: state.revision,
    boardNumber: state.boardNumber,
    phase: state.phase,
    viewerSeat,
    dealer: state.dealer,
    vulnerability: state.vulnerability,
    currentSeat: state.currentSeat,
    controller,
    auction: Object.freeze(state.auction.map((entry) => Object.freeze({ ...entry, call: Object.freeze({ ...entry.call }) }))),
    contract: state.contract ? Object.freeze({ ...state.contract }) : null,
    hands: Object.freeze(visibleHands),
    handCounts: Object.freeze(Object.fromEntries(SEATS.map((seat) => [seat, state.hands[seat].length])) as Record<Seat, number>),
    currentTrick: state.currentTrick
      ? Object.freeze({
          ...state.currentTrick,
          plays: Object.freeze(state.currentTrick.plays.map((play) => Object.freeze({ ...play }))),
        })
      : null,
    completedTricks: Object.freeze(state.completedTricks.map((trick) => Object.freeze({
      ...trick,
      plays: Object.freeze(trick.plays.map((play) => Object.freeze({ ...play }))),
    }))),
    tricksWon: Object.freeze({ ...state.tricksWon }),
    openingLeadPlayed: state.openingLeadPlayed,
    result: state.result,
    legalCalls: controller === viewerSeat ? getLegalCalls(state) : Object.freeze([]),
    legalCardIds: controller === viewerSeat ? getLegalCardIds(state) : Object.freeze([]),
  });
}

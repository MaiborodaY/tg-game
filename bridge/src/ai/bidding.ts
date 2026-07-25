import {
  callsEqual,
  getCard,
  partnerOf,
  partnershipOf,
  type AuctionEntry,
  type BidLevel,
  type Call,
  type CardId,
  type Seat,
  type Strain,
  type Suit,
  type ViewerSnapshot,
} from "../game/index.ts";

const HCP_BY_RANK: Readonly<Record<number, number>> = Object.freeze({ 11: 1, 12: 2, 13: 3, 14: 4 });
const NATURAL_SUIT_PREFERENCE: readonly Suit[] = Object.freeze(["spades", "hearts", "diamonds", "clubs"]);

export function chooseAiCall(snapshot: ViewerSnapshot): Call | null {
  if (snapshot.phase !== "auction" || snapshot.controller !== snapshot.viewerSeat || snapshot.legalCalls.length === 0) return null;
  const hand = snapshot.hands[snapshot.viewerSeat];
  if (!hand) return legalPass(snapshot.legalCalls);

  const legalCalls = snapshot.legalCalls;
  const points = highCardPoints(hand);
  const shape = handShape(hand);
  const ownBids = bidsBy(snapshot.auction, snapshot.viewerSeat);
  const partner = partnerOf(snapshot.viewerSeat);
  const partnerBids = bidsBy(snapshot.auction, partner);
  const opponentBids = snapshot.auction.filter((entry) => (
    entry.call.type === "bid" && partnershipOf(entry.seat) !== partnershipOf(snapshot.viewerSeat)
  ));

  // A bounded, deterministic system: each hand makes at most one natural bid.
  if (ownBids.length > 0) return chooseProtectiveCall(legalCalls, points);
  if (partnerBids.length > 0) {
    return chooseResponse(legalCalls, partnerBids.at(-1) as AuctionEntry & { call: Extract<Call, { type: "bid" }> }, hand, points, shape)
      ?? chooseProtectiveCall(legalCalls, points);
  }
  if (opponentBids.length > 0) {
    return chooseOvercall(legalCalls, hand, points, shape) ?? chooseProtectiveCall(legalCalls, points);
  }
  return chooseOpening(legalCalls, hand, points, shape) ?? legalPass(legalCalls);
}

export function highCardPoints(hand: readonly CardId[]): number {
  return hand.reduce((total, cardId) => total + (HCP_BY_RANK[getCard(cardId).rank] ?? 0), 0);
}

export function handShape(hand: readonly CardId[]): Readonly<Record<Suit, number>> {
  const counts: Record<Suit, number> = { clubs: 0, diamonds: 0, hearts: 0, spades: 0 };
  hand.forEach((cardId) => { counts[getCard(cardId).suit] += 1; });
  return Object.freeze(counts);
}

function chooseOpening(
  legalCalls: readonly Call[],
  hand: readonly CardId[],
  points: number,
  shape: Readonly<Record<Suit, number>>,
): Call | null {
  if (points < 12 && !(points >= 10 && Math.max(...Object.values(shape)) >= 6)) return null;
  if (isBalanced(shape) && points >= 20) return findBid(legalCalls, 2, "notrump");
  if (isBalanced(shape) && points >= 15 && points <= 17) return findBid(legalCalls, 1, "notrump");
  return findCheapestBid(legalCalls, longestNaturalSuit(hand));
}

function chooseResponse(
  legalCalls: readonly Call[],
  partnerBid: AuctionEntry & { call: Extract<Call, { type: "bid" }> },
  hand: readonly CardId[],
  points: number,
  shape: Readonly<Record<Suit, number>>,
): Call | null {
  if (points < 6) return null;

  if (partnerBid.call.strain !== "notrump" && shape[partnerBid.call.strain] >= 3) {
    const gameLevel: BidLevel = partnerBid.call.strain === "hearts" || partnerBid.call.strain === "spades" ? 4 : 5;
    if (points >= 13) return findBid(legalCalls, gameLevel, partnerBid.call.strain) ?? findCheapestBid(legalCalls, partnerBid.call.strain);
    const raiseBy = points >= 10 ? 2 : 1;
    return findBid(legalCalls, clampBidLevel(partnerBid.call.level + raiseBy), partnerBid.call.strain)
      ?? findCheapestBid(legalCalls, partnerBid.call.strain);
  }

  if (isBalanced(shape) && points >= 10) {
    const target = partnerBid.call.strain === "notrump" && points >= 13 ? 3 : 2;
    const noTrump = findBid(legalCalls, target as BidLevel, "notrump");
    if (noTrump) return noTrump;
  }

  const longest = longestNaturalSuit(hand);
  if (shape[longest] >= 4) return findCheapestBid(legalCalls, longest);
  return points >= 10 ? findCheapestBid(legalCalls, "notrump") : null;
}

function chooseOvercall(
  legalCalls: readonly Call[],
  hand: readonly CardId[],
  points: number,
  shape: Readonly<Record<Suit, number>>,
): Call | null {
  if (points >= 16 && isBalanced(shape)) {
    const noTrump = findCheapestBid(legalCalls, "notrump");
    if (noTrump) return noTrump;
  }
  const suit = longestNaturalSuit(hand);
  if (points >= 8 && shape[suit] >= 5) return findCheapestBid(legalCalls, suit);
  return null;
}

function chooseProtectiveCall(legalCalls: readonly Call[], points: number): Call | null {
  const redouble = legalCalls.find((call) => call.type === "redouble");
  if (redouble && points >= 10) return redouble;
  const double = legalCalls.find((call) => call.type === "double");
  if (double && points >= 15) return double;
  return legalPass(legalCalls);
}

function longestNaturalSuit(hand: readonly CardId[]): Suit {
  const shape = handShape(hand);
  return NATURAL_SUIT_PREFERENCE.reduce((best, suit) => shape[suit] > shape[best] ? suit : best);
}

function isBalanced(shape: Readonly<Record<Suit, number>>): boolean {
  const lengths = Object.values(shape);
  return Math.min(...lengths) >= 2 && Math.max(...lengths) <= 5;
}

function bidsBy(auction: readonly AuctionEntry[], seat: Seat): Array<AuctionEntry & { call: Extract<Call, { type: "bid" }> }> {
  return auction.filter((entry): entry is AuctionEntry & { call: Extract<Call, { type: "bid" }> } => (
    entry.seat === seat && entry.call.type === "bid"
  ));
}

function findCheapestBid(legalCalls: readonly Call[], strain: Strain): Call | null {
  return legalCalls.find((call) => call.type === "bid" && call.strain === strain) ?? null;
}

function findBid(legalCalls: readonly Call[], level: BidLevel, strain: Strain): Call | null {
  const desired: Call = { type: "bid", level, strain };
  return legalCalls.find((call) => callsEqual(call, desired)) ?? null;
}

function legalPass(legalCalls: readonly Call[]): Call | null {
  return legalCalls.find((call) => call.type === "pass") ?? null;
}

function clampBidLevel(level: number): BidLevel {
  return Math.min(7, Math.max(1, Math.floor(level))) as BidLevel;
}

import { BID_LEVELS, STRAINS, type AuctionEntry, type BidLevel, type Call, type Contract, type Seat, type Strain } from "./types.ts";
import { isOpponent, nextSeat, partnerOf, partnershipOf } from "./seats.ts";

const PASS: Call = Object.freeze({ type: "pass" });
const DOUBLE: Call = Object.freeze({ type: "double" });
const REDOUBLE: Call = Object.freeze({ type: "redouble" });

export function getAuctionSeat(dealer: Seat, auction: readonly AuctionEntry[]): Seat {
  return nextSeat(dealer, auction.length);
}

export function compareBids(
  left: Readonly<{ level: BidLevel; strain: Strain }>,
  right: Readonly<{ level: BidLevel; strain: Strain }>,
): number {
  return (left.level - right.level) || (STRAINS.indexOf(left.strain) - STRAINS.indexOf(right.strain));
}

export function getLegalCallsForAuction(auction: readonly AuctionEntry[], seat: Seat): readonly Call[] {
  if (isAuctionComplete(auction)) return Object.freeze([]);

  const standing = getAuctionStanding(auction);
  const calls: Call[] = [PASS];
  for (const level of BID_LEVELS) {
    for (const strain of STRAINS) {
      const bid = Object.freeze({ type: "bid" as const, level, strain });
      if (!standing.bid || compareBids(bid, standing.bid.call) > 0) calls.push(bid);
    }
  }

  if (
    standing.bid
    && standing.doubled === 0
    && standing.lastNonPass?.call.type === "bid"
    && isOpponent(seat, standing.bid.seat)
  ) {
    calls.push(DOUBLE);
  }
  if (
    standing.bid
    && standing.doubled === 1
    && standing.lastNonPass?.call.type === "double"
    && partnershipOf(seat) === partnershipOf(standing.bid.seat)
  ) {
    calls.push(REDOUBLE);
  }

  return Object.freeze(calls);
}

export function isLegalCall(auction: readonly AuctionEntry[], seat: Seat, call: Call): boolean {
  if (!isWellFormedCall(call)) return false;
  return getLegalCallsForAuction(auction, seat).some((legal) => callsEqual(legal, call));
}

export function isAuctionComplete(auction: readonly AuctionEntry[]): boolean {
  const lastBidIndex = findLastIndex(auction, (entry) => entry.call.type === "bid");
  if (lastBidIndex < 0) return auction.length >= 4 && auction.slice(-4).every((entry) => entry.call.type === "pass");
  return auction.length >= lastBidIndex + 4 && auction.slice(-3).every((entry) => entry.call.type === "pass");
}

export function resolveContract(auction: readonly AuctionEntry[]): Contract | null {
  if (!isAuctionComplete(auction)) throw new Error("The auction is not complete.");
  const standing = getAuctionStanding(auction);
  if (!standing.bid) return null;

  const declaringSide = partnershipOf(standing.bid.seat);
  const firstStrainBid = auction.find((entry) => (
    entry.call.type === "bid"
    && entry.call.strain === standing.bid?.call.strain
    && partnershipOf(entry.seat) === declaringSide
  ));
  if (!firstStrainBid) throw new Error("Could not determine declarer.");

  const declarer = firstStrainBid.seat;
  return Object.freeze({
    level: standing.bid.call.level,
    strain: standing.bid.call.strain,
    doubled: standing.doubled,
    declarer,
    dummy: partnerOf(declarer),
    openingLeader: nextSeat(declarer),
    declaringSide,
  });
}

export function callsEqual(left: Call, right: Call): boolean {
  return left.type === right.type && (
    left.type !== "bid"
    || (right.type === "bid" && left.level === right.level && left.strain === right.strain)
  );
}

export function isWellFormedCall(call: unknown): call is Call {
  if (!call || typeof call !== "object" || !("type" in call)) return false;
  const candidate = call as Partial<Call>;
  if (candidate.type === "pass" || candidate.type === "double" || candidate.type === "redouble") return true;
  return candidate.type === "bid"
    && BID_LEVELS.includes(candidate.level as BidLevel)
    && STRAINS.includes(candidate.strain as Strain);
}

function getAuctionStanding(auction: readonly AuctionEntry[]): {
  bid: (AuctionEntry & { call: Extract<Call, { type: "bid" }> }) | null;
  doubled: 0 | 1 | 2;
  lastNonPass: AuctionEntry | null;
} {
  let bid: (AuctionEntry & { call: Extract<Call, { type: "bid" }> }) | null = null;
  let doubled: 0 | 1 | 2 = 0;
  let lastNonPass: AuctionEntry | null = null;

  for (const entry of auction) {
    if (entry.call.type === "pass") continue;
    lastNonPass = entry;
    if (entry.call.type === "bid") {
      bid = entry as AuctionEntry & { call: Extract<Call, { type: "bid" }> };
      doubled = 0;
    } else if (entry.call.type === "double") {
      doubled = 1;
    } else {
      doubled = 2;
    }
  }
  return { bid, doubled, lastNonPass };
}

function findLastIndex<T>(values: readonly T[], predicate: (value: T) => boolean): number {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (predicate(values[index])) return index;
  }
  return -1;
}

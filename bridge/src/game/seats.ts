import { SEATS, type Partnership, type Seat } from "./types.ts";

export function nextSeat(seat: Seat, steps = 1): Seat {
  const index = SEATS.indexOf(seat);
  return SEATS[(index + steps % SEATS.length + SEATS.length) % SEATS.length];
}

export function partnerOf(seat: Seat): Seat {
  return nextSeat(seat, 2);
}

export function partnershipOf(seat: Seat): Partnership {
  return seat === "north" || seat === "south" ? "ns" : "ew";
}

export function isOpponent(left: Seat, right: Seat): boolean {
  return partnershipOf(left) !== partnershipOf(right);
}

import { getCard } from "../game/cards.ts";
import { SEATS, type BridgeResult, type Call, type CardId, type Contract, type Seat, type Strain, type Suit, type Vulnerability } from "../game/types.ts";

export type TablePosition = "bottom" | "left" | "top" | "right";

const POSITION_BY_OFFSET: readonly TablePosition[] = ["bottom", "left", "top", "right"];

export const SEAT_LABELS: Readonly<Record<Seat, string>> = Object.freeze({
  north: "Север",
  east: "Восток",
  south: "Юг",
  west: "Запад",
});

export const SUIT_SYMBOLS: Readonly<Record<Suit, string>> = Object.freeze({
  clubs: "♣",
  diamonds: "♦",
  hearts: "♥",
  spades: "♠",
});

export const STRAIN_LABELS: Readonly<Record<Strain, string>> = Object.freeze({
  clubs: "♣",
  diamonds: "♦",
  hearts: "♥",
  spades: "♠",
  notrump: "БК",
});

export function getSeatPosition(viewerSeat: Seat, seat: Seat): TablePosition {
  const viewerIndex = SEATS.indexOf(viewerSeat);
  const seatIndex = SEATS.indexOf(seat);
  return POSITION_BY_OFFSET[(seatIndex - viewerIndex + SEATS.length) % SEATS.length];
}

export function getSeatsByPosition(viewerSeat: Seat): Readonly<Record<TablePosition, Seat>> {
  return Object.freeze(Object.fromEntries(
    SEATS.map((seat) => [getSeatPosition(viewerSeat, seat), seat]),
  ) as Record<TablePosition, Seat>);
}

export function formatCall(call: Call): string {
  if (call.type === "pass") return "Пас";
  if (call.type === "double") return "Контра";
  if (call.type === "redouble") return "Реконтра";
  return `${call.level}${STRAIN_LABELS[call.strain]}`;
}

export function callKey(call: Call): string {
  return call.type === "bid" ? `bid:${call.level}:${call.strain}` : call.type;
}

export function callsEqual(left: Call | null, right: Call | null): boolean {
  return left !== null && right !== null && callKey(left) === callKey(right);
}

export function formatContract(contract: Contract | null): string {
  if (!contract) return "Контракт ещё не определён";
  const multiplier = contract.doubled === 1 ? "×" : contract.doubled === 2 ? "××" : "";
  return `${contract.level}${STRAIN_LABELS[contract.strain]}${multiplier} · ${SEAT_LABELS[contract.declarer]}`;
}

export function formatVulnerability(vulnerability: Vulnerability): string {
  if (vulnerability === "none") return "Никто не в зоне";
  if (vulnerability === "both") return "Все в зоне";
  return vulnerability === "ns" ? "Север—Юг в зоне" : "Восток—Запад в зоне";
}

export function isRedStrain(strain: Strain): boolean {
  return strain === "diamonds" || strain === "hearts";
}

export function formatCard(cardId: CardId): Readonly<{ rank: string; suit: string; red: boolean; spoken: string }> {
  const card = getCard(cardId);
  const rank = card.rank === 10 ? "10" : card.rank === 11 ? "J" : card.rank === 12 ? "Q" : card.rank === 13 ? "K" : card.rank === 14 ? "A" : String(card.rank);
  const suit = SUIT_SYMBOLS[card.suit];
  return Object.freeze({
    rank,
    suit,
    red: card.suit === "diamonds" || card.suit === "hearts",
    spoken: `${rank} ${suitNameGenitive(card.suit)}`,
  });
}

export function groupCardsBySuit(cardIds: readonly CardId[]): Readonly<Record<Suit, readonly string[]>> {
  const groups: Record<Suit, string[]> = { clubs: [], diamonds: [], hearts: [], spades: [] };
  cardIds.forEach((cardId) => groups[getCard(cardId).suit].push(formatCard(cardId).rank));
  return Object.freeze({
    clubs: Object.freeze(groups.clubs),
    diamonds: Object.freeze(groups.diamonds),
    hearts: Object.freeze(groups.hearts),
    spades: Object.freeze(groups.spades),
  });
}

export function formatSignedScore(score: number): string {
  return score > 0 ? `+${score}` : String(score);
}

export function formatResultTitle(result: BridgeResult): string {
  if (result.type === "passed_out") return "Все спасовали";
  if (result.made) {
    const target = result.contract.level + 6;
    const overtricks = result.declarerTricks - target;
    return overtricks > 0 ? `Контракт выполнен +${overtricks}` : "Контракт точно выполнен";
  }
  return `Без ${result.contract.level + 6 - result.declarerTricks}`;
}

export function deterministicBotDelay(revision: number): number {
  return 430 + (Math.abs(revision * 137) % 260);
}

export function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function suitNameGenitive(suit: Suit): string {
  if (suit === "clubs") return "треф";
  if (suit === "diamonds") return "бубен";
  if (suit === "hearts") return "червей";
  return "пик";
}

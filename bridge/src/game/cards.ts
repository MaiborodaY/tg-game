import { SEATS, SUITS, type Card, type CardId, type CreateGameOptions, type Seat, type Suit } from "./types.ts";
import { nextSeat } from "./seats.ts";

const RANK_SYMBOLS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"] as const;
const SUIT_CODES: Readonly<Record<Suit, string>> = {
  clubs: "C",
  diamonds: "D",
  hearts: "H",
  spades: "S",
};
const CODE_SUITS: Readonly<Record<string, Suit>> = Object.freeze({ C: "clubs", D: "diamonds", H: "hearts", S: "spades" });

export const FULL_DECK: readonly CardId[] = Object.freeze(
  SUITS.flatMap((suit) => RANK_SYMBOLS.map((rank) => `${SUIT_CODES[suit]}${rank}`)),
);

export function createDeck(): CardId[] {
  return [...FULL_DECK];
}

export function getCard(cardId: CardId): Card {
  if (typeof cardId !== "string" || cardId.length !== 2) throw new Error(`Unknown card: ${String(cardId)}`);
  const suit = CODE_SUITS[cardId[0]?.toUpperCase()];
  const rankIndex = RANK_SYMBOLS.indexOf(cardId[1]?.toUpperCase() as (typeof RANK_SYMBOLS)[number]);
  if (!suit || rankIndex < 0) throw new Error(`Unknown card: ${cardId}`);
  return Object.freeze({ id: `${SUIT_CODES[suit]}${RANK_SYMBOLS[rankIndex]}`, suit, rank: rankIndex + 2 });
}

export function compareCardsForHand(leftId: CardId, rightId: CardId): number {
  const left = getCard(leftId);
  const right = getCard(rightId);
  return SUITS.indexOf(left.suit) - SUITS.indexOf(right.suit) || right.rank - left.rank;
}

export function validateDeck(deck: readonly CardId[]): CardId[] {
  if (deck.length !== 52) throw new Error("A bridge deck must contain exactly 52 cards.");
  const normalized = deck.map((cardId) => getCard(cardId).id);
  if (new Set(normalized).size !== 52 || normalized.some((cardId) => !FULL_DECK.includes(cardId))) {
    throw new Error("A bridge deck must contain each standard card exactly once.");
  }
  return normalized;
}

export function shuffleDeck(
  deck: readonly CardId[] = FULL_DECK,
  options: Pick<CreateGameOptions, "seed" | "random"> = {},
): CardId[] {
  const shuffled = validateDeck(deck);
  const random = options.random ?? (options.seed === undefined ? secureRandom : seededRandom(String(options.seed)));

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error("Random source must return a finite number in [0, 1).");
    const target = Math.floor(value * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

export function dealCards(deck: readonly CardId[], dealer: Seat): Readonly<Record<Seat, readonly CardId[]>> {
  const validated = validateDeck(deck);
  const mutable: Record<Seat, CardId[]> = { north: [], east: [], south: [], west: [] };
  const firstRecipient = nextSeat(dealer);

  validated.forEach((cardId, index) => {
    mutable[nextSeat(firstRecipient, index)].push(cardId);
  });

  return Object.freeze(Object.fromEntries(SEATS.map((seat) => [
    seat,
    Object.freeze(mutable[seat].sort(compareCardsForHand)),
  ])) as Record<Seat, readonly CardId[]>);
}

function seededRandom(seed: string): () => number {
  let value = hashSeed(seed);
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result;
    return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function hashSeed(seed: string): number {
  let hash = 1_779_033_703 ^ seed.length;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 3_432_918_353);
    hash = hash << 13 | hash >>> 19;
  }
  hash = Math.imul(hash ^ (hash >>> 16), 2_246_822_507);
  hash = Math.imul(hash ^ (hash >>> 13), 3_266_489_909);
  return (hash ^ (hash >>> 16)) >>> 0;
}

function secureRandom(): number {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const value = new Uint32Array(1);
    globalThis.crypto.getRandomValues(value);
    return value[0] / 4_294_967_296;
  }
  return Math.random();
}

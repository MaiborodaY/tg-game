import {
  SHEDDING_RANKS,
  SHEDDING_SUITS,
  type SheddingCard,
  type SheddingCardId,
  type SheddingRank,
  type SheddingSuit,
} from "./types.ts";

const SUIT_CODES: Readonly<Record<SheddingSuit, string>> = Object.freeze({
  clubs: "C",
  diamonds: "D",
  hearts: "H",
  spades: "S",
});

const CODE_SUITS: Readonly<Record<string, SheddingSuit>> = Object.freeze({
  C: "clubs",
  D: "diamonds",
  H: "hearts",
  S: "spades",
});

const RANK_CODES: Readonly<Record<SheddingRank, string>> = Object.freeze({
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "T",
  11: "J",
  12: "Q",
  13: "K",
  14: "A",
});

const CODE_RANKS: Readonly<Record<string, SheddingRank>> = Object.freeze({
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
});

export const SHEDDING_DECK: readonly SheddingCardId[] = Object.freeze(
  SHEDDING_SUITS.flatMap((suit) => SHEDDING_RANKS.map((rank) => `${SUIT_CODES[suit]}${RANK_CODES[rank]}`)),
);

export function createSheddingDeck(): SheddingCardId[] {
  return [...SHEDDING_DECK];
}

export function getSheddingCard(cardId: SheddingCardId): SheddingCard {
  if (typeof cardId !== "string" || cardId.length !== 2) {
    throw new Error(`Unknown shedding card: ${String(cardId)}`);
  }
  const suit = CODE_SUITS[cardId[0]?.toUpperCase()];
  const rank = CODE_RANKS[cardId[1]?.toUpperCase()];
  if (!suit || !rank) throw new Error(`Unknown shedding card: ${cardId}`);
  return Object.freeze({ id: `${SUIT_CODES[suit]}${RANK_CODES[rank]}`, suit, rank });
}

export function validateSheddingDeck(deck: readonly SheddingCardId[]): SheddingCardId[] {
  if (deck.length !== SHEDDING_DECK.length) {
    throw new Error(`A shedding Bridge deck must contain exactly ${SHEDDING_DECK.length} cards.`);
  }
  const normalized = deck.map((cardId) => getSheddingCard(cardId).id);
  if (new Set(normalized).size !== SHEDDING_DECK.length || normalized.some((cardId) => !SHEDDING_DECK.includes(cardId))) {
    throw new Error("A shedding Bridge deck must contain every card from six through ace exactly once.");
  }
  return normalized;
}

export function shuffleSheddingDeck(
  deck: readonly SheddingCardId[] = SHEDDING_DECK,
  seed: string | number = createRandomSeed(),
): SheddingCardId[] {
  const shuffled = validateSheddingDeck(deck);
  const random = seededRandom(String(seed));
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

export function getSheddingCardPoints(cardId: SheddingCardId): number {
  const { rank } = getSheddingCard(cardId);
  if (rank === 14) return 15;
  if (rank === 11) return 20;
  if (rank >= 10) return 10;
  return 0;
}

export function scoreSheddingHand(cardIds: readonly SheddingCardId[]): number {
  return cardIds.reduce((total, cardId) => total + getSheddingCardPoints(cardId), 0);
}

export function compareSheddingCards(leftId: SheddingCardId, rightId: SheddingCardId): number {
  const left = getSheddingCard(leftId);
  const right = getSheddingCard(rightId);
  return SHEDDING_SUITS.indexOf(left.suit) - SHEDDING_SUITS.indexOf(right.suit) || left.rank - right.rank;
}

export function createRandomSeed(): string {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const values = globalThis.crypto.getRandomValues(new Uint32Array(4));
    return Array.from(values, (value) => value.toString(36)).join("-");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
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

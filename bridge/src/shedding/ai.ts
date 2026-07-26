import { getSheddingCard, getSheddingCardPoints } from "./cards.ts";
import { SHEDDING_SUITS, type SheddingAction, type SheddingCardId, type SheddingSuit, type SheddingViewerSnapshot } from "./types.ts";

export function chooseSheddingBotAction(view: SheddingViewerSnapshot): SheddingAction | null {
  if (view.phase === "round_complete" && view.canStartNextRound) {
    return Object.freeze({ type: "next_round" });
  }
  if (view.phase !== "playing" || view.controller !== view.viewerSeat) return null;

  const hand = view.hands[view.viewerSeat] ?? [];
  const legal = new Set(view.legalCardIds);
  const groups = groupPlayableRanks(hand, legal);
  if (groups.length === 0) return Object.freeze({ type: "draw_card" });

  const topRank = getSheddingCard(view.topCard).rank;
  groups.sort((left, right) => (
    scoreGroup(right, hand.length, topRank, view.topRankCount)
    - scoreGroup(left, hand.length, topRank, view.topRankCount)
  ));
  const cardIds = groups[0];
  const rank = getSheddingCard(cardIds[0]).rank;
  const remaining = hand.filter((cardId) => !cardIds.includes(cardId));
  const declaredSuit = rank === 11 ? chooseDeclaredSuit(remaining) : undefined;
  return Object.freeze({
    type: "play_cards",
    cardIds: Object.freeze([...cardIds]),
    ...(declaredSuit ? { declaredSuit } : {}),
  });
}

function groupPlayableRanks(hand: readonly SheddingCardId[], legal: ReadonlySet<SheddingCardId>): SheddingCardId[][] {
  const groups = new Map<number, SheddingCardId[]>();
  hand.forEach((cardId) => {
    const rank = getSheddingCard(cardId).rank;
    const group = groups.get(rank) ?? [];
    group.push(cardId);
    groups.set(rank, group);
  });

  return Array.from(groups.values())
    .filter((group) => group.some((cardId) => legal.has(cardId)))
    .map((group) => {
      const legalLead = group.find((cardId) => legal.has(cardId)) as SheddingCardId;
      return [legalLead, ...group.filter((cardId) => cardId !== legalLead)];
    });
}

function scoreGroup(
  cardIds: readonly SheddingCardId[],
  handSize: number,
  topRank: number,
  topRankCount: number,
): number {
  const rank = getSheddingCard(cardIds[0]).rank;
  const emptiesHand = cardIds.length === handSize && rank !== 6;
  const makesFourOfAKind = rank === topRank && topRankCount + cardIds.length >= 4;
  const effect = rank === 8 ? 42 : rank === 6 || rank === 14 ? 30 : rank === 7 ? 22 : rank === 11 ? 14 : 0;
  return (makesFourOfAKind ? 20_000 : 0)
    + (emptiesHand ? 10_000 : 0)
    + cardIds.length * 120
    + cardIds.reduce((total, cardId) => total + getSheddingCardPoints(cardId), 0)
    + effect;
}

function chooseDeclaredSuit(cards: readonly SheddingCardId[]): SheddingSuit {
  const counts = Object.fromEntries(SHEDDING_SUITS.map((suit) => [suit, 0])) as Record<SheddingSuit, number>;
  cards.forEach((cardId) => {
    const card = getSheddingCard(cardId);
    if (card.rank !== 11) counts[card.suit] += 1;
  });
  return [...SHEDDING_SUITS].sort((left, right) => counts[right] - counts[left])[0];
}

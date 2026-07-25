import {
  SUITS,
  cardBeats,
  getCard,
  partnershipOf,
  type CardId,
  type CardPlay,
  type Strain,
  type ViewerSnapshot,
} from "../game/index.ts";

export function chooseAiCard(snapshot: ViewerSnapshot): CardId | null {
  if (snapshot.phase !== "play" || snapshot.controller !== snapshot.viewerSeat || !snapshot.currentSeat) return null;
  const legal = snapshot.legalCardIds;
  if (legal.length === 0) return null;
  const currentPlays = snapshot.currentTrick?.plays ?? [];
  if (currentPlays.length === 0) return chooseLead(legal, snapshot.contract?.strain ?? "notrump");

  const winner = currentWinner(currentPlays, snapshot.contract?.strain ?? "notrump");
  if (partnershipOf(winner.seat) === partnershipOf(snapshot.currentSeat)) return lowestCard(legal);

  const leadSuit = getCard(currentPlays[0].cardId).suit;
  const winningCards = legal.filter((cardId) => cardBeats(cardId, winner.cardId, leadSuit, snapshot.contract?.strain ?? "notrump"));
  return winningCards.length > 0 ? lowestCard(winningCards) : lowestCard(legal);
}

function chooseLead(legal: readonly CardId[], strain: Strain): CardId {
  const nonTrump = strain === "notrump" ? legal : legal.filter((cardId) => getCard(cardId).suit !== strain);
  const candidates = nonTrump.length > 0 ? nonTrump : legal;
  const counts = new Map<string, number>();
  candidates.forEach((cardId) => counts.set(getCard(cardId).suit, (counts.get(getCard(cardId).suit) ?? 0) + 1));
  const longestSuit = SUITS.reduce((best, suit) => {
    const count = counts.get(suit) ?? 0;
    const bestCount = counts.get(best) ?? 0;
    return count > bestCount || (count === bestCount && SUITS.indexOf(suit) > SUITS.indexOf(best)) ? suit : best;
  });
  const suitCards = candidates.filter((cardId) => getCard(cardId).suit === longestSuit).sort(compareLowToHigh);
  if (suitCards.length >= 4) return [...suitCards].sort(compareHighToLow)[3];
  return suitCards[0] ?? lowestCard(candidates);
}

function currentWinner(plays: readonly CardPlay[], strain: Strain): CardPlay {
  const leadSuit = getCard(plays[0].cardId).suit;
  return plays.slice(1).reduce((winner, challenger) => (
    cardBeats(challenger.cardId, winner.cardId, leadSuit, strain)
      ? challenger
      : winner
  ), plays[0]);
}

function lowestCard(cards: readonly CardId[]): CardId {
  return [...cards].sort(compareLowToHigh)[0];
}

function compareLowToHigh(leftId: CardId, rightId: CardId): number {
  const left = getCard(leftId);
  const right = getCard(rightId);
  return left.rank - right.rank || SUITS.indexOf(left.suit) - SUITS.indexOf(right.suit);
}

function compareHighToLow(leftId: CardId, rightId: CardId): number {
  return -compareLowToHigh(leftId, rightId);
}

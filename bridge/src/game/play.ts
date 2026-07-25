import { getCard } from "./cards.ts";
import type { CardId, CardPlay, Contract, Seat, Strain, Suit } from "./types.ts";

export function getLegalCardsForTrick(
  hand: readonly CardId[],
  plays: readonly CardPlay[],
): readonly CardId[] {
  if (plays.length === 0) return Object.freeze([...hand]);
  const leadSuit = getCard(plays[0].cardId).suit;
  const following = hand.filter((cardId) => getCard(cardId).suit === leadSuit);
  return Object.freeze(following.length > 0 ? following : [...hand]);
}

export function getTrickWinner(plays: readonly CardPlay[], contract: Pick<Contract, "strain">): Seat {
  if (plays.length !== 4) throw new Error("A completed bridge trick must contain four cards.");
  const leadSuit = getCard(plays[0].cardId).suit;
  let winner = plays[0];
  for (const play of plays.slice(1)) {
    if (cardBeats(play.cardId, winner.cardId, leadSuit, contract.strain)) winner = play;
  }
  return winner.seat;
}

export function cardBeats(challengerId: CardId, incumbentId: CardId, leadSuit: Suit, strain: Strain): boolean {
  const challenger = getCard(challengerId);
  const incumbent = getCard(incumbentId);
  const trump = strain === "notrump" ? null : strain;

  if (trump) {
    if (challenger.suit === trump && incumbent.suit !== trump) return true;
    if (challenger.suit !== trump && incumbent.suit === trump) return false;
  }
  if (challenger.suit === incumbent.suit) return challenger.rank > incumbent.rank;
  if (challenger.suit === leadSuit && incumbent.suit !== leadSuit) return true;
  return false;
}

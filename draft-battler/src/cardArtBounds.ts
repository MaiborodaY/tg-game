import generatedBounds from "./card-art-bounds.json" with { type: "json" };
import type { CardId } from "./game/types";

export interface CardArtBounds {
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

// The viewBox follows the visible silhouette, not the transparent authoring canvas.
// A complete typed record makes new cards require bounds before they can ship.
const cardArtBounds: Readonly<Record<CardId, CardArtBounds>> = generatedBounds;

export function getCardArtBounds(cardId: CardId): CardArtBounds {
  return cardArtBounds[cardId];
}

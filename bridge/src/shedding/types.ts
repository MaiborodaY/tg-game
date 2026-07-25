export const SHEDDING_SEATS = ["south", "west"] as const;
export const SHEDDING_SUITS = ["clubs", "diamonds", "hearts", "spades"] as const;
export const SHEDDING_RANKS = [6, 7, 8, 9, 10, 11, 12, 13, 14] as const;

export type SheddingSeat = (typeof SHEDDING_SEATS)[number];
export type SheddingSuit = (typeof SHEDDING_SUITS)[number];
export type SheddingRank = (typeof SHEDDING_RANKS)[number];
export type SheddingCardId = string;

export interface SheddingCard {
  readonly id: SheddingCardId;
  readonly suit: SheddingSuit;
  readonly rank: SheddingRank;
}

export type SheddingPhase = "playing" | "round_complete" | "match_complete";

export type SheddingAction =
  | Readonly<{
      type: "play_cards";
      cardIds: readonly SheddingCardId[];
      declaredSuit?: SheddingSuit;
    }>
  | Readonly<{ type: "draw_card" }>
  | Readonly<{ type: "next_round" }>;

export type SheddingLastAction =
  | Readonly<{
      type: "play_cards";
      seat: SheddingSeat;
      cardIds: readonly SheddingCardId[];
      declaredSuit: SheddingSuit | null;
      penaltyCards: number;
      skippedOpponent: boolean;
    }>
  | Readonly<{
      type: "draw_card";
      seat: SheddingSeat;
      count: number;
    }>;

export interface SheddingRoundResult {
  readonly round: number;
  readonly winner: SheddingSeat;
  readonly loser: SheddingSeat;
  readonly points: number;
  readonly loserCards: readonly SheddingCardId[];
  readonly scores: Readonly<Record<SheddingSeat, number>>;
}

export interface SheddingGameState {
  readonly version: 2;
  readonly revision: number;
  readonly round: number;
  readonly targetScore: number;
  readonly phase: SheddingPhase;
  readonly dealer: SheddingSeat;
  readonly currentSeat: SheddingSeat | null;
  readonly scores: Readonly<Record<SheddingSeat, number>>;
  readonly hands: Readonly<Record<SheddingSeat, readonly SheddingCardId[]>>;
  readonly drawPile: readonly SheddingCardId[];
  readonly discardPile: readonly SheddingCardId[];
  readonly declaredSuit: SheddingSuit | null;
  readonly recycleCount: number;
  readonly lastAction: SheddingLastAction | null;
  readonly roundResult: SheddingRoundResult | null;
  readonly matchWinner: SheddingSeat | null;
  /** Private deterministic shuffle material. Never expose it in a viewer snapshot. */
  readonly matchSeed: string;
}

export interface CreateSheddingGameOptions {
  readonly seed?: string | number;
  readonly dealer?: SheddingSeat;
  readonly targetScore?: number;
  readonly deck?: readonly SheddingCardId[];
}

export interface SheddingViewerSnapshot {
  readonly version: 2;
  readonly revision: number;
  readonly round: number;
  readonly targetScore: number;
  readonly phase: SheddingPhase;
  readonly viewerSeat: SheddingSeat;
  readonly dealer: SheddingSeat;
  readonly currentSeat: SheddingSeat | null;
  readonly controller: SheddingSeat | null;
  readonly scores: Readonly<Record<SheddingSeat, number>>;
  readonly hands: Readonly<Partial<Record<SheddingSeat, readonly SheddingCardId[]>>>;
  readonly handCounts: Readonly<Record<SheddingSeat, number>>;
  readonly topCard: SheddingCardId;
  readonly declaredSuit: SheddingSuit | null;
  readonly drawCount: number;
  readonly discardCount: number;
  readonly recycleCount: number;
  readonly lastAction: SheddingLastAction | null;
  readonly roundResult: SheddingRoundResult | null;
  readonly matchWinner: SheddingSeat | null;
  readonly legalCardIds: readonly SheddingCardId[];
  readonly canDraw: boolean;
  readonly canStartNextRound: boolean;
}

export class SheddingRuleError extends Error {
  readonly code: string;

  constructor(code: string, message = code) {
    super(message);
    this.name = "SheddingRuleError";
    this.code = code;
  }
}

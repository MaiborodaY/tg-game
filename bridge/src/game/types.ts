export const SEATS = ["north", "east", "south", "west"] as const;
export const SUITS = ["clubs", "diamonds", "hearts", "spades"] as const;
export const STRAINS = ["clubs", "diamonds", "hearts", "spades", "notrump"] as const;
export const BID_LEVELS = [1, 2, 3, 4, 5, 6, 7] as const;

export type Seat = (typeof SEATS)[number];
export type Partnership = "ns" | "ew";
export type Suit = (typeof SUITS)[number];
export type Strain = (typeof STRAINS)[number];
export type BidLevel = (typeof BID_LEVELS)[number];
export type Vulnerability = "none" | "ns" | "ew" | "both";
export type CardId = string;

export interface Card {
  readonly id: CardId;
  readonly suit: Suit;
  readonly rank: number;
}

export type Call =
  | Readonly<{ type: "pass" }>
  | Readonly<{ type: "double" }>
  | Readonly<{ type: "redouble" }>
  | Readonly<{ type: "bid"; level: BidLevel; strain: Strain }>;

export interface AuctionEntry {
  readonly seat: Seat;
  readonly call: Call;
}

export interface Contract {
  readonly level: BidLevel;
  readonly strain: Strain;
  /** 0 = undoubled, 1 = doubled, 2 = redoubled. */
  readonly doubled: 0 | 1 | 2;
  readonly declarer: Seat;
  readonly dummy: Seat;
  readonly openingLeader: Seat;
  readonly declaringSide: Partnership;
}

export interface CardPlay {
  readonly seat: Seat;
  readonly cardId: CardId;
}

export interface TrickInProgress {
  readonly index: number;
  readonly leader: Seat;
  readonly plays: readonly CardPlay[];
}

export interface CompletedTrick extends TrickInProgress {
  readonly winner: Seat;
}

export interface DuplicateScoreBreakdown {
  /** Signed total from the declaring partnership's point of view. */
  readonly total: number;
  readonly made: boolean;
  readonly contractPoints: number;
  readonly overtrickPoints: number;
  readonly insultBonus: number;
  readonly gameOrPartscoreBonus: number;
  readonly slamBonus: number;
  readonly undertrickPenalty: number;
}

export type BridgeResult =
  | Readonly<{ type: "passed_out"; scoreNS: 0 }>
  | Readonly<{
      type: "contract";
      contract: Contract;
      declarerTricks: number;
      defenderTricks: number;
      made: boolean;
      scoreNS: number;
      breakdown: DuplicateScoreBreakdown;
    }>;

export type BridgePhase = "auction" | "play" | "complete";

export interface BridgeGameState {
  readonly version: 1;
  readonly revision: number;
  readonly boardNumber: number;
  readonly phase: BridgePhase;
  readonly dealer: Seat;
  readonly vulnerability: Vulnerability;
  readonly currentSeat: Seat | null;
  readonly auction: readonly AuctionEntry[];
  readonly contract: Contract | null;
  readonly hands: Readonly<Record<Seat, readonly CardId[]>>;
  readonly currentTrick: TrickInProgress | null;
  readonly completedTricks: readonly CompletedTrick[];
  readonly tricksWon: Readonly<Record<Partnership, number>>;
  readonly openingLeadPlayed: boolean;
  readonly result: BridgeResult | null;
  /** Private deal material. Never copy these fields into a viewer snapshot. */
  readonly seed: string | null;
  readonly deckOrder: readonly CardId[];
}

export interface CreateGameOptions {
  readonly seed?: string | number;
  readonly random?: () => number;
  readonly deck?: readonly CardId[];
  readonly boardNumber?: number;
  readonly dealer?: Seat;
  readonly vulnerability?: Vulnerability;
}

export interface ViewerSnapshot {
  readonly version: 1;
  readonly revision: number;
  readonly boardNumber: number;
  readonly phase: BridgePhase;
  readonly viewerSeat: Seat;
  readonly dealer: Seat;
  readonly vulnerability: Vulnerability;
  readonly currentSeat: Seat | null;
  readonly controller: Seat | null;
  readonly auction: readonly AuctionEntry[];
  readonly contract: Contract | null;
  /** Hidden hands are absent. All four hands appear only after completion. */
  readonly hands: Readonly<Partial<Record<Seat, readonly CardId[]>>>;
  readonly handCounts: Readonly<Record<Seat, number>>;
  readonly currentTrick: TrickInProgress | null;
  readonly completedTricks: readonly CompletedTrick[];
  readonly tricksWon: Readonly<Record<Partnership, number>>;
  readonly openingLeadPlayed: boolean;
  readonly result: BridgeResult | null;
  /** Populated only when viewerSeat is the current controller. */
  readonly legalCalls: readonly Call[];
  /** Populated only when viewerSeat is the current controller. */
  readonly legalCardIds: readonly CardId[];
}

export type BridgeAction =
  | Readonly<{ type: "call"; call: Call }>
  | Readonly<{ type: "play_card"; cardId: CardId }>;

export class BridgeRuleError extends Error {
  readonly code: string;

  constructor(code: string, message = code) {
    super(message);
    this.name = "BridgeRuleError";
    this.code = code;
  }
}

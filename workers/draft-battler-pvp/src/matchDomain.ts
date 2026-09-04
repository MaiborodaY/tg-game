import {
  MAX_RUN_ROUNDS,
  PLAYER_STARTING_HP,
  type BoardSlot,
  type CardId,
  type CombatResult,
  type DraftOption,
} from "../../../draft-battler/src/game/types";
import { applyDraftPlacement } from "../../../draft-battler/src/game/placement";
import {
  createDraftOptions,
  createEmptyBoardSlots,
  isCardAllowedInSlot,
} from "../../../draft-battler/src/game/draft";
import { resolveCombat } from "../../../draft-battler/src/game/combat";
import { getMatchCastleDamage } from "./combatHp";
import type { RankingSettlementStatus } from "./ranking";
import type { TelegramPlayerIdentity } from "./telegramAuth";

export const RULESET_VERSION = "draft-battler-pvp-v4";
export const MATCH_SCHEMA_VERSION = 1;
export const ROOM_SCHEMA_VERSION = 1;
export const MATCH_MAX_ROUNDS = MAX_RUN_ROUNDS;
export const ACTIVE_MATCH_TTL_MS = 30 * 60 * 1000;
export const FINISHED_MATCH_TTL_MS = 15 * 60 * 1000;
export const ROOM_TTL_MS = 2 * 60 * 60 * 1000;
export const DISCONNECT_GRACE_MS = 90 * 1000;

export type PlayerRole = "host" | "guest";
export type MatchPhase = "draft" | "battle" | "finished";
export type MatchWinner = PlayerRole | "draw";
export type MatchOutcomeReason = "castle" | "round_limit" | "forfeit" | "disconnect" | "expired";

export interface MatchOutcome {
  winner: MatchWinner;
  reason: MatchOutcomeReason;
  finishedAt: number;
  forfeitedRole?: PlayerRole;
}

export interface MatchCombatSnapshot {
  round: number;
  hostSlots: BoardSlot[];
  guestSlots: BoardSlot[];
  combat: CombatResult;
  hostHpBefore: number;
  hostHpAfter: number;
  guestHpBefore: number;
  guestHpAfter: number;
}

export interface MatchPlayerState {
  boardSlots: BoardSlot[];
  draftOptions: DraftOption[];
  draftRerollCount: 0 | 1;
  pendingBoardSlots?: BoardSlot[];
  pickedCardId?: CardId;
  locked: boolean;
  nextRoundReady: boolean;
  rematchReady: boolean;
}

export interface MatchState {
  schemaVersion: typeof MATCH_SCHEMA_VERSION;
  rulesetVersion: typeof RULESET_VERSION;
  matchId: string;
  seed: string;
  round: number;
  phase: MatchPhase;
  hostHp: number;
  guestHp: number;
  players: Record<PlayerRole, MatchPlayerState>;
  combat?: MatchCombatSnapshot;
  outcome?: MatchOutcome;
  rankingStatus?: RankingSettlementStatus | "pending";
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

interface MatchIntentBase {
  matchId: string;
  round: number;
}

export type MatchIntent =
  | (MatchIntentBase & {
    type: "pick";
    cardId: CardId;
    targetSlotIndex: number;
    allowReplacement: boolean;
  })
  | (MatchIntentBase & { type: "move"; sourceSlotIndex: number; targetSlotIndex: number })
  | (MatchIntentBase & { type: "reroll" })
  | (MatchIntentBase & { type: "lock" })
  | (MatchIntentBase & { type: "next_ready" })
  | (MatchIntentBase & { type: "rematch" })
  | (MatchIntentBase & { type: "forfeit" });

export type MatchDomainErrorCode =
  | "stale_match"
  | "stale_round"
  | "wrong_phase"
  | "match_finished"
  | "player_locked"
  | "card_not_offered"
  | "card_already_picked"
  | "invalid_placement"
  | "replacement_confirmation_required"
  | "reroll_unavailable"
  | "invalid_move"
  | "empty_board"
  | "already_locked"
  | "already_ready"
  | "not_finished"
  | "rematch_not_ready"
  | "room_full"
  | "same_player"
  | "invalid_seat";

export class MatchDomainError extends Error {
  readonly code: MatchDomainErrorCode;

  constructor(code: MatchDomainErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "MatchDomainError";
  }
}

export type MatchEvent =
  | { type: "picked"; role: PlayerRole; cardId: CardId; targetSlotIndex: number }
  | { type: "moved"; role: PlayerRole; sourceSlotIndex: number; targetSlotIndex: number }
  | { type: "rerolled"; role: PlayerRole }
  | { type: "locked"; role: PlayerRole }
  | { type: "battle_resolved"; round: number }
  | { type: "next_ready"; role: PlayerRole }
  | { type: "round_started"; round: number }
  | { type: "rematch_ready"; role: PlayerRole }
  | { type: "finished"; outcome: MatchOutcome };

export interface ApplyMatchIntentResult {
  state: MatchState;
  event: MatchEvent;
}

export interface CreateMatchInput {
  matchId: string;
  seed: string;
  now: number;
}

export interface PlayerMatchSnapshot {
  rulesetVersion: typeof RULESET_VERSION;
  matchId: string;
  round: number;
  phase: MatchPhase;
  hostHp: number;
  guestHp: number;
  self: {
    role: PlayerRole;
    boardSlots: BoardSlot[];
    draftOptions: DraftOption[];
    draftRerollCount: 0 | 1;
    pendingBoardSlots?: BoardSlot[];
    pickedCardId?: CardId;
    locked: boolean;
    nextRoundReady: boolean;
    rematchReady: boolean;
  };
  opponent: {
    role: PlayerRole;
    locked: boolean;
    nextRoundReady: boolean;
    rematchReady: boolean;
    boardSlots?: BoardSlot[];
  };
  combat?: MatchCombatSnapshot;
  outcome?: MatchOutcome;
  expiresAt: number;
  serverNow: number;
}

export function createMatch(input: CreateMatchInput): MatchState {
  return {
    schemaVersion: MATCH_SCHEMA_VERSION,
    rulesetVersion: RULESET_VERSION,
    matchId: input.matchId,
    seed: input.seed,
    round: 1,
    phase: "draft",
    hostHp: PLAYER_STARTING_HP,
    guestHp: PLAYER_STARTING_HP,
    players: {
      host: createRoundPlayerState(input.seed, "host", 1, createEmptyBoardSlots()),
      guest: createRoundPlayerState(input.seed, "guest", 1, createEmptyBoardSlots()),
    },
    createdAt: input.now,
    updatedAt: input.now,
    expiresAt: input.now + ACTIVE_MATCH_TTL_MS,
  };
}

export function applyMatchIntent(
  current: MatchState,
  role: PlayerRole,
  intent: MatchIntent,
  now: number,
): ApplyMatchIntentResult {
  assertCurrentIntent(current, intent);

  if (intent.type === "forfeit") {
    assertNotFinished(current);
    const state = finishMatch(current, oppositeRole(role), "forfeit", now, role);
    return { state, event: { type: "finished", outcome: state.outcome! } };
  }

  if (intent.type === "rematch") {
    if (current.phase !== "finished") {
      throw new MatchDomainError("not_finished", "Rematch is only available after a finished match.");
    }
    const state = cloneMatch(current);
    state.players[role].rematchReady = true;
    touchMatch(state, now, true);
    return { state, event: { type: "rematch_ready", role } };
  }

  assertNotFinished(current);
  if (intent.type === "next_ready") {
    return applyNextReady(current, role, now);
  }

  if (current.phase !== "draft") {
    throw new MatchDomainError("wrong_phase", "Draft actions are only accepted during the draft phase.");
  }

  const player = current.players[role];
  if (player.locked) {
    throw new MatchDomainError("player_locked", "The player has already locked this round.");
  }

  if (intent.type === "pick") {
    return applyPick(current, role, intent, now);
  }
  if (intent.type === "move") {
    return applyMove(current, role, intent, now);
  }
  if (intent.type === "reroll") {
    return applyReroll(current, role, now);
  }

  return applyLock(current, role, now);
}

export function createPlayerMatchSnapshot(
  state: MatchState,
  viewerRole: PlayerRole,
  serverNow = state.updatedAt,
): PlayerMatchSnapshot {
  const self = state.players[viewerRole];
  const opponentRole = oppositeRole(viewerRole);
  const opponent = state.players[opponentRole];
  const revealOpponentBoard = state.phase === "battle" || state.phase === "finished";

  return {
    rulesetVersion: state.rulesetVersion,
    matchId: state.matchId,
    round: state.round,
    phase: state.phase,
    hostHp: state.hostHp,
    guestHp: state.guestHp,
    self: {
      role: viewerRole,
      boardSlots: cloneSlots(self.boardSlots),
      draftOptions: cloneOptions(self.draftOptions),
      draftRerollCount: self.draftRerollCount,
      pendingBoardSlots: self.pendingBoardSlots ? cloneSlots(self.pendingBoardSlots) : undefined,
      pickedCardId: self.pickedCardId,
      locked: self.locked,
      nextRoundReady: self.nextRoundReady,
      rematchReady: self.rematchReady,
    },
    opponent: {
      role: opponentRole,
      locked: opponent.locked,
      nextRoundReady: opponent.nextRoundReady,
      rematchReady: opponent.rematchReady,
      boardSlots: revealOpponentBoard ? cloneSlots(opponent.boardSlots) : undefined,
    },
    combat: state.combat ? cloneCombat(state.combat) : undefined,
    outcome: state.outcome ? { ...state.outcome } : undefined,
    expiresAt: state.expiresAt,
    serverNow,
  };
}

export function isRematchReady(state: MatchState): boolean {
  return state.phase === "finished" && state.players.host.rematchReady && state.players.guest.rematchReady;
}

export function startRematch(state: MatchState, input: CreateMatchInput): MatchState {
  if (!isRematchReady(state)) {
    throw new MatchDomainError("rematch_not_ready", "Both players must accept the rematch.");
  }
  return createMatch(input);
}

export function isMatchExpired(state: MatchState, now: number): boolean {
  return now >= state.expiresAt;
}

export function expireMatch(state: MatchState, now: number): MatchState {
  if (!isMatchExpired(state, now) || state.phase === "finished") {
    return cloneMatch(state);
  }
  return finishMatch(state, "draw", "expired", now);
}

export function forfeitDisconnectedPlayer(state: MatchState, role: PlayerRole, now: number): MatchState {
  if (state.phase === "finished") {
    return cloneMatch(state);
  }
  return finishMatch(state, oppositeRole(role), "disconnect", now, role);
}

function applyPick(
  current: MatchState,
  role: PlayerRole,
  intent: Extract<MatchIntent, { type: "pick" }>,
  now: number,
): ApplyMatchIntentResult {
  const currentPlayer = current.players[role];
  if (currentPlayer.pickedCardId) {
    throw new MatchDomainError("card_already_picked", "Only one card may be picked per round.");
  }
  if (!currentPlayer.draftOptions.some((option) => option.cardId === intent.cardId)) {
    throw new MatchDomainError("card_not_offered", "The selected card is not in this player's server offer.");
  }

  const source = currentPlayer.pendingBoardSlots ?? currentPlayer.boardSlots;
  const result = applyDraftPlacement(source, intent.cardId, intent.targetSlotIndex, {
    allowReplacement: intent.allowReplacement,
  });
  if (result.classification.kind === "replace" && !intent.allowReplacement) {
    throw new MatchDomainError("replacement_confirmation_required", "Replacing a unit requires confirmation.");
  }
  if (!result.applied) {
    throw new MatchDomainError("invalid_placement", `Illegal card placement: ${result.classification.kind === "invalid" ? result.classification.reason : "rejected"}.`);
  }

  const state = cloneMatch(current);
  state.players[role].pendingBoardSlots = result.boardSlots;
  state.players[role].pickedCardId = intent.cardId;
  touchMatch(state, now);
  return {
    state,
    event: { type: "picked", role, cardId: intent.cardId, targetSlotIndex: intent.targetSlotIndex },
  };
}

function applyMove(
  current: MatchState,
  role: PlayerRole,
  intent: Extract<MatchIntent, { type: "move" }>,
  now: number,
): ApplyMatchIntentResult {
  const player = current.players[role];
  const slots = cloneSlots(player.pendingBoardSlots ?? player.boardSlots);
  if (!isSlotIndex(intent.sourceSlotIndex) || !isSlotIndex(intent.targetSlotIndex) || intent.sourceSlotIndex === intent.targetSlotIndex) {
    throw new MatchDomainError("invalid_move", "Move slot indices are invalid.");
  }

  const source = slots[intent.sourceSlotIndex];
  const target = slots[intent.targetSlotIndex];
  if (!source.cardId) {
    throw new MatchDomainError("invalid_move", "The source slot is empty.");
  }

  const sourceCardId = source.cardId;
  const sourceUpgrade = source.upgradeLevel;
  const targetCardId = target.cardId;
  const targetUpgrade = target.upgradeLevel;
  if (!isCardAllowedInSlot(sourceCardId, target.slotIndex) || (targetCardId && !isCardAllowedInSlot(targetCardId, source.slotIndex))) {
    throw new MatchDomainError("invalid_move", "A moved card would be placed in an illegal row.");
  }

  target.cardId = sourceCardId;
  target.upgradeLevel = sourceUpgrade;
  source.cardId = targetCardId;
  source.upgradeLevel = targetCardId ? targetUpgrade : 0;

  const state = cloneMatch(current);
  state.players[role].pendingBoardSlots = slots;
  touchMatch(state, now);
  return {
    state,
    event: { type: "moved", role, sourceSlotIndex: intent.sourceSlotIndex, targetSlotIndex: intent.targetSlotIndex },
  };
}

function applyReroll(current: MatchState, role: PlayerRole, now: number): ApplyMatchIntentResult {
  const player = current.players[role];
  if (player.draftRerollCount !== 0 || player.pickedCardId) {
    throw new MatchDomainError("reroll_unavailable", "This round's reroll is unavailable.");
  }

  const state = cloneMatch(current);
  const nextPlayer = state.players[role];
  nextPlayer.draftRerollCount = 1;
  nextPlayer.draftOptions = createRoleDraftOptions(state.seed, role, state.round, 1, player.boardSlots);
  touchMatch(state, now);
  return { state, event: { type: "rerolled", role } };
}

function applyLock(current: MatchState, role: PlayerRole, now: number): ApplyMatchIntentResult {
  const currentPlayer = current.players[role];
  if (currentPlayer.locked) {
    throw new MatchDomainError("already_locked", "The player's board is already locked.");
  }
  const board = currentPlayer.pendingBoardSlots ?? currentPlayer.boardSlots;
  if (!board.some((slot) => slot.cardId)) {
    throw new MatchDomainError("empty_board", "An empty army cannot be locked.");
  }

  const state = cloneMatch(current);
  state.players[role].boardSlots = cloneSlots(board);
  state.players[role].pendingBoardSlots = undefined;
  state.players[role].locked = true;
  touchMatch(state, now);
  if (!state.players.host.locked || !state.players.guest.locked) {
    return { state, event: { type: "locked", role } };
  }

  resolveLockedBoards(state, now);
  return state.phase === "finished"
    ? { state, event: { type: "finished", outcome: state.outcome! } }
    : { state, event: { type: "battle_resolved", round: state.round } };
}

function applyNextReady(current: MatchState, role: PlayerRole, now: number): ApplyMatchIntentResult {
  if (current.phase !== "battle") {
    throw new MatchDomainError("wrong_phase", "Next-round readiness is only accepted after battle.");
  }
  if (current.players[role].nextRoundReady) {
    throw new MatchDomainError("already_ready", "The player is already ready for the next round.");
  }

  const state = cloneMatch(current);
  state.players[role].nextRoundReady = true;
  touchMatch(state, now);
  if (!state.players.host.nextRoundReady || !state.players.guest.nextRoundReady) {
    return { state, event: { type: "next_ready", role } };
  }

  state.round += 1;
  state.phase = "draft";
  state.combat = undefined;
  state.players.host = createRoundPlayerState(state.seed, "host", state.round, state.players.host.boardSlots);
  state.players.guest = createRoundPlayerState(state.seed, "guest", state.round, state.players.guest.boardSlots);
  touchMatch(state, now);
  return { state, event: { type: "round_started", round: state.round } };
}

function resolveLockedBoards(state: MatchState, now: number): void {
  const hostHpBefore = state.hostHp;
  const guestHpBefore = state.guestHp;
  const combat = resolveCombat(state.players.host.boardSlots, state.players.guest.boardSlots, state.round);
  const damage = getMatchCastleDamage(combat);
  state.hostHp = Math.max(0, hostHpBefore - damage.hostHpLoss);
  state.guestHp = Math.max(0, guestHpBefore - damage.guestHpLoss);
  state.combat = {
    round: state.round,
    hostSlots: cloneSlots(state.players.host.boardSlots),
    guestSlots: cloneSlots(state.players.guest.boardSlots),
    combat,
    hostHpBefore,
    hostHpAfter: state.hostHp,
    guestHpBefore,
    guestHpAfter: state.guestHp,
  };

  const castleWinner = getCastleWinner(state.hostHp, state.guestHp);
  if (castleWinner !== undefined) {
    applyFinishedState(state, castleWinner, "castle", now);
    return;
  }
  if (state.round >= MATCH_MAX_ROUNDS) {
    applyFinishedState(state, getHpWinner(state.hostHp, state.guestHp), "round_limit", now);
    return;
  }

  state.phase = "battle";
  state.players.host.nextRoundReady = false;
  state.players.guest.nextRoundReady = false;
  touchMatch(state, now);
}

function finishMatch(
  current: MatchState,
  winner: MatchWinner,
  reason: MatchOutcomeReason,
  now: number,
  forfeitedRole?: PlayerRole,
): MatchState {
  const state = cloneMatch(current);
  applyFinishedState(state, winner, reason, now, forfeitedRole);
  return state;
}

function applyFinishedState(
  state: MatchState,
  winner: MatchWinner,
  reason: MatchOutcomeReason,
  now: number,
  forfeitedRole?: PlayerRole,
): void {
  state.phase = "finished";
  state.outcome = { winner, reason, finishedAt: now, forfeitedRole };
  state.updatedAt = now;
  state.expiresAt = now + FINISHED_MATCH_TTL_MS;
}

function createRoundPlayerState(
  seed: string,
  role: PlayerRole,
  round: number,
  boardSlots: readonly BoardSlot[],
): MatchPlayerState {
  return {
    boardSlots: cloneSlots(boardSlots),
    draftOptions: createRoleDraftOptions(seed, role, round, 0, boardSlots),
    draftRerollCount: 0,
    locked: false,
    nextRoundReady: false,
    rematchReady: false,
  };
}

function createRoleDraftOptions(
  seed: string,
  role: PlayerRole,
  round: number,
  rerollCount: number,
  incumbentSlots: readonly BoardSlot[],
): DraftOption[] {
  return createDraftOptions(`${seed}:pvp:${role}`, round, rerollCount, incumbentSlots);
}

function assertCurrentIntent(state: MatchState, intent: MatchIntent): void {
  if (intent.matchId !== state.matchId) {
    throw new MatchDomainError("stale_match", "The intent belongs to another match.");
  }
  if (intent.round !== state.round) {
    throw new MatchDomainError("stale_round", "The intent belongs to another round.");
  }
}

function assertNotFinished(state: MatchState): void {
  if (state.phase === "finished") {
    throw new MatchDomainError("match_finished", "The match is already finished.");
  }
}

function touchMatch(state: MatchState, now: number, finished = false): void {
  state.updatedAt = now;
  state.expiresAt = now + (finished || state.phase === "finished" ? FINISHED_MATCH_TTL_MS : ACTIVE_MATCH_TTL_MS);
}

function getCastleWinner(hostHp: number, guestHp: number): MatchWinner | undefined {
  if (hostHp <= 0 && guestHp <= 0) return "draw";
  if (hostHp <= 0) return "guest";
  if (guestHp <= 0) return "host";
  return undefined;
}

function getHpWinner(hostHp: number, guestHp: number): MatchWinner {
  if (hostHp === guestHp) return "draw";
  return hostHp > guestHp ? "host" : "guest";
}

function oppositeRole(role: PlayerRole): PlayerRole {
  return role === "host" ? "guest" : "host";
}

function isSlotIndex(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < createEmptyBoardSlots().length;
}

function cloneSlots(slots: readonly BoardSlot[]): BoardSlot[] {
  return slots.map((slot) => ({ ...slot }));
}

function cloneOptions(options: readonly DraftOption[]): DraftOption[] {
  return options.map((option) => ({ ...option }));
}

function cloneCombat(combat: MatchCombatSnapshot): MatchCombatSnapshot {
  return {
    ...combat,
    hostSlots: cloneSlots(combat.hostSlots),
    guestSlots: cloneSlots(combat.guestSlots),
    combat: structuredClone(combat.combat),
  };
}

function cloneMatch(state: MatchState): MatchState {
  return {
    ...state,
    players: {
      host: clonePlayer(state.players.host),
      guest: clonePlayer(state.players.guest),
    },
    combat: state.combat ? cloneCombat(state.combat) : undefined,
    outcome: state.outcome ? { ...state.outcome } : undefined,
  };
}

function clonePlayer(player: MatchPlayerState): MatchPlayerState {
  return {
    ...player,
    boardSlots: cloneSlots(player.boardSlots),
    draftOptions: cloneOptions(player.draftOptions),
    pendingBoardSlots: player.pendingBoardSlots ? cloneSlots(player.pendingBoardSlots) : undefined,
  };
}

export interface RoomSeatState {
  role: PlayerRole;
  tokenHash: string;
  connectionId: string;
  connected: boolean;
  ready: boolean;
  claimedAt: number;
  lastSeenAt: number;
  disconnectedAt?: number;
  disconnectDeadline?: number;
  identity?: TelegramPlayerIdentity;
}

export interface RoomState {
  schemaVersion: typeof ROOM_SCHEMA_VERSION;
  roomId: string;
  rulesetVersion: typeof RULESET_VERSION;
  seats: Partial<Record<PlayerRole, RoomSeatState>>;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

export function isCurrentRoomState(value: unknown): value is RoomState {
  return isRecord(value)
    && value.schemaVersion === ROOM_SCHEMA_VERSION
    && value.rulesetVersion === RULESET_VERSION;
}

export function isCurrentMatchState(value: unknown): value is MatchState {
  return isRecord(value)
    && value.schemaVersion === MATCH_SCHEMA_VERSION
    && value.rulesetVersion === RULESET_VERSION;
}

export interface ClaimSeatInput {
  presentedTokenHash?: string;
  issuedTokenHash: string;
  connectionId: string;
  now: number;
  identity?: TelegramPlayerIdentity;
}

export interface ClaimSeatResult {
  room: RoomState;
  role: PlayerRole;
  reconnected: boolean;
}

export interface SeatMutationInput {
  role: PlayerRole;
  tokenHash: string;
  connectionId: string;
  now: number;
}

export interface RoomSnapshot {
  roomId: string;
  rulesetVersion: typeof RULESET_VERSION;
  status: "waiting" | "ready" | "playing" | "finished";
  viewerRole?: PlayerRole;
  self?: RoomSnapshotSeat;
  opponent?: RoomSnapshotSeat;
  seats: RoomSnapshotSeat[];
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  serverNow: number;
}

export interface RoomSnapshotSeat {
  role: PlayerRole;
  claimed: boolean;
  connected: boolean;
  ready: boolean;
  disconnectDeadline?: number;
}

export function createRoom(input: { roomId: string; now: number }): RoomState {
  return {
    schemaVersion: ROOM_SCHEMA_VERSION,
    roomId: input.roomId,
    rulesetVersion: RULESET_VERSION,
    seats: {},
    createdAt: input.now,
    updatedAt: input.now,
    expiresAt: input.now + ROOM_TTL_MS,
  };
}

export function claimSeat(current: RoomState, input: ClaimSeatInput): ClaimSeatResult {
  const room = cloneRoom(current);
  const existingRole = input.presentedTokenHash
    ? (["host", "guest"] as const).find((role) => room.seats[role]?.tokenHash === input.presentedTokenHash)
    : undefined;
  if (existingRole) {
    const seat = room.seats[existingRole]!;
    if (input.identity && seat.identity && input.identity.userId !== seat.identity.userId) {
      throw new MatchDomainError("invalid_seat", "This room seat belongs to another Telegram player.");
    }
    seat.connectionId = input.connectionId;
    seat.connected = true;
    seat.lastSeenAt = input.now;
    seat.disconnectedAt = undefined;
    seat.disconnectDeadline = undefined;
    touchRoom(room, input.now);
    return { room, role: existingRole, reconnected: true };
  }

  const role = room.seats.host ? (room.seats.guest ? undefined : "guest") : "host";
  if (!role) {
    throw new MatchDomainError("room_full", "Both player seats are already claimed.");
  }
  if (input.identity && Object.values(room.seats).some((seat) => seat?.identity?.userId === input.identity?.userId)) {
    throw new MatchDomainError("same_player", "The same Telegram player cannot occupy both seats.");
  }
  room.seats[role] = {
    role,
    tokenHash: input.issuedTokenHash,
    connectionId: input.connectionId,
    connected: true,
    ready: false,
    claimedAt: input.now,
    lastSeenAt: input.now,
    identity: input.identity ? { ...input.identity } : undefined,
  };
  touchRoom(room, input.now);
  return { room, role, reconnected: false };
}

export function touchSeat(current: RoomState, input: SeatMutationInput): RoomState;
export function touchSeat(
  current: RoomState,
  role: PlayerRole,
  tokenHash: string,
  connectionId: string,
  now: number,
): RoomState;
export function touchSeat(
  current: RoomState,
  inputOrRole: SeatMutationInput | PlayerRole,
  tokenHash?: string,
  connectionId?: string,
  now?: number,
): RoomState {
  const input = readSeatMutationInput(inputOrRole, tokenHash, connectionId, now);
  const room = cloneRoom(current);
  const seat = requireSeat(room, input);
  seat.lastSeenAt = input.now;
  touchRoom(room, input.now);
  return room;
}

export function disconnectSeat(current: RoomState, input: SeatMutationInput): RoomState;
export function disconnectSeat(
  current: RoomState,
  role: PlayerRole,
  tokenHash: string,
  connectionId: string,
  now: number,
): RoomState;
export function disconnectSeat(
  current: RoomState,
  inputOrRole: SeatMutationInput | PlayerRole,
  tokenHash?: string,
  connectionId?: string,
  now?: number,
): RoomState {
  const input = readSeatMutationInput(inputOrRole, tokenHash, connectionId, now);
  const room = cloneRoom(current);
  const seat = room.seats[input.role];
  // A close event from a superseded socket must not disconnect the reconnected seat.
  if (!seat || seat.tokenHash !== input.tokenHash || seat.connectionId !== input.connectionId) {
    return room;
  }
  seat.connected = false;
  seat.ready = false;
  seat.lastSeenAt = input.now;
  seat.disconnectedAt = input.now;
  seat.disconnectDeadline = input.now + DISCONNECT_GRACE_MS;
  touchRoom(room, input.now);
  return room;
}

export function setSeatReady(
  current: RoomState,
  input: SeatMutationInput & { ready: boolean },
): RoomState {
  const room = cloneRoom(current);
  const seat = requireSeat(room, input);
  if (!seat.connected) {
    throw new MatchDomainError("invalid_seat", "A disconnected seat cannot become ready.");
  }
  seat.ready = input.ready;
  seat.lastSeenAt = input.now;
  touchRoom(room, input.now);
  return room;
}

export function areSeatsReady(room: RoomState): boolean {
  return Boolean(room.seats.host?.connected && room.seats.host.ready && room.seats.guest?.connected && room.seats.guest.ready);
}

export function getDisconnectForfeitRole(room: RoomState, now: number): PlayerRole | undefined {
  for (const role of ["host", "guest"] as const) {
    const seat = room.seats[role];
    const opponent = room.seats[oppositeRole(role)];
    if (seat && !seat.connected && seat.disconnectDeadline !== undefined && now >= seat.disconnectDeadline && opponent?.connected) {
      return role;
    }
  }
  return undefined;
}

export function getDisconnectedSeatReleaseRole(room: RoomState, now: number): PlayerRole | undefined {
  for (const role of ["host", "guest"] as const) {
    const seat = room.seats[role];
    if (seat && !seat.connected && seat.disconnectDeadline !== undefined && now >= seat.disconnectDeadline) {
      return role;
    }
  }
  return undefined;
}

export function releaseDisconnectedSeat(current: RoomState, role: PlayerRole, now: number): RoomState {
  const room = cloneRoom(current);
  const seat = room.seats[role];
  if (!seat || seat.connected || seat.disconnectDeadline === undefined || now < seat.disconnectDeadline) {
    return room;
  }

  delete room.seats[role];
  touchRoom(room, now);
  return room;
}

export function createRoomSnapshot(
  room: RoomState,
  viewerRole?: PlayerRole,
  serverNow = room.updatedAt,
  matchPhase?: MatchPhase,
): RoomSnapshot {
  const seats = (["host", "guest"] as const).map((role): RoomSnapshotSeat => ({
    role,
    claimed: Boolean(room.seats[role]),
    connected: room.seats[role]?.connected ?? false,
    ready: room.seats[role]?.ready ?? false,
    disconnectDeadline: room.seats[role]?.disconnectDeadline,
  }));
  const getSnapshotSeat = (role: PlayerRole) => seats.find((seat) => seat.role === role)!;

  return {
    roomId: room.roomId,
    rulesetVersion: room.rulesetVersion,
    status: matchPhase === "finished" ? "finished" : matchPhase ? "playing" : areSeatsReady(room) ? "ready" : "waiting",
    viewerRole,
    self: viewerRole ? getSnapshotSeat(viewerRole) : undefined,
    opponent: viewerRole ? getSnapshotSeat(oppositeRole(viewerRole)) : undefined,
    seats,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    expiresAt: room.expiresAt,
    serverNow,
  };
}

export function isRoomExpired(room: RoomState, now: number): boolean {
  return now >= room.expiresAt;
}

function requireSeat(room: RoomState, input: SeatMutationInput): RoomSeatState {
  const seat = room.seats[input.role];
  if (!seat || seat.tokenHash !== input.tokenHash || seat.connectionId !== input.connectionId) {
    throw new MatchDomainError("invalid_seat", "Seat credentials or connection are stale.");
  }
  return seat;
}

function readSeatMutationInput(
  inputOrRole: SeatMutationInput | PlayerRole,
  tokenHash: string | undefined,
  connectionId: string | undefined,
  now: number | undefined,
): SeatMutationInput {
  if (typeof inputOrRole !== "string") {
    return inputOrRole;
  }
  if (tokenHash === undefined || connectionId === undefined || now === undefined) {
    throw new MatchDomainError("invalid_seat", "Seat mutation credentials are incomplete.");
  }
  return { role: inputOrRole, tokenHash, connectionId, now };
}

function touchRoom(room: RoomState, now: number): void {
  room.updatedAt = now;
  room.expiresAt = now + ROOM_TTL_MS;
}

function cloneRoom(room: RoomState): RoomState {
  return {
    ...room,
    seats: {
      host: room.seats.host ? { ...room.seats.host } : undefined,
      guest: room.seats.guest ? { ...room.seats.guest } : undefined,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

import { START_DISTANCE, type ActionId, type CombatState, type Result, type TurnOwner } from "./combat";
import type { HeroState } from "./hero";

export type PvpSeat = "host" | "guest";
export type PvpRoomStatus = "waiting" | "playing" | "finished";

export interface PvpRoomSession {
  roomCode: string;
  token: string;
  seat: PvpSeat;
}

export interface PvpRoomSnapshot {
  roomCode: string;
  seat: PvpSeat;
  status: PvpRoomStatus;
  state?: CombatState;
  activeSeat?: PvpSeat;
  turnVersion: number;
  deadlineAt?: number;
  serverNow: number;
}

export type PvpServerMessage =
  | { type: "snapshot"; snapshot: PvpRoomSnapshot }
  | { type: "error"; message: string };

export type PvpClientMessage =
  | { type: "action"; actionId: ActionId; turnVersion: number };

export interface PvpCreateRoomRequest {
  hero: HeroState;
}

export interface PvpJoinRoomRequest {
  hero: HeroState;
}

export interface PvpCancelRoomRequest {
  token: string;
}

export interface PvpCancelRoomResponse {
  ok: true;
}

export interface PvpRoomListEntry {
  roomCode: string;
  hostName: string;
  hostLevel: number;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
}

export interface PvpListRoomsResponse {
  rooms: PvpRoomListEntry[];
  serverNow: number;
}

export interface PvpRoomResponse extends PvpRoomSession {
  snapshot: PvpRoomSnapshot;
}

export interface PvpCurrentRoomResponse {
  room: PvpRoomResponse | null;
  serverNow: number;
}

export function getPvpActorForSeat(seat: PvpSeat): TurnOwner {
  return seat === "host" ? "player" : "enemy";
}

export function getPvpSeatForActor(actor: TurnOwner): PvpSeat {
  return actor === "player" ? "host" : "guest";
}

export function toViewerPvpSnapshot(snapshot: Omit<PvpRoomSnapshot, "seat" | "state"> & { state?: CombatState }, seat: PvpSeat): PvpRoomSnapshot {
  return {
    ...snapshot,
    seat,
    state: snapshot.state ? toViewerCombatState(snapshot.state, seat) : undefined,
  };
}

export function toViewerCombatState(state: CombatState, seat: PvpSeat): CombatState {
  return seat === "host" ? state : mirrorCombatState(state);
}

function mirrorCombatState(state: CombatState): CombatState {
  return {
    ...state,
    player: { ...state.enemy },
    enemy: { ...state.player },
    result: mirrorResult(state.result),
    activeTurn: mirrorTurnOwner(state.activeTurn),
    playerPosition: START_DISTANCE - state.enemyPosition,
    enemyPosition: START_DISTANCE - state.playerPosition,
    playerRestBlockChancePenalty: state.enemyRestBlockChancePenalty,
    enemyRestBlockChancePenalty: state.playerRestBlockChancePenalty,
    lastPlayerAction: state.lastEnemyAction,
    lastEnemyAction: state.lastPlayerAction,
    lastPlayerDamage: state.lastEnemyDamage,
    lastEnemyDamage: state.lastPlayerDamage,
    lastPlayerArmorAbsorbed: state.lastEnemyArmorAbsorbed,
    lastEnemyArmorAbsorbed: state.lastPlayerArmorAbsorbed,
    lastPlayerArmorBroken: state.lastEnemyArmorBroken,
    lastEnemyArmorBroken: state.lastPlayerArmorBroken,
    lastPlayerRemovedArmorSlots: state.lastEnemyRemovedArmorSlots,
    lastEnemyRemovedArmorSlots: state.lastPlayerRemovedArmorSlots,
    lastPlayerWardAbsorbed: state.lastEnemyWardAbsorbed,
    lastEnemyWardAbsorbed: state.lastPlayerWardAbsorbed,
    lastPlayerHitResults: state.lastEnemyHitResults,
    lastEnemyHitResults: state.lastPlayerHitResults,
    lastPlayerPoisonDamage: state.lastEnemyPoisonDamage,
    lastEnemyPoisonDamage: state.lastPlayerPoisonDamage,
    lastPlayerDoubleStrikeRepeat: state.lastEnemyDoubleStrikeRepeat,
    lastEnemyDoubleStrikeRepeat: state.lastPlayerDoubleStrikeRepeat,
    lastPlayerBlocked: state.lastEnemyBlocked,
    lastEnemyBlocked: state.lastPlayerBlocked,
  };
}

function mirrorTurnOwner(owner: TurnOwner): TurnOwner {
  return owner === "player" ? "enemy" : "player";
}

function mirrorResult(result: Result): Result {
  if (result === "win") {
    return "lose";
  }
  if (result === "lose") {
    return "win";
  }
  return result;
}

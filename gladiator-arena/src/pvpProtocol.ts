import { START_DISTANCE, type ActionId, type CombatActionTrace, type CombatActor, type CombatState, type Result, type TurnOwner } from "./combat";
import type { HeroState } from "./hero";

export type PvpSeat = "host" | "guest";
export type PvpRoomKind = "pvp" | "duoBoss";
export type PvpRoomStatus = "waiting" | "playing" | "finished";

export interface PvpRoomSession {
  roomCode: string;
  token: string;
  seat: PvpSeat;
  roomKind?: PvpRoomKind;
}

export interface PvpRoomSnapshot {
  roomCode: string;
  seat: PvpSeat;
  roomKind?: PvpRoomKind;
  status: PvpRoomStatus;
  bossId?: string;
  bossName?: string;
  bossTierId?: number;
  state?: CombatState;
  activeSeat?: PvpSeat;
  controlledActor?: CombatActor;
  autoSeats?: Partial<Record<PvpSeat, boolean>>;
  turnVersion: number;
  deadlineAt?: number;
  serverNow: number;
}

export type PvpServerMessage =
  | { type: "snapshot"; snapshot: PvpRoomSnapshot }
  | { type: "error"; message: string };

export type PvpClientMessage =
  | { type: "action"; actionId: ActionId; turnVersion: number }
  | { type: "autoOff" };

export interface PvpCreateRoomRequest {
  hero: HeroState;
}

export interface PvpCreateDuoBossRoomRequest {
  hero: HeroState;
  bossId: string;
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
  roomKind?: PvpRoomKind;
  hostName: string;
  hostLevel: number;
  bossId?: string;
  bossName?: string;
  bossTierId?: number;
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

export function getPvpActorForSeat(seat: PvpSeat, roomKind: PvpRoomKind = "pvp"): CombatActor {
  if (roomKind === "duoBoss") {
    return seat === "host" ? "player" : "helper";
  }

  return seat === "host" ? "player" : "enemy";
}

export function getPvpSeatForActor(actor: CombatActor, roomKind: PvpRoomKind = "pvp"): PvpSeat | undefined {
  if (actor === "player") {
    return "host";
  }

  if (actor === "helper" || (roomKind === "duoBoss" && actor === "enemy")) {
    return "guest";
  }

  return roomKind === "pvp" ? "guest" : undefined;
}

export function toViewerPvpSnapshot(snapshot: Omit<PvpRoomSnapshot, "seat" | "state" | "controlledActor"> & { state?: CombatState }, seat: PvpSeat): PvpRoomSnapshot {
  const roomKind = snapshot.roomKind ?? "pvp";

  return {
    ...snapshot,
    seat,
    roomKind,
    controlledActor: getViewerControlledActor(seat, roomKind),
    state: snapshot.state ? toViewerCombatState(snapshot.state, seat, roomKind) : undefined,
  };
}

function getViewerControlledActor(seat: PvpSeat, roomKind: PvpRoomKind): CombatActor {
  return roomKind === "duoBoss" ? getPvpActorForSeat(seat, roomKind) : "player";
}

export function toViewerCombatState(state: CombatState, seat: PvpSeat, roomKind: PvpRoomKind = "pvp"): CombatState {
  if (roomKind === "duoBoss") {
    return state;
  }

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
    playerRestDefensePenalty: state.enemyRestDefensePenalty,
    enemyRestDefensePenalty: state.playerRestDefensePenalty,
    lastPlayerActions: mirrorCombatActionTraces(state.lastEnemyActions ?? []),
    lastEnemyActions: mirrorCombatActionTraces(state.lastPlayerActions ?? []),
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

function mirrorCombatActionTraces(traces: readonly CombatActionTrace[]): CombatActionTrace[] {
  return traces.map((trace) => ({
    ...trace,
    defender: mirrorCombatActor(trace.defender),
  }));
}

function mirrorCombatActor(actor: CombatActionTrace["defender"]): CombatActionTrace["defender"] {
  if (actor === "player") {
    return "enemy";
  }

  if (actor === "enemy") {
    return "player";
  }

  return actor;
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

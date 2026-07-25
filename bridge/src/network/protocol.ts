import type { SheddingSuit } from "../shedding/index.ts";

export type BridgeRoomSeat = "south" | "west";
export type BridgeHumanSeat = BridgeRoomSeat;

export type BridgeClientCommand =
  | {
      commandId: string;
      expectedRevision: number;
      type: "play_cards";
      cardIds: string[];
      declaredSuit?: SheddingSuit;
    }
  | { commandId: string; expectedRevision: number; type: "draw_card" }
  | { commandId: string; expectedRevision: number; type: "next_round" };

export type BridgeRoomStatus = "waiting" | "playing" | "finished";

export interface BridgeRoomPlayerSummary {
  kind: "human" | "bot" | "open";
  displayName: string;
  connected: boolean;
  left: boolean;
}

export interface BridgeRoomSnapshot<TView = unknown> {
  roomCode: string;
  seat: BridgeHumanSeat;
  status: BridgeRoomStatus;
  revision: number;
  players: Record<BridgeRoomSeat, BridgeRoomPlayerSummary>;
  bots: BridgeRoomSeat[];
  view?: TView;
  deadlineAt?: number;
  createdAt: number;
  updatedAt: number;
  serverNow: number;
}

export interface BridgeRoomSession<TView = unknown> {
  roomCode: string;
  seat: BridgeHumanSeat;
  snapshot: BridgeRoomSnapshot<TView>;
}

export interface BridgeCurrentRoomResponse<TView = unknown> {
  room: BridgeRoomSession<TView> | null;
  serverNow: number;
}

export interface BridgeSocketTicketResponse {
  roomCode: string;
  seat: BridgeHumanSeat;
  ticket: string;
  expiresAt: number;
}

export type BridgeServerMessage<TView = unknown> =
  | { type: "snapshot"; snapshot: BridgeRoomSnapshot<TView> }
  | { type: "error"; code: string; message: string; revision?: number };

const ROOM_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;

export function normalizeBridgeRoomCode(value: string | null | undefined): string | null {
  const normalized = (value ?? "").trim().toUpperCase().replace(/[\s-]+/g, "");
  return ROOM_CODE_PATTERN.test(normalized) ? normalized : null;
}

export function createBridgeCommandId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") return `bridge_${globalThis.crypto.randomUUID()}`;
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const random = globalThis.crypto.getRandomValues(new Uint32Array(2));
    return `bridge_${Date.now().toString(36)}_${random[0].toString(36)}${random[1].toString(36)}`;
  }
  return `bridge_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

export function parseBridgeServerMessage<TView>(value: unknown): BridgeServerMessage<TView> | null {
  if (!isRecord(value)) return null;
  if (value.type === "error" && typeof value.code === "string" && typeof value.message === "string") {
    const revision = isRevision(value.revision) ? value.revision : undefined;
    return { type: "error", code: value.code, message: value.message, revision };
  }
  if (value.type !== "snapshot" || !isRecord(value.snapshot)) return null;
  const snapshot = value.snapshot;
  if (
    !normalizeBridgeRoomCode(readString(snapshot.roomCode))
    || (snapshot.seat !== "south" && snapshot.seat !== "west")
    || (snapshot.status !== "waiting" && snapshot.status !== "playing" && snapshot.status !== "finished")
    || !isRevision(snapshot.revision)
    || !isPlayerRecord(snapshot.players)
    || !Array.isArray(snapshot.bots)
    || !Number.isFinite(snapshot.serverNow)
  ) {
    return null;
  }
  return { type: "snapshot", snapshot: snapshot as unknown as BridgeRoomSnapshot<TView> };
}

function isRevision(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isPlayerRecord(value: unknown): value is BridgeRoomSnapshot["players"] {
  if (!isRecord(value)) return false;
  return (["south", "west"] as const).every((seat) => {
    const player = value[seat];
    return isRecord(player)
      && (player.kind === "human" || player.kind === "bot" || player.kind === "open")
      && typeof player.displayName === "string"
      && typeof player.connected === "boolean"
      && typeof player.left === "boolean";
  });
}

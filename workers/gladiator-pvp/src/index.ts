import { DurableObject } from "cloudflare:workers";
import { actionOrder, canUseTurnAction, resolvePvpTurn, type ActionId, type CombatState } from "../../../gladiator-arena/src/combat";
import { createPvpCombatStateFromHeroes, type HeroState } from "../../../gladiator-arena/src/hero";
import {
  getPvpActorForSeat,
  getPvpSeatForActor,
  toViewerPvpSnapshot,
  type PvpCancelRoomRequest,
  type PvpCancelRoomResponse,
  type PvpClientMessage,
  type PvpCreateRoomRequest,
  type PvpJoinRoomRequest,
  type PvpRoomResponse,
  type PvpRoomSnapshot,
  type PvpRoomStatus,
  type PvpSeat,
  type PvpServerMessage,
} from "../../../gladiator-arena/src/pvpProtocol";

export interface Env {
  PVP_ROOM: DurableObjectNamespace<PvpRoom>;
}

interface RoomPlayer {
  token: string;
  hero: HeroState;
}

interface RoomRecord {
  roomCode: string;
  status: PvpRoomStatus;
  host?: RoomPlayer;
  guest?: RoomPlayer;
  state?: CombatState;
  activeSeat?: PvpSeat;
  turnVersion: number;
  deadlineAt?: number;
  createdAt: number;
  updatedAt: number;
}

interface SocketAttachment {
  token: string;
  seat: PvpSeat;
}

const ROOM_STORAGE_KEY = "room";
const TURN_DURATION_MS = 20_000;
const ROOM_CODE_LENGTH = 6;
const API_PREFIX = "/api/pvp";
const REST_ACTION_ID: ActionId = "rest";
const ACTION_IDS = new Set<ActionId>(actionOrder);

export class PvpRoom extends DurableObject<Env> {
  async hasRoom(): Promise<boolean> {
    return Boolean(await this.readRoom());
  }

  async createRoom(roomCode: string, hero: HeroState): Promise<PvpRoomResponse> {
    const existing = await this.readRoom();

    if (existing) {
      throw new Error("Room already exists.");
    }

    const token = crypto.randomUUID();
    const now = Date.now();
    const record: RoomRecord = {
      roomCode,
      status: "waiting",
      host: { token, hero },
      turnVersion: 0,
      createdAt: now,
      updatedAt: now,
    };

    await this.writeRoom(record);

    return {
      roomCode,
      token,
      seat: "host",
      snapshot: this.createViewerSnapshot(record, "host"),
    };
  }

  async cancelRoom(token: string): Promise<PvpCancelRoomResponse> {
    const record = await this.readRoom();

    if (!record?.host) {
      throw new Error("Room not found.");
    }
    if (record.host.token !== token) {
      throw new Error("Only room host can cancel this room.");
    }
    if (record.status !== "waiting") {
      throw new Error("PvP match already started.");
    }

    this.closeRoomSockets("Room cancelled.");
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.delete(ROOM_STORAGE_KEY);

    return { ok: true };
  }

  async joinRoom(hero: HeroState): Promise<PvpRoomResponse> {
    const record = await this.readRoom();

    if (!record?.host) {
      throw new Error("Room not found.");
    }
    if (record.status !== "waiting" || record.guest) {
      throw new Error("Room is not available.");
    }

    const token = crypto.randomUUID();
    const nextRecord = this.startMatch({
      ...record,
      guest: { token, hero },
      status: "playing",
      updatedAt: Date.now(),
    });

    await this.writeRoom(nextRecord);
    await this.scheduleTurnAlarm(nextRecord);
    this.broadcastSnapshots(nextRecord);

    return {
      roomCode: nextRecord.roomCode,
      token,
      seat: "guest",
      snapshot: this.createViewerSnapshot(nextRecord, "guest"),
    };
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return json({ ok: false, error: "Expected WebSocket upgrade." }, 426);
    }

    const record = await this.readRoom();
    const url = new URL(request.url);
    const token = url.searchParams.get("token") ?? "";
    const seat = record ? this.getSeatForToken(record, token) : undefined;

    if (!record || !seat) {
      return json({ ok: false, error: "Invalid PvP room token." }, 403);
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    server.serializeAttachment({ token, seat } satisfies SocketAttachment);
    this.ctx.acceptWebSocket(server);
    this.sendSnapshot(server, record, seat);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const attachment = this.getSocketAttachment(ws);

    if (!attachment || typeof message !== "string") {
      this.sendError(ws, "Bad PvP message.");
      return;
    }

    let data: PvpClientMessage;

    try {
      data = JSON.parse(message) as PvpClientMessage;
    } catch {
      this.sendError(ws, "Bad PvP JSON.");
      return;
    }

    if (data.type !== "action" || !isActionId(data.actionId)) {
      this.sendError(ws, "Unknown PvP action.");
      return;
    }

    await this.handleAction(attachment.seat, data.actionId, data.turnVersion);
  }

  async alarm(): Promise<void> {
    const record = await this.readRoom();

    if (!record || record.status !== "playing" || !record.state || !record.activeSeat || !record.deadlineAt) {
      return;
    }

    if (Date.now() < record.deadlineAt) {
      await this.scheduleTurnAlarm(record);
      return;
    }

    const nextRecord = this.applyAction(record, record.activeSeat, REST_ACTION_ID);
    await this.writeRoom(nextRecord);
    await this.scheduleTurnAlarm(nextRecord);
    this.broadcastSnapshots(nextRecord);
  }

  private async handleAction(seat: PvpSeat, actionId: ActionId, turnVersion: number): Promise<void> {
    const record = await this.resolveExpiredTurnIfNeeded(await this.readRoom());

    if (!record || record.status !== "playing" || !record.state || !record.activeSeat) {
      return;
    }

    if (record.activeSeat !== seat || record.turnVersion !== turnVersion) {
      this.broadcastSnapshots(record);
      return;
    }

    const nextRecord = this.applyAction(record, seat, actionId);
    await this.writeRoom(nextRecord);
    await this.scheduleTurnAlarm(nextRecord);
    this.broadcastSnapshots(nextRecord);
  }

  private async resolveExpiredTurnIfNeeded(record: RoomRecord | undefined): Promise<RoomRecord | undefined> {
    if (!record || record.status !== "playing" || !record.state || !record.activeSeat || !record.deadlineAt) {
      return record;
    }

    if (Date.now() < record.deadlineAt) {
      return record;
    }

    const nextRecord = this.applyAction(record, record.activeSeat, REST_ACTION_ID);
    await this.writeRoom(nextRecord);
    await this.scheduleTurnAlarm(nextRecord);
    this.broadcastSnapshots(nextRecord);
    return nextRecord;
  }

  private startMatch(record: RoomRecord): RoomRecord {
    if (!record.host || !record.guest) {
      return record;
    }

    const now = Date.now();
    const state = createPvpCombatStateFromHeroes(record.host.hero, record.guest.hero);

    return {
      ...record,
      status: "playing",
      state,
      activeSeat: "host",
      turnVersion: 1,
      deadlineAt: now + TURN_DURATION_MS,
      updatedAt: now,
    };
  }

  private applyAction(record: RoomRecord, seat: PvpSeat, actionId: ActionId): RoomRecord {
    if (!record.state) {
      return record;
    }

    const now = Date.now();
    const actor = getPvpActorForSeat(seat);

    if (!canUseTurnAction(record.state, actionId, actor)) {
      return record;
    }

    const state = resolvePvpTurn(record.state, actor, actionId);
    const status: PvpRoomStatus = state.result === "playing" ? "playing" : "finished";
    const activeSeat = status === "playing" ? getPvpSeatForActor(state.activeTurn) : undefined;

    return {
      ...record,
      status,
      state,
      activeSeat,
      turnVersion: record.turnVersion + 1,
      deadlineAt: activeSeat ? now + TURN_DURATION_MS : undefined,
      updatedAt: now,
    };
  }

  private async scheduleTurnAlarm(record: RoomRecord): Promise<void> {
    if (record.status === "playing" && record.deadlineAt) {
      await this.ctx.storage.setAlarm(record.deadlineAt);
      return;
    }

    await this.ctx.storage.deleteAlarm();
  }

  private createViewerSnapshot(record: RoomRecord, seat: PvpSeat): PvpRoomSnapshot {
    return toViewerPvpSnapshot({
      roomCode: record.roomCode,
      status: record.status,
      state: record.state,
      activeSeat: record.activeSeat,
      turnVersion: record.turnVersion,
      deadlineAt: record.deadlineAt,
      serverNow: Date.now(),
    }, seat);
  }

  private broadcastSnapshots(record: RoomRecord): void {
    this.ctx.getWebSockets().forEach((ws) => {
      const attachment = this.getSocketAttachment(ws);

      if (attachment) {
        this.sendSnapshot(ws, record, attachment.seat);
      }
    });
  }

  private sendSnapshot(ws: WebSocket, record: RoomRecord, seat: PvpSeat): void {
    sendSocketMessage(ws, {
      type: "snapshot",
      snapshot: this.createViewerSnapshot(record, seat),
    });
  }

  private sendError(ws: WebSocket, message: string): void {
    sendSocketMessage(ws, { type: "error", message });
  }

  private closeRoomSockets(message: string): void {
    this.ctx.getWebSockets().forEach((ws) => {
      this.sendError(ws, message);
      ws.close(1000, message);
    });
  }

  private getSocketAttachment(ws: WebSocket): SocketAttachment | undefined {
    const attachment = ws.deserializeAttachment() as Partial<SocketAttachment> | undefined;

    return isPvpSeat(attachment?.seat) && attachment.token ? { token: attachment.token, seat: attachment.seat } : undefined;
  }

  private getSeatForToken(record: RoomRecord, token: string): PvpSeat | undefined {
    if (record.host?.token === token) {
      return "host";
    }
    if (record.guest?.token === token) {
      return "guest";
    }
    return undefined;
  }

  private readRoom(): Promise<RoomRecord | undefined> {
    return this.ctx.storage.get<RoomRecord>(ROOM_STORAGE_KEY);
  }

  private writeRoom(record: RoomRecord): Promise<void> {
    return this.ctx.storage.put(ROOM_STORAGE_KEY, record);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    try {
      return await handleRequest(request, env);
    } catch (error) {
      return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 400);
    }
  },
};

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = normalizePath(url.pathname);
  const segments = path.split("/").filter(Boolean);

  if (request.method === "POST" && segments.length === 1 && segments[0] === "rooms") {
    const body = (await request.json()) as PvpCreateRoomRequest;
    const roomCode = await createUniqueRoomCode(env);
    const room = env.PVP_ROOM.getByName(roomCode);
    const response = await room.createRoom(roomCode, body.hero);

    return json(response);
  }

  if (request.method === "POST" && segments.length === 3 && segments[0] === "rooms" && segments[2] === "join") {
    const roomCode = normalizeRoomCode(segments[1] ?? "");
    const body = (await request.json()) as PvpJoinRoomRequest;
    const room = env.PVP_ROOM.getByName(roomCode);
    const response = await room.joinRoom(body.hero);

    return json(response);
  }

  if (request.method === "POST" && segments.length === 3 && segments[0] === "rooms" && segments[2] === "cancel") {
    const roomCode = normalizeRoomCode(segments[1] ?? "");
    const body = (await request.json()) as PvpCancelRoomRequest;
    const room = env.PVP_ROOM.getByName(roomCode);
    const response = await room.cancelRoom(body.token);

    return json(response);
  }

  if (request.method === "GET" && segments.length === 3 && segments[0] === "rooms" && segments[2] === "ws") {
    const roomCode = normalizeRoomCode(segments[1] ?? "");
    const room = env.PVP_ROOM.getByName(roomCode);

    return room.fetch(request);
  }

  return json({ ok: false, error: "Not found." }, 404);
}

async function createUniqueRoomCode(env: Env): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = createRoomCode();
    const room = env.PVP_ROOM.getByName(code);

    if (!(await room.hasRoom())) {
      return code;
    }
  }

  return createRoomCode();
}

function createRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, ROOM_CODE_LENGTH);
}

function normalizePath(pathname: string): string {
  return pathname.startsWith(API_PREFIX) ? pathname.slice(API_PREFIX.length) || "/" : pathname;
}

function isActionId(actionId: unknown): actionId is ActionId {
  return typeof actionId === "string" && ACTION_IDS.has(actionId as ActionId);
}

function isPvpSeat(seat: unknown): seat is PvpSeat {
  return seat === "host" || seat === "guest";
}

function sendSocketMessage(ws: WebSocket, message: PvpServerMessage): void {
  try {
    ws.send(JSON.stringify(message));
  } catch {
    // The runtime will clean up closed sockets; this keeps broadcasts best-effort.
  }
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(),
    },
  });
}

function corsHeaders(): HeadersInit {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
  };
}

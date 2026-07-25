import { DurableObject } from "cloudflare:workers";

import {
  applySheddingAction,
  chooseSheddingBotAction,
  createSheddingGame,
  createSheddingViewerSnapshot,
  getLegalSheddingCardIds,
  getSheddingTurnController,
  type SheddingAction,
  type SheddingGameState,
  type SheddingSeat,
  type SheddingViewerSnapshot,
} from "../../../bridge/src/shedding";
import {
  MAX_SOCKET_MESSAGE_BYTES,
  appendProcessedCommand,
  createOpaqueToken,
  createRoomCode,
  getCommandDisposition,
  hashOpaqueToken,
  isHumanBridgeSeat,
  normalizeRoomCode,
  parseBridgeClientCommand,
  type BridgeClientCommand,
  type BridgeServerMessage,
  type HumanBridgeSeat,
  type ProcessedCommand,
} from "./protocol";
import {
  BridgeAuthError,
  authenticateBridgeRequest,
  type BridgeIdentity,
  type BridgeAuthEnv,
} from "./security";
import {
  BridgeUserSession,
  type BridgeUserSessionRecord,
} from "./userSession";
import { resolveHumanTurnDeadline } from "./timing.ts";

export { BridgeUserSession } from "./userSession";

export interface Env extends BridgeAuthEnv {
  BRIDGE_ROOM: DurableObjectNamespace<BridgeRoom>;
  BRIDGE_USER_SESSION: DurableObjectNamespace<BridgeUserSession>;
}

type BridgeRoomStatus = "waiting" | "playing" | "finished";

interface HumanPlayerRecord {
  userId: string;
  displayName: string;
  joinedAt: number;
  leftAt?: number;
}

interface RoomTicketRecord {
  tokenHash: string;
  userId: string;
  seat: HumanBridgeSeat;
  expiresAt: number;
}

interface BridgeRoomRecord {
  schemaVersion: 2;
  roomCode: string;
  status: BridgeRoomStatus;
  humans: Partial<Record<HumanBridgeSeat, HumanPlayerRecord>>;
  game?: SheddingGameState;
  processedCommands: ProcessedCommand[];
  tickets: RoomTicketRecord[];
  humanDeadlineAt?: number;
  expiresAt?: number;
  maxExpiresAt: number;
  createdAt: number;
  updatedAt: number;
}

interface SocketAttachment {
  userId: string;
  seat: HumanBridgeSeat;
}

interface BridgePlayerSnapshot {
  kind: "human" | "bot" | "open";
  displayName: string;
  connected: boolean;
  left: boolean;
}

export interface BridgeRoomSnapshot {
  roomCode: string;
  seat: HumanBridgeSeat;
  status: BridgeRoomStatus;
  revision: number;
  players: Record<SheddingSeat, BridgePlayerSnapshot>;
  bots: SheddingSeat[];
  view?: SheddingViewerSnapshot;
  deadlineAt?: number;
  createdAt: number;
  updatedAt: number;
  serverNow: number;
}

export interface BridgeRoomResponse {
  roomCode: string;
  seat: HumanBridgeSeat;
  snapshot: BridgeRoomSnapshot;
}

interface BridgeCurrentRoomResponse {
  room: BridgeRoomResponse | null;
  serverNow: number;
}

interface BridgeTicketResponse {
  roomCode: string;
  seat: HumanBridgeSeat;
  ticket: string;
  expiresAt: number;
}

interface BridgeLeaveResult {
  ok: true;
  deleted: boolean;
}

type BridgeRpcResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: string; message: string } };

const API_PREFIX = "/api/bridge";
const ROOM_STORAGE_KEY = "room:v2";
const LEGACY_ROOM_STORAGE_KEY = "room:v1";
const WAITING_ROOM_TTL_MS = 10 * 60_000;
const FINISHED_ROOM_TTL_MS = 15 * 60_000;
const ACTIVE_ROOM_TTL_MS = 2 * 60 * 60_000;
const SOCKET_TICKET_TTL_MS = 45_000;
const MAX_ROOM_CODE_ATTEMPTS = 8;
const MAX_AUTOMATED_ACTIONS = 128;

class BridgeRoomError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "BridgeRoomError";
    this.code = code;
  }
}

export class BridgeRoom extends DurableObject<Env> {
  async hasLiveRoom(): Promise<boolean> {
    return Boolean(await this.readLiveRoom());
  }

  async createRoom(roomCode: string, identity: BridgeIdentity): Promise<BridgeRoomResponse | undefined> {
    if (await this.readLiveRoom()) {
      return undefined;
    }

    const now = Date.now();
    const record: BridgeRoomRecord = {
      schemaVersion: 2,
      roomCode,
      status: "waiting",
      humans: {
        south: createHumanPlayer(identity, now),
      },
      processedCommands: [],
      tickets: [],
      expiresAt: now + WAITING_ROOM_TTL_MS,
      maxExpiresAt: now + ACTIVE_ROOM_TTL_MS,
      createdAt: now,
      updatedAt: now,
    };

    await this.writeRoom(record);
    await this.scheduleRoomAlarm(record);
    return this.createRoomResponse(record, "south");
  }

  async joinRoom(identity: BridgeIdentity): Promise<BridgeRpcResult<BridgeRoomResponse>> {
    try {
      return { ok: true, value: await this.joinRoomInternal(identity) };
    } catch (error) {
      if (error instanceof BridgeRoomError) {
        return { ok: false, error: { code: error.code, message: error.message } };
      }
      throw error;
    }
  }

  private async joinRoomInternal(identity: BridgeIdentity): Promise<BridgeRoomResponse> {
    const record = await this.readLiveRoom();
    if (!record?.humans.south) {
      throw new BridgeRoomError("room_not_found", "Bridge room not found.");
    }

    const existingSeat = this.getSeatForUser(record, identity.userId);
    if (existingSeat) {
      return this.createRoomResponse(record, existingSeat);
    }
    if (record.status !== "waiting" || record.humans.west) {
      throw new BridgeRoomError("room_unavailable", "Bridge room is no longer available.");
    }

    const now = Date.now();
    const game = createSheddingGame();
    let nextRecord: BridgeRoomRecord = {
      ...record,
      status: "playing",
      humans: {
        ...record.humans,
        west: createHumanPlayer(identity, now),
      },
      game,
      expiresAt: undefined,
      maxExpiresAt: now + ACTIVE_ROOM_TTL_MS,
      updatedAt: now,
    };

    nextRecord = this.advanceAutomatedSeats(nextRecord, now);
    await this.writeRoom(nextRecord);
    await this.scheduleRoomAlarm(nextRecord);
    this.broadcastSnapshots(nextRecord);
    return this.createRoomResponse(nextRecord, "west");
  }

  async getRoomForUser(userId: string): Promise<BridgeRoomResponse | undefined> {
    const record = await this.readLiveRoom();
    const seat = record ? this.getSeatForUser(record, userId) : undefined;
    return record && seat ? this.createRoomResponse(record, seat) : undefined;
  }

  async issueTicket(userId: string): Promise<BridgeRpcResult<BridgeTicketResponse>> {
    try {
      return { ok: true, value: await this.issueTicketInternal(userId) };
    } catch (error) {
      if (error instanceof BridgeRoomError) {
        return { ok: false, error: { code: error.code, message: error.message } };
      }
      throw error;
    }
  }

  private async issueTicketInternal(userId: string): Promise<BridgeTicketResponse> {
    const record = await this.readLiveRoom();
    const seat = record ? this.getSeatForUser(record, userId) : undefined;
    if (!record || !seat) {
      throw new BridgeRoomError("not_room_member", "You are not an active member of this room.");
    }

    const now = Date.now();
    const ticket = createOpaqueToken();
    const expiresAt = now + SOCKET_TICKET_TTL_MS;
    const tickets = record.tickets
      .filter((candidate) => candidate.expiresAt > now && candidate.seat !== seat)
      .concat({ tokenHash: await hashOpaqueToken(ticket), userId, seat, expiresAt });
    const nextRecord = { ...record, tickets, updatedAt: now };

    await this.writeRoom(nextRecord);
    return { roomCode: record.roomCode, seat, ticket, expiresAt };
  }

  async leaveRoom(userId: string): Promise<BridgeLeaveResult> {
    const record = await this.readLiveRoom();
    const seat = record ? this.getSeatForUser(record, userId) : undefined;
    if (!record || !seat) {
      return { ok: true, deleted: false };
    }

    if (record.status === "waiting" && seat === "south") {
      await this.deleteRoom(record, "Room closed.");
      return { ok: true, deleted: true };
    }

    const now = Date.now();
    const human = record.humans[seat] as HumanPlayerRecord;
    let nextRecord: BridgeRoomRecord = {
      ...record,
      humans: {
        ...record.humans,
        [seat]: { ...human, leftAt: now },
      },
      tickets: record.tickets.filter((ticket) => ticket.seat !== seat),
      updatedAt: now,
    };

    this.closeSeatSockets(seat, "Left room.");
    if (getHumanPlayers(nextRecord).every((player) => player.leftAt)) {
      await this.deleteRoom(nextRecord, "Room closed.");
      return { ok: true, deleted: true };
    }

    nextRecord = this.advanceAutomatedSeats(nextRecord, now);
    await this.writeRoom(nextRecord);
    await this.scheduleRoomAlarm(nextRecord);
    this.broadcastSnapshots(nextRecord);
    return { ok: true, deleted: false };
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return json({ ok: false, error: "Expected WebSocket upgrade." }, 426);
    }

    const rawTicket = new URL(request.url).searchParams.get("ticket") ?? "";
    if (rawTicket.length < 20 || rawTicket.length > 256) {
      return json({ ok: false, error: "Invalid socket ticket." }, 403);
    }

    const record = await this.readLiveRoom();
    if (!record) {
      return json({ ok: false, error: "Bridge room not found." }, 404);
    }

    const now = Date.now();
    const tokenHash = await hashOpaqueToken(rawTicket);
    const ticket = record.tickets.find(
      (candidate) => candidate.tokenHash === tokenHash && candidate.expiresAt > now,
    );
    if (!ticket || this.getSeatForUser(record, ticket.userId) !== ticket.seat) {
      return json({ ok: false, error: "Invalid or expired socket ticket." }, 403);
    }

    const nextRecord = {
      ...record,
      tickets: record.tickets.filter((candidate) => candidate.tokenHash !== ticket.tokenHash),
      updatedAt: now,
    };
    await this.writeRoom(nextRecord);

    this.closeSeatSockets(ticket.seat, "Reconnected elsewhere.");
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.serializeAttachment({ userId: ticket.userId, seat: ticket.seat } satisfies SocketAttachment);
    this.ctx.acceptWebSocket(server);
    this.sendSnapshot(server, nextRecord, ticket.seat);
    this.broadcastSnapshots(nextRecord, server);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const attachment = this.getSocketAttachment(ws);
    if (!attachment || typeof message !== "string" || new TextEncoder().encode(message).byteLength > MAX_SOCKET_MESSAGE_BYTES) {
      this.sendError(ws, "bad_message", "Invalid bridge command.");
      return;
    }

    let rawCommand: unknown;
    try {
      rawCommand = JSON.parse(message);
    } catch {
      this.sendError(ws, "bad_json", "Invalid bridge command JSON.");
      return;
    }

    const command = parseBridgeClientCommand(rawCommand);
    if (!command) {
      this.sendError(ws, "bad_command", "Invalid bridge command.");
      return;
    }

    await this.handleCommand(ws, attachment, command);
  }

  async webSocketClose(): Promise<void> {
    const record = await this.readLiveRoom();
    if (record) {
      this.broadcastSnapshots(record);
    }
  }

  async webSocketError(): Promise<void> {
    const record = await this.readLiveRoom();
    if (record) {
      this.broadcastSnapshots(record);
    }
  }

  async alarm(): Promise<void> {
    const record = await this.readRoom();
    if (!record) {
      return;
    }

    const now = Date.now();
    if (record.maxExpiresAt <= now || ((record.status === "waiting" || record.status === "finished") && (record.expiresAt ?? 0) <= now)) {
      await this.deleteRoom(record, "Room expired.");
      return;
    }

    if (record.status !== "playing" || !record.game) {
      await this.scheduleRoomAlarm(record);
      return;
    }

    if (record.humanDeadlineAt && record.humanDeadlineAt > now) {
      await this.scheduleRoomAlarm(record);
      return;
    }

    const controller = getSheddingTurnController(record.game);
    const forcedSeat = isHumanBridgeSeat(controller) ? controller : undefined;
    const nextRecord = this.advanceAutomatedSeats(record, now, forcedSeat);

    await this.writeRoom(nextRecord);
    await this.scheduleRoomAlarm(nextRecord);
    this.broadcastSnapshots(nextRecord);
  }

  private async handleCommand(
    ws: WebSocket,
    attachment: SocketAttachment,
    command: BridgeClientCommand,
  ): Promise<void> {
    const record = await this.readLiveRoom();
    if (!record?.game || record.status !== "playing" || this.getSeatForUser(record, attachment.userId) !== attachment.seat) {
      this.sendError(ws, "room_not_playing", "Bridge room is not accepting actions.");
      return;
    }

    const disposition = getCommandDisposition(record.processedCommands, command, record.game.revision);
    if (disposition === "duplicate") {
      this.sendSnapshot(ws, record, attachment.seat);
      return;
    }

    const revision = record.game.revision;
    if (disposition === "stale") {
      this.sendError(ws, "stale_revision", "The room changed; use the latest snapshot.", revision);
      this.sendSnapshot(ws, record, attachment.seat);
      return;
    }

    if (getSheddingTurnController(record.game) !== attachment.seat) {
      this.sendError(ws, "not_controller", "It is not your decision.", revision);
      return;
    }

    let game: SheddingGameState;
    try {
      game = applyClientCommand(record.game, command);
    } catch {
      this.sendError(ws, "illegal_action", "That bridge action is not legal.", revision);
      return;
    }

    const now = Date.now();
    let nextRecord: BridgeRoomRecord = {
      ...record,
      game,
      processedCommands: appendProcessedCommand(record.processedCommands, {
        commandId: command.commandId,
        acceptedRevision: game.revision,
      }),
      humanDeadlineAt: undefined,
      updatedAt: now,
    };

    nextRecord = this.advanceAutomatedSeats(nextRecord, now);
    await this.writeRoom(nextRecord);
    await this.scheduleRoomAlarm(nextRecord);
    this.broadcastSnapshots(nextRecord);
  }

  private advanceAutomatedSeats(
    source: BridgeRoomRecord,
    now: number,
    forcedHumanSeat?: HumanBridgeSeat,
  ): BridgeRoomRecord {
    let record = source;
    let forcedSeat = forcedHumanSeat;
    const previousRevision = source.game?.revision;
    const previousController = source.game ? getSheddingTurnController(source.game) : null;

    for (let step = 0; step < MAX_AUTOMATED_ACTIONS; step += 1) {
      const game = record.game;
      if (!game || game.phase === "match_complete") {
        break;
      }

      const controller = getSheddingTurnController(game);
      if (!controller) {
        break;
      }

      const human = isHumanBridgeSeat(controller) ? record.humans[controller] : undefined;
      const shouldWaitForHuman = Boolean(human && !human.leftAt && forcedSeat !== controller);
      if (shouldWaitForHuman) {
        break;
      }

      const action = chooseSheddingBotAction(createSheddingViewerSnapshot(game, controller)) ?? createSafeFallbackAction(game);
      if (!action) {
        throw new BridgeRoomError("automation_failed", "Bridge automation could not find a legal action.");
      }

      const nextGame = applySheddingAction(game, action);
      record = { ...record, game: nextGame, updatedAt: now };
      forcedSeat = undefined;
    }

    const game = record.game;
    if (!game) {
      return record;
    }
    if (game.phase === "match_complete") {
      return {
        ...record,
        status: "finished",
        humanDeadlineAt: undefined,
        expiresAt: now + FINISHED_ROOM_TTL_MS,
        updatedAt: now,
      };
    }

    const controller = getSheddingTurnController(game);
    const stateDidNotAdvance = previousRevision === game.revision && previousController === controller;
    return {
      ...record,
      status: "playing",
      humanDeadlineAt: resolveHumanTurnDeadline(
        now,
        source.humanDeadlineAt,
        stateDidNotAdvance,
      ),
      expiresAt: undefined,
      updatedAt: now,
    };
  }

  private createRoomResponse(record: BridgeRoomRecord, seat: HumanBridgeSeat): BridgeRoomResponse {
    return {
      roomCode: record.roomCode,
      seat,
      snapshot: this.createSnapshot(record, seat),
    };
  }

  private createSnapshot(record: BridgeRoomRecord, seat: HumanBridgeSeat): BridgeRoomSnapshot {
    const connectedSeats = this.getConnectedSeats();
    const south = record.humans.south;
    const west = record.humans.west;

    return {
      roomCode: record.roomCode,
      seat,
      status: record.status,
      revision: record.game?.revision ?? 0,
      players: {
        south: south
          ? createHumanPlayerSnapshot(south, connectedSeats.has("south"))
          : createOpenPlayerSnapshot(),
        west: west
          ? createHumanPlayerSnapshot(west, connectedSeats.has("west"))
          : createOpenPlayerSnapshot(),
      },
      bots: (["south", "west"] as const).filter((candidate) => Boolean(record.game && record.humans[candidate]?.leftAt)),
      view: record.game ? createSheddingViewerSnapshot(record.game, seat) : undefined,
      deadlineAt: record.humanDeadlineAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      serverNow: Date.now(),
    };
  }

  private broadcastSnapshots(record: BridgeRoomRecord, except?: WebSocket): void {
    this.ctx.getWebSockets().forEach((ws) => {
      if (ws === except) {
        return;
      }
      const attachment = this.getSocketAttachment(ws);
      if (attachment) {
        this.sendSnapshot(ws, record, attachment.seat);
      }
    });
  }

  private sendSnapshot(ws: WebSocket, record: BridgeRoomRecord, seat: HumanBridgeSeat): void {
    sendSocketMessage(ws, {
      type: "snapshot",
      snapshot: this.createSnapshot(record, seat),
    });
  }

  private sendError(ws: WebSocket, code: string, message: string, revision?: number): void {
    sendSocketMessage(ws, { type: "error", code, message, revision });
  }

  private getConnectedSeats(): Set<HumanBridgeSeat> {
    const seats = new Set<HumanBridgeSeat>();
    this.ctx.getWebSockets().forEach((ws) => {
      const attachment = this.getSocketAttachment(ws);
      if (attachment) {
        seats.add(attachment.seat);
      }
    });
    return seats;
  }

  private getSocketAttachment(ws: WebSocket): SocketAttachment | undefined {
    const attachment = ws.deserializeAttachment() as Partial<SocketAttachment> | undefined;
    return attachment && typeof attachment.userId === "string" && isHumanBridgeSeat(attachment.seat)
      ? { userId: attachment.userId, seat: attachment.seat }
      : undefined;
  }

  private getSeatForUser(record: BridgeRoomRecord, userId: string): HumanBridgeSeat | undefined {
    return (["south", "west"] as const).find((seat) => {
      const human = record.humans[seat];
      return human?.userId === userId && !human.leftAt;
    });
  }

  private closeSeatSockets(seat: HumanBridgeSeat, message: string): void {
    this.ctx.getWebSockets().forEach((ws) => {
      if (this.getSocketAttachment(ws)?.seat === seat) {
        ws.close(4001, message);
      }
    });
  }

  private closeRoomSockets(message: string): void {
    this.ctx.getWebSockets().forEach((ws) => ws.close(1000, message));
  }

  private async readLiveRoom(): Promise<BridgeRoomRecord | undefined> {
    const record = await this.readRoom();
    if (!record) {
      return undefined;
    }

    const now = Date.now();
    const stateExpired = record.maxExpiresAt <= now
      || ((record.status === "waiting" || record.status === "finished") && (record.expiresAt ?? 0) <= now);
    if (!stateExpired) {
      return record;
    }

    await this.deleteRoom(record, "Room expired.");
    return undefined;
  }

  private async readRoom(): Promise<BridgeRoomRecord | undefined> {
    const record = await this.ctx.storage.get<BridgeRoomRecord>(ROOM_STORAGE_KEY);
    if (record) return record;

    // Contract-Bridge rooms are incompatible with the two-player shedding engine.
    // They were short-lived, so clear the legacy payload instead of attempting a lossy migration.
    const legacy = await this.ctx.storage.get(LEGACY_ROOM_STORAGE_KEY);
    if (legacy !== undefined) await this.ctx.storage.delete(LEGACY_ROOM_STORAGE_KEY);
    return undefined;
  }

  private writeRoom(record: BridgeRoomRecord): Promise<void> {
    return this.ctx.storage.put(ROOM_STORAGE_KEY, record);
  }

  private async scheduleRoomAlarm(record: BridgeRoomRecord): Promise<void> {
    const candidates = [record.maxExpiresAt, record.expiresAt, record.humanDeadlineAt]
      .filter((value): value is number => typeof value === "number");
    if (candidates.length === 0) {
      await this.ctx.storage.deleteAlarm();
      return;
    }

    await this.ctx.storage.setAlarm(Math.min(...candidates));
  }

  private async deleteRoom(record: BridgeRoomRecord, message: string): Promise<void> {
    this.closeRoomSockets(message);
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.delete(ROOM_STORAGE_KEY);
    await Promise.allSettled(getHumanPlayers(record).map((player) => (
      this.env.BRIDGE_USER_SESSION.getByName(player.userId).clearSession(record.roomCode)
    )));
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    try {
      return await handleRequest(request, env);
    } catch (error) {
      if (error instanceof BridgeAuthError) {
        return json({ ok: false, error: error.code, message: error.message }, error.status, env);
      }
      if (error instanceof BridgeRoomError) {
        return json({ ok: false, error: error.code, message: error.message }, getRoomErrorStatus(error.code), env);
      }

      return json({ ok: false, error: "bridge_request_failed", message: "Bridge request failed." }, 400, env);
    }
  },
};

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === "/health" || url.pathname === `${API_PREFIX}/health`) {
    return json({ ok: true, service: "bridge-pvp", serverNow: Date.now() }, 200, env);
  }

  const path = url.pathname.startsWith(API_PREFIX)
    ? url.pathname.slice(API_PREFIX.length) || "/"
    : url.pathname;
  const segments = path.split("/").filter(Boolean);

  if (request.method === "GET" && segments.length === 3 && segments[0] === "rooms" && segments[2] === "ws") {
    const roomCode = requireRoomCode(segments[1]);
    return env.BRIDGE_ROOM.getByName(roomCode).fetch(request);
  }

  if (request.method === "GET" && segments.length === 2 && segments[0] === "rooms" && segments[1] === "current") {
    const identity = await authenticateBridgeRequest(request, env);
    return json(await getCurrentRoom(identity, env), 200, env);
  }

  if (request.method === "POST" && segments.length === 1 && segments[0] === "rooms") {
    const identity = await authenticateBridgeRequest(request, env);
    const current = await getCurrentRoom(identity, env);
    if (current.room) {
      return json(current.room, 200, env);
    }

    const response = await createBridgeRoom(identity, env);
    return json(response, 201, env);
  }

  if (request.method === "POST" && segments.length === 3 && segments[0] === "rooms" && segments[2] === "join") {
    const identity = await authenticateBridgeRequest(request, env);
    const current = await getCurrentRoom(identity, env);
    if (current.room) {
      return json(current.room, 200, env);
    }

    const roomCode = requireRoomCode(segments[1]);
    const response = await joinBridgeRoom(roomCode, identity, env);
    return json(response, 200, env);
  }

  if (request.method === "POST" && segments.length === 3 && segments[0] === "rooms" && segments[2] === "ticket") {
    const identity = await authenticateBridgeRequest(request, env);
    const roomCode = requireRoomCode(segments[1]);
    const ticket = unwrapBridgeRpcResult(await env.BRIDGE_ROOM.getByName(roomCode).issueTicket(identity.userId));
    return json(ticket, 200, env);
  }

  if (request.method === "POST" && segments.length === 3 && segments[0] === "rooms" && segments[2] === "leave") {
    const identity = await authenticateBridgeRequest(request, env);
    const roomCode = requireRoomCode(segments[1]);
    const result = await env.BRIDGE_ROOM.getByName(roomCode).leaveRoom(identity.userId);
    await getUserSession(env, identity.userId).clearSession(roomCode);
    return json(result, 200, env);
  }

  return json({ ok: false, error: "not_found" }, 404, env);
}

async function createBridgeRoom(identity: BridgeIdentity, env: Env): Promise<BridgeRoomResponse> {
  const userSession = getUserSession(env, identity.userId);

  for (let attempt = 0; attempt < MAX_ROOM_CODE_ATTEMPTS; attempt += 1) {
    const now = Date.now();
    const roomCode = createRoomCode();
    const session = createUserSessionRecord(roomCode, "south", now);
    const claim = await userSession.claimSession(session);
    if (!claim.claimed) {
      const current = await resolveSession(identity.userId, claim.session, env);
      if (current) {
        return current;
      }
      await userSession.clearSession(claim.session.roomCode);
      continue;
    }

    const room = env.BRIDGE_ROOM.getByName(roomCode);
    const response = await room.createRoom(roomCode, identity);
    if (response) {
      return response;
    }

    await userSession.clearSession(roomCode);
  }

  throw new BridgeRoomError("room_code_exhausted", "Could not allocate a bridge room code.");
}

async function joinBridgeRoom(roomCode: string, identity: BridgeIdentity, env: Env): Promise<BridgeRoomResponse> {
  const userSession = getUserSession(env, identity.userId);
  const session = createUserSessionRecord(roomCode, "west", Date.now());
  const claim = await userSession.claimSession(session);
  if (!claim.claimed) {
    const current = await resolveSession(identity.userId, claim.session, env);
    if (current) {
      return current;
    }
    await userSession.clearSession(claim.session.roomCode);
    throw new BridgeRoomError("active_room_conflict", "Another bridge room is active.");
  }

  try {
    const response = unwrapBridgeRpcResult(await env.BRIDGE_ROOM.getByName(roomCode).joinRoom(identity));
    if (response.seat !== session.seat) {
      await userSession.clearSession(roomCode);
      await userSession.claimSession(createUserSessionRecord(roomCode, response.seat, Date.now()));
    }
    return response;
  } catch (error) {
    await userSession.clearSession(roomCode);
    throw error;
  }
}

async function getCurrentRoom(identity: BridgeIdentity, env: Env): Promise<BridgeCurrentRoomResponse> {
  const userSession = getUserSession(env, identity.userId);
  const session = await userSession.getSession();
  if (!session) {
    return { room: null, serverNow: Date.now() };
  }

  const room = await resolveSession(identity.userId, session, env);
  if (!room) {
    await userSession.clearSession(session.roomCode);
  } else if (room.seat !== session.seat) {
    await userSession.clearSession(session.roomCode);
    await userSession.claimSession(createUserSessionRecord(room.roomCode, room.seat, Date.now()));
  }

  return { room: room ?? null, serverNow: Date.now() };
}

function resolveSession(
  userId: string,
  session: BridgeUserSessionRecord,
  env: Env,
): Promise<BridgeRoomResponse | undefined> {
  return env.BRIDGE_ROOM.getByName(session.roomCode).getRoomForUser(userId);
}

function getUserSession(env: Env, userId: string): DurableObjectStub<BridgeUserSession> {
  return env.BRIDGE_USER_SESSION.getByName(userId);
}

function createUserSessionRecord(
  roomCode: string,
  seat: HumanBridgeSeat,
  now: number,
): BridgeUserSessionRecord {
  return {
    roomCode,
    seat,
    expiresAt: now + ACTIVE_ROOM_TTL_MS,
    updatedAt: now,
  };
}

function unwrapBridgeRpcResult<T>(result: BridgeRpcResult<T>): T {
  if (result.ok) {
    return result.value;
  }
  throw new BridgeRoomError(result.error.code, result.error.message);
}

function applyClientCommand(game: SheddingGameState, command: BridgeClientCommand): SheddingGameState {
  const action: SheddingAction = command.type === "play_cards"
    ? {
        type: "play_cards",
        cardIds: command.cardIds,
        ...(command.declaredSuit ? { declaredSuit: command.declaredSuit } : {}),
      }
    : { type: command.type };
  return applySheddingAction(game, action);
}

function createSafeFallbackAction(game: SheddingGameState): SheddingAction | null {
  if (game.phase === "round_complete") {
    return { type: "next_round" };
  }

  if (game.phase === "playing") {
    const cardId = getLegalSheddingCardIds(game)[0];
    if (!cardId) return { type: "draw_card" };
    const declaredSuit = cardId.endsWith("J") ? "clubs" : undefined;
    return { type: "play_cards", cardIds: [cardId], ...(declaredSuit ? { declaredSuit } : {}) };
  }

  return null;
}

function createHumanPlayer(identity: BridgeIdentity, joinedAt: number): HumanPlayerRecord {
  return {
    userId: identity.userId,
    displayName: identity.displayName,
    joinedAt,
  };
}

function createHumanPlayerSnapshot(player: HumanPlayerRecord, connected: boolean): BridgePlayerSnapshot {
  return {
    kind: "human",
    displayName: player.displayName,
    connected: connected && !player.leftAt,
    left: Boolean(player.leftAt),
  };
}

function createOpenPlayerSnapshot(): BridgePlayerSnapshot {
  return { kind: "open", displayName: "Waiting for player", connected: false, left: false };
}

function getHumanPlayers(record: BridgeRoomRecord): HumanPlayerRecord[] {
  return [record.humans.south, record.humans.west].filter(
    (player): player is HumanPlayerRecord => Boolean(player),
  );
}

function requireRoomCode(value: string | undefined): string {
  const roomCode = normalizeRoomCode(value);
  if (!roomCode) {
    throw new BridgeRoomError("bad_room_code", "Invalid bridge room code.");
  }
  return roomCode;
}

function getRoomErrorStatus(code: string): number {
  if (code === "bad_room_code") return 400;
  if (code === "room_not_found") return 404;
  if (code === "not_room_member") return 403;
  if (code === "room_code_exhausted") return 503;
  return 409;
}

function sendSocketMessage(ws: WebSocket, message: BridgeServerMessage<BridgeRoomSnapshot>): void {
  try {
    ws.send(JSON.stringify(message));
  } catch {
    // Hibernated WebSockets are pruned by the runtime; broadcasts remain best-effort.
  }
}

function json(payload: unknown, status = 200, env?: BridgeAuthEnv): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...corsHeaders(env),
    },
  });
}

function corsHeaders(env?: BridgeAuthEnv): HeadersInit {
  const headers: Record<string, string> = {
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-telegram-init-data, x-bridge-dev-user-id, x-bridge-dev-user-name",
  };
  if (env?.ENVIRONMENT === "development") {
    headers["access-control-allow-origin"] = "*";
  }
  return headers;
}

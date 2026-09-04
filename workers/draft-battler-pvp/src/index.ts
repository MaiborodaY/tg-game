import { DurableObject } from "cloudflare:workers";
import {
  getExpiryReconciliation,
  type ExpiryReconciliation,
} from "./expiryLifecycle";
import {
  RULESET_VERSION,
  MatchDomainError,
  applyMatchIntent,
  areSeatsReady,
  claimSeat,
  createMatch,
  createPlayerMatchSnapshot,
  createRoom,
  createRoomSnapshot,
  disconnectSeat,
  expireMatch,
  forfeitDisconnectedPlayer,
  getDisconnectedSeatReleaseRole,
  getDisconnectForfeitRole,
  isCurrentMatchState,
  isCurrentRoomState,
  isMatchExpired,
  isRematchReady,
  releaseDisconnectedSeat,
  setSeatReady,
  startRematch,
  touchSeat,
  type MatchIntent,
  type MatchState,
  type PlayerRole,
  type PlayerMatchSnapshot,
  type RoomSnapshot,
  type RoomState,
} from "./matchDomain";
import {
  MAX_SOCKET_MESSAGE_BYTES,
  consumeRateLimit,
  createRoomCode,
  createSeatToken,
  createSocketTicket,
  hashSeatToken,
  isAllowedOrigin,
  isSocketTicketValid,
  normalizeRoomId,
  parseClientMessage,
  readJsonBody,
  readSeatToken,
  tokensMatch,
  type PvpClientMessage,
  type PvpErrorCode,
  type SocketTicketRecord,
} from "./protocol";
import {
  getEnabledPvpBinding,
  isPvpEnabled,
  type PvpFeatureEnvironment,
} from "./releasePolicy";
import { settleExpiredOpponentAfterReconnect } from "./reconnectLifecycle";
import { getNextRoomAlarmAt } from "./roomAlarm";
import {
  createBroBattlerRankingCandidate,
  readBroBattlerLeaderboard,
  settleBroBattlerMatch,
  settleBroBattlerRankingCandidate,
  type BroBattlerRankingCandidate,
} from "./ranking";
import {
  TelegramAuthError,
  authenticateOptionalTelegramRequest,
  type TelegramPlayerIdentity,
} from "./telegramAuth";

export { getEnabledPvpBinding, isPvpEnabled } from "./releasePolicy";
export type { PvpEnabledFlag, PvpFeatureEnvironment } from "./releasePolicy";

export interface Env extends PvpFeatureEnvironment {
  DRAFT_PVP_ROOM: DurableObjectNamespace<DraftPvpRoom>;
  WOL_DB: D1Database;
  BOT_TOKEN?: string;
  PVP_ALLOWED_ORIGINS?: string;
  ENVIRONMENT?: string;
}

interface SocketAttachment {
  role: PlayerRole;
  tokenHash: string;
  connectionId: string;
  windowStartedAt: number;
  messageCount: number;
}

interface RoomSessionResponse {
  ok: true;
  roomId: string;
  seat: PlayerRole;
  seatToken: string;
  socketTicket: string;
  snapshot: ViewerRoomSnapshot;
}

type ViewerRoomSnapshot = RoomSnapshot & { match?: PlayerMatchSnapshot };

interface ServerSnapshotMessage {
  type: "connected" | "snapshot";
  roomId: string;
  seat?: PlayerRole;
  snapshot: ViewerRoomSnapshot;
}

interface ServerErrorMessage {
  type: "error";
  code: PvpErrorCode;
  message: string;
}

const API_PREFIX = "/api/pvp";
const WORKER_NAME = "draft-battler-pvp";
const ROOM_STORAGE_KEY = "room:v2";
const MATCH_STORAGE_KEY = "match:v2";
const SOCKET_TICKET_STORAGE_PREFIX = "socket-ticket:v1:";
const INTERNAL_CREATE_PATH = "/internal/create";
const INTERNAL_USER_ID_HEADER = "x-draft-user-id";
const INTERNAL_USER_NAME_HEADER = "x-draft-user-name";
const PENDING_RANKINGS_STORAGE_KEY = "ranking-pending:v1";
const CREATE_ROOM_ATTEMPTS = 4;

interface PendingRanking {
  candidate: BroBattlerRankingCandidate;
}

export class DraftPvpRoom extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === INTERNAL_CREATE_PATH && request.method === "POST") {
      return this.createHostSession(
        request.headers.get("x-pvp-room-id") ?? "",
        readTrustedTelegramIdentity(request),
      );
    }

    const route = parseRoomRoute(url.pathname);
    if (!route) {
      return errorResponse("room_not_found", "Room not found.", 404);
    }

    if (route.action === "socket") {
      return this.handleSocket(request, route.roomId);
    }

    if (request.method !== "POST") {
      return errorResponse("bad_request", "Method not allowed.", 405);
    }

    const body = await readJsonBody(request);
    if (!body) {
      return errorResponse("bad_request", "Invalid request body.", 400);
    }

    if (route.action === "join" && hasExactKeys(body, [])) {
      return this.createGuestSession(route.roomId, readTrustedTelegramIdentity(request));
    }

    if ((route.action === "reconnect" || route.action === "socket_ticket") && hasExactKeys(body, ["seatToken"])) {
      const seatToken = readSeatToken(body.seatToken);
      return seatToken
        ? this.reconnectSession(route.roomId, seatToken, readTrustedTelegramIdentity(request))
        : errorResponse("invalid_token", "Invalid room token.", 403);
    }

    return errorResponse("bad_request", "Invalid room action.", 400);
  }

  async webSocketMessage(ws: WebSocket, rawMessage: string | ArrayBuffer): Promise<void> {
    const attachment = getSocketAttachment(ws);
    if (!attachment) {
      sendSocketError(ws, "invalid_token", "Socket is not authenticated.");
      ws.close(1008, "Unauthenticated socket");
      return;
    }

    const now = Date.now();
    const nextRate = consumeRateLimit(attachment, now);
    ws.serializeAttachment({ ...attachment, ...nextRate } satisfies SocketAttachment);
    if (!nextRate.allowed) {
      sendSocketError(ws, "rate_limited", "Too many messages.");
      ws.close(1008, "Rate limit exceeded");
      return;
    }

    if (typeof rawMessage !== "string"
      || rawMessage.length > MAX_SOCKET_MESSAGE_BYTES
      || new TextEncoder().encode(rawMessage).byteLength > MAX_SOCKET_MESSAGE_BYTES) {
      sendSocketError(ws, "message_too_large", "Message is too large.");
      return;
    }

    const message = parseClientMessage(rawMessage);
    if (!message) {
      sendSocketError(ws, "bad_request", "Invalid message.");
      return;
    }

    try {
      await this.handleClientMessage(ws, attachment, message, now);
    } catch (error) {
      const code = readDomainErrorCode(error);
      sendSocketError(ws, code, error instanceof Error ? error.message : "Action rejected.");
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    await this.handleSocketDisconnect(ws);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.handleSocketDisconnect(ws);
  }

  async alarm(): Promise<void> {
    const now = Date.now();
    const settledRankings = await this.flushPendingRankings();
    let room = await this.readRoom();
    let match = await this.readMatch();
    if (!room) {
      await this.ctx.storage.deleteAlarm();
      return;
    }
    if (match?.rankingStatus === "pending") {
      const settledStatus = settledRankings.get(match.matchId);
      if (settledStatus) {
        match = { ...match, rankingStatus: settledStatus };
        await this.writeMatch(match);
      }
    }

    const disconnectedRole = match?.phase !== "finished" ? getDisconnectForfeitRole(room, now) : undefined;
    if (match && disconnectedRole) {
      match = forfeitDisconnectedPlayer(match, disconnectedRole, now);
      await this.writeMatch(match);
      match = await this.settleFinishedMatch(room, match);
    }

    if (match?.phase === "finished" && match.rankingStatus === undefined) {
      match = await this.settleFinishedMatch(room, match);
    }

    if (match && isMatchExpired(match, now)) {
      if (match.phase === "finished") {
        await this.deleteRoom("Room expired.");
        return;
      }

      match = expireMatch(match, now);
      await this.writeMatch(match);
      match = await this.settleFinishedMatch(room, match);
    }

    if (!match) {
      const releaseRole = getDisconnectedSeatReleaseRole(room, now);
      if (releaseRole === "host" || now >= room.expiresAt) {
        await this.deleteRoom("Room expired.");
        return;
      }
      if (releaseRole === "guest") {
        room = releaseDisconnectedSeat(room, releaseRole, now);
        await this.writeRoom(room);
      }
    }

    room = await this.readRoom();
    if (room) {
      await this.scheduleAlarm(room, match);
      await this.broadcastSnapshots(room, match);
    }
  }

  private async createHostSession(rawRoomId: string, identity?: TelegramPlayerIdentity): Promise<Response> {
    const roomId = normalizeRoomId(rawRoomId);
    if (!roomId || await this.readRoom()) {
      return errorResponse("action_rejected", "Room code collision.", 409);
    }

    const now = Date.now();
    const seatToken = createSeatToken();
    const tokenHash = await hashSeatToken(seatToken);
    const connectionId = `http:${crypto.randomUUID()}`;
    let room = createRoom({ roomId, now });
    const claim = claimSeat(room, { issuedTokenHash: tokenHash, connectionId, now, identity });
    room = disconnectSeat(claim.room, { role: claim.role, tokenHash, connectionId, now });
    await this.writeRoom(room);
    await this.scheduleAlarm(room);

    return json(await this.createSessionResponse(room, undefined, claim.role, seatToken));
  }

  private async createGuestSession(roomId: string, identity?: TelegramPlayerIdentity): Promise<Response> {
    let room = await this.readRoom();
    if (!room || room.roomId !== roomId || Date.now() >= room.expiresAt) {
      return errorResponse("room_not_found", "Room not found.", 404);
    }

    const now = Date.now();
    const seatToken = createSeatToken();
    const tokenHash = await hashSeatToken(seatToken);
    const connectionId = `http:${crypto.randomUUID()}`;
    try {
      const claim = claimSeat(room, { issuedTokenHash: tokenHash, connectionId, now, identity });
      if (claim.role !== "guest" || claim.reconnected) {
        return errorResponse("room_full", "Room is full.", 409);
      }
      room = disconnectSeat(claim.room, { role: claim.role, tokenHash, connectionId, now });
      await this.writeRoom(room);
      await this.scheduleAlarm(room);
      await this.broadcastSnapshots(room, await this.readMatch());
      return json(await this.createSessionResponse(room, await this.readMatch(), claim.role, seatToken));
    } catch (error) {
      if (error instanceof MatchDomainError && error.code === "same_player") {
        return errorResponse("same_player", error.message, 409);
      }
      return errorResponse("room_full", "Room is full.", 409);
    }
  }

  private async reconnectSession(
    roomId: string,
    seatToken: string,
    identity?: TelegramPlayerIdentity,
  ): Promise<Response> {
    const expiry = await this.reconcileExpiry(Date.now());
    const room = expiry.status === "missing" ? undefined : expiry.room;
    const match = expiry.status === "missing" ? undefined : expiry.match;
    if (!room || room.roomId !== roomId) {
      return errorResponse("room_not_found", "Room not found.", 404);
    }

    const tokenHash = await hashSeatToken(seatToken);
    const role = findSeatRoleByTokenHash(room, tokenHash);
    if (!role) {
      return errorResponse("invalid_token", "Invalid room token.", 403);
    }
    const seatIdentity = room.seats[role]?.identity;
    if (identity && seatIdentity && identity.userId !== seatIdentity.userId) {
      return errorResponse("invalid_token", "This room seat belongs to another Telegram player.", 403);
    }

    // Reconnect bootstrap is deliberately read-only. The existing socket remains authoritative
    // until the replacement WebSocket has authenticated and atomically claimed the seat.
    return json(await this.createSessionResponse(room, match, role, seatToken));
  }

  private async handleSocket(request: Request, roomId: string): Promise<Response> {
    if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
      return errorResponse("bad_request", "Expected WebSocket upgrade.", 426);
    }

    const now = Date.now();
    const expiry = await this.reconcileExpiry(now);
    const socketTicket = readSeatToken(new URL(request.url).searchParams.get("ticket"));
    let room = expiry.status === "missing" ? undefined : expiry.room;
    let match = expiry.status === "missing" ? undefined : expiry.match;
    if (!socketTicket || !room || room.roomId !== roomId) {
      return errorResponse("invalid_token", "Invalid room token.", 403);
    }

    const presentedTicketHash = await hashSeatToken(socketTicket);
    let ticketRecord: SocketTicketRecord | undefined;
    let ticketStorageKey: string | undefined;
    for (const role of ["host", "guest"] as const) {
      const candidate = await this.ctx.storage.get<SocketTicketRecord>(getSocketTicketStorageKey(role));
      if (candidate && tokensMatch(candidate.ticketHash, presentedTicketHash)) {
        ticketRecord = candidate;
        ticketStorageKey = getSocketTicketStorageKey(role);
        break;
      }
    }
    if (!ticketRecord || !ticketStorageKey) {
      return errorResponse("invalid_token", "Invalid or expired socket ticket.", 403);
    }
    // A matching credential is consumed before validation, including an expired replay.
    await this.ctx.storage.delete(ticketStorageKey);
    if (!await isSocketTicketValid(ticketRecord, socketTicket, now)) {
      return errorResponse("invalid_token", "Invalid or expired socket ticket.", 403);
    }

    const { role, tokenHash } = ticketRecord;
    const seat = room.seats[role];
    const reconnectGraceExpired = match?.phase !== "finished"
      && seat?.connected === false
      && seat.disconnectDeadline !== undefined
      && now >= seat.disconnectDeadline;
    if (!seat || !tokensMatch(seat.tokenHash, tokenHash) || reconnectGraceExpired) {
      return errorResponse("invalid_token", "Invalid room token.", 403);
    }
    const connectionId = crypto.randomUUID();
    try {
      const claim = claimSeat(room, {
        presentedTokenHash: tokenHash,
        issuedTokenHash: tokenHash,
        connectionId,
        now,
      });
      if (!claim.reconnected) {
        return errorResponse("invalid_token", "Invalid room token.", 403);
      }
      if (claim.role !== role) {
        return errorResponse("invalid_token", "Socket ticket belongs to another seat.", 403);
      }
      room = claim.room;
    } catch {
      return errorResponse("invalid_token", "Invalid room token.", 403);
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.serializeAttachment({
      role,
      tokenHash,
      connectionId,
      windowStartedAt: now,
      messageCount: 0,
    } satisfies SocketAttachment);
    this.ctx.acceptWebSocket(server);
    await this.writeRoom(room);
    const reconnectSettlement = settleExpiredOpponentAfterReconnect(room, match, now);
    match = reconnectSettlement.match;
    if (reconnectSettlement.forfeitedRole && match) {
      await this.writeMatch(match);
      match = await this.settleFinishedMatch(room, match);
    }
    await this.scheduleAlarm(room, match);
    // Retire the old connection only after the replacement is accepted and durable seat ownership
    // points at it. A failed replacement handshake must not evict the still-working socket.
    closePreviousSeatSockets(this.ctx.getWebSockets(), role, connectionId);
    sendSocketMessage(server, {
      type: "connected",
      roomId,
      seat: role,
      snapshot: await this.createViewerSnapshot(room, match, role),
    });
    await this.broadcastSnapshots(room, match, server);
    return new Response(null, { status: 101, webSocket: client });
  }

  private async handleClientMessage(
    ws: WebSocket,
    attachment: SocketAttachment,
    message: PvpClientMessage,
    now: number,
  ): Promise<void> {
    const expiry = await this.reconcileExpiry(now);
    if (expiry.status === "missing") {
      throw new Error("Room expired before the action was received.");
    }
    if (expiry.status === "match_expired") {
      throw new Error("Match expired before the action was received.");
    }

    let room = await this.requireAuthenticatedRoom(attachment, now, expiry.room);
    let match = expiry.match;

    if (message.type === "ping") {
      sendSocketMessage(ws, { type: "pong", serverNow: now });
      return;
    }

    if (message.type === "leave") {
      if (match && match.phase !== "finished") {
        match = applyMatchIntent(match, attachment.role, {
          type: "forfeit",
          matchId: match.matchId,
          round: match.round,
        }, now).state;
        await this.writeMatch(match);
        match = await this.settleFinishedMatch(room, match);
      }
      await this.writeRoom(disconnectSeat(room, {
        role: attachment.role,
        tokenHash: attachment.tokenHash,
        connectionId: attachment.connectionId,
        now,
      }));
      await this.broadcastSnapshots(await this.requireRoom(), match);
      ws.close(1000, "Left room");
      return;
    }

    if (message.type === "set_ready") {
      if (match) {
        throw new Error("Match has already started.");
      }
      room = setSeatReady(room, {
        role: attachment.role,
        tokenHash: attachment.tokenHash,
        connectionId: attachment.connectionId,
        ready: message.ready,
        now,
      });
      if (areSeatsReady(room)) {
        match = createMatch({ matchId: createMatchId(), seed: createMatchSeed(room.roomId), now });
        await this.writeMatch(match);
      }
      await this.writeRoom(room);
      await this.scheduleAlarm(room, match);
      await this.broadcastSnapshots(room, match);
      return;
    }

    if (!match) {
      throw new Error("Match has not started.");
    }

    assertCurrentMatch(message, match);
    const intent = toMatchIntent(message);
    match = applyMatchIntent(match, attachment.role, intent, now).state;
    await this.writeMatch(match);
    match = await this.settleFinishedMatch(room, match);
    if (message.type === "rematch" && isRematchReady(match)) {
      match = startRematch(match, { matchId: createMatchId(), seed: createMatchSeed(room.roomId), now });
    }

    await this.writeMatch(match);
    await this.scheduleAlarm(room, match);
    await this.broadcastSnapshots(room, match);
  }

  private async handleSocketDisconnect(ws: WebSocket): Promise<void> {
    const attachment = getSocketAttachment(ws);
    const room = await this.readRoom();
    if (!attachment || !room) {
      return;
    }

    const now = Date.now();
    const nextRoom = disconnectSeat(room, {
      role: attachment.role,
      tokenHash: attachment.tokenHash,
      connectionId: attachment.connectionId,
      now,
    });
    // A replaced socket may close after the new connection is stored. In that case the domain
    // keeps the newer seat connected, and the stale close must not broadcast a false disconnect.
    const nextSeat = nextRoom.seats[attachment.role];
    if (nextSeat?.connected || nextSeat?.connectionId !== attachment.connectionId) {
      return;
    }
    await this.writeRoom(nextRoom);
    const match = await this.readMatch();
    await this.scheduleAlarm(nextRoom, match);
    await this.broadcastSnapshots(nextRoom, match);
  }

  private async requireAuthenticatedRoom(
    attachment: SocketAttachment,
    now: number,
    currentRoom?: RoomState,
  ): Promise<RoomState> {
    const room = currentRoom ?? await this.requireRoom();
    const seat = room.seats[attachment.role];
    if (!seat || !tokensMatch(seat.tokenHash, attachment.tokenHash)) {
      throw new Error("Invalid room token.");
    }

    const nextRoom = touchSeat(room, {
      role: attachment.role,
      tokenHash: attachment.tokenHash,
      connectionId: attachment.connectionId,
      now,
    });
    await this.writeRoom(nextRoom);
    return nextRoom;
  }

  private async requireRoom(): Promise<RoomState> {
    const room = await this.readRoom();
    if (!room) {
      throw new Error("Room not found.");
    }
    return room;
  }

  private async createSessionResponse(
    room: RoomState,
    match: MatchState | undefined,
    role: PlayerRole,
    seatToken: string,
  ): Promise<RoomSessionResponse> {
    const issuedTicket = await createSocketTicket(role, await hashSeatToken(seatToken), Date.now());
    await this.ctx.storage.put(getSocketTicketStorageKey(role), issuedTicket.record);
    return {
      ok: true,
      roomId: room.roomId,
      seat: role,
      seatToken,
      socketTicket: issuedTicket.ticket,
      snapshot: await this.createViewerSnapshot(room, match, role),
    };
  }

  private async createViewerSnapshot(
    room: RoomState,
    match: MatchState | undefined,
    role: PlayerRole,
  ): Promise<ViewerRoomSnapshot> {
    const now = Date.now();
    const roomSnapshot = createRoomSnapshot(room, role, now, match?.phase);
    return {
      ...roomSnapshot,
      match: match ? createPlayerMatchSnapshot(match, role, now) : undefined,
      serverNow: now,
    };
  }

  private async broadcastSnapshots(room: RoomState, match?: MatchState, except?: WebSocket): Promise<void> {
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === except) {
        continue;
      }
      const attachment = getSocketAttachment(ws);
      if (!attachment) {
        continue;
      }
      sendSocketMessage(ws, {
        type: "snapshot",
        roomId: room.roomId,
        snapshot: await this.createViewerSnapshot(room, match, attachment.role),
      });
    }
  }

  private async settleFinishedMatch(room: RoomState, match: MatchState): Promise<MatchState> {
    if (match.phase !== "finished" || match.rankingStatus) {
      return match;
    }

    const candidate = createBroBattlerRankingCandidate(room, match);
    if (!candidate) {
      const unranked = { ...match, rankingStatus: "unranked" as const };
      await this.writeMatch(unranked);
      return unranked;
    }

    try {
      const status = await settleBroBattlerMatch(this.env.WOL_DB, room, match);
      const settled = { ...match, rankingStatus: status };
      await this.writeMatch(settled);
      return settled;
    } catch (error) {
      await this.enqueuePendingRanking(candidate);
      const pending = { ...match, rankingStatus: "pending" as const };
      await this.writeMatch(pending);
      console.error("BroBattler ranking settlement queued", { matchId: match.matchId, error });
      return pending;
    }
  }

  private async enqueuePendingRanking(candidate: BroBattlerRankingCandidate): Promise<void> {
    const pending = await this.readPendingRankings();
    if (!pending.some((entry) => entry.candidate.matchId === candidate.matchId)) {
      pending.push({ candidate });
      await this.ctx.storage.put(PENDING_RANKINGS_STORAGE_KEY, pending);
    }
  }

  private async flushPendingRankings(): Promise<Map<string, "recorded" | "unranked">> {
    const pending = await this.readPendingRankings();
    const remaining: PendingRanking[] = [];
    const settled = new Map<string, "recorded" | "unranked">();
    for (const entry of pending) {
      try {
        settled.set(entry.candidate.matchId, await settleBroBattlerRankingCandidate(this.env.WOL_DB, entry.candidate));
      } catch (error) {
        remaining.push(entry);
        console.error("BroBattler ranking settlement retry failed", {
          matchId: entry.candidate.matchId,
          error,
        });
      }
    }
    if (remaining.length > 0) {
      await this.ctx.storage.put(PENDING_RANKINGS_STORAGE_KEY, remaining);
    } else if (pending.length > 0) {
      await this.ctx.storage.delete(PENDING_RANKINGS_STORAGE_KEY);
    }
    return settled;
  }

  private async readPendingRankings(): Promise<PendingRanking[]> {
    const value = await this.ctx.storage.get<unknown>(PENDING_RANKINGS_STORAGE_KEY);
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is PendingRanking => Boolean(
      entry && typeof entry === "object" && "candidate" in entry,
    ));
  }

  private async readRoom(): Promise<RoomState | undefined> {
    const room = await this.ctx.storage.get<unknown>(ROOM_STORAGE_KEY);
    if (room !== undefined && !isCurrentRoomState(room)) {
      await this.deleteRoom("Room belongs to an older game version.");
      return undefined;
    }
    return room;
  }

  private async writeRoom(room: RoomState): Promise<void> {
    await this.ctx.storage.put(ROOM_STORAGE_KEY, room);
  }

  private async readMatch(): Promise<MatchState | undefined> {
    const match = await this.ctx.storage.get<unknown>(MATCH_STORAGE_KEY);
    if (match !== undefined && !isCurrentMatchState(match)) {
      await this.deleteRoom("Match belongs to an older game version.");
      throw new Error("Persisted match is incompatible with the current ruleset.");
    }
    return match;
  }

  private async writeMatch(match: MatchState): Promise<void> {
    await this.ctx.storage.put(MATCH_STORAGE_KEY, match);
  }

  private async reconcileExpiry(now: number): Promise<ExpiryReconciliation> {
    const expiry = getExpiryReconciliation(await this.readRoom(), await this.readMatch(), now);
    if (expiry.status === "delete") {
      await this.deleteRoom("Room expired.");
      return { status: "missing" };
    }
    if (expiry.status === "match_expired") {
      await this.writeMatch(expiry.match);
      const settledMatch = await this.settleFinishedMatch(expiry.room, expiry.match);
      await this.scheduleAlarm(expiry.room, settledMatch);
      await this.broadcastSnapshots(expiry.room, settledMatch);
    }
    return expiry;
  }

  private async scheduleAlarm(room: RoomState, match?: MatchState): Promise<void> {
    const now = Date.now();
    const hasPendingRanking = (await this.readPendingRankings()).length > 0;
    const nextAlarmAt = getNextRoomAlarmAt(room, match, now, hasPendingRanking);
    if (Number.isFinite(nextAlarmAt)) {
      await this.ctx.storage.setAlarm(nextAlarmAt);
    } else {
      await this.ctx.storage.deleteAlarm();
    }
  }

  private async deleteRoom(message: string): Promise<void> {
    for (const ws of this.ctx.getWebSockets()) {
      ws.close(1000, message);
    }
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/" || url.pathname === "/health" || url.pathname === `${API_PREFIX}/health`) {
      return json({
        ok: true,
        service: WORKER_NAME,
        apiPrefix: API_PREFIX,
        rulesetVersion: RULESET_VERSION,
        pvpEnabled: isPvpEnabled(env),
        serverNow: Date.now(),
      });
    }

    if (!isAllowedOrigin(request, env.PVP_ALLOWED_ORIGINS, env.ENVIRONMENT === "development")) {
      return errorResponse("origin_forbidden", "Origin is not allowed.", 403);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const roomNamespace = getEnabledPvpBinding(env);
    if (!roomNamespace) {
      return errorResponse("pvp_disabled", "PvP is disabled for this release.", 404, request);
    }

    let identity: TelegramPlayerIdentity | undefined;
    try {
      identity = await authenticateOptionalTelegramRequest(request, env);
    } catch (error) {
      if (error instanceof TelegramAuthError) {
        return errorResponse(error.code, error.message, error.status, request);
      }
      return errorResponse("invalid_init_data", "Invalid Telegram authentication.", 401, request);
    }

    if (request.method === "POST" && url.pathname === `${API_PREFIX}/leaderboard`) {
      const body = await readJsonBody(request);
      if (!body || !hasExactKeys(body, [])) {
        return errorResponse("bad_request", "Invalid leaderboard request.", 400, request);
      }
      try {
        return json({ ok: true, ...(await readBroBattlerLeaderboard(env.WOL_DB, identity)) }, 200, request);
      } catch (error) {
        console.error("BroBattler leaderboard read failed", { error });
        return errorResponse("rating_unavailable", "Leaderboard is temporarily unavailable.", 503, request);
      }
    }

    if (request.method === "POST" && url.pathname === `${API_PREFIX}/rooms`) {
      const body = await readJsonBody(request);
      if (!body || !hasExactKeys(body, [])) {
        return errorResponse("bad_request", "Invalid create-room request.", 400, request);
      }

      for (let attempt = 0; attempt < CREATE_ROOM_ATTEMPTS; attempt += 1) {
        const roomId = createRoomCode();
        const response = await roomNamespace.getByName(roomId).fetch(new Request(`https://room.invalid${INTERNAL_CREATE_PATH}`, {
          method: "POST",
          headers: createTrustedRoomHeaders(undefined, identity, { "x-pvp-room-id": roomId }),
        }));
        if (response.status !== 409) {
          return withCors(response, request);
        }
      }
      return errorResponse("action_rejected", "Could not allocate a room.", 503, request);
    }

    const route = parseRoomRoute(url.pathname);
    if (!route) {
      return errorResponse("room_not_found", "Room not found.", 404, request);
    }

    const forwardedRequest = route.action === "socket"
      ? request
      : new Request(request, { headers: createTrustedRoomHeaders(request, identity) });
    const response = await roomNamespace.getByName(route.roomId).fetch(forwardedRequest);
    return route.action === "socket" ? response : withCors(response, request);
  },
};

function parseRoomRoute(pathname: string): { roomId: string; action: "join" | "reconnect" | "socket_ticket" | "socket" } | undefined {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length !== 5 || parts[0] !== "api" || parts[1] !== "pvp" || parts[2] !== "rooms") {
    return undefined;
  }

  const roomId = normalizeRoomId(parts[3]);
  const action = parts[4];
  const normalizedAction = action === "socket-ticket" ? "socket_ticket" : action;
  return roomId && (normalizedAction === "join" || normalizedAction === "reconnect" || normalizedAction === "socket_ticket" || normalizedAction === "socket")
    ? { roomId, action: normalizedAction }
    : undefined;
}

function toMatchIntent(message: Exclude<PvpClientMessage, { type: "ping" | "set_ready" | "leave" }>): MatchIntent {
  const base = { matchId: message.matchId, round: message.round };
  switch (message.type) {
    case "pick":
      return {
        ...base,
        type: "pick",
        cardId: message.cardId,
        targetSlotIndex: message.targetSlotIndex,
        allowReplacement: message.allowReplacement,
      };
    case "move":
      return {
        ...base,
        type: "move",
        sourceSlotIndex: message.sourceSlotIndex,
        targetSlotIndex: message.targetSlotIndex,
      };
    case "reroll":
    case "lock":
    case "next_ready":
    case "forfeit":
    case "rematch":
      return { ...base, type: message.type };
  }
}

function assertCurrentMatch(
  message: Exclude<PvpClientMessage, { type: "ping" | "set_ready" | "leave" }>,
  match: MatchState,
): void {
  if (message.matchId !== match.matchId || ("round" in message && message.round !== match.round)) {
    const error = new Error("Match state is stale.");
    error.name = "stale_match";
    throw error;
  }
}

function getSocketAttachment(ws: WebSocket): SocketAttachment | undefined {
  const value = ws.deserializeAttachment() as Partial<SocketAttachment> | undefined;
  return value
    && (value.role === "host" || value.role === "guest")
    && typeof value.tokenHash === "string"
    && typeof value.connectionId === "string"
    && typeof value.windowStartedAt === "number"
    && typeof value.messageCount === "number"
    ? value as SocketAttachment
    : undefined;
}

function closePreviousSeatSockets(sockets: WebSocket[], role: PlayerRole, nextConnectionId: string): void {
  for (const socket of sockets) {
    const attachment = getSocketAttachment(socket);
    if (attachment?.role === role && attachment.connectionId !== nextConnectionId) {
      socket.close(1000, "Reconnected from another client");
    }
  }
}

function findSeatRoleByTokenHash(room: RoomState, tokenHash: string): PlayerRole | undefined {
  return (["host", "guest"] as const).find((role) => {
    const storedHash = room.seats[role]?.tokenHash;
    return storedHash ? tokensMatch(storedHash, tokenHash) : false;
  });
}

function createTrustedRoomHeaders(
  request: Request | undefined,
  identity: TelegramPlayerIdentity | undefined,
  extra: Record<string, string> = {},
): Headers {
  const headers = new Headers(extra);
  const contentType = request?.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  if (identity) {
    headers.set(INTERNAL_USER_ID_HEADER, identity.userId);
    headers.set(INTERNAL_USER_NAME_HEADER, identity.displayName);
  }
  return headers;
}

function readTrustedTelegramIdentity(request: Request): TelegramPlayerIdentity | undefined {
  const userId = request.headers.get(INTERNAL_USER_ID_HEADER)?.trim();
  const displayName = request.headers.get(INTERNAL_USER_NAME_HEADER)?.trim();
  return userId && displayName ? { userId, displayName } : undefined;
}

function getSocketTicketStorageKey(role: PlayerRole): string {
  return `${SOCKET_TICKET_STORAGE_PREFIX}${role}`;
}

function readDomainErrorCode(error: unknown): PvpErrorCode {
  if (error instanceof MatchDomainError && (error.code === "stale_match" || error.code === "stale_round")) {
    return "stale_match";
  }
  return "action_rejected";
}

function createMatchId(): string {
  return `match-${crypto.randomUUID()}`;
}

function createMatchSeed(roomId: string): string {
  return `pvp-${roomId}-${crypto.randomUUID()}`;
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && keys.every((key) => actualKeys.includes(key));
}

function sendSocketMessage(ws: WebSocket, message: ServerSnapshotMessage | ServerErrorMessage | { type: "pong"; serverNow: number }): void {
  try {
    ws.send(JSON.stringify(message));
  } catch {
    // The runtime removes closed sockets; broadcasts stay best-effort.
  }
}

function sendSocketError(ws: WebSocket, code: PvpErrorCode, message: string): void {
  sendSocketMessage(ws, { type: "error", code, message });
}

function errorResponse(code: PvpErrorCode, message: string, status: number, request?: Request): Response {
  return json({ ok: false, code, message }, status, request);
}

function json(payload: unknown, status = 200, request?: Request): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(request ? corsHeaders(request) : {}),
    },
  });
}

function withCors(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(request)).forEach(([key, value]) => headers.set(key, value));
  headers.set("cache-control", "no-store");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-telegram-init-data",
    "access-control-max-age": "600",
    vary: "Origin",
  };
}

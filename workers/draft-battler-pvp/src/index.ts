import { DurableObject } from "cloudflare:workers";
import {
  BOARD_SLOT_COUNT,
  CARD_DEFINITIONS,
  PLAYER_STARTING_HP,
  createBoardFromSlots,
  createEmptyBoardSlots,
  isCardAllowedInSlot,
  resolveCombat,
  type BoardSlot,
  type CardId,
  type CombatResult,
} from "../../../draft-battler/src/game";

export interface Env {
  DRAFT_PVP_ROOM: DurableObjectNamespace<DraftPvpRoom>;
}

interface RoomSnapshot {
  roomId: string;
  status: "waiting" | "ready";
  connectedPeers: number;
  players: RoomPlayerSlot[];
  match?: MatchSnapshot;
  createdAt: number;
  updatedAt: number;
  serverNow: number;
}

interface RoomRecord {
  roomId: string;
  createdAt: number;
  updatedAt: number;
}

type PlayerRole = "host" | "guest";
type PeerRole = PlayerRole | "spectator";

interface RoomPlayerSlot {
  role: PlayerRole;
  peerId: string | null;
  connected: boolean;
  ready: boolean;
  joinedAt: number | null;
}

type MatchPhase = "draft" | "battle";

interface MatchSnapshot {
  matchId: string;
  seed: string;
  round: number;
  phase: MatchPhase;
  submissions: MatchSubmissionSnapshot[];
  combat?: MatchCombatSnapshot;
  updatedAt: number;
}

interface MatchRecord {
  matchId: string;
  seed: string;
  round: number;
  phase: MatchPhase;
  createdAt: number;
  updatedAt: number;
  submissions: Partial<Record<PlayerRole, MatchSubmissionRecord>>;
  combat?: MatchCombatSnapshot;
}

interface MatchSubmissionRecord {
  slots: BoardSlot[];
  submittedAt: number;
}

interface MatchSubmissionSnapshot {
  role: PlayerRole;
  submitted: boolean;
  submittedAt: number | null;
}

interface MatchCombatSnapshot {
  round: number;
  hostSlots: BoardSlot[];
  guestSlots: BoardSlot[];
  combat: CombatResult;
  hostHpBefore: number;
  hostHpAfter: number;
  guestHpBefore: number;
  guestHpAfter: number;
}

interface SocketAttachment {
  peerId: string;
  role: PeerRole;
  joinedAt: number;
  ready: boolean;
}

interface ClientMessage {
  type?: string;
  payload?: unknown;
}

interface ServerMessage {
  type: string;
  roomId: string;
  peerId?: string;
  role?: PeerRole;
  connectedPeers?: number;
  payload?: unknown;
  serverNow: number;
}

const API_PREFIX = "/api/pvp";
const WORKER_NAME = "draft-battler-pvp";
const ROOM_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{2,47}$/;
const MATCH_STORAGE_KEY = "match:v1";
const VALID_CARD_IDS = new Set<CardId>(CARD_DEFINITIONS.map((card) => card.id));

export class DraftPvpRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS room_records (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          room_id TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const route = parseRoomRoute(url.pathname);

    if (!route) {
      return json({ ok: false, error: "Unknown room route." }, 404);
    }

    if (route.action === "socket") {
      return this.handleSocket(request, route.roomId);
    }

    if (request.method !== "GET") {
      return json({ ok: false, error: "Method not allowed." }, 405);
    }

    return json({ ok: true, room: await this.getSnapshot(route.roomId) });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const attachment = getSocketAttachment(ws);
    const room = await this.readOrCreateRoom();

    if (!attachment || typeof message !== "string") {
      sendSocketMessage(ws, {
        type: "error",
        roomId: room.roomId,
        payload: { error: "Bad message." },
        serverNow: Date.now(),
      });
      return;
    }

    let data: ClientMessage;
    try {
      data = JSON.parse(message) as ClientMessage;
    } catch {
      sendSocketMessage(ws, {
        type: "error",
        roomId: room.roomId,
        peerId: attachment.peerId,
        payload: { error: "Bad JSON." },
        serverNow: Date.now(),
      });
      return;
    }

    if (data.type === "ping") {
      sendSocketMessage(ws, {
        type: "pong",
        roomId: room.roomId,
        peerId: attachment.peerId,
        role: attachment.role,
        connectedPeers: this.ctx.getWebSockets().length,
        serverNow: Date.now(),
      });
      return;
    }

    if (data.type === "set_ready") {
      const ready = readReadyPayload(data.payload);
      const nextAttachment = { ...attachment, ready };
      ws.serializeAttachment(nextAttachment satisfies SocketAttachment);
      const updatedRoom = this.touchRoom(room);
      await this.maybeStartMatch(updatedRoom);
      await this.broadcastRoomState(updatedRoom, attachment);
      return;
    }

    if (data.type === "submit_board") {
      await this.handleSubmitBoard(ws, attachment, room, data.payload);
      return;
    }

    if (data.type === "next_round") {
      await this.handleNextRound(ws, attachment, room);
      return;
    }

    this.broadcast({
      type: "peer_message",
      roomId: room.roomId,
      peerId: attachment.peerId,
      role: attachment.role,
      connectedPeers: this.ctx.getWebSockets().length,
      payload: data.payload,
      serverNow: Date.now(),
    });
  }

  async webSocketClose(): Promise<void> {
    const room = this.touchRoom(await this.readOrCreateRoom());
    await this.broadcastRoomState(room, undefined, "peer_left");
  }

  async webSocketError(): Promise<void> {
    const room = this.touchRoom(await this.readOrCreateRoom());
    await this.broadcastRoomState(room, undefined, "peer_error");
  }

  private async handleSocket(request: Request, roomId: string): Promise<Response> {
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return json({ ok: false, error: "Expected WebSocket upgrade." }, 426);
    }

    const record = this.touchRoom(await this.readOrCreateRoom(roomId));
    const peerId = crypto.randomUUID();
    const role = this.assignPeerRole();
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    server.serializeAttachment({ peerId, role, joinedAt: Date.now(), ready: false } satisfies SocketAttachment);
    this.ctx.acceptWebSocket(server);
    sendSocketMessage(server, {
      type: "connected",
      roomId: record.roomId,
      peerId,
      role,
      connectedPeers: this.ctx.getWebSockets().length,
      payload: await this.createSnapshot(record),
      serverNow: Date.now(),
    });
    await this.broadcastRoomState(record, { peerId, role }, "room_state", server);

    return new Response(null, { status: 101, webSocket: client });
  }

  private async getSnapshot(roomId: string): Promise<RoomSnapshot> {
    return this.createSnapshot(await this.readOrCreateRoom(roomId));
  }

  private async readOrCreateRoom(roomId?: string): Promise<RoomRecord> {
    const stored = this.ctx.storage.sql
      .exec<{
        roomId: string;
        createdAt: number;
        updatedAt: number;
      }>("SELECT room_id AS roomId, created_at AS createdAt, updated_at AS updatedAt FROM room_records WHERE id = 1")
      .toArray()[0];

    if (stored) {
      return stored;
    }

    const now = Date.now();
    const record: RoomRecord = {
      roomId: roomId ?? "unknown",
      createdAt: now,
      updatedAt: now,
    };

    this.ctx.storage.sql.exec(
      "INSERT INTO room_records (id, room_id, created_at, updated_at) VALUES (1, ?, ?, ?)",
      record.roomId,
      record.createdAt,
      record.updatedAt,
    );

    return record;
  }

  private async createSnapshot(record: RoomRecord): Promise<RoomSnapshot> {
    const players = this.createPlayerSlots();
    const match = await this.readMatch();

    return {
      roomId: record.roomId,
      status: players.every((player) => player.connected && player.ready) ? "ready" : "waiting",
      connectedPeers: this.ctx.getWebSockets().length,
      players,
      match: match ? createMatchSnapshot(match) : undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      serverNow: Date.now(),
    };
  }

  private async broadcastRoomState(
    record: RoomRecord,
    actor?: Pick<SocketAttachment, "peerId" | "role">,
    type = "room_state",
    except?: WebSocket,
  ): Promise<void> {
    this.broadcast(
      {
        type,
        roomId: record.roomId,
        peerId: actor?.peerId,
        role: actor?.role,
        connectedPeers: this.ctx.getWebSockets().length,
        payload: await this.createSnapshot(record),
        serverNow: Date.now(),
      },
      except,
    );
  }

  private async maybeStartMatch(record: RoomRecord): Promise<void> {
    const players = this.createPlayerSlots();
    if (!players.every((player) => player.connected && player.ready)) {
      return;
    }

    if (await this.readMatch()) {
      return;
    }

    const now = Date.now();
    await this.writeMatch({
      matchId: crypto.randomUUID(),
      seed: createMatchSeed(record.roomId, now),
      round: 1,
      phase: "draft",
      createdAt: now,
      updatedAt: now,
      submissions: {},
    });
  }

  private async handleSubmitBoard(
    ws: WebSocket,
    attachment: SocketAttachment,
    room: RoomRecord,
    payload: unknown,
  ): Promise<void> {
    if (attachment.role === "spectator") {
      sendRoomError(ws, room.roomId, "Spectators cannot submit boards.");
      return;
    }

    const match = await this.readMatch();
    if (!match || match.phase !== "draft") {
      sendRoomError(ws, room.roomId, "Match is not accepting boards.");
      return;
    }

    const submittedSlots = readSubmitBoardPayload(payload, match);
    if (!submittedSlots) {
      sendRoomError(ws, room.roomId, "Bad board submission.");
      return;
    }

    const now = Date.now();
    const submissions = {
      ...match.submissions,
      [attachment.role]: {
        slots: submittedSlots,
        submittedAt: now,
      },
    } satisfies MatchRecord["submissions"];

    let nextMatch: MatchRecord = {
      ...match,
      submissions,
      updatedAt: now,
    };

    if (submissions.host && submissions.guest) {
      const combat = resolveCombat(submissions.host.slots, submissions.guest.slots, match.round);
      nextMatch = {
        ...nextMatch,
        phase: "battle",
        combat: createMatchCombatSnapshot(match.round, submissions.host.slots, submissions.guest.slots, combat),
      };
    }

    await this.writeMatch(nextMatch);
    await this.broadcastRoomState(this.touchRoom(room), attachment);
  }

  private async handleNextRound(ws: WebSocket, attachment: SocketAttachment, room: RoomRecord): Promise<void> {
    if (attachment.role === "spectator") {
      sendRoomError(ws, room.roomId, "Spectators cannot advance rounds.");
      return;
    }

    const match = await this.readMatch();
    if (!match || match.phase !== "battle") {
      sendRoomError(ws, room.roomId, "Match is not ready for the next round.");
      return;
    }

    const now = Date.now();
    await this.writeMatch({
      matchId: match.matchId,
      seed: match.seed,
      round: match.round + 1,
      phase: "draft",
      createdAt: match.createdAt,
      updatedAt: now,
      submissions: {},
    });
    await this.broadcastRoomState(this.touchRoom(room), attachment);
  }

  private async readMatch(): Promise<MatchRecord | undefined> {
    return this.ctx.storage.get<MatchRecord>(MATCH_STORAGE_KEY);
  }

  private async writeMatch(match: MatchRecord): Promise<void> {
    await this.ctx.storage.put(MATCH_STORAGE_KEY, match);
  }

  private touchRoom(record: RoomRecord): RoomRecord {
    const updatedAt = Date.now();
    this.ctx.storage.sql.exec("UPDATE room_records SET updated_at = ? WHERE id = 1", updatedAt);

    return { ...record, updatedAt };
  }

  private assignPeerRole(): PeerRole {
    const occupiedRoles = new Set<PeerRole>();
    this.ctx.getWebSockets().forEach((ws) => {
      const attachment = getSocketAttachment(ws);
      if (attachment) {
        occupiedRoles.add(attachment.role);
      }
    });

    if (!occupiedRoles.has("host")) {
      return "host";
    }

    if (!occupiedRoles.has("guest")) {
      return "guest";
    }

    return "spectator";
  }

  private createPlayerSlots(): RoomPlayerSlot[] {
    const slots: RoomPlayerSlot[] = [
      { role: "host", peerId: null, connected: false, ready: false, joinedAt: null },
      { role: "guest", peerId: null, connected: false, ready: false, joinedAt: null },
    ];

    this.ctx.getWebSockets().forEach((ws) => {
      const attachment = getSocketAttachment(ws);
      if (!attachment || attachment.role === "spectator") {
        return;
      }

      const slot = slots.find((player) => player.role === attachment.role);
      if (slot && !slot.connected) {
        slot.peerId = attachment.peerId;
        slot.connected = true;
        slot.ready = attachment.ready;
        slot.joinedAt = attachment.joinedAt;
      }
    });

    return slots;
  }

  private broadcast(message: ServerMessage, except?: WebSocket): void {
    this.ctx.getWebSockets().forEach((ws) => {
      if (ws !== except) {
        sendSocketMessage(ws, message);
      }
    });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/health" || url.pathname === `${API_PREFIX}/health`) {
      return json({
        ok: true,
        service: WORKER_NAME,
        apiPrefix: API_PREFIX,
        serverNow: Date.now(),
      });
    }

    const route = parseRoomRoute(url.pathname);
    if (!route) {
      return json({ ok: false, error: "Not found." }, 404);
    }

    const stub = env.DRAFT_PVP_ROOM.getByName(route.roomId);
    return stub.fetch(request);
  },
};

function parseRoomRoute(pathname: string): { roomId: string; action: "snapshot" | "socket" } | undefined {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 3 || parts[0] !== "api" || parts[1] !== "pvp" || parts[2] !== "rooms") {
    return undefined;
  }

  const roomId = normalizeRoomId(parts[3]);
  if (!roomId) {
    return undefined;
  }

  return {
    roomId,
    action: parts[4] === "socket" ? "socket" : "snapshot",
  };
}

function normalizeRoomId(roomId: string | undefined): string | undefined {
  const normalized = roomId?.trim().toLowerCase();
  return normalized && ROOM_ID_PATTERN.test(normalized) ? normalized : undefined;
}

function getSocketAttachment(ws: WebSocket): SocketAttachment | undefined {
  const attachment = ws.deserializeAttachment() as Partial<SocketAttachment> | undefined;
  return typeof attachment?.peerId === "string" &&
    isPeerRole(attachment.role) &&
    typeof attachment.joinedAt === "number"
    ? { peerId: attachment.peerId, role: attachment.role, joinedAt: attachment.joinedAt, ready: attachment.ready === true }
    : undefined;
}

function isPeerRole(role: unknown): role is PeerRole {
  return role === "host" || role === "guest" || role === "spectator";
}

function readReadyPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== "object" || !("ready" in payload)) {
    return false;
  }

  return (payload as { ready?: unknown }).ready === true;
}

function readSubmitBoardPayload(payload: unknown, match: MatchRecord): BoardSlot[] | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const submission = payload as { matchId?: unknown; round?: unknown; boardSlots?: unknown };
  if (submission.matchId !== match.matchId || submission.round !== match.round) {
    return undefined;
  }

  return readBoardSlots(submission.boardSlots);
}

function readBoardSlots(value: unknown): BoardSlot[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const slots = createEmptyBoardSlots();
  const seenSlotIndexes = new Set<number>();

  for (const item of value) {
    if (!item || typeof item !== "object") {
      return undefined;
    }

    const slot = item as { slotIndex?: unknown; cardId?: unknown; upgradeLevel?: unknown };
    const slotIndex = typeof slot.slotIndex === "number" && Number.isInteger(slot.slotIndex) ? slot.slotIndex : -1;
    if (slotIndex < 0 || slotIndex >= BOARD_SLOT_COUNT) {
      return undefined;
    }

    if (seenSlotIndexes.has(slotIndex)) {
      return undefined;
    }
    seenSlotIndexes.add(slotIndex);

    const cardId = readCardId(slot.cardId);
    if (cardId === undefined) {
      return undefined;
    }

    if (cardId && !isCardAllowedInSlot(cardId, slotIndex)) {
      return undefined;
    }

    slots[slotIndex] = {
      slotIndex,
      cardId,
      upgradeLevel: cardId && slot.upgradeLevel === 1 ? 1 : 0,
    };
  }

  try {
    return createBoardFromSlots(slots, BOARD_SLOT_COUNT);
  } catch {
    return undefined;
  }
}

function readCardId(value: unknown): CardId | null | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value === "string" && VALID_CARD_IDS.has(value as CardId)) {
    return value as CardId;
  }

  return undefined;
}

function createMatchSnapshot(match: MatchRecord): MatchSnapshot {
  return {
    matchId: match.matchId,
    seed: match.seed,
    round: match.round,
    phase: match.phase,
    submissions: createSubmissionSnapshots(match.submissions),
    combat: match.combat,
    updatedAt: match.updatedAt,
  };
}

function createSubmissionSnapshots(
  submissions: MatchRecord["submissions"],
): MatchSubmissionSnapshot[] {
  return (["host", "guest"] as const).map((role) => ({
    role,
    submitted: Boolean(submissions[role]),
    submittedAt: submissions[role]?.submittedAt ?? null,
  }));
}

function createMatchCombatSnapshot(
  round: number,
  hostSlots: BoardSlot[],
  guestSlots: BoardSlot[],
  combat: CombatResult,
): MatchCombatSnapshot {
  return {
    round,
    hostSlots,
    guestSlots,
    combat,
    hostHpBefore: PLAYER_STARTING_HP,
    hostHpAfter: PLAYER_STARTING_HP - getHostHpLoss(combat),
    guestHpBefore: PLAYER_STARTING_HP,
    guestHpAfter: PLAYER_STARTING_HP - getGuestHpLoss(combat),
  };
}

function getHostHpLoss(combat: CombatResult): number {
  return combat.winner === "enemy" ? combat.hpLoss : 0;
}

function getGuestHpLoss(combat: CombatResult): number {
  if (combat.winner !== "player") {
    return 0;
  }

  return combat.survivingPlayerUnits.filter(
    (unit) => unit.abilityId !== "bulwark" && unit.abilityId !== "heal_only",
  ).length;
}

function createMatchSeed(roomId: string, now: number): string {
  return `pvp-${roomId}-${now.toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
}

function sendRoomError(ws: WebSocket, roomId: string, error: string): void {
  sendSocketMessage(ws, {
    type: "error",
    roomId,
    payload: { error },
    serverNow: Date.now(),
  });
}

function sendSocketMessage(ws: WebSocket, message: ServerMessage): void {
  try {
    ws.send(JSON.stringify(message));
  } catch {
    // Closed sockets are cleaned up by the runtime; broadcast stays best-effort.
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
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type",
  };
}

import { DurableObject } from "cloudflare:workers";

export interface Env {
  DRAFT_PVP_ROOM: DurableObjectNamespace<DraftPvpRoom>;
}

interface RoomSnapshot {
  roomId: string;
  status: "waiting" | "ready";
  connectedPeers: number;
  players: RoomPlayerSlot[];
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
      this.broadcast({
        type: "room_state",
        roomId: updatedRoom.roomId,
        peerId: attachment.peerId,
        role: attachment.role,
        connectedPeers: this.ctx.getWebSockets().length,
        payload: this.createSnapshot(updatedRoom),
        serverNow: Date.now(),
      });
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
    this.broadcast({
      type: "peer_left",
      roomId: room.roomId,
      connectedPeers: this.ctx.getWebSockets().length,
      payload: this.createSnapshot(room),
      serverNow: Date.now(),
    });
  }

  async webSocketError(): Promise<void> {
    const room = this.touchRoom(await this.readOrCreateRoom());
    this.broadcast({
      type: "peer_error",
      roomId: room.roomId,
      connectedPeers: this.ctx.getWebSockets().length,
      payload: this.createSnapshot(room),
      serverNow: Date.now(),
    });
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
    this.broadcast(
      {
        type: "room_state",
        roomId: record.roomId,
        peerId,
        role,
        connectedPeers: this.ctx.getWebSockets().length,
        payload: this.createSnapshot(record),
        serverNow: Date.now(),
      },
      server,
    );

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

  private createSnapshot(record: RoomRecord): RoomSnapshot {
    const players = this.createPlayerSlots();

    return {
      roomId: record.roomId,
      status: players.every((player) => player.connected && player.ready) ? "ready" : "waiting",
      connectedPeers: this.ctx.getWebSockets().length,
      players,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      serverNow: Date.now(),
    };
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

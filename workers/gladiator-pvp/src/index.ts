import { DurableObject } from "cloudflare:workers";
import {
  actionOrder,
  canUseTurnAction,
  choosePlayerAutoAction,
  resolveDuoBossHelperPlayerTurn,
  resolveDuoBossSkippedDefeatedAllyTurn,
  resolveEnemyTurn,
  resolvePvpTurn,
  type ActionId,
  type CombatState,
  type TurnOwner,
} from "../../../gladiator-arena/src/combat";
import {
  createArenaBossEncounter,
  createOnlineDuoBossCombatStateFromHeroes,
  createPvpCombatStateFromHeroes,
  getArenaBossDefinition,
  type HeroState,
} from "../../../gladiator-arena/src/hero";
import {
  getPvpActorForSeat,
  getPvpSeatForActor,
  toViewerPvpSnapshot,
  type PvpCancelRoomRequest,
  type PvpCancelRoomResponse,
  type PvpClientMessage,
  type PvpCreateDuoBossRoomRequest,
  type PvpCreateRoomRequest,
  type PvpCurrentRoomResponse,
  type PvpJoinRoomRequest,
  type PvpListRoomsResponse,
  type PvpRoomListEntry,
  type PvpRoomKind,
  type PvpRoomResponse,
  type PvpRoomSnapshot,
  type PvpRoomStatus,
  type PvpSeat,
  type PvpServerMessage,
} from "../../../gladiator-arena/src/pvpProtocol";

export interface Env {
  PVP_ROOM: DurableObjectNamespace<PvpRoom>;
  PVP_LOBBY: DurableObjectNamespace<PvpLobby>;
  BOT_TOKEN?: string;
}

interface RoomPlayer {
  token: string;
  hero: HeroState;
  telegramUserId?: string;
}

interface RoomRecord {
  roomCode: string;
  roomKind: PvpRoomKind;
  status: PvpRoomStatus;
  host?: RoomPlayer;
  guest?: RoomPlayer;
  bossId?: string;
  bossName?: string;
  bossTierId?: number;
  state?: CombatState;
  activeSeat?: PvpSeat;
  autoSeats?: Partial<Record<PvpSeat, boolean>>;
  timeoutStreaks?: Partial<Record<PvpSeat, number>>;
  turnVersion: number;
  deadlineAt?: number;
  expiresAt?: number;
  createdAt: number;
  updatedAt: number;
}

interface PvpActiveSession {
  roomCode: string;
  seat: PvpSeat;
  token: string;
  roomKind?: PvpRoomKind;
  updatedAt: number;
}

interface TelegramInitUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

interface SocketAttachment {
  token: string;
  seat: PvpSeat;
}

const ROOM_STORAGE_KEY = "room";
const LOBBY_STORAGE_KEY = "rooms";
const ACTIVE_SESSIONS_STORAGE_KEY = "activeSessions";
const PVP_LOBBY_NAME = "global";
const TURN_DURATION_MS = 20_000;
const DUO_BOSS_TURN_DURATION_MS = 60_000;
const DUO_BOSS_AUTO_TURN_DELAY_MS = 800;
const MAX_CONSECUTIVE_TURN_TIMEOUTS = 3;
const WAITING_ROOM_TTL_MS = 5 * 60_000;
const FINISHED_ROOM_TTL_MS = 5 * 60_000;
const ROOM_CODE_LENGTH = 6;
const MAX_LOBBY_ROOMS = 50;
const API_PREFIX = "/api/pvp";
const REST_ACTION_ID: ActionId = "rest";
const ACTION_IDS = new Set<ActionId>(actionOrder);

function getSeatTimeoutStreak(record: Pick<RoomRecord, "timeoutStreaks">, seat: PvpSeat): number {
  return Math.max(0, Math.floor(record.timeoutStreaks?.[seat] ?? 0));
}

function getTurnDurationMs(record: Pick<RoomRecord, "roomKind" | "timeoutStreaks" | "autoSeats">, seat: PvpSeat): number {
  if (record.roomKind === "duoBoss") {
    return record.autoSeats?.[seat] ? DUO_BOSS_AUTO_TURN_DELAY_MS : DUO_BOSS_TURN_DURATION_MS;
  }

  const timeoutPenalty = Math.min(getSeatTimeoutStreak(record, seat), MAX_CONSECUTIVE_TURN_TIMEOUTS - 1);

  return TURN_DURATION_MS / 2 ** timeoutPenalty;
}

function getNextTimeoutStreaks(
  current: RoomRecord["timeoutStreaks"],
  seat: PvpSeat,
  streak: number,
): RoomRecord["timeoutStreaks"] {
  const nextStreaks: Partial<Record<PvpSeat, number>> = { ...(current ?? {}) };
  const normalizedStreak = Math.max(0, Math.floor(streak));

  if (normalizedStreak > 0) {
    nextStreaks[seat] = normalizedStreak;
  } else {
    delete nextStreaks[seat];
  }

  return nextStreaks.host || nextStreaks.guest ? nextStreaks : undefined;
}

function getNextAutoSeats(
  current: RoomRecord["autoSeats"],
  seat: PvpSeat,
  enabled: boolean,
): RoomRecord["autoSeats"] {
  const nextAutoSeats: Partial<Record<PvpSeat, boolean>> = { ...(current ?? {}) };

  if (enabled) {
    nextAutoSeats[seat] = true;
  } else {
    delete nextAutoSeats[seat];
  }

  return nextAutoSeats.host || nextAutoSeats.guest ? nextAutoSeats : undefined;
}

function createTimeoutLossState(state: CombatState, seat: PvpSeat): CombatState {
  const timedOutActor = getPvpTurnOwnerForSeat(seat);
  const timedOutFighter = timedOutActor === "player" ? state.player : state.enemy;
  const nextState: CombatState = {
    ...state,
    player: { ...state.player },
    enemy: { ...state.enemy },
    result: timedOutActor === "player" ? "lose" : "win",
    activeTurn: timedOutActor,
    log: [
      { text: `${timedOutFighter.name} collapses after missing too many turns.`, important: true },
      ...state.log,
    ].slice(0, 7),
  };

  if (timedOutActor === "player") {
    nextState.player.hp = 0;
  } else {
    nextState.enemy.hp = 0;
  }

  return nextState;
}

function getPvpTurnOwnerForSeat(seat: PvpSeat): TurnOwner {
  return seat === "host" ? "player" : "enemy";
}

export class PvpLobby extends DurableObject<Env> {
  async listRooms(roomKind?: PvpRoomKind): Promise<PvpListRoomsResponse> {
    const rooms = await this.readLiveRooms();
    const filteredRooms = roomKind ? rooms.filter((entry) => (entry.roomKind ?? "pvp") === roomKind) : rooms;

    return {
      rooms: [...filteredRooms].sort((left, right) => right.createdAt - left.createdAt),
      serverNow: Date.now(),
    };
  }

  async addRoom(room: PvpRoomListEntry): Promise<void> {
    const rooms = (await this.readRooms()).filter((entry) => entry.roomCode !== room.roomCode);

    rooms.unshift(room);
    await this.writeRooms(rooms.slice(0, MAX_LOBBY_ROOMS));
  }

  async removeRoom(roomCode: string): Promise<void> {
    const rooms = await this.readRooms();
    const nextRooms = rooms.filter((entry) => entry.roomCode !== roomCode);

    if (nextRooms.length !== rooms.length) {
      await this.writeRooms(nextRooms);
    }
  }

  async getActiveSession(telegramUserId: string): Promise<PvpActiveSession | undefined> {
    const sessions = await this.readActiveSessions();

    return sessions[telegramUserId];
  }

  async setActiveSession(telegramUserId: string, session: PvpActiveSession): Promise<void> {
    const sessions = await this.readActiveSessions();

    sessions[telegramUserId] = session;
    await this.writeActiveSessions(sessions);
  }

  async removeActiveSession(telegramUserId: string): Promise<void> {
    const sessions = await this.readActiveSessions();

    if (!sessions[telegramUserId]) {
      return;
    }

    delete sessions[telegramUserId];
    await this.writeActiveSessions(sessions);
  }

  async removeActiveSessions(telegramUserIds: readonly string[]): Promise<void> {
    const sessions = await this.readActiveSessions();
    let changed = false;

    telegramUserIds.forEach((telegramUserId) => {
      if (sessions[telegramUserId]) {
        delete sessions[telegramUserId];
        changed = true;
      }
    });

    if (changed) {
      await this.writeActiveSessions(sessions);
    }
  }

  private async readLiveRooms(): Promise<PvpRoomListEntry[]> {
    const rooms = await this.readRooms();
    const now = Date.now();
    const liveRooms = rooms.filter((entry) => Boolean(entry.expiresAt && entry.expiresAt > now));

    if (liveRooms.length !== rooms.length) {
      await this.writeRooms(liveRooms);
    }

    return liveRooms;
  }

  private async readRooms(): Promise<PvpRoomListEntry[]> {
    return (await this.ctx.storage.get<PvpRoomListEntry[]>(LOBBY_STORAGE_KEY)) ?? [];
  }

  private writeRooms(rooms: PvpRoomListEntry[]): Promise<void> {
    return this.ctx.storage.put(LOBBY_STORAGE_KEY, rooms);
  }

  private async readActiveSessions(): Promise<Record<string, PvpActiveSession>> {
    return (await this.ctx.storage.get<Record<string, PvpActiveSession>>(ACTIVE_SESSIONS_STORAGE_KEY)) ?? {};
  }

  private writeActiveSessions(sessions: Record<string, PvpActiveSession>): Promise<void> {
    return this.ctx.storage.put(ACTIVE_SESSIONS_STORAGE_KEY, sessions);
  }
}

export class PvpRoom extends DurableObject<Env> {
  async hasRoom(): Promise<boolean> {
    return Boolean(await this.readLiveRoom());
  }

  async createRoom(roomCode: string, hero: HeroState, telegramUserId?: string): Promise<PvpRoomResponse> {
    const existing = await this.readLiveRoom();

    if (existing) {
      throw new Error("Room already exists.");
    }

    const token = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + WAITING_ROOM_TTL_MS;
    const record: RoomRecord = {
      roomCode,
      roomKind: "pvp",
      status: "waiting",
      host: { token, hero, telegramUserId },
      turnVersion: 0,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    };

    await this.writeRoom(record);
    await this.scheduleRoomAlarm(record);

    return {
      roomCode,
      token,
      seat: "host",
      roomKind: "pvp",
      snapshot: this.createViewerSnapshot(record, "host"),
    };
  }

  async createDuoBossRoom(roomCode: string, bossId: string, hero: HeroState, telegramUserId?: string): Promise<PvpRoomResponse> {
    const existing = await this.readLiveRoom();

    if (existing) {
      throw new Error("Room already exists.");
    }

    const boss = getArenaBossDefinition(bossId);

    if (!boss) {
      throw new Error("Unknown arena boss.");
    }

    const token = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + WAITING_ROOM_TTL_MS;
    const record: RoomRecord = {
      roomCode,
      roomKind: "duoBoss",
      status: "waiting",
      host: { token, hero, telegramUserId },
      bossId: boss.id,
      bossName: boss.name,
      bossTierId: boss.tierId,
      turnVersion: 0,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    };

    await this.writeRoom(record);
    await this.scheduleRoomAlarm(record);

    return {
      roomCode,
      token,
      seat: "host",
      roomKind: "duoBoss",
      snapshot: this.createViewerSnapshot(record, "host"),
    };
  }

  async cancelRoom(token: string, telegramUserId?: string): Promise<{ response: PvpCancelRoomResponse; telegramUserIds: string[] }> {
    const record = await this.readLiveRoom();

    if (!record?.host) {
      throw new Error("Room not found.");
    }
    const canCancelByToken = Boolean(token && record.host.token === token);
    const canCancelByTelegramUser = Boolean(telegramUserId && record.host.telegramUserId === telegramUserId);

    if (!canCancelByToken && !canCancelByTelegramUser) {
      throw new Error("Only room host can cancel this room.");
    }
    if (record.status !== "waiting") {
      throw new Error("PvP match already started.");
    }

    this.closeRoomSockets("Room cancelled.");
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.delete(ROOM_STORAGE_KEY);

    return {
      response: { ok: true },
      telegramUserIds: getRoomTelegramUserIds(record),
    };
  }

  async joinRoom(hero: HeroState, telegramUserId?: string): Promise<PvpRoomResponse> {
    const record = await this.readLiveRoom();

    if (!record?.host) {
      throw new Error("Room not found.");
    }
    if (record.status !== "waiting" || record.guest) {
      throw new Error("Room is not available.");
    }

    const token = crypto.randomUUID();
    const nextRecord = this.startMatch({
      ...record,
      guest: { token, hero, telegramUserId },
      status: "playing",
      updatedAt: Date.now(),
    });

    await this.writeRoom(nextRecord);
    await this.scheduleRoomAlarm(nextRecord);
    this.broadcastSnapshots(nextRecord);

    return {
      roomCode: nextRecord.roomCode,
      token,
      seat: "guest",
      roomKind: nextRecord.roomKind,
      snapshot: this.createViewerSnapshot(nextRecord, "guest"),
    };
  }

  async reconnectRoom(token: string): Promise<PvpRoomResponse | undefined> {
    const record = await this.readLiveRoom();
    const seat = record ? this.getSeatForToken(record, token) : undefined;

    if (!record || !seat) {
      return undefined;
    }
    const liveRecord = await this.healDuoBossRoomIfNeeded(record);

    return {
      roomCode: liveRecord.roomCode,
      token,
      seat,
      roomKind: liveRecord.roomKind,
      snapshot: this.createViewerSnapshot(liveRecord, seat),
    };
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return json({ ok: false, error: "Expected WebSocket upgrade." }, 426);
    }

    const record = await this.readLiveRoom();
    const url = new URL(request.url);
    const token = url.searchParams.get("token") ?? "";
    const seat = record ? this.getSeatForToken(record, token) : undefined;

    if (!record || !seat) {
      return json({ ok: false, error: "Invalid PvP room token." }, 403);
    }
    const liveRecord = await this.healDuoBossRoomIfNeeded(record);

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    server.serializeAttachment({ token, seat } satisfies SocketAttachment);
    this.ctx.acceptWebSocket(server);
    this.sendSnapshot(server, liveRecord, seat);

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

    if (data.type === "autoOff") {
      await this.handleAutoOff(attachment.seat);
      return;
    }

    if (data.type !== "action" || !isActionId(data.actionId)) {
      this.sendError(ws, "Unknown PvP action.");
      return;
    }

    await this.handleAction(attachment.seat, data.actionId, data.turnVersion);
  }

  private async handleAutoOff(seat: PvpSeat): Promise<void> {
    const storedRecord = await this.readLiveRoom();

    if (!storedRecord || storedRecord.roomKind !== "duoBoss") {
      return;
    }

    const record = await this.healDuoBossRoomIfNeeded(storedRecord, { broadcast: false });

    if (!record.autoSeats?.[seat]) {
      if (record !== storedRecord) {
        this.broadcastSnapshots(record);
      }
      return;
    }

    const now = Date.now();
    const autoSeats = getNextAutoSeats(record.autoSeats, seat, false);
    const deadlineAt = record.status === "playing" && record.activeSeat === seat
      ? now + getTurnDurationMs({ roomKind: record.roomKind, timeoutStreaks: record.timeoutStreaks, autoSeats }, seat)
      : record.deadlineAt;
    const nextRecord: RoomRecord = {
      ...record,
      autoSeats,
      deadlineAt,
      updatedAt: now,
    };

    await this.writeRoom(nextRecord);
    await this.scheduleRoomAlarm(nextRecord);
    this.broadcastSnapshots(nextRecord);
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const attachment = this.getSocketAttachment(ws);

    if (!attachment || attachment.seat !== "host") {
      return;
    }

    const record = await this.readLiveRoom();

    if (!record || record.status !== "waiting") {
      return;
    }

    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.delete(ROOM_STORAGE_KEY);
    await getPvpLobby(this.env).removeRoom(record.roomCode);
    await getPvpLobby(this.env).removeActiveSessions(getRoomTelegramUserIds(record));
  }

  async alarm(): Promise<void> {
    const record = await this.readRoom();

    if (record?.status === "waiting" && record.expiresAt) {
      if (Date.now() < record.expiresAt) {
        await this.scheduleRoomAlarm(record);
        return;
      }

      this.closeRoomSockets("Room expired.");
      await this.ctx.storage.delete(ROOM_STORAGE_KEY);
      return;
    }

    if (record?.status === "finished" && record.expiresAt) {
      if (Date.now() < record.expiresAt) {
        await this.scheduleRoomAlarm(record);
        return;
      }

      await this.ctx.storage.delete(ROOM_STORAGE_KEY);
      return;
    }

    if (!record || record.status !== "playing" || !record.state || !record.activeSeat || !record.deadlineAt) {
      return;
    }

    if (Date.now() < record.deadlineAt) {
      await this.scheduleRoomAlarm(record);
      return;
    }

    const nextRecord = this.applyTimedOutTurn(record, record.activeSeat);
    await this.writeRoom(nextRecord);
    await this.scheduleRoomAlarm(nextRecord);
    this.broadcastSnapshots(nextRecord);
  }

  private async handleAction(seat: PvpSeat, actionId: ActionId, turnVersion: number): Promise<void> {
    const record = await this.resolveExpiredTurnIfNeeded(await this.readLiveRoom());

    if (!record || record.status !== "playing" || !record.state || !record.activeSeat) {
      return;
    }

    if (record.activeSeat !== seat || record.turnVersion !== turnVersion) {
      this.broadcastSnapshots(record);
      return;
    }

    const nextRecord = this.applyAction(record, seat, actionId);
    await this.writeRoom(nextRecord);
    await this.scheduleRoomAlarm(nextRecord);
    this.broadcastSnapshots(nextRecord);
  }

  private async resolveExpiredTurnIfNeeded(record: RoomRecord | undefined): Promise<RoomRecord | undefined> {
    if (!record || record.status !== "playing" || !record.state || !record.activeSeat || !record.deadlineAt) {
      return record;
    }

    if (Date.now() < record.deadlineAt) {
      return record;
    }

    const nextRecord = this.applyTimedOutTurn(record, record.activeSeat);
    await this.writeRoom(nextRecord);
    await this.scheduleRoomAlarm(nextRecord);
    this.broadcastSnapshots(nextRecord);
    return nextRecord;
  }

  private startMatch(record: RoomRecord): RoomRecord {
    if (!record.host || !record.guest) {
      return record;
    }

    if (record.roomKind === "duoBoss") {
      return this.startDuoBossMatch(record);
    }

    const now = Date.now();
    const state = createPvpCombatStateFromHeroes(record.host.hero, record.guest.hero);

    return {
      ...record,
      status: "playing",
      state,
      activeSeat: "host",
      turnVersion: 1,
      timeoutStreaks: undefined,
      deadlineAt: now + getTurnDurationMs({ roomKind: record.roomKind, timeoutStreaks: undefined, autoSeats: undefined }, "host"),
      expiresAt: undefined,
      updatedAt: now,
    };
  }

  private startDuoBossMatch(record: RoomRecord): RoomRecord {
    if (!record.host || !record.guest || !record.bossId) {
      return record;
    }

    const now = Date.now();
    const state = createOnlineDuoBossCombatStateFromHeroes(record.host.hero, record.guest.hero, createArenaBossEncounter(record.bossId));

    return {
      ...record,
      status: "playing",
      state,
      activeSeat: "host",
      turnVersion: 1,
      timeoutStreaks: undefined,
      deadlineAt: now + getTurnDurationMs({ roomKind: record.roomKind, timeoutStreaks: undefined, autoSeats: undefined }, "host"),
      expiresAt: undefined,
      updatedAt: now,
    };
  }

  private applyTimedOutTurn(record: RoomRecord, seat: PvpSeat): RoomRecord {
    if (!record.state) {
      return record;
    }

    if (record.roomKind === "duoBoss") {
      const actor = getPvpActorForSeat(seat, record.roomKind);
      const actionId = choosePlayerAutoAction(record.state, actor === "helper" ? "helper" : "player") ?? REST_ACTION_ID;
      const autoSeats = getNextAutoSeats(record.autoSeats, seat, true);

      return this.applyAction({ ...record, autoSeats }, seat, actionId, { resetTimeoutStreak: false });
    }

    const now = Date.now();
    const timeoutStreak = getSeatTimeoutStreak(record, seat) + 1;
    const timeoutStreaks = getNextTimeoutStreaks(record.timeoutStreaks, seat, timeoutStreak);

    if (timeoutStreak >= MAX_CONSECUTIVE_TURN_TIMEOUTS) {
      return {
        ...record,
        status: "finished",
        state: createTimeoutLossState(record.state, seat),
        activeSeat: undefined,
        timeoutStreaks,
        turnVersion: record.turnVersion + 1,
        deadlineAt: undefined,
        expiresAt: now + FINISHED_ROOM_TTL_MS,
        updatedAt: now,
      };
    }

    return this.applyAction({ ...record, timeoutStreaks }, seat, REST_ACTION_ID, { resetTimeoutStreak: false });
  }

  private applyAction(
    record: RoomRecord,
    seat: PvpSeat,
    actionId: ActionId,
    options: { resetTimeoutStreak?: boolean } = {},
  ): RoomRecord {
    if (!record.state) {
      return record;
    }

    const now = Date.now();
    const actor = getPvpActorForSeat(seat, record.roomKind);

    if (record.roomKind === "duoBoss") {
      const skippedAllyState = resolveDuoBossSkippedDefeatedAllyTurn(record.state);

      if (skippedAllyState !== record.state) {
        return this.createRecordWithState(record, skippedAllyState, now);
      }
    }

    if (!canUseTurnAction(record.state, actionId, actor)) {
      return record;
    }

    const resolvedState = record.roomKind === "duoBoss"
      ? this.resolveDuoBossAction(record.state, seat, actionId)
      : resolvePvpTurn(record.state, getPvpTurnOwnerForSeat(seat), actionId);
    const state = record.roomKind === "duoBoss" ? resolveDuoBossSkippedDefeatedAllyTurn(resolvedState) : resolvedState;
    const timeoutStreaks = options.resetTimeoutStreak === false
      ? record.timeoutStreaks
      : getNextTimeoutStreaks(record.timeoutStreaks, seat, 0);

    return this.createRecordWithState(record, state, now, timeoutStreaks);
  }

  private createRecordWithState(
    record: RoomRecord,
    state: CombatState,
    now: number,
    timeoutStreaks = record.timeoutStreaks,
  ): RoomRecord {
    const status: PvpRoomStatus = state.result === "playing" ? "playing" : "finished";
    const activeSeat = status === "playing" ? getPvpSeatForActor(state.activeTurn, record.roomKind) : undefined;
    const deadlineAt = activeSeat ? now + getTurnDurationMs({ roomKind: record.roomKind, timeoutStreaks, autoSeats: record.autoSeats }, activeSeat) : undefined;
    const expiresAt = status === "finished" ? now + FINISHED_ROOM_TTL_MS : undefined;

    return {
      ...record,
      status,
      state,
      activeSeat,
      timeoutStreaks,
      turnVersion: record.turnVersion + 1,
      deadlineAt,
      expiresAt,
      updatedAt: now,
    };
  }

  private createHealedDuoBossRoom(record: RoomRecord, now = Date.now()): RoomRecord {
    if (record.roomKind !== "duoBoss" || !record.state) {
      return record;
    }

    const state = resolveDuoBossSkippedDefeatedAllyTurn(record.state);

    return state === record.state ? record : this.createRecordWithState(record, state, now);
  }

  private async healDuoBossRoomIfNeeded(record: RoomRecord, options: { broadcast?: boolean } = {}): Promise<RoomRecord> {
    const nextRecord = this.createHealedDuoBossRoom(record);

    if (nextRecord === record) {
      return record;
    }

    await this.writeRoom(nextRecord);
    await this.scheduleRoomAlarm(nextRecord);
    if (options.broadcast !== false) {
      this.broadcastSnapshots(nextRecord);
    }
    return nextRecord;
  }

  private resolveDuoBossAction(state: CombatState, seat: PvpSeat, actionId: ActionId): CombatState {
    if (seat === "host") {
      return resolvePvpTurn(state, "player", actionId);
    }

    const helperState = resolveDuoBossHelperPlayerTurn(state, actionId);

    return helperState.result === "playing" ? resolveEnemyTurn(helperState) : helperState;
  }

  private async scheduleRoomAlarm(record: RoomRecord): Promise<void> {
    if (record.status === "playing" && record.deadlineAt) {
      await this.ctx.storage.setAlarm(record.deadlineAt);
      return;
    }

    if ((record.status === "waiting" || record.status === "finished") && record.expiresAt) {
      await this.ctx.storage.setAlarm(record.expiresAt);
      return;
    }

    await this.ctx.storage.deleteAlarm();
  }

  private createViewerSnapshot(record: RoomRecord, seat: PvpSeat): PvpRoomSnapshot {
    return toViewerPvpSnapshot({
      roomCode: record.roomCode,
      roomKind: record.roomKind,
      status: record.status,
      bossId: record.bossId,
      bossName: record.bossName,
      bossTierId: record.bossTierId,
      state: record.state,
      activeSeat: record.activeSeat,
      autoSeats: record.autoSeats,
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

  private async readLiveRoom(): Promise<RoomRecord | undefined> {
    const record = await this.readRoom();

    if (!record) {
      return undefined;
    }

    if (record.status === "playing") {
      return record;
    }

    if (record.expiresAt && record.expiresAt > Date.now()) {
      return record;
    }

    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.delete(ROOM_STORAGE_KEY);
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

  if (request.method === "GET" && segments.length === 1 && segments[0] === "rooms") {
    return json(await getPvpLobby(env).listRooms(readRoomKind(url.searchParams.get("kind"))));
  }

  if (request.method === "GET" && segments.length === 2 && segments[0] === "rooms" && segments[1] === "current") {
    return json(await getCurrentPvpRoom(request, env));
  }

  if (request.method === "POST" && segments.length === 1 && segments[0] === "rooms") {
    const body = (await request.json()) as PvpCreateRoomRequest;
    const telegramUser = await readOptionalTelegramUser(request, env);
    const currentRoom = telegramUser ? await getCurrentPvpRoomForUser(env, String(telegramUser.id)) : undefined;

    if (currentRoom) {
      return json(currentRoom);
    }

    const roomCode = await createUniqueRoomCode(env);
    const room = env.PVP_ROOM.getByName(roomCode);
    const telegramUserId = telegramUser ? String(telegramUser.id) : undefined;
    const response = await room.createRoom(roomCode, body.hero, telegramUserId);

    await getPvpLobby(env).addRoom(createRoomListEntry(roomCode, body.hero, telegramUser));
    if (telegramUserId) {
      await getPvpLobby(env).setActiveSession(telegramUserId, createActiveSession(response));
    }

    return json(response);
  }

  if (request.method === "POST" && segments.length === 2 && segments[0] === "rooms" && segments[1] === "duo-boss") {
    const body = (await request.json()) as PvpCreateDuoBossRoomRequest;
    const telegramUser = await readOptionalTelegramUser(request, env);
    const currentRoom = telegramUser ? await getCurrentPvpRoomForUser(env, String(telegramUser.id)) : undefined;

    if (currentRoom) {
      return json(currentRoom);
    }

    const roomCode = await createUniqueRoomCode(env);
    const room = env.PVP_ROOM.getByName(roomCode);
    const telegramUserId = telegramUser ? String(telegramUser.id) : undefined;
    const response = await room.createDuoBossRoom(roomCode, body.bossId, body.hero, telegramUserId);
    const boss = getArenaBossDefinition(body.bossId);

    await getPvpLobby(env).addRoom(createRoomListEntry(roomCode, body.hero, telegramUser, {
      roomKind: "duoBoss",
      bossId: boss?.id ?? body.bossId,
      bossName: boss?.name,
      bossTierId: boss?.tierId,
    }));
    if (telegramUserId) {
      await getPvpLobby(env).setActiveSession(telegramUserId, createActiveSession(response));
    }

    return json(response);
  }

  if (request.method === "POST" && segments.length === 3 && segments[0] === "rooms" && segments[2] === "join") {
    const roomCode = normalizeRoomCode(segments[1] ?? "");
    const body = (await request.json()) as PvpJoinRoomRequest;
    const telegramUser = await readOptionalTelegramUser(request, env);
    const currentRoom = telegramUser ? await getCurrentPvpRoomForUser(env, String(telegramUser.id)) : undefined;

    if (currentRoom) {
      return json(currentRoom);
    }

    const room = env.PVP_ROOM.getByName(roomCode);
    const telegramUserId = telegramUser ? String(telegramUser.id) : undefined;
    const response = await room.joinRoom(body.hero, telegramUserId);

    await getPvpLobby(env).removeRoom(roomCode);
    if (telegramUserId) {
      await getPvpLobby(env).setActiveSession(telegramUserId, createActiveSession(response));
    }

    return json(response);
  }

  if (request.method === "POST" && segments.length === 3 && segments[0] === "rooms" && segments[2] === "cancel") {
    const roomCode = normalizeRoomCode(segments[1] ?? "");
    const body = (await request.json()) as PvpCancelRoomRequest;
    const telegramUser = await readOptionalTelegramUser(request, env);
    const room = env.PVP_ROOM.getByName(roomCode);
    const { response, telegramUserIds } = await room.cancelRoom(body.token, telegramUser ? String(telegramUser.id) : undefined);

    await getPvpLobby(env).removeRoom(roomCode);
    await getPvpLobby(env).removeActiveSessions(telegramUserIds);

    return json(response);
  }

  if (request.method === "GET" && segments.length === 3 && segments[0] === "rooms" && segments[2] === "ws") {
    const roomCode = normalizeRoomCode(segments[1] ?? "");
    const room = env.PVP_ROOM.getByName(roomCode);

    return room.fetch(request);
  }

  return json({ ok: false, error: "Not found." }, 404);
}

function getPvpLobby(env: Env): DurableObjectStub<PvpLobby> {
  return env.PVP_LOBBY.getByName(PVP_LOBBY_NAME);
}

async function getCurrentPvpRoom(request: Request, env: Env): Promise<PvpCurrentRoomResponse> {
  const telegramUser = await readOptionalTelegramUser(request, env);
  const room = telegramUser ? await getCurrentPvpRoomForUser(env, String(telegramUser.id), { includeFinishedDuoBoss: true }) : undefined;

  return {
    room: room ?? null,
    serverNow: Date.now(),
  };
}

async function getCurrentPvpRoomForUser(
  env: Env,
  telegramUserId: string,
  options: { includeFinishedDuoBoss?: boolean } = {},
): Promise<PvpRoomResponse | undefined> {
  const lobby = getPvpLobby(env);
  const session = await lobby.getActiveSession(telegramUserId);

  if (!session) {
    return undefined;
  }

  const room = env.PVP_ROOM.getByName(session.roomCode);
  const response = await room.reconnectRoom(session.token);

  if (!response) {
    await lobby.removeActiveSession(telegramUserId);
    return undefined;
  }
  if (response.snapshot.status === "finished") {
    await lobby.removeActiveSession(telegramUserId);

    return options.includeFinishedDuoBoss && (response.roomKind ?? "pvp") === "duoBoss" ? response : undefined;
  }

  return response;
}

function createActiveSession(response: PvpRoomResponse): PvpActiveSession {
  return {
    roomCode: response.roomCode,
    seat: response.seat,
    token: response.token,
    roomKind: response.roomKind,
    updatedAt: Date.now(),
  };
}

function createRoomListEntry(
  roomCode: string,
  hero: HeroState,
  telegramUser?: TelegramInitUser,
  options: {
    roomKind?: PvpRoomKind;
    bossId?: string;
    bossName?: string;
    bossTierId?: number;
  } = {},
): PvpRoomListEntry {
  const now = Date.now();

  return {
    roomCode,
    roomKind: options.roomKind,
    hostName: normalizeHostName(getTelegramUserDisplayName(telegramUser) ?? hero.name),
    hostLevel: Math.max(1, Math.floor(Number(hero.level) || 1)),
    bossId: options.bossId,
    bossName: options.bossName,
    bossTierId: options.bossTierId,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + WAITING_ROOM_TTL_MS,
  };
}

function getRoomTelegramUserIds(record: RoomRecord): string[] {
  return [record.host?.telegramUserId, record.guest?.telegramUserId].filter((id): id is string => Boolean(id));
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

function readRoomKind(value: string | null): PvpRoomKind | undefined {
  return value === "duoBoss" || value === "pvp" ? value : undefined;
}

function normalizeHostName(name: string): string {
  return name.trim().slice(0, 24) || "Gladiator";
}

function getTelegramUserDisplayName(user: TelegramInitUser | undefined): string | undefined {
  const personalName = normalizeTelegramDisplayName([user?.first_name, user?.last_name].filter(Boolean).join(" "));

  if (personalName) {
    return personalName;
  }

  return normalizeTelegramDisplayName(user?.username?.replace(/^@+/, ""));
}

function normalizeTelegramDisplayName(name: string | undefined): string | undefined {
  const normalized = name?.trim().replace(/\s+/g, " ").slice(0, 24);

  return normalized || undefined;
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

async function readOptionalTelegramUser(request: Request, env: Env): Promise<TelegramInitUser | undefined> {
  const initData = request.headers.get("x-telegram-init-data") ?? "";

  if (!initData || !env.BOT_TOKEN) {
    return undefined;
  }

  const auth = await verifyTelegramInitData(initData, env.BOT_TOKEN);

  if (!auth.ok) {
    throw new Error(auth.error);
  }

  return auth.user;
}

async function verifyTelegramInitData(initData: string, botToken: string): Promise<{ ok: true; user: TelegramInitUser } | { ok: false; error: string }> {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash") ?? "";
  const userJson = params.get("user") ?? "";

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = await hmacSha256(new TextEncoder().encode("WebAppData"), botToken);
  const digest = await hmacSha256(secretKey, dataCheckString);

  if (!timingSafeEqualHex(hash, bytesToHex(digest))) {
    return { ok: false, error: "bad_init_data_signature" };
  }

  try {
    const user = JSON.parse(userJson) as Partial<TelegramInitUser>;
    const userId = typeof user.id === "number" && Number.isFinite(user.id) ? Math.floor(user.id) : undefined;

    if (userId === undefined) {
      return { ok: false, error: "missing_telegram_user" };
    }

    return {
      ok: true,
      user: {
        id: userId,
        username: typeof user.username === "string" ? user.username : undefined,
        first_name: typeof user.first_name === "string" ? user.first_name : undefined,
        last_name: typeof user.last_name === "string" ? user.last_name : undefined,
      },
    };
  } catch {
    return { ok: false, error: "bad_telegram_user" };
  }
}

async function hmacSha256(key: BufferSource, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);

  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
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
    "access-control-allow-headers": "content-type, x-telegram-init-data",
  };
}

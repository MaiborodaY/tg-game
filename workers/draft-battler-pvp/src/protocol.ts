import { CARD_DEFINITIONS } from "../../../draft-battler/src/game/cards";
import type { CardId } from "../../../draft-battler/src/game/types.ts";

export const MAX_SOCKET_MESSAGE_BYTES = 4_096;
export const SOCKET_RATE_WINDOW_MS = 10_000;
export const MAX_SOCKET_MESSAGES_PER_WINDOW = 40;
export const MAX_HTTP_BODY_BYTES = 1_024;
export const SOCKET_TICKET_TTL_MS = 30_000;
export const SEAT_TOKEN_BYTES = 32;
export const ROOM_CODE_LENGTH = 8;
const BOARD_SLOT_COUNT = 6;
const VALID_CARD_IDS = new Set<CardId>(CARD_DEFINITIONS.map((card) => card.id));

export type PlayerRole = "host" | "guest";

export interface SocketTicketRecord {
  role: PlayerRole;
  tokenHash: string;
  ticketHash: string;
  expiresAt: number;
}

export type PvpErrorCode =
  | "bad_request"
  | "room_not_found"
  | "room_full"
  | "same_player"
  | "invalid_token"
  | "stale_match"
  | "action_rejected"
  | "rate_limited"
  | "message_too_large"
  | "pvp_disabled"
  | "origin_forbidden"
  | "invalid_init_data"
  | "auth_unavailable"
  | "rating_unavailable"
  | "internal_error";

export type PvpClientMessage =
  | { type: "ping" }
  | { type: "set_ready"; ready: boolean }
  | { type: "pick"; matchId: string; round: number; cardId: CardId; targetSlotIndex: number; allowReplacement: boolean }
  | { type: "move"; matchId: string; round: number; sourceSlotIndex: number; targetSlotIndex: number }
  | { type: "reroll"; matchId: string; round: number }
  | { type: "lock"; matchId: string; round: number }
  | { type: "next_ready"; matchId: string; round: number }
  | { type: "forfeit"; matchId: string; round: number }
  | { type: "leave" }
  | { type: "rematch"; matchId: string; round: number };

const MESSAGE_TYPES = new Set([
  "ping",
  "set_ready",
  "pick",
  "move",
  "reroll",
  "lock",
  "next_ready",
  "forfeit",
  "leave",
  "rematch",
]);

export function parseClientMessage(rawMessage: string | ArrayBuffer): PvpClientMessage | undefined {
  if (typeof rawMessage !== "string" || byteLength(rawMessage) > MAX_SOCKET_MESSAGE_BYTES) {
    return undefined;
  }

  let value: unknown;
  try {
    value = JSON.parse(rawMessage);
  } catch {
    return undefined;
  }

  if (!isRecord(value) || typeof value.type !== "string" || !MESSAGE_TYPES.has(value.type)) {
    return undefined;
  }

  switch (value.type) {
    case "ping":
    case "leave":
      return hasExactKeys(value, ["type"]) ? { type: value.type } : undefined;
    case "set_ready":
      return hasExactKeys(value, ["type", "ready"]) && typeof value.ready === "boolean"
        ? { type: value.type, ready: value.ready }
        : undefined;
    case "pick":
      return hasExactKeys(value, ["type", "matchId", "round", "cardId", "targetSlotIndex", "allowReplacement"])
        && isMatchId(value.matchId)
        && isRound(value.round)
        && typeof value.cardId === "string"
        && VALID_CARD_IDS.has(value.cardId as CardId)
        && Number.isInteger(value.targetSlotIndex)
        && Number(value.targetSlotIndex) >= 0
        && Number(value.targetSlotIndex) < BOARD_SLOT_COUNT
        && typeof value.allowReplacement === "boolean"
        ? {
            type: value.type,
            matchId: value.matchId,
            round: value.round,
            cardId: value.cardId as CardId,
            targetSlotIndex: Number(value.targetSlotIndex),
            allowReplacement: value.allowReplacement,
          }
        : undefined;
    case "move":
      return hasExactKeys(value, ["type", "matchId", "round", "sourceSlotIndex", "targetSlotIndex"])
        && isMatchId(value.matchId)
        && isRound(value.round)
        && isSlotIndex(value.sourceSlotIndex)
        && isSlotIndex(value.targetSlotIndex)
        && value.sourceSlotIndex !== value.targetSlotIndex
        ? {
            type: value.type,
            matchId: value.matchId,
            round: value.round,
            sourceSlotIndex: value.sourceSlotIndex,
            targetSlotIndex: value.targetSlotIndex,
          }
        : undefined;
    case "reroll":
    case "lock":
    case "next_ready":
      return hasExactKeys(value, ["type", "matchId", "round"])
        && isMatchId(value.matchId)
        && isRound(value.round)
        ? { type: value.type, matchId: value.matchId, round: value.round }
        : undefined;
    case "forfeit":
    case "rematch":
      return hasExactKeys(value, ["type", "matchId", "round"]) && isMatchId(value.matchId) && isRound(value.round)
        ? { type: value.type, matchId: value.matchId, round: value.round }
        : undefined;
  }
}

export function createSeatToken(randomBytes: Uint8Array = crypto.getRandomValues(new Uint8Array(SEAT_TOKEN_BYTES))): string {
  if (randomBytes.byteLength !== SEAT_TOKEN_BYTES) {
    throw new Error(`Seat tokens require exactly ${SEAT_TOKEN_BYTES} random bytes.`);
  }

  let binary = "";
  randomBytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

export async function createSocketTicket(
  role: PlayerRole,
  tokenHash: string,
  now: number,
  ticket = createSeatToken(),
): Promise<{ ticket: string; record: SocketTicketRecord }> {
  return {
    ticket,
    record: {
      role,
      tokenHash,
      ticketHash: await hashSeatToken(ticket),
      expiresAt: now + SOCKET_TICKET_TTL_MS,
    },
  };
}

export async function isSocketTicketValid(
  record: SocketTicketRecord,
  ticket: string,
  now: number,
): Promise<boolean> {
  return now < record.expiresAt && tokensMatch(record.ticketHash, await hashSeatToken(ticket));
}

export function createRoomCode(randomBytes: Uint8Array = crypto.getRandomValues(new Uint8Array(ROOM_CODE_LENGTH))): string {
  if (randomBytes.byteLength < ROOM_CODE_LENGTH) {
    throw new Error(`Room codes require at least ${ROOM_CODE_LENGTH} random bytes.`);
  }

  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(randomBytes.slice(0, ROOM_CODE_LENGTH), (value) => alphabet[value % alphabet.length]).join("");
}

export async function hashSeatToken(seatToken: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seatToken));
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

export function tokensMatch(leftHash: string, rightHash: string): boolean {
  if (leftHash.length !== rightHash.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < leftHash.length; index += 1) {
    difference |= leftHash.charCodeAt(index) ^ rightHash.charCodeAt(index);
  }

  return difference === 0;
}

export function normalizeRoomId(roomId: string | undefined): string | undefined {
  const normalized = roomId?.trim().toLowerCase();
  return normalized && /^[a-z2-9]{8}$/u.test(normalized) ? normalized : undefined;
}

export function readSeatToken(value: unknown): string | undefined {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/u.test(value) ? value : undefined;
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown> | undefined> {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader !== null
    && (!/^\d+$/u.test(contentLengthHeader) || Number(contentLengthHeader) > MAX_HTTP_BODY_BYTES)) {
    await cancelRequestBody(request);
    return undefined;
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return {};
  }

  const decoder = new TextDecoder();
  let byteCount = 0;
  let textValue = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        textValue += decoder.decode();
        break;
      }

      byteCount += value.byteLength;
      if (byteCount > MAX_HTTP_BODY_BYTES) {
        await reader.cancel();
        return undefined;
      }
      textValue += decoder.decode(value, { stream: true });
    }
  } catch {
    return undefined;
  } finally {
    reader.releaseLock();
  }

  if (!textValue.trim()) {
    return {};
  }

  try {
    const value = JSON.parse(textValue) as unknown;
    return isRecord(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

async function cancelRequestBody(request: Request): Promise<void> {
  try {
    await request.body?.cancel();
  } catch {
    // The body may already be locked or aborted; rejection is still fail-closed.
  }
}

export function isAllowedOrigin(request: Request, configuredOrigins: string | undefined, development = false): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  const requestOrigin = new URL(request.url).origin;
  if (origin === requestOrigin) {
    return true;
  }

  const allowed = new Set((configuredOrigins ?? "").split(",").map((value) => value.trim()).filter(Boolean));
  if (allowed.has(origin)) {
    return true;
  }

  if (!development) {
    return false;
  }

  try {
    const url = new URL(origin);
    return (url.hostname === "127.0.0.1" || url.hostname === "localhost") && (url.protocol === "http:" || url.protocol === "https:");
  } catch {
    return false;
  }
}

export function consumeRateLimit(
  state: { windowStartedAt: number; messageCount: number },
  now: number,
): { allowed: boolean; windowStartedAt: number; messageCount: number } {
  if (now - state.windowStartedAt >= SOCKET_RATE_WINDOW_MS || now < state.windowStartedAt) {
    return { allowed: true, windowStartedAt: now, messageCount: 1 };
  }

  const messageCount = state.messageCount + 1;
  return {
    allowed: messageCount <= MAX_SOCKET_MESSAGES_PER_WINDOW,
    windowStartedAt: state.windowStartedAt,
    messageCount,
  };
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expectedKeys: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expectedKeys.length && expectedKeys.every((key) => keys.includes(key));
}

function isMatchId(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8 && value.length <= 80 && /^[a-zA-Z0-9:_-]+$/u.test(value);
}

function isRound(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 15;
}

function isSlotIndex(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value < BOARD_SLOT_COUNT;
}

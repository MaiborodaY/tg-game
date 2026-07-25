export type BridgeSeat = "south" | "west";
export type HumanBridgeSeat = BridgeSeat;
export type BridgeSuitWire = "clubs" | "diamonds" | "hearts" | "spades";

export type BridgeClientCommand =
  | {
      commandId: string;
      expectedRevision: number;
      type: "play_cards";
      cardIds: string[];
      declaredSuit?: BridgeSuitWire;
    }
  | { commandId: string; expectedRevision: number; type: "draw_card" }
  | { commandId: string; expectedRevision: number; type: "next_round" };

export interface ProcessedCommand {
  commandId: string;
  acceptedRevision: number;
}

export type CommandDisposition = "accept" | "duplicate" | "stale";

export interface BridgeServerSnapshotMessage<TSnapshot = unknown> {
  type: "snapshot";
  snapshot: TSnapshot;
}

export interface BridgeServerErrorMessage {
  type: "error";
  code: string;
  message: string;
  revision?: number;
}

export type BridgeServerMessage<TSnapshot = unknown> =
  | BridgeServerSnapshotMessage<TSnapshot>
  | BridgeServerErrorMessage;

export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 6;
export const MAX_SOCKET_MESSAGE_BYTES = 4_096;
export const MAX_PROCESSED_COMMANDS = 128;

const ROOM_CODE_PATTERN = new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`);
const COMMAND_ID_PATTERN = /^[A-Za-z0-9_-]{8,80}$/;
const CARD_ID_PATTERN = /^[CDHS][6789TJQKA]$/;
const BRIDGE_SUITS = new Set<BridgeSuitWire>(["clubs", "diamonds", "hearts", "spades"]);

export function createRoomCode(randomBytes?: Uint8Array): string {
  const bytes = randomBytes ?? crypto.getRandomValues(new Uint8Array(ROOM_CODE_LENGTH));
  if (bytes.length < ROOM_CODE_LENGTH) throw new Error("Room-code entropy is too short.");
  return Array.from(bytes.slice(0, ROOM_CODE_LENGTH), (value) => (
    ROOM_CODE_ALPHABET[value % ROOM_CODE_ALPHABET.length]
  )).join("");
}

export function normalizeRoomCode(value: string | undefined): string | undefined {
  const normalized = value?.trim().toUpperCase().replace(/[\s-]+/g, "");
  return normalized && ROOM_CODE_PATTERN.test(normalized) ? normalized : undefined;
}

export function parseBridgeClientCommand(value: unknown): BridgeClientCommand | undefined {
  if (!isRecord(value) || !isCommandId(value.commandId) || !isRevision(value.expectedRevision)) return undefined;
  const base = { commandId: value.commandId, expectedRevision: value.expectedRevision };

  if (value.type === "draw_card" || value.type === "next_round") {
    return { ...base, type: value.type };
  }

  if (value.type !== "play_cards" || !Array.isArray(value.cardIds)) return undefined;
  if (value.cardIds.length < 1 || value.cardIds.length > 4) return undefined;
  if (!value.cardIds.every((cardId) => typeof cardId === "string" && CARD_ID_PATTERN.test(cardId.toUpperCase()))) {
    return undefined;
  }
  const cardIds = value.cardIds.map((cardId) => cardId.toUpperCase());
  if (new Set(cardIds).size !== cardIds.length) return undefined;

  const declaredSuit = value.declaredSuit;
  if (declaredSuit !== undefined && !BRIDGE_SUITS.has(declaredSuit as BridgeSuitWire)) return undefined;
  return {
    ...base,
    type: "play_cards",
    cardIds,
    ...(declaredSuit ? { declaredSuit: declaredSuit as BridgeSuitWire } : {}),
  };
}

export function hasProcessedCommand(commands: readonly ProcessedCommand[], commandId: string): boolean {
  return commands.some((command) => command.commandId === commandId);
}

export function appendProcessedCommand(
  commands: readonly ProcessedCommand[],
  command: ProcessedCommand,
): ProcessedCommand[] {
  if (hasProcessedCommand(commands, command.commandId)) return [...commands];
  return [...commands, command].slice(-MAX_PROCESSED_COMMANDS);
}

export function getCommandDisposition(
  commands: readonly ProcessedCommand[],
  command: Pick<BridgeClientCommand, "commandId" | "expectedRevision">,
  currentRevision: number,
): CommandDisposition {
  if (hasProcessedCommand(commands, command.commandId)) return "duplicate";
  return command.expectedRevision === currentRevision ? "accept" : "stale";
}

export async function hashOpaqueToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return bytesToBase64Url(new Uint8Array(digest));
}

export function createOpaqueToken(randomBytes?: Uint8Array): string {
  const bytes = randomBytes ?? crypto.getRandomValues(new Uint8Array(32));
  if (bytes.length < 24) throw new Error("Socket-ticket entropy is too short.");
  return bytesToBase64Url(bytes);
}

export function isBridgeSeat(value: unknown): value is BridgeSeat {
  return value === "south" || value === "west";
}

export function isHumanBridgeSeat(value: unknown): value is HumanBridgeSeat {
  return isBridgeSeat(value);
}

function isCommandId(value: unknown): value is string {
  return typeof value === "string" && COMMAND_ID_PATTERN.test(value);
}

function isRevision(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

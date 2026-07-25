export type BridgeSeat = "north" | "east" | "south" | "west";
export type HumanBridgeSeat = "south" | "west";
export type BridgeStrain = "clubs" | "diamonds" | "hearts" | "spades" | "notrump";

export type BridgeCallWire =
  | { type: "pass" }
  | { type: "double" }
  | { type: "redouble" }
  | { type: "bid"; level: number; strain: BridgeStrain };

export type BridgeClientCommand =
  | { commandId: string; expectedRevision: number; type: "call"; call: BridgeCallWire }
  | { commandId: string; expectedRevision: number; type: "play_card"; cardId: string };

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
const CARD_ID_PATTERN = /^[A-Za-z0-9:_-]{1,64}$/;
const BRIDGE_STRAINS = new Set<BridgeStrain>(["clubs", "diamonds", "hearts", "spades", "notrump"]);

export function createRoomCode(randomBytes?: Uint8Array): string {
  const bytes = randomBytes ?? crypto.getRandomValues(new Uint8Array(ROOM_CODE_LENGTH));
  if (bytes.length < ROOM_CODE_LENGTH) {
    throw new Error("Not enough random bytes for a room code.");
  }

  let code = "";
  for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
    code += ROOM_CODE_ALPHABET[bytes[index] % ROOM_CODE_ALPHABET.length];
  }
  return code;
}

export function normalizeRoomCode(value: string | undefined): string | undefined {
  const normalized = value?.trim().toUpperCase().replace(/[\s-]+/g, "");
  return normalized && ROOM_CODE_PATTERN.test(normalized) ? normalized : undefined;
}

export function parseBridgeClientCommand(value: unknown): BridgeClientCommand | undefined {
  if (!isRecord(value) || !isCommandId(value.commandId) || !isRevision(value.expectedRevision)) {
    return undefined;
  }

  if (value.type === "call") {
    const call = parseBridgeCall(value.call);
    return call
      ? { commandId: value.commandId, expectedRevision: value.expectedRevision, type: "call", call }
      : undefined;
  }

  if (value.type === "play_card" && typeof value.cardId === "string" && CARD_ID_PATTERN.test(value.cardId)) {
    return {
      commandId: value.commandId,
      expectedRevision: value.expectedRevision,
      type: "play_card",
      cardId: value.cardId,
    };
  }

  return undefined;
}

export function parseBridgeCall(value: unknown): BridgeCallWire | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  if (value.type === "pass" || value.type === "double" || value.type === "redouble") {
    return { type: value.type };
  }

  if (
    value.type === "bid"
    && Number.isInteger(value.level)
    && Number(value.level) >= 1
    && Number(value.level) <= 7
    && typeof value.strain === "string"
    && BRIDGE_STRAINS.has(value.strain as BridgeStrain)
  ) {
    return { type: "bid", level: Number(value.level), strain: value.strain as BridgeStrain };
  }

  return undefined;
}

export function hasProcessedCommand(commands: readonly ProcessedCommand[], commandId: string): boolean {
  return commands.some((command) => command.commandId === commandId);
}

export function appendProcessedCommand(
  commands: readonly ProcessedCommand[],
  command: ProcessedCommand,
): ProcessedCommand[] {
  if (hasProcessedCommand(commands, command.commandId)) {
    return [...commands];
  }

  return [...commands, command].slice(-MAX_PROCESSED_COMMANDS);
}

export function getCommandDisposition(
  commands: readonly ProcessedCommand[],
  command: Pick<BridgeClientCommand, "commandId" | "expectedRevision">,
  currentRevision: number,
): CommandDisposition {
  if (hasProcessedCommand(commands, command.commandId)) {
    return "duplicate";
  }
  return command.expectedRevision === currentRevision ? "accept" : "stale";
}

export async function hashOpaqueToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return bytesToBase64Url(new Uint8Array(digest));
}

export function createOpaqueToken(randomBytes?: Uint8Array): string {
  const bytes = randomBytes ?? crypto.getRandomValues(new Uint8Array(32));
  if (bytes.length < 16) {
    throw new Error("Opaque tokens require at least 128 bits of randomness.");
  }
  return bytesToBase64Url(bytes);
}

export function isBridgeSeat(value: unknown): value is BridgeSeat {
  return value === "north" || value === "east" || value === "south" || value === "west";
}

export function isHumanBridgeSeat(value: unknown): value is HumanBridgeSeat {
  return value === "south" || value === "west";
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
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

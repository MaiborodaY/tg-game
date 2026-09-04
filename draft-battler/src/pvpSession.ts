export const PVP_SESSION_STORAGE_KEY = "draft-battler:pvp-session:v1";

export type PvpSeat = "host" | "guest";

export interface PvpSessionCredentials {
  version: 1;
  roomId: string;
  seat: PvpSeat;
  seatToken: string;
}

export interface PvpSessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface PvpBootstrapResponse<TSnapshot = unknown> {
  ok: true;
  roomId: string;
  seat: PvpSeat;
  seatToken: string;
  socketTicket: string;
  snapshot: TSnapshot;
}

export class PvpRequestError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number) {
    super(code);
    this.name = "PvpRequestError";
    this.code = code;
    this.status = status;
  }
}

export type PvpFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface PvpApiRequestOptions {
  telegramInitData?: string | null;
  fetcher?: PvpFetch;
}

export function normalizePvpRoomId(value: string): string | undefined {
  const normalized = value.trim().toLowerCase();
  return /^[a-z2-9]{8}$/u.test(normalized) ? normalized : undefined;
}

export function normalizePvpApiOrigin(value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) {
    return "";
  }

  const url = new URL(normalized);
  if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) {
    throw new Error("VITE_DRAFT_BATTLER_PVP_ORIGIN must be an HTTP(S) origin.");
  }

  return url.origin;
}

export function createPvpSocketUrl(
  roomId: string,
  socketTicket: string,
  apiOrigin: string,
  currentOrigin: string,
): string {
  const normalizedRoomId = normalizePvpRoomId(roomId);
  if (!normalizedRoomId || !isSeatToken(socketTicket)) {
    throw new Error("Cannot create a PvP socket URL without a valid socket ticket.");
  }

  const url = new URL(`/api/pvp/rooms/${normalizedRoomId}/socket`, apiOrigin || currentOrigin);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("PvP sockets require an HTTP(S) application origin.");
  }

  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("ticket", socketTicket);
  return url.toString();
}

export function loadPvpSession(storage: PvpSessionStorage | undefined): PvpSessionCredentials | undefined {
  if (!storage) {
    return undefined;
  }

  try {
    const serialized = storage.getItem(PVP_SESSION_STORAGE_KEY);
    if (!serialized) {
      return undefined;
    }

    return readPvpSession(JSON.parse(serialized));
  } catch {
    return undefined;
  }
}

export function savePvpSession(
  storage: PvpSessionStorage | undefined,
  session: PvpSessionCredentials,
): boolean {
  const validSession = readPvpSession(session);
  if (!storage || !validSession) {
    return false;
  }

  try {
    storage.setItem(PVP_SESSION_STORAGE_KEY, JSON.stringify(validSession));
    return true;
  } catch {
    return false;
  }
}

export function clearPvpSession(storage: PvpSessionStorage | undefined): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(PVP_SESSION_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function createPvpRoom<TSnapshot = unknown>(
  apiOrigin: string,
  options: PvpApiRequestOptions = {},
): Promise<PvpBootstrapResponse<TSnapshot>> {
  return requestPvpBootstrap<TSnapshot>(`${apiOrigin}/api/pvp/rooms`, {}, options);
}

export function joinPvpRoom<TSnapshot = unknown>(
  apiOrigin: string,
  roomId: string,
  options: PvpApiRequestOptions = {},
): Promise<PvpBootstrapResponse<TSnapshot>> {
  const normalizedRoomId = normalizePvpRoomId(roomId);
  if (!normalizedRoomId) {
    return Promise.reject(new PvpRequestError("invalid_room_code", 400));
  }

  return requestPvpBootstrap<TSnapshot>(`${apiOrigin}/api/pvp/rooms/${normalizedRoomId}/join`, {}, options);
}

export function reconnectPvpRoom<TSnapshot = unknown>(
  apiOrigin: string,
  session: PvpSessionCredentials,
  options: PvpApiRequestOptions = {},
): Promise<PvpBootstrapResponse<TSnapshot>> {
  const validSession = readPvpSession(session);
  if (!validSession) {
    return Promise.reject(new PvpRequestError("invalid_session", 400));
  }

  return requestPvpBootstrap<TSnapshot>(
    `${apiOrigin}/api/pvp/rooms/${validSession.roomId}/reconnect`,
    { seatToken: validSession.seatToken },
    options,
  );
}

function readPvpSession(value: unknown): PvpSessionCredentials | undefined {
  if (!isRecord(value) || value.version !== 1) {
    return undefined;
  }

  const roomId = typeof value.roomId === "string" ? normalizePvpRoomId(value.roomId) : undefined;
  if (!roomId || !isPvpSeat(value.seat) || !isSeatToken(value.seatToken)) {
    return undefined;
  }

  return {
    version: 1,
    roomId,
    seat: value.seat,
    seatToken: value.seatToken,
  };
}

async function requestPvpBootstrap<TSnapshot>(
  url: string,
  body: Record<string, unknown>,
  options: PvpApiRequestOptions,
): Promise<PvpBootstrapResponse<TSnapshot>> {
  let response: Response;
  try {
    const headers: Record<string, string> = { "content-type": "application/json" };
    const initData = options.telegramInitData?.trim();
    if (initData) headers["x-telegram-init-data"] = initData;
    response = await (options.fetcher ?? fetch)(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    throw new PvpRequestError("connection_failed", 0);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new PvpRequestError("bad_response", response.status);
  }

  if (!response.ok) {
    throw new PvpRequestError(readErrorCode(payload), response.status);
  }

  const bootstrap = readPvpBootstrap<TSnapshot>(payload);
  if (!bootstrap) {
    throw new PvpRequestError("bad_response", response.status);
  }

  return bootstrap;
}

function readPvpBootstrap<TSnapshot>(value: unknown): PvpBootstrapResponse<TSnapshot> | undefined {
  if (
    !isRecord(value) ||
    value.ok !== true ||
    !isPvpSeat(value.seat) ||
    !isSeatToken(value.seatToken) ||
    !isSeatToken(value.socketTicket)
  ) {
    return undefined;
  }

  const roomId = typeof value.roomId === "string" ? normalizePvpRoomId(value.roomId) : undefined;
  if (!roomId || !isRecord(value.snapshot)) {
    return undefined;
  }

  return {
    ok: true,
    roomId,
    seat: value.seat,
    seatToken: value.seatToken,
    socketTicket: value.socketTicket,
    snapshot: value.snapshot as TSnapshot,
  };
}

function readErrorCode(value: unknown): string {
  if (!isRecord(value)) {
    return "request_failed";
  }

  if (typeof value.code === "string") {
    return value.code;
  }

  if (typeof value.error === "string") {
    return value.error;
  }

  return "request_failed";
}

function isPvpSeat(value: unknown): value is PvpSeat {
  return value === "host" || value === "guest";
}

function isSeatToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/u.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

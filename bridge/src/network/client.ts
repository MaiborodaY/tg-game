import {
  normalizeBridgeRoomCode,
  parseBridgeServerMessage,
  type BridgeClientCommand,
  type BridgeCurrentRoomResponse,
  type BridgeRoomSession,
  type BridgeServerMessage,
  type BridgeSocketTicketResponse,
} from "./protocol.ts";
import { translateBridge, type BridgeLocale } from "../i18n.ts";

const REQUEST_TIMEOUT_MS = 12_000;

export type BridgeDevelopmentIdentity = Readonly<{ userId: string; displayName: string }>;

export type BridgeNetworkOptions = Readonly<{
  initData: string | (() => string);
  baseUrl?: string;
  developmentIdentity?: BridgeDevelopmentIdentity | null;
}>;

export type BridgeRoomConnection = Readonly<{
  readonly readyState: number;
  send(command: BridgeClientCommand): boolean;
  close(): void;
}>;

export type BridgeConnectionHandlers<TView> = Readonly<{
  onOpen?(): void;
  onMessage(message: BridgeServerMessage<TView>): void;
  onClose?(event: CloseEvent): void;
  onError?(error: BridgeNetworkError): void;
}>;

export class BridgeNetworkError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = "network_error", status = 0) {
    super(message);
    this.name = "BridgeNetworkError";
    this.code = code;
    this.status = status;
  }
}

export type BridgeNetworkClient<TView = unknown> = Readonly<{
  readonly authenticated: boolean;
  readonly baseUrl: string;
  getCurrentRoom(): Promise<BridgeRoomSession<TView> | null>;
  createRoom(): Promise<BridgeRoomSession<TView>>;
  joinRoom(roomCode: string): Promise<BridgeRoomSession<TView>>;
  leaveRoom(roomCode: string): Promise<void>;
  connectRoom(
    room: Pick<BridgeRoomSession<TView>, "roomCode">,
    handlers: BridgeConnectionHandlers<TView>,
  ): Promise<BridgeRoomConnection>;
}>;

export function createBridgeNetworkClient<TView = unknown>(options: BridgeNetworkOptions): BridgeNetworkClient<TView> {
  const baseUrl = normalizeBaseUrl(options.baseUrl || getDefaultBaseUrl());

  const request = <T>(path: string, init: RequestInit = {}) => requestJson<T>(
    joinUrl(baseUrl, path),
    {
      ...init,
      headers: buildRequestHeaders(options, init),
    },
  );

  const getCurrentRoom = async (): Promise<BridgeRoomSession<TView> | null> => {
    const response = await request<BridgeCurrentRoomResponse<TView>>("rooms/current");
    return response.room ?? null;
  };

  const createRoom = (): Promise<BridgeRoomSession<TView>> => request("rooms", {
    method: "POST",
    body: "{}",
  });

  const joinRoom = (roomCode: string): Promise<BridgeRoomSession<TView>> => {
    const normalized = normalizeBridgeRoomCode(roomCode);
    if (!normalized) throw new BridgeNetworkError("Invalid room code.", "bad_room_code", 400);
    return request(`rooms/${normalized}/join`, { method: "POST", body: "{}" });
  };

  const leaveRoom = async (roomCode: string): Promise<void> => {
    const normalized = normalizeBridgeRoomCode(roomCode);
    if (!normalized) return;
    await request(`rooms/${normalized}/leave`, { method: "POST", body: "{}" });
  };

  const connectRoom = async (
    room: Pick<BridgeRoomSession<TView>, "roomCode">,
    handlers: BridgeConnectionHandlers<TView>,
  ): Promise<BridgeRoomConnection> => {
    const normalized = normalizeBridgeRoomCode(room.roomCode);
    if (!normalized) throw new BridgeNetworkError("Invalid room code.", "bad_room_code", 400);
    const ticket = await request<BridgeSocketTicketResponse>(`rooms/${normalized}/ticket`, {
      method: "POST",
      body: "{}",
    });
    const socket = new WebSocket(getSocketUrl(baseUrl, `rooms/${normalized}/ws`, ticket.ticket));
    socket.addEventListener("open", () => handlers.onOpen?.());
    socket.addEventListener("close", (event) => handlers.onClose?.(event));
    socket.addEventListener("error", () => handlers.onError?.(
      new BridgeNetworkError("Table connection interrupted.", "socket_error"),
    ));
    socket.addEventListener("message", (event) => {
      if (typeof event.data !== "string") return;
      try {
        const message = parseBridgeServerMessage<TView>(JSON.parse(event.data));
        if (message) handlers.onMessage(message);
        else handlers.onError?.(new BridgeNetworkError("Unknown server response.", "bad_server_message"));
      } catch {
        handlers.onError?.(new BridgeNetworkError("Unreadable server response.", "bad_server_message"));
      }
    });

    return Object.freeze({
      get readyState() { return socket.readyState; },
      send(command: BridgeClientCommand): boolean {
        if (socket.readyState !== WebSocket.OPEN) return false;
        socket.send(JSON.stringify(command));
        return true;
      },
      close: () => socket.close(1000, "client_close"),
    });
  };

  return Object.freeze({
    get authenticated() {
      return Boolean(readInitData(options).trim() || options.developmentIdentity?.userId.trim());
    },
    baseUrl,
    getCurrentRoom,
    createRoom,
    joinRoom,
    leaveRoom,
    connectRoom,
  });
}

export function getBridgeNetworkErrorMessage(error: unknown, locale: BridgeLocale = "ru"): string {
  if (!(error instanceof BridgeNetworkError)) return translateBridge(locale, "networkUnavailable");
  if (error.code === "bad_room_code") return translateBridge(locale, "badRoomCode");
  if (error.code === "socket_error") return translateBridge(locale, "socketError");
  if (error.code === "bad_server_message") return translateBridge(locale, "badServerMessage");
  if (error.code === "missing_init_data") return translateBridge(locale, "pvpTelegramOnly");
  if (error.code === "missing_development_identity") return translateBridge(locale, "missingDevelopmentIdentity");
  if (error.code === "expired_init_data") return translateBridge(locale, "telegramExpired");
  if (error.code === "room_not_found") return translateBridge(locale, "roomNotFound");
  if (error.code === "room_unavailable" || error.code === "room_full") {
    return translateBridge(locale, "roomUnavailable");
  }
  if (error.code === "active_room_conflict") return translateBridge(locale, "activeRoomConflict");
  if (error.code === "not_room_member") return translateBridge(locale, "notRoomMember");
  if (error.code === "room_code_exhausted") return translateBridge(locale, "roomCodeExhausted");
  if (error.code === "request_timeout") return translateBridge(locale, "requestTimeout");
  if (error.code === "request_failed") return translateBridge(locale, "requestFailed");
  if (error.status === 401) return translateBridge(locale, "telegramAuthFailed");
  return translateBridge(locale, "networkError");
}

function getAuthHeaders(options: BridgeNetworkOptions): Record<string, string> {
  const initData = readInitData(options).trim();
  if (initData) return { "x-telegram-init-data": initData };
  const developmentIdentity = options.developmentIdentity;
  if (!developmentIdentity?.userId.trim()) return {};
  return {
    "x-bridge-dev-user-id": developmentIdentity.userId.trim(),
    "x-bridge-dev-user-name": developmentIdentity.displayName.trim().slice(0, 32) || "Local player",
  };
}

function readInitData(options: BridgeNetworkOptions): string {
  try {
    return typeof options.initData === "function" ? options.initData() : options.initData;
  } catch {
    return "";
  }
}

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const data = await response.json().catch(() => ({})) as T & {
      code?: string;
      error?: string | { code?: string; message?: string };
      message?: string;
    };
    if (!response.ok) {
      const nestedError = typeof data.error === "object" ? data.error : undefined;
      const stringError = typeof data.error === "string" ? data.error : undefined;
      throw new BridgeNetworkError(
        data.message || nestedError?.message || stringError || `Bridge API: ${response.status}`,
        data.code || nestedError?.code || stringError || `http_${response.status}`,
        response.status,
      );
    }
    return data;
  } catch (error) {
    if (error instanceof BridgeNetworkError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new BridgeNetworkError("Request timed out.", "request_timeout");
    }
    throw new BridgeNetworkError("Bridge server unavailable.", "request_failed");
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

function buildRequestHeaders(options: BridgeNetworkOptions, init: RequestInit): Headers {
  const headers = new Headers(init.headers);
  Object.entries(getAuthHeaders(options)).forEach(([name, value]) => headers.set(name, value));
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  return headers;
}

function getDefaultBaseUrl(): string {
  const configured = import.meta.env.VITE_BRIDGE_API_BASE_URL as string | undefined;
  return configured?.trim() || "/api/bridge";
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "") || "/api/bridge";
}

function joinUrl(baseUrl: string, path: string): string {
  return new URL(`${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`, window.location.href).toString();
}

function getSocketUrl(baseUrl: string, path: string, ticket: string): string {
  const url = new URL(joinUrl(baseUrl, path));
  url.searchParams.set("ticket", ticket);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

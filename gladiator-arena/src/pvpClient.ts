import type { ActionId } from "./combat";
import type { HeroState } from "./hero";
import type { PvpClientMessage, PvpRoomResponse, PvpRoomSession, PvpServerMessage } from "./pvpProtocol";

export interface PvpConnection {
  close: () => void;
  sendAction: (actionId: ActionId, turnVersion: number) => void;
}

export interface PvpConnectionHandlers {
  onMessage: (message: PvpServerMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: () => void;
}

const PVP_API_BASE_URL_STORAGE_KEY = "dust-arena-pvp-api-base-url";
const DEFAULT_PVP_API_BASE_URL = "/api/pvp";
const DEFAULT_LOCAL_PVP_API_BASE_URL = "http://localhost:8787/api/pvp";

export async function createPvpRoom(hero: HeroState): Promise<PvpRoomResponse> {
  return postPvpJson<PvpRoomResponse>("rooms", { hero });
}

export async function joinPvpRoom(roomCode: string, hero: HeroState): Promise<PvpRoomResponse> {
  return postPvpJson<PvpRoomResponse>(`rooms/${normalizeRoomCode(roomCode)}/join`, { hero });
}

export function connectPvpRoom(session: PvpRoomSession, handlers: PvpConnectionHandlers): PvpConnection {
  const socket = new WebSocket(getPvpWebSocketUrl(`rooms/${session.roomCode}/ws`, { token: session.token }));

  socket.addEventListener("open", () => handlers.onOpen?.());
  socket.addEventListener("close", () => handlers.onClose?.());
  socket.addEventListener("error", () => handlers.onError?.());
  socket.addEventListener("message", (event) => {
    if (typeof event.data !== "string") {
      return;
    }

    try {
      handlers.onMessage(JSON.parse(event.data) as PvpServerMessage);
    } catch {
      handlers.onMessage({ type: "error", message: "Bad PvP message." });
    }
  });

  return {
    close: () => socket.close(),
    sendAction: (actionId: ActionId, turnVersion: number) => {
      const message: PvpClientMessage = { type: "action", actionId, turnVersion };
      const payload = JSON.stringify(message);

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload);
        return;
      }

      if (socket.readyState === WebSocket.CONNECTING) {
        socket.addEventListener("open", () => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(payload);
          }
        }, { once: true });
      }
    },
  };
}

export function getPvpApiBaseUrl(): string {
  const configured = import.meta.env.VITE_GLADIATOR_PVP_API_BASE_URL as string | undefined;
  const stored = window.localStorage.getItem(PVP_API_BASE_URL_STORAGE_KEY) ?? undefined;

  return normalizeBaseUrl(configured || stored || getDefaultPvpApiBaseUrl());
}

async function postPvpJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(getPvpHttpUrl(path), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json() as T & { error?: string };

  if (!response.ok) {
    throw new Error(data.error || `PvP request failed: ${response.status}`);
  }

  return data;
}

function getPvpHttpUrl(path: string): string {
  return new URL(joinUrlPath(getPvpApiBaseUrl(), path), window.location.href).toString();
}

function getPvpWebSocketUrl(path: string, params: Record<string, string>): string {
  const url = new URL(joinUrlPath(getPvpApiBaseUrl(), path), window.location.href);

  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  if (url.protocol === "https:") {
    url.protocol = "wss:";
  } else {
    url.protocol = "ws:";
  }

  return url.toString();
}

function joinUrlPath(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "") || DEFAULT_PVP_API_BASE_URL;
}

function getDefaultPvpApiBaseUrl(): string {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? DEFAULT_LOCAL_PVP_API_BASE_URL
    : DEFAULT_PVP_API_BASE_URL;
}

function normalizeRoomCode(roomCode: string): string {
  return roomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

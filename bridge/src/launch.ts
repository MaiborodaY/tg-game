const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;

export type BridgeLaunch = Readonly<{
  roomCode: string | null;
  source: "query" | "telegram" | null;
  returnTo: "tower-defense" | null;
}>;

export function parseBridgeLaunch(
  url: string,
  telegramStartParam?: string | null,
): BridgeLaunch {
  let queryRoom: string | null;
  let returnTo: BridgeLaunch["returnTo"];

  try {
    const parsedUrl = new URL(url);
    queryRoom = normalizeRoomCode(parsedUrl.searchParams.get("room"));
    returnTo = parsedUrl.searchParams.get("source") === "td" ? "tower-defense" : null;
  } catch {
    queryRoom = null;
    returnTo = null;
  }

  if (queryRoom) {
    return Object.freeze({ roomCode: queryRoom, source: "query", returnTo });
  }

  const startRoom = parseTelegramRoomStartParam(telegramStartParam);
  return Object.freeze({
    roomCode: startRoom,
    source: startRoom ? "telegram" : null,
    returnTo,
  });
}

export function parseTelegramRoomStartParam(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  const match = /^(?:bridge[_-])?([A-HJ-NP-Z2-9]{6})$/i.exec(normalized);
  return match ? normalizeRoomCode(match[1] ?? "") : null;
}

export function normalizeRoomCode(value: string | null | undefined): string | null {
  const normalized = (value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, ROOM_CODE_LENGTH);

  return ROOM_CODE_PATTERN.test(normalized) ? normalized : null;
}

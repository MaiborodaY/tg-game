import { PvpRequestError, type PvpApiRequestOptions } from "./pvpSession";

export type PvpLeaderboardParticipation = "ranked" | "missing_profile" | "telegram_required";

export interface PvpLeaderboardEntry {
  rank: number;
  displayName: string;
  wins: number;
  losses: number;
  draws: number;
  games: number;
}

export interface PvpLeaderboardSnapshot {
  weekKey: string;
  weekEndsAt: number;
  totalPlayers: number;
  entries: PvpLeaderboardEntry[];
  viewer: PvpLeaderboardEntry | null;
  participation: PvpLeaderboardParticipation;
}

export async function fetchPvpLeaderboard(
  apiOrigin: string,
  options: PvpApiRequestOptions = {},
): Promise<PvpLeaderboardSnapshot> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  const initData = options.telegramInitData?.trim();
  if (initData) headers["x-telegram-init-data"] = initData;

  let response: Response;
  try {
    response = await (options.fetcher ?? fetch)(`${apiOrigin}/api/pvp/leaderboard`, {
      method: "POST",
      headers,
      body: "{}",
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

  const snapshot = readLeaderboardSnapshot(payload);
  if (!snapshot) throw new PvpRequestError("bad_response", response.status);
  return snapshot;
}

function readLeaderboardSnapshot(value: unknown): PvpLeaderboardSnapshot | undefined {
  if (!isRecord(value) || value.ok !== true || typeof value.weekKey !== "string") return undefined;
  const weekEndsAt = Number(value.weekEndsAt);
  const totalPlayers = Number(value.totalPlayers);
  if (!Number.isFinite(weekEndsAt) || !Number.isInteger(totalPlayers) || totalPlayers < 0) return undefined;
  if (!Array.isArray(value.entries) || !isParticipation(value.participation)) return undefined;
  const entries = value.entries.map(readEntry);
  if (entries.some((entry) => !entry)) return undefined;
  const viewer = value.viewer === null ? null : readEntry(value.viewer);
  if (value.viewer !== null && !viewer) return undefined;
  return {
    weekKey: value.weekKey.slice(0, 16),
    weekEndsAt,
    totalPlayers,
    entries: entries as PvpLeaderboardEntry[],
    viewer: viewer ?? null,
    participation: value.participation,
  };
}

function readEntry(value: unknown): PvpLeaderboardEntry | undefined {
  if (!isRecord(value) || typeof value.displayName !== "string") return undefined;
  const rank = Number(value.rank);
  const wins = Number(value.wins);
  const losses = Number(value.losses);
  const draws = Number(value.draws);
  const games = Number(value.games);
  if (![rank, wins, losses, draws, games].every((number) => Number.isInteger(number) && number >= 0)) return undefined;
  return { rank, displayName: value.displayName.slice(0, 32), wins, losses, draws, games };
}

function readErrorCode(value: unknown): string {
  return isRecord(value) && typeof value.code === "string" ? value.code : "request_failed";
}

function isParticipation(value: unknown): value is PvpLeaderboardParticipation {
  return value === "ranked" || value === "missing_profile" || value === "telegram_required";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

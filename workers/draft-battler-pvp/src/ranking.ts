import type { MatchState, PlayerRole, RoomState } from "./matchDomain";
import type { TelegramPlayerIdentity } from "./telegramAuth";

export type RankingSettlementStatus = "recorded" | "unranked";
export type LeaderboardParticipation = "ranked" | "missing_profile" | "telegram_required";

export interface BroBattlerLeaderboardEntry {
  rank: number;
  displayName: string;
  wins: number;
  losses: number;
  draws: number;
  games: number;
}

export interface BroBattlerRankingCandidate {
  matchId: string;
  host: TelegramPlayerIdentity;
  guest: TelegramPlayerIdentity;
  outcome: NonNullable<MatchState["outcome"]>;
  roundsPlayed: number;
}

export interface BroBattlerLeaderboard {
  weekKey: string;
  weekEndsAt: number;
  totalPlayers: number;
  entries: BroBattlerLeaderboardEntry[];
  viewer: BroBattlerLeaderboardEntry | null;
  participation: LeaderboardParticipation;
}

interface ProfileRow {
  user_id: string;
  name: string;
}

interface RankedRow {
  rank: number;
  display_name: string;
  wins: number;
  losses: number;
  draws: number;
  games: number;
}

const LEADERBOARD_LIMIT = 10;

export function getUtcIsoWeek(timestamp: number): { weekKey: string; weekEndsAt: number } {
  const date = new Date(timestamp);
  const dayStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const day = new Date(dayStart);
  const isoDay = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + 4 - isoDay);
  const isoYear = day.getUTCFullYear();
  const yearStart = Date.UTC(isoYear, 0, 1);
  const week = Math.ceil((((day.getTime() - yearStart) / 86_400_000) + 1) / 7);
  const monday = dayStart - (isoDay - 1) * 86_400_000;
  return {
    weekKey: `${isoYear}-W${String(week).padStart(2, "0")}`,
    weekEndsAt: monday + 7 * 86_400_000,
  };
}

export function getCompletedCombatRounds(match: Pick<MatchState, "round" | "combat">): number {
  return match.combat ? match.round : Math.max(0, match.round - 1);
}

export async function settleBroBattlerMatch(
  db: D1Database,
  room: Pick<RoomState, "seats">,
  match: Pick<MatchState, "matchId" | "round" | "combat" | "outcome">,
): Promise<RankingSettlementStatus> {
  const candidate = createBroBattlerRankingCandidate(room, match);
  return candidate ? settleBroBattlerRankingCandidate(db, candidate) : "unranked";
}

export function createBroBattlerRankingCandidate(
  room: Pick<RoomState, "seats">,
  match: Pick<MatchState, "matchId" | "round" | "combat" | "outcome">,
): BroBattlerRankingCandidate | undefined {
  const outcome = match.outcome;
  const host = room.seats.host?.identity;
  const guest = room.seats.guest?.identity;
  const roundsPlayed = getCompletedCombatRounds(match);
  if (!outcome || !host || !guest || host.userId === guest.userId || roundsPlayed < 1) {
    return undefined;
  }

  return {
    matchId: match.matchId,
    host,
    guest,
    outcome,
    roundsPlayed,
  };
}

export async function settleBroBattlerRankingCandidate(
  db: D1Database,
  candidate: BroBattlerRankingCandidate,
): Promise<RankingSettlementStatus> {
  const { host, guest, outcome, roundsPlayed } = candidate;

  const profiles = await db.prepare(
    "SELECT user_id, name FROM user_directory WHERE user_id IN (?, ?)",
  ).bind(host.userId, guest.userId).all<ProfileRow>();
  const profileById = new Map((profiles.results ?? []).map((row) => [String(row.user_id), row]));
  if (!profileById.has(host.userId) || !profileById.has(guest.userId)) {
    return "unranked";
  }

  const finishedAt = outcome.finishedAt;
  const { weekKey } = getUtcIsoWeek(finishedAt);
  const dayKey = new Date(finishedAt).toISOString().slice(0, 10);
  const createStatement = (role: PlayerRole, identity: TelegramPlayerIdentity, opponent: TelegramPlayerIdentity) => {
    const result = outcome.winner === "draw" ? "draw" : outcome.winner === role ? "win" : "loss";
    const profileName = normalizeStoredName(profileById.get(identity.userId)?.name) ?? identity.displayName;
    return db.prepare(`
      INSERT OR IGNORE INTO brobattler_match_results (
        match_id, user_id, opponent_user_id, display_name, week_key, day_key,
        result, finish_reason, rounds_played, finished_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      candidate.matchId,
      identity.userId,
      opponent.userId,
      profileName,
      weekKey,
      dayKey,
      result,
      outcome.reason,
      roundsPlayed,
      finishedAt,
    );
  };

  await db.batch([
    createStatement("host", host, guest),
    createStatement("guest", guest, host),
  ]);
  return "recorded";
}

export async function readBroBattlerLeaderboard(
  db: D1Database,
  viewer: TelegramPlayerIdentity | undefined,
  now = Date.now(),
): Promise<BroBattlerLeaderboard> {
  const { weekKey, weekEndsAt } = getUtcIsoWeek(now);
  const rankedCte = `
    WITH aggregates AS (
      SELECT
        user_id,
        MAX(display_name) AS display_name,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) AS wins,
        SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) AS losses,
        SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) AS draws,
        COUNT(*) AS games,
        MAX(finished_at) AS last_finished_at
      FROM brobattler_match_results
      WHERE week_key = ?
      GROUP BY user_id
    ), ranked AS (
      SELECT *, ROW_NUMBER() OVER (
        ORDER BY wins DESC, (wins * 1.0 / games) DESC, games DESC, last_finished_at ASC, user_id ASC
      ) AS rank
      FROM aggregates
    )
  `;
  const topStatement = db.prepare(`${rankedCte}
    SELECT rank, display_name, wins, losses, draws, games
    FROM ranked ORDER BY rank LIMIT ?
  `).bind(weekKey, LEADERBOARD_LIMIT);
  const totalStatement = db.prepare(
    "SELECT COUNT(DISTINCT user_id) AS total FROM brobattler_match_results WHERE week_key = ?",
  ).bind(weekKey);
  const viewerStatement = viewer
    ? db.prepare(`${rankedCte}
        SELECT rank, display_name, wins, losses, draws, games
        FROM ranked WHERE user_id = ? LIMIT 1
      `).bind(weekKey, viewer.userId)
    : undefined;
  const profileStatement = viewer
    ? db.prepare("SELECT user_id FROM user_directory WHERE user_id = ? LIMIT 1").bind(viewer.userId)
    : undefined;

  const statements = [topStatement, totalStatement];
  if (viewerStatement && profileStatement) statements.push(viewerStatement, profileStatement);
  const results = await db.batch<RankedRow | { total: number } | { user_id: string }>(statements);
  const entries = (results[0]?.results ?? []).map(readLeaderboardEntry).filter(isDefined);
  const totalRow = results[1]?.results?.[0] as { total?: number } | undefined;
  const profileRow = results[3]?.results?.[0] as { user_id?: string } | undefined;
  const totalPlayers = Math.max(0, Number(totalRow?.total ?? 0));
  const viewerEntry = viewer ? readLeaderboardEntry(results[2]?.results?.[0]) ?? null : null;
  const hasProfile = viewer ? Boolean(profileRow?.user_id) : false;

  return {
    weekKey,
    weekEndsAt,
    totalPlayers,
    entries,
    viewer: viewerEntry,
    participation: !viewer ? "telegram_required" : hasProfile ? "ranked" : "missing_profile",
  };
}

function readLeaderboardEntry(value: unknown): BroBattlerLeaderboardEntry | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as Partial<RankedRow>;
  const numbers = [row.rank, row.wins, row.losses, row.draws, row.games].map(Number);
  if (numbers.some((number) => !Number.isInteger(number) || number < 0) || typeof row.display_name !== "string") {
    return undefined;
  }
  return {
    rank: numbers[0],
    displayName: normalizeStoredName(row.display_name) ?? "Player",
    wins: numbers[1],
    losses: numbers[2],
    draws: numbers[3],
    games: numbers[4],
  };
}

function normalizeStoredName(value: string | undefined): string | undefined {
  const normalized = value?.trim().replace(/\s+/gu, " ").slice(0, 32);
  return normalized || undefined;
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

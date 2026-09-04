import type { MatchState, RoomState } from "./matchDomain";

export function getNextRoomAlarmAt(
  room: Pick<RoomState, "expiresAt" | "seats">,
  match?: Pick<MatchState, "expiresAt" | "phase" | "rankingStatus">,
  now = Number.NEGATIVE_INFINITY,
  hasPendingRanking = false,
): number {
  const disconnectDeadlines = match?.phase === "finished"
    ? []
    : Object.values(room.seats)
      .map((seat) => seat?.disconnectDeadline)
      .filter((value): value is number => typeof value === "number" && value > now);

  const durableDeadlines = [room.expiresAt, match?.expiresAt]
    .filter((value): value is number => typeof value === "number" && value > now);
  const rankingRetryAt = (hasPendingRanking || (match?.phase === "finished" && match.rankingStatus === undefined))
    && Number.isFinite(now)
    ? now + 10_000
    : undefined;
  return Math.min(...durableDeadlines, ...disconnectDeadlines, ...(rankingRetryAt ? [rankingRetryAt] : []));
}

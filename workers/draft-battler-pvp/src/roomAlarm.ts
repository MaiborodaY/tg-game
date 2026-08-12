import type { MatchState, RoomState } from "./matchDomain";

export function getNextRoomAlarmAt(
  room: Pick<RoomState, "expiresAt" | "seats">,
  match?: Pick<MatchState, "expiresAt" | "phase">,
  now = Number.NEGATIVE_INFINITY,
): number {
  const disconnectDeadlines = match?.phase === "finished"
    ? []
    : Object.values(room.seats)
      .map((seat) => seat?.disconnectDeadline)
      .filter((value): value is number => typeof value === "number" && value > now);

  const durableDeadlines = [room.expiresAt, match?.expiresAt]
    .filter((value): value is number => typeof value === "number" && value > now);
  return Math.min(...durableDeadlines, ...disconnectDeadlines);
}

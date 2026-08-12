import {
  expireMatch,
  isMatchExpired,
  type MatchState,
  type RoomState,
} from "./matchDomain";

export type ExpiryReconciliation =
  | { status: "missing" }
  | { status: "current"; room: RoomState; match?: MatchState }
  | { status: "delete"; room: RoomState; match?: MatchState }
  | { status: "match_expired"; room: RoomState; match: MatchState };

export function getExpiryReconciliation(
  room: RoomState | undefined,
  match: MatchState | undefined,
  now: number,
): ExpiryReconciliation {
  if (!room) {
    return { status: "missing" };
  }

  if (!match) {
    return now >= room.expiresAt
      ? { status: "delete", room }
      : { status: "current", room };
  }

  if (!isMatchExpired(match, now)) {
    return { status: "current", room, match };
  }

  return match.phase === "finished"
    ? { status: "delete", room, match }
    : { status: "match_expired", room, match: expireMatch(match, now) };
}

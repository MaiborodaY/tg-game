import {
  forfeitDisconnectedPlayer,
  getDisconnectForfeitRole,
  type MatchState,
  type PlayerRole,
  type RoomState,
} from "./matchDomain";

export interface ReconnectSettlement {
  match: MatchState | undefined;
  forfeitedRole?: PlayerRole;
}

export function settleExpiredOpponentAfterReconnect(
  room: RoomState,
  match: MatchState | undefined,
  now: number,
): ReconnectSettlement {
  if (!match || match.phase === "finished") {
    return { match };
  }

  const forfeitedRole = getDisconnectForfeitRole(room, now);
  return forfeitedRole
    ? { match: forfeitDisconnectedPlayer(match, forfeitedRole, now), forfeitedRole }
    : { match };
}
